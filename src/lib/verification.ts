import { prisma } from "@/lib/prisma";

/**
 * Epic 9 — verified badge. Manual review, non-gating: unverified users can
 * still post; the badge only signals trust on their listings.
 * SLA (T9.3): 1-business-day public promise, 48h hard auto-flag — breaches
 * are computed from verificationSubmittedAt via the composite index on User.
 */

export const SLA_HOURS = 48;

export async function submitVerification(userId: string, documentUrl: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      verificationStatus: "PENDING",
      verificationDocumentUrl: documentUrl,
      verificationSubmittedAt: new Date(),
      verificationReviewedAt: null,
      verificationReviewedBy: null,
    },
    select: { verificationStatus: true, verificationSubmittedAt: true },
  });
}

/**
 * T9.2 — queue sorted by account value: active subscribers first, then total
 * completed payment volume, then oldest submission first within a tier.
 */
export async function getVerificationQueue() {
  const now = new Date();
  const pending = await prisma.user.findMany({
    where: { verificationStatus: "PENDING" },
    select: {
      id: true,
      name: true,
      businessName: true,
      email: true,
      phoneNumber: true,
      accountType: true,
      verificationDocumentUrl: true,
      verificationSubmittedAt: true,
      subscriptions: { where: { status: "ACTIVE", expiresAt: { gt: now } }, select: { id: true } },
      payments: { where: { status: "COMPLETED" }, select: { amount: true } },
    },
  });

  const slaCutoff = new Date(now.getTime() - SLA_HOURS * 60 * 60 * 1000);
  const queue = pending
    .map((user) => ({
      id: user.id,
      name: user.businessName ?? user.name,
      contact: user.email ?? user.phoneNumber,
      accountType: user.accountType,
      documentUrl: user.verificationDocumentUrl,
      submittedAt: user.verificationSubmittedAt,
      isSubscriber: user.subscriptions.length > 0,
      totalPaid: user.payments.reduce((sum, p) => sum + p.amount, 0),
      slaBreached: user.verificationSubmittedAt !== null && user.verificationSubmittedAt < slaCutoff,
    }))
    .sort((a, b) => {
      if (a.isSubscriber !== b.isSubscriber) return a.isSubscriber ? -1 : 1;
      if (a.totalPaid !== b.totalPaid) return b.totalPaid - a.totalPaid;
      return (a.submittedAt?.getTime() ?? 0) - (b.submittedAt?.getTime() ?? 0);
    });

  return { queue, slaBreachedCount: queue.filter((q) => q.slaBreached).length };
}

export async function reviewVerification(
  adminId: string,
  targetUserId: string,
  decision: "VERIFIED" | "REJECTED",
  reason?: string,
) {
  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: {
        verificationStatus: decision,
        verificationReviewedAt: new Date(),
        verificationReviewedBy: adminId,
      },
      select: { id: true, verificationStatus: true },
    }),
    prisma.moderationLog.create({
      data: {
        adminId,
        targetUserId,
        action: decision === "VERIFIED" ? "APPROVE" : "REJECT",
        reason: reason ?? `Verification ${decision.toLowerCase()}`,
      },
    }),
  ]);
  return user;
}
