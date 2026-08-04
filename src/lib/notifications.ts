import type { NotificationChannel, Prisma, SavedSearch } from "@prisma/client";

import { sendEmail } from "@/lib/email";
import { digestMessage, translatorFor, type NotificationMessage } from "@/lib/notification-messages";
import { prisma } from "@/lib/prisma";
import { sendSms, sendWhatsApp } from "@/lib/sms";

export {
  listingPublishedMessage,
  referralCreditMessage,
  subscriptionActivatedMessage,
} from "@/lib/notification-messages";

/**
 * Epic 7 — notifications. Two entry points:
 * - notifyUser: one-off transactional notification (payment completed, listing
 *   live) via the user's best available channel.
 * - runNotificationDigest (T7.3): matches new LIVE listings against saved
 *   searches and sends one digest per search. Triggered from the admin panel
 *   for now; T0.7 wires it to a cron.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const MAX_LISTINGS_PER_DIGEST = 5;

function usableEmail(email: string | null): string | null {
  // Phone-signup users get a synthetic @phone.amatangazo.local address — not deliverable.
  if (!email || email.endsWith("@phone.amatangazo.local")) return null;
  return email;
}

async function deliver(
  channel: NotificationChannel,
  user: { phoneNumber: string | null; email: string | null },
  subject: string,
  body: string,
): Promise<void> {
  if (channel === "EMAIL") {
    const email = usableEmail(user.email);
    if (!email) throw new Error("User has no usable email address");
    await sendEmail(email, subject, body);
    return;
  }
  if (!user.phoneNumber) throw new Error("User has no phone number");
  if (channel === "WHATSAPP") await sendWhatsApp(user.phoneNumber, body);
  else await sendSms(user.phoneNumber, body);
}

/**
 * Transactional notify — picks SMS when the user has a phone, else email.
 *
 * Takes an unresolved NotificationMessage rather than a finished string so the
 * copy can be rendered in the *recipient's* language, which is only known once
 * the user row is loaded.
 */
export async function notifyUser(userId: string, message: NotificationMessage) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phoneNumber: true, email: true, preferredLanguage: true },
  });
  if (!user) return;

  const { subject, body } = message(translatorFor(user.preferredLanguage));
  const channel: NotificationChannel = user.phoneNumber ? "SMS" : "EMAIL";
  let status: "sent" | "failed" = "sent";
  try {
    await deliver(channel, user, subject, body);
  } catch (error) {
    status = "failed";
    console.error(`Transactional notification failed for user ${userId}`, error);
  }
  await prisma.notificationLog.create({ data: { userId, channel, status } });
}

// ── Saved-search digest (T7.3) ───────────────────────────────

export type SavedSearchFilters = {
  keyword?: string;
  location?: string;
  sector?: string;
  experienceLevel?: string;
};

export function buildSearchWhere(
  search: Pick<SavedSearch, "category" | "filters">,
  since: Date,
): Prisma.ListingWhereInput {
  const filters = (search.filters ?? {}) as SavedSearchFilters;
  const where: Prisma.ListingWhereInput = {
    status: "LIVE",
    category: search.category,
    publishedAt: { gt: since },
  };

  if (filters.keyword) {
    where.OR = [
      { title: { contains: filters.keyword, mode: "insensitive" } },
      { description: { contains: filters.keyword, mode: "insensitive" } },
    ];
  }
  if (filters.location) {
    where.location = { contains: filters.location, mode: "insensitive" };
  }
  if (filters.sector) {
    if (search.category === "JOB") {
      where.jobDetails = { sector: { contains: filters.sector, mode: "insensitive" } };
    } else if (search.category === "TENDER") {
      where.tenderDetails = { sector: { contains: filters.sector, mode: "insensitive" } };
    }
  }
  if (filters.experienceLevel && search.category === "JOB") {
    where.jobDetails = {
      ...(where.jobDetails as Prisma.JobDetailsWhereInput | undefined),
      experienceLevel: filters.experienceLevel as Prisma.JobDetailsWhereInput["experienceLevel"],
    };
  }

  return where;
}

export type DigestRunResult = {
  searchesChecked: number;
  searchesMatched: number;
  notificationsSent: number;
  notificationsFailed: number;
};

export async function runNotificationDigest(): Promise<DigestRunResult> {
  const searches = await prisma.savedSearch.findMany({
    include: { user: { select: { id: true, email: true, phoneNumber: true, preferredLanguage: true } } },
  });

  const result: DigestRunResult = {
    searchesChecked: searches.length,
    searchesMatched: 0,
    notificationsSent: 0,
    notificationsFailed: 0,
  };

  for (const search of searches) {
    const since = search.lastNotifiedAt ?? search.createdAt;
    const candidates = await prisma.listing.findMany({
      where: buildSearchWhere(search, since),
      select: { id: true, title: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    // Never notify the same user about the same listing twice, even across
    // overlapping saved searches (uses the [userId, listingId] index).
    const alreadyNotified = await prisma.notificationLog.findMany({
      where: { userId: search.userId, listingId: { in: candidates.map((c) => c.id) }, status: "sent" },
      select: { listingId: true },
    });
    const notifiedIds = new Set(alreadyNotified.map((n) => n.listingId));
    const fresh = candidates.filter((c) => !notifiedIds.has(c.id));
    if (fresh.length === 0) continue;

    result.searchesMatched += 1;
    const { subject, body } = digestMessage(
      search.category,
      fresh.slice(0, MAX_LISTINGS_PER_DIGEST),
      fresh.length,
      BASE_URL,
    )(translatorFor(search.user.preferredLanguage));

    let status: "sent" | "failed" = "sent";
    try {
      await deliver(search.channel, search.user, subject, body);
    } catch (error) {
      status = "failed";
      console.error(`Digest delivery failed for saved search ${search.id}`, error);
    }

    await prisma.$transaction([
      prisma.notificationLog.createMany({
        data: fresh.map((listing) => ({
          userId: search.userId,
          savedSearchId: search.id,
          listingId: listing.id,
          channel: search.channel,
          status,
        })),
      }),
      prisma.savedSearch.update({
        where: { id: search.id },
        data: { lastNotifiedAt: new Date() },
      }),
    ]);

    if (status === "sent") result.notificationsSent += 1;
    else result.notificationsFailed += 1;
  }

  return result;
}
