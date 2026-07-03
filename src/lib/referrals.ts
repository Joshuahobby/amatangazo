import type { Prisma } from "@prisma/client";

import { notifyUser } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type Db = typeof prisma | Prisma.TransactionClient;

/**
 * RWF values per PRD P0-4: "1 free boost credit (RWF 10,000 value)" for a
 * referred user's first paid listing, "proposed at RWF 30,000" for a first
 * annual-subscription conversion. Not wired into PricingConfig — the PRD's
 * "pricing is not hardcoded" checkbox is scoped to the boost/subscription
 * tiers explicitly, not these.
 */
const LISTING_CONVERSION_CREDIT = 10000;
const SUBSCRIPTION_CONVERSION_CREDIT = 30000;
const CREDIT_EXPIRY_DAYS = 90;
const MONTHLY_CREDIT_CAP = 10;

export function buildReferralLink(referralCode: string) {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${base}/?ref=${referralCode}`;
}

/** Called from a Better Auth user.create hook — links a new signup to whoever referred them. */
export async function linkReferralOnSignup(newUserId: string, referralCode: string) {
  const referrer = await prisma.user.findUnique({ where: { referralCode } });
  if (!referrer || referrer.id === newUserId) return;

  await prisma.$transaction([
    prisma.user.update({ where: { id: newUserId }, data: { referredByUserId: referrer.id } }),
    prisma.referral.create({
      data: { referrerUserId: referrer.id, referredUserId: newUserId, status: "PENDING" },
    }),
  ]);
}

async function hasSharedPaymentMethod(referrerUserId: string, payerPhoneNumber: string | null) {
  if (!payerPhoneNumber) return false;
  const overlap = await prisma.payment.findFirst({
    where: { userId: referrerUserId, payerPhoneNumber },
  });
  return Boolean(overlap);
}

function monthStart() {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Called after a LISTING_PUBLISH/SUBSCRIPTION payment completes. No-ops
 * unless the paying user has a still-PENDING referral — that status check is
 * what guarantees this only fires once, on the referred user's first paid
 * conversion (whichever type happens first).
 */
export async function issueReferralCredit(payment: {
  id: string;
  userId: string;
  type: string;
  payerPhoneNumber: string | null;
}) {
  const referral = await prisma.referral.findFirst({
    where: { referredUserId: payment.userId, status: "PENDING" },
  });
  if (!referral) return;

  if (await hasSharedPaymentMethod(referral.referrerUserId, payment.payerPhoneNumber)) {
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: "FRAUD_HOLD", fraudFlagReason: "Referred account shares a payment method with the referrer" },
    });
    return;
  }

  const creditCount = await prisma.referralCredit.count({
    where: { userId: referral.referrerUserId, createdAt: { gte: monthStart() } },
  });
  if (creditCount >= MONTHLY_CREDIT_CAP) {
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: "REJECTED", fraudFlagReason: `Monthly referral credit cap (${MONTHLY_CREDIT_CAP}) reached` },
    });
    return;
  }

  const isSubscription = payment.type === "SUBSCRIPTION";
  const amount = isSubscription ? SUBSCRIPTION_CONVERSION_CREDIT : LISTING_CONVERSION_CREDIT;
  const creditType = isSubscription ? "SUBSCRIPTION_CREDIT" : "BOOST_CREDIT";
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CREDIT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referral.id },
      data: { status: "CREDITED", creditType, creditValue: amount, creditedAt: now },
    }),
    prisma.referralCredit.create({
      data: { userId: referral.referrerUserId, referralId: referral.id, amount, status: "AVAILABLE", expiresAt },
    }),
  ]);

  await notifyUser(referral.referrerUserId, `You earned a RWF ${amount.toLocaleString()} referral credit on Amatangazo.`);
}

/**
 * T4.6 (scheduled half) — materialize the EXPIRED status on credits past
 * their 90-day window. Reads already exclude expired credits at query time
 * (getAvailableCredits filters expiresAt > now), so this is only for an
 * accurate stored status in the admin/reporting views. Idempotent.
 */
export async function expireStaleCredits() {
  const result = await prisma.referralCredit.updateMany({
    where: { status: "AVAILABLE", expiresAt: { lte: new Date() } },
    data: { status: "EXPIRED" },
  });
  return { expired: result.count };
}

/** No stored "expired" flag at read time — availability is always a query-time check, same pattern as the SLA-breach index. */
export function getAvailableCredits(userId: string) {
  return prisma.referralCredit.findMany({
    where: { userId, status: "AVAILABLE", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Split into validate + mark so callers can do the work the credit pays for
 * (publish a listing, activate a boost) *between* the two calls, all inside
 * one transaction (pass `tx` for both). Marking the credit redeemed only
 * after that work succeeds means a failure downstream never burns a credit
 * without delivering what it paid for — the credit stays AVAILABLE and the
 * caller can retry. markCreditRedeemed's conditional update (still
 * AVAILABLE) is what stops two concurrent redemptions of the same credit
 * both succeeding — the second one's update matches zero rows and throws.
 */
export async function validateCredit(userId: string, creditId: string, db: Db = prisma): Promise<number> {
  const credit = await db.referralCredit.findFirst({
    where: { id: creditId, userId, status: "AVAILABLE", expiresAt: { gt: new Date() } },
  });
  if (!credit) throw new Error("Credit not found, already used, or expired");
  return credit.amount;
}

export async function markCreditRedeemed(db: Db, creditId: string) {
  const result = await db.referralCredit.updateMany({
    where: { id: creditId, status: "AVAILABLE" },
    data: { status: "REDEEMED", redeemedAt: new Date() },
  });
  if (result.count === 0) throw new Error("Credit was already redeemed");
}

export async function getReferralStats(userId: string) {
  const [referrals, credits] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerUserId: userId },
      include: { referredUser: { select: { name: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getAvailableCredits(userId),
  ]);

  return {
    referralCount: referrals.length,
    convertedCount: referrals.filter((r) => r.status === "CREDITED").length,
    availableCredits: credits,
    availableCreditTotal: credits.reduce((sum, c) => sum + c.amount, 0),
    referrals,
  };
}
