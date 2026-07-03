import { prisma } from "@/lib/prisma";
import {
  buildSourceUrl,
  fetchTenderDetail,
  fetchTenderListPage,
  getSessionCookie,
  type UmucyoTender,
} from "@/lib/umucyo";

/**
 * All mirrored tenders are posted by one system account so posterId (required
 * on Listing) stays honest — it's upserted on demand, so ingestion works even
 * on a database that was never seeded with it.
 */
const MIRROR_USER_EMAIL = "mirror@umucyo.amatangazo.local";

const SECTOR_BY_TYPE_CD: Record<string, string> = {
  C: "Consultancy",
  NC: "Non-Consultancy Services",
  G: "Goods",
  W: "Works",
};

async function getMirrorUser() {
  return prisma.user.upsert({
    where: { email: MIRROR_USER_EMAIL },
    update: {},
    create: {
      email: MIRROR_USER_EMAIL,
      name: "Umucyo — Government e-Procurement",
      businessName: "Umucyo (umucyo.gov.rw)",
      accountType: "BUSINESS",
    },
  });
}

function composeDescription(
  tender: UmucyoTender,
  detail: { procuringEntity: string | null; openingPlace: string | null },
): string {
  const lines = [
    detail.procuringEntity ? `Procuring entity: ${detail.procuringEntity}` : null,
    `Tender number: ${tender.displayTenderNo}`,
    `Procurement method: ${tender.methodCd}`,
    tender.submissionDeadline
      ? `Submission deadline: ${tender.submissionDeadline.toISOString().slice(0, 16).replace("T", " ")} (Kigali time as published)`
      : null,
    detail.openingPlace ? `Bid opening: ${detail.openingPlace}` : null,
    "",
    "Mirrored from Umucyo, Rwanda's official e-Procurement portal. Bids are submitted on umucyo.gov.rw, not on Amatangazo — follow the source link for the full notice and tender documents.",
  ];
  return lines.filter((line) => line !== null).join("\n");
}

export type IngestResult = {
  status: "SUCCESS" | "PARTIAL_FAILURE" | "FAILURE";
  tendersFound: number;
  tendersCreated: number;
  errorMessage: string | null;
};

/**
 * T3.4: list scrape -> dedup by sourceUrl (which encodes the tender ref) ->
 * detail-fetch only the unseen ones (keeps request volume at ~1/new tender,
 * not 1/listed tender) -> create LIVE listings. Government mirrors skip the
 * payment gate by design (P0-3: auto-published). Existing mirrors get their
 * title/deadline refreshed when Umucyo shows an amendment.
 */
export async function runUmucyoScrape(pages = 2): Promise<IngestResult> {
  let tendersFound = 0;
  let tendersCreated = 0;
  const errors: string[] = [];

  try {
    const cookie = await getSessionCookie();
    const tenders: UmucyoTender[] = [];
    for (let page = 1; page <= pages; page++) {
      tenders.push(...(await fetchTenderListPage(cookie, page)));
    }
    tendersFound = tenders.length;
    if (tendersFound === 0) {
      // A structure change on their side would most likely show up as a
      // silently empty parse, not an HTTP error — treat it as a failure.
      throw new Error("Parsed zero tenders from the list page — Umucyo markup may have changed");
    }

    const mirrorUser = await getMirrorUser();
    const sourceUrls = tenders.map((tender) => buildSourceUrl(tender.tendReferNo));
    const existing = await prisma.listing.findMany({
      where: { sourceUrl: { in: sourceUrls } },
      select: { id: true, sourceUrl: true, title: true, expiresAt: true },
    });
    const existingByUrl = new Map(existing.map((row) => [row.sourceUrl!, row]));

    for (const tender of tenders) {
      const sourceUrl = buildSourceUrl(tender.tendReferNo);
      const seen = existingByUrl.get(sourceUrl);

      try {
        if (seen) {
          const deadlineChanged =
            tender.submissionDeadline && seen.expiresAt?.getTime() !== tender.submissionDeadline.getTime();
          if (deadlineChanged || seen.title !== tender.title) {
            await prisma.listing.update({
              where: { id: seen.id },
              data: {
                title: tender.title,
                expiresAt: tender.submissionDeadline ?? undefined,
                tenderDetails: {
                  update: tender.submissionDeadline ? { submissionDeadline: tender.submissionDeadline } : {},
                },
              },
            });
          }
          continue;
        }

        if (!tender.submissionDeadline) {
          errors.push(`${tender.tendReferNo}: no parseable submission deadline, skipped`);
          continue;
        }

        const detail = await fetchTenderDetail(cookie, tender);
        await prisma.listing.create({
          data: {
            category: "TENDER",
            posterId: mirrorUser.id,
            title: tender.title,
            description: composeDescription(tender, detail),
            status: "LIVE",
            source: "GOVERNMENT_MIRROR",
            sourceUrl,
            location: detail.procuringEntity ?? "Rwanda",
            language: "EN",
            publishedAt: tender.advertisedOn ?? new Date(),
            expiresAt: tender.submissionDeadline,
            tenderDetails: {
              create: {
                sector: SECTOR_BY_TYPE_CD[tender.typeCd] ?? "Government Procurement",
                submissionDeadline: tender.submissionDeadline,
              },
            },
          },
        });
        tendersCreated++;
      } catch (error) {
        errors.push(`${tender.tendReferNo}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } catch (error) {
    // undici wraps network errors as bare "fetch failed" — surface the cause.
    const cause = error instanceof Error && error.cause ? ` (${String(error.cause)})` : "";
    const message = (error instanceof Error ? error.message : String(error)) + cause;
    await prisma.umucyoScrapeLog.create({
      data: { status: "FAILURE", tendersFound, tendersCreated, errorMessage: message },
    });
    return { status: "FAILURE", tendersFound, tendersCreated, errorMessage: message };
  }

  const status = errors.length > 0 ? "PARTIAL_FAILURE" : "SUCCESS";
  const errorMessage = errors.length > 0 ? errors.join("; ").slice(0, 2000) : null;
  await prisma.umucyoScrapeLog.create({
    data: { status, tendersFound, tendersCreated, errorMessage },
  });
  return { status, tendersFound, tendersCreated, errorMessage };
}
