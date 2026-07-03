import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BoostButton } from "@/components/boost-button";
import { AuctionDetailsSection } from "@/components/listing-details/auction-details";
import { ClassifiedDetailsSection } from "@/components/listing-details/classified-details";
import { JobDetailsSection } from "@/components/listing-details/job-details";
import { TenderDetailsSection } from "@/components/listing-details/tender-details";
import { getCurrentUserId } from "@/lib/auth";
import { listingInclude } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { buildListingJsonLd, serializeJsonLd } from "@/lib/structured-data";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, include: listingInclude });

  if (!listing) notFound();

  const userId = await getCurrentUserId();
  if (listing.status !== "LIVE" && userId !== listing.posterId) notFound();
  const isOwner = userId === listing.posterId;

  // T10.1 — count reads by non-owners; fire-and-forget so it never delays render.
  if (listing.status === "LIVE" && !isOwner) {
    void prisma.listing
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch((error) => console.error(`View count increment failed for ${id}`, error));
  }

  const jsonLd = buildListingJsonLd(listing);
  const t = await getTranslations("listing");
  const tc = await getTranslations("common");

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", fontFamily: "sans-serif" }}>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <span style={{ background: "#eee", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
          {listing.category}
        </span>
        {listing.isCurrentlyBoosted && (
          <span style={{ background: "#ffe9a8", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>{tc("featured")}</span>
        )}
        {listing.status !== "LIVE" && (
          <span style={{ background: "#fdd", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
            {listing.status} {t("onlyVisibleToYou")}
          </span>
        )}
      </div>

      <h1>{listing.title}</h1>
      <p style={{ color: "#666" }}>{listing.location}</p>

      {listing.images.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "16px 0" }}>
          {listing.images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element -- R2 URLs, not part of Next's image optimization domain list yet
            <img key={image.id} src={image.url} alt={listing.title} style={{ height: 160, borderRadius: 8 }} />
          ))}
        </div>
      )}

      <p style={{ whiteSpace: "pre-wrap" }}>{listing.description}</p>

      <hr />

      {listing.category === "JOB" && <JobDetailsSection listing={listing} />}
      {listing.category === "TENDER" && <TenderDetailsSection listing={listing} />}
      {listing.category === "AUCTION" && <AuctionDetailsSection listing={listing} />}
      {listing.category === "CLASSIFIED" && <ClassifiedDetailsSection listing={listing} />}

      {isOwner && listing.status === "LIVE" && <BoostButton listingId={listing.id} />}

      <hr />

      <p>
        {t("postedBy")} <strong>{listing.poster.businessName ?? listing.poster.name}</strong>
        {listing.poster.verificationStatus === "VERIFIED" && ` ✓ ${t("verified")}`}
      </p>
    </main>
  );
}
