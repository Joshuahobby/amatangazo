import type { ListingCategory, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

import { listingPublishedMessage, notifyUser, subscriptionActivatedMessage } from "@/lib/notifications";
import { initiateDeposit, isPawaPayConfigured, type PawaPayProvider } from "@/lib/pawapay";
import { prisma } from "@/lib/prisma";
import { issueReferralCredit, markCreditRedeemed, validateCredit } from "@/lib/referrals";

type Db = typeof prisma | Prisma.TransactionClient;

export type CheckoutTier = "PAY_PER_BOOST" | "ANNUAL_SUBSCRIPTION";

const BOOST_DURATION_MS = 24 * 60 * 60 * 1000;
const SUBSCRIPTION_DURATION_MS = 365 * 24 * 60 * 60 * 1000;
const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

/**
 * PRD Monetization & Pricing: "top 6-8, rotating among currently-active
 * boosts" is the PRD's own proposed policy, not an open question — this
 * implements it literally. Bumps the boost closest to naturally expiring
 * anyway when a new one needs a slot, rather than rejecting the purchase.
 */
const FEATURED_SLOT_CAP = 8;

/**
 * Takes an optional transaction client (`db`) so callers that need this to
 * participate in a larger atomic operation — e.g. redeeming a referral
 * credit alongside it, see publishWithReferralCredit — can pass their `tx`.
 * Defaults to the plain client for the common case (called on its own).
 */
async function activateBoost(
  db: Db,
  params: {
    listingId: string;
    category: ListingCategory;
    pricePaid: number;
    paymentId?: string;
    subscriptionId?: string;
    fromAllotment?: boolean;
  },
) {
  const now = new Date();
  const endsAt = new Date(now.getTime() + BOOST_DURATION_MS);

  const currentlyBoosted = await db.listing.findMany({
    where: { category: params.category, isCurrentlyBoosted: true, id: { not: params.listingId } },
    orderBy: { boostExpiresAt: "asc" },
    select: { id: true },
  });
  const overflow = currentlyBoosted.length - (FEATURED_SLOT_CAP - 1);
  const toBump = overflow > 0 ? currentlyBoosted.slice(0, overflow) : [];

  for (const listing of toBump) {
    await db.listing.update({ where: { id: listing.id }, data: { isCurrentlyBoosted: false } });
  }
  await db.listing.update({
    where: { id: params.listingId },
    data: { isCurrentlyBoosted: true, boostExpiresAt: endsAt },
  });
  await db.boost.create({
    data: {
      listingId: params.listingId,
      paymentId: params.paymentId,
      subscriptionId: params.subscriptionId,
      startsAt: now,
      endsAt,
      pricePaid: params.pricePaid,
      fromAllotment: params.fromAllotment ?? false,
    },
  });
}

export async function getPricing() {
  const rows = await prisma.pricingConfig.findMany({ where: { category: null } });
  const byTier = Object.fromEntries(rows.map((row) => [row.tier, row.price]));
  return {
    payPerBoost: byTier.PAY_PER_BOOST ?? 10000,
    annualSubscription: byTier.ANNUAL_SUBSCRIPTION ?? 300000,
    subscriberBoostDiscount: byTier.SUBSCRIBER_BOOST_DISCOUNT ?? 8000,
  };
}

export function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE", expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
  });
}

/** A subscriber publishes for free — no PawaPay call, no Payment row. */
export async function publishWithSubscription(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.posterId !== userId) throw new Error("Listing not found");
  if (listing.status !== "DRAFT" && listing.status !== "PENDING_PAYMENT") {
    throw new Error(`Listing is already ${listing.status}`);
  }

  const subscription = await getActiveSubscription(userId);
  if (!subscription) throw new Error("No active subscription");

  const published = await prisma.listing.update({
    where: { id: listingId },
    data: { status: "LIVE", publishedAt: new Date() },
  });

  await notifyUser(userId, listingPublishedMessage(published.title, `${APP_BASE_URL}/listings/${published.id}`));

  return published;
}

/**
 * Referral credits are full-value, one-time redemptions (see referrals.ts) —
 * redeeming one covers a listing publish entirely regardless of the credit's
 * exact RWF value, same as a real pay-per-boost payment would (publish +
 * 24h featured boost). Not offered toward a subscription checkout: even the
 * larger 30,000 credit is a fraction of the 300,000 subscription price, so
 * that pairing isn't offered in the UI.
 */
