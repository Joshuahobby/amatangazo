import type { ModerationAction, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * P0-5: every admin action on a listing goes through here so ModerationLog
 * stays a complete audit trail — no route mutates listing status directly.
 */

export async function approveListing(adminId: string, listingId: string, reason?: string) {
  const [listing] = await prisma.$transaction([
    prisma.listing.update({
      where: { id: listingId },
      data: { status: "LIVE", publishedAt: new Date() },
    }),
    prisma.moderationLog.create({
      data: { adminId, listingId, action: "APPROVE", reason },
    }),
  ]);
  return listing;
}

export async function rejectListing(adminId: string, listingId: string, reason: string) {
  const [listing] = await prisma.$transaction([
    prisma.listing.update({
      where: { id: listingId },
      data: { status: "REJECTED", isCurrentlyBoosted: false },
    }),
    prisma.moderationLog.create({
      data: { adminId, listingId, action: "REJECT", reason },
    }),
  ]);
  return listing;
}

export async function editListing(
  adminId: string,
  listingId: string,
  edits: { title?: string; description?: string; location?: string },
  reason?: string,
) {
  const [listing] = await prisma.$transaction([
    prisma.listing.update({ where: { id: listingId }, data: edits }),
    prisma.moderationLog.create({
      data: { adminId, listingId, action: "EDIT", reason: reason ?? `Edited: ${Object.keys(edits).join(", ")}` },
    }),
  ]);
  return listing;
}

/**
 * Marks the money side only. TODO(T2.1): call PawaPay's refunds API here
 * once a live merchant account exists — until then this records the refund
 * decision and takes the listing down, and the actual repayment happens
 * outside the platform.
 */
export async function refundListing(adminId: string, listingId: string, reason: string) {
  const payment = await prisma.payment.findFirst({
    where: { listingId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });
  if (!payment) throw new Error("No completed payment found for this listing");

  const [listing] = await prisma.$transaction([
    prisma.listing.update({
      where: { id: listingId },
      data: { status: "REMOVED", isCurrentlyBoosted: false },
    }),
    prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } }),
    prisma.moderationLog.create({
      data: { adminId, listingId, action: "REFUND", reason },
    }),
  ]);
  return listing;
}

export type ModerationQueueFilter = "flagged" | "pending" | "all";

export async function getModerationQueue(filter: ModerationQueueFilter) {
  const where: Prisma.ListingWhereInput =
    filter === "flagged"
      ? { aiFlags: { some: { reviewed: false } } }
      : filter === "pending"
        ? { status: { in: ["DRAFT", "PENDING_PAYMENT"] } }
        : {};

  return prisma.listing.findMany({
    where,
    include: {
      poster: { select: { id: true, name: true, businessName: true } },
      aiFlags: { where: { reviewed: false }, orderBy: { confidenceScore: "desc" } },
      moderationLogs: { orderBy: { createdAt: "desc" }, take: 3, include: { admin: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markFlagsReviewed(listingId: string) {
  await prisma.aiFlag.updateMany({ where: { listingId, reviewed: false }, data: { reviewed: true } });
}

export function isModerationAction(value: string): value is ModerationAction {
  return ["APPROVE", "REJECT", "EDIT", "REFUND"].includes(value);
}