export async function publishWithReferralCredit(listingId: string, userId: string, creditId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.posterId !== userId) throw new Error("Listing not found");
  if (listing.status !== "DRAFT" && listing.status !== "PENDING_PAYMENT") {
    throw new Error(`Listing is already ${listing.status}`);
  }

  // One atomic transaction: the credit is only marked spent if the publish +
  // boost writes also succeed, and vice versa — a failure anywhere leaves
  // the credit AVAILABLE and the listing untouched, safe to retry.
  const published = await prisma.$transaction(async (tx) => {
    const amount = await validateCredit(userId, creditId, tx);
    const updated = await tx.listing.update({
      where: { id: listingId },
      data: { status: "LIVE", publishedAt: new Date() },
    });
    await activateBoost(tx, { listingId: updated.id, category: updated.category, pricePaid: amount });
    await markCreditRedeemed(tx, creditId);
    return updated;
  });

  await notifyUser(userId, listingPublishedMessage(published.title, `${APP_BASE_URL}/listings/${published.id}`));

  return published;
}

/** Same one-time-redemption credit, applied to re-boost an already-live listing. */
export async function boostWithReferralCredit(listingId: string, userId: string, creditId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.posterId !== userId) throw new Error("Listing not found");
  if (listing.status !== "LIVE") throw new Error(`Listing is ${listing.status}, not LIVE`);

  return prisma.$transaction(async (tx) => {
    const amount = await validateCredit(userId, creditId, tx);
    await activateBoost(tx, { listingId: listing.id, category: listing.category, pricePaid: amount });
    await markCreditRedeemed(tx, creditId);
    return tx.listing.findUniqueOrThrow({ where: { id: listingId } });
  });
}

export type InitiateCheckoutResult =
  | { ok: true; payment: { id: string; pawapayTransactionId: string | null } }
  | { ok: false; error: string };

type PendingPaymentError = { ok: false; error: string };

/**
 * The DB-write half of checkout initiation (Payment row + listing ->
 * PENDING_PAYMENT), shared between the real flow below and the dev
 * simulator (src/app/api/dev/simulate-checkout/[listingId]/route.ts) — the
 * only thing the dev path skips is the actual initiateDeposit() call, since
 * that needs a live PawaPay account this environment doesn't have.
 */
async function createPendingListingPayment(params: {
  listingId: string;
  userId: string;
  tier: CheckoutTier;
  payerPhoneNumber?: string;
}) {
  const listing = await prisma.listing.findUnique({ where: { id: params.listingId } });
  if (!listing || listing.posterId !== params.userId) {
    return { ok: false, error: "Listing not found" } as PendingPaymentError;
  }
  if (listing.status !== "DRAFT" && listing.status !== "PENDING_PAYMENT") {
    return { ok: false, error: `Listing is already ${listing.status}` } as PendingPaymentError;
  }

  const pricing = await getPricing();
  const amount = params.tier === "ANNUAL_SUBSCRIPTION" ? pricing.annualSubscription : pricing.payPerBoost;
  const paymentType = params.tier === "ANNUAL_SUBSCRIPTION" ? "SUBSCRIPTION" : "LISTING_PUBLISH";
  const depositId = randomUUID();

  const payment = await prisma.payment.create({
    data: {
      userId: params.userId,
      listingId: listing.id,
      type: paymentType,
      amount,
      status: "PENDING",
      pawapayTransactionId: depositId,
      payerPhoneNumber: params.payerPhoneNumber,
    },
  });

  await prisma.listing.update({ where: { id: listing.id }, data: { status: "PENDING_PAYMENT" } });

  return { ok: true, payment, amount, depositId } as const;
}

export async function initiateListingCheckout(params: {
  listingId: string;
  userId: string;
  tier: CheckoutTier;
  phoneNumber: string;
  provider: PawaPayProvider;
}): Promise<InitiateCheckoutResult> {
  if (!isPawaPayConfigured()) {
    return { ok: false, error: "Mobile money payments aren't available right now. Please try again later." };
  }

  const pending = await createPendingListingPayment({ ...params, payerPhoneNumber: params.phoneNumber });
  if (!pending.ok) return pending;
  const { payment, amount, depositId } = pending;

  const result = await initiateDeposit({
    depositId,
    amount,
    phoneNumber: params.phoneNumber,
    provider: params.provider,
    customerMessage: "Amatangazo listing",
  });

  if (!result.ok) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    await prisma.listing.update({ where: { id: payment.listingId! }, data: { status: "DRAFT" } });
    return { ok: false, error: result.failureMessage ?? "Payment was rejected" };
  }

  return { ok: true, payment: { id: payment.id, pawapayTransactionId: payment.pawapayTransactionId } };
}

export async function simulateCheckoutInitiation(params: {
  listingId: string;
  userId: string;
  tier: CheckoutTier;
}) {
  return createPendingListingPayment(params);
}

/** No rollover: counts only this calendar month's allotment-funded boosts. */
async function getBoostAllotmentRemaining(subscription: { id: string; boostsIncludedPerMonth: number }) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const usedThisMonth = await prisma.boost.count({
    where: { subscriptionId: subscription.id, fromAllotment: true, createdAt: { gte: monthStart } },
  });
  return Math.max(0, subscription.boostsIncludedPerMonth - usedThisMonth);
}

export type BoostQuote =
  | { kind: "FROM_ALLOTMENT" }
  | { kind: "SUBSCRIBER_DISCOUNT"; price: number }
  | { kind: "STANDARD"; price: number };

export async function getBoostQuote(userId: string): Promise<BoostQuote> {
  const pricing = await getPricing();
  const subscription = await getActiveSubscription(userId);
  if (!subscription) return { kind: "STANDARD", price: pricing.payPerBoost };

  const remaining = await getBoostAllotmentRemaining(subscription);
  if (remaining > 0) return { kind: "FROM_ALLOTMENT" };
  return { kind: "SUBSCRIBER_DISCOUNT", price: pricing.subscriberBoostDiscount };
}

/** Re-boost an already-live listing using the subscriber's monthly allotment — no payment. */
export async function redeemBoostFromAllotment(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.posterId !== userId) throw new Error("Listing not found");
  if (listing.status !== "LIVE") throw new Error(`Listing is ${listing.status}, not LIVE`);

  const subscription = await getActiveSubscription(userId);
  if (!subscription) throw new Error("No active subscription");
  const remaining = await getBoostAllotmentRemaining(subscription);
  if (remaining <= 0) throw new Error("Monthly boost allotment already used");

  await prisma.$transaction((tx) =>
    activateBoost(tx, {
      listingId: listing.id,
      category: listing.category,
      pricePaid: 0,
      subscriptionId: subscription.id,
      fromAllotment: true,
    }),
  );
  return prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
}

async function createPendingBoostPayment(params: {
  listingId: string;
  userId: string;
  payerPhoneNumber?: string;
}) {
  const listing = await prisma.listing.findUnique({ where: { id: params.listingId } });
  if (!listing || listing.posterId !== params.userId) {
    return { ok: false, error: "Listing not found" } as PendingPaymentError;
  }
  if (listing.status !== "LIVE") {
    return { ok: false, error: `Listing is ${listing.status}, not LIVE` } as PendingPaymentError;
  }

  const quote = await getBoostQuote(params.userId);
  if (quote.kind === "FROM_ALLOTMENT") {
    return { ok: false, error: "Use the free monthly allotment instead of a paid boost" } as PendingPaymentError;
  }

  const amount = quote.price;
  const depositId = randomUUID();
  const payment = await prisma.payment.create({
    data: {
      userId: params.userId,
      listingId: listing.id,
      type: "BOOST",
      amount,
      status: "PENDING",
      pawapayTransactionId: depositId,
      payerPhoneNumber: params.payerPhoneNumber,
    },
  });

  return { ok: true, payment, amount, depositId } as const;
}

export async function initiateBoostCheckout(params: {
  listingId: string;
  userId: string;
  phoneNumber: string;
  provider: PawaPayProvider;
}): Promise<InitiateCheckoutResult> {
  if (!isPawaPayConfigured()) {
    return { ok: false, error: "Mobile money payments aren't available right now. Please try again later." };
  }

  const pending = await createPendingBoostPayment({ ...params, payerPhoneNumber: params.phoneNumber });
  if (!pending.ok) return pending;
  const { payment, amount, depositId } = pending;

  const result = await initiateDeposit({
    depositId,
    amount,
    phoneNumber: params.phoneNumber,
    provider: params.provider,
    customerMessage: "Amatangazo boost",
  });

  if (!result.ok) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    return { ok: false, error: result.failureMessage ?? "Payment was rejected" };
  }

  return { ok: true, payment: { id: payment.id, pawapayTransactionId: payment.pawapayTransactionId } };
}

export async function simulateBoostCheckoutInitiation(params: { listingId: string; userId: string }) {
  return createPendingBoostPayment(params);
}

/**
 * Shared by the real webhook handler and the dev simulator (no live PawaPay
 * sandbox in this environment — see /api/dev/pawapay-webhook). Idempotent:
 * safe to call more than once for the same payment.
 */
export async function handleDepositCompleted(pawapayTransactionId: string) {
  const payment = await prisma.payment.findUnique({ where: { pawapayTransactionId } });
  if (!payment) throw new Error(`No payment found for deposit ${pawapayTransactionId}`);
  if (payment.status === "COMPLETED") return payment;

  // The payment is flipped to COMPLETED in the SAME transaction as the domain
  // writes it pays for (listing -> LIVE, boost, subscription). Doing them
  // atomically is what makes the idempotency guard above sound: a crash can
  // never leave the payment COMPLETED while the listing is stuck in
  // PENDING_PAYMENT — either everything commits or nothing does, and a webhook
  // retry re-runs the whole thing. External/best-effort side effects
  // (notification SMS, referral credit) run after the commit.
  const outcome = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    if (payment.type === "LISTING_PUBLISH" && payment.listingId) {
      const listing = await tx.listing.update({
        where: { id: payment.listingId },
        data: { status: "LIVE", publishedAt: new Date() },
      });
      await activateBoost(tx, {
        listingId: listing.id,
        category: listing.category,
        pricePaid: payment.amount,
        paymentId: payment.id,
      });
      return { published: { id: listing.id, title: listing.title }, viaSubscription: false };
    }

    if (payment.type === "BOOST" && payment.listingId) {
      const listing = await tx.listing.findUniqueOrThrow({ where: { id: payment.listingId } });
      await activateBoost(tx, {
        listingId: listing.id,
        category: listing.category,
        pricePaid: payment.amount,
        paymentId: payment.id,
      });
      return { published: null, viaSubscription: false };
    }

    if (payment.type === "SUBSCRIPTION") {
      const now = new Date();
      await tx.subscription.create({
        data: {
          userId: payment.userId,
          paymentId: payment.id,
          status: "ACTIVE",
          startedAt: now,
          expiresAt: new Date(now.getTime() + SUBSCRIPTION_DURATION_MS),
          pricePaid: payment.amount,
        },
      });
      if (payment.listingId) {
        const listing = await tx.listing.update({
          where: { id: payment.listingId },
          data: { status: "LIVE", publishedAt: now },
        });
        return { published: { id: listing.id, title: listing.title }, viaSubscription: true };
      }
    }

    return { published: null, viaSubscription: false };
  });

  if (outcome.published) {
    const url = `${APP_BASE_URL}/listings/${outcome.published.id}`;
    const message = outcome.viaSubscription
      ? subscriptionActivatedMessage(outcome.published.title, url)
      : listingPublishedMessage(outcome.published.title, url);
    await notifyUser(payment.userId, message);
  }

  // Referral conversions are keyed off a paying user's first LISTING_PUBLISH
  // or SUBSCRIPTION payment — a re-boost (BOOST type) isn't a conversion.
  // issueReferralCredit is itself idempotent (acts only on a PENDING referral).
  if (payment.type === "LISTING_PUBLISH" || payment.type === "SUBSCRIPTION") {
    await issueReferralCredit(payment);
  }

  return prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
}

export async function handleDepositFailed(pawapayTransactionId: string) {
  const payment = await prisma.payment.findUnique({ where: { pawapayTransactionId } });
  if (!payment) throw new Error(`No payment found for deposit ${pawapayTransactionId}`);
  if (payment.status !== "PENDING") return payment;

  const updated = await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  // BOOST payments target an already-LIVE listing — a failed re-boost must
  // not un-publish it. Only LISTING_PUBLISH/SUBSCRIPTION leave a listing
  // parked in PENDING_PAYMENT that needs to revert.
  if (payment.listingId && payment.type !== "BOOST") {
    await prisma.listing.update({ where: { id: payment.listingId }, data: { status: "DRAFT" } });
  }
  return updated;
}
