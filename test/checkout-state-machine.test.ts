import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it, vi } from "vitest";

import { handleDepositCompleted, handleDepositFailed } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";

// Integration test — needs the local Postgres (prisma dev). Skips cleanly when
// no DB is reachable so `npm test` stays green in a vendorless CI. Guards the
// payment-completion atomicity + idempotency fix in handleDepositCompleted.
//
// The local dev DB (PGlite-backed `prisma dev`) is noticeably slower on
// transactional writes than the default 5s Vitest timeout allows for, even
// though it's fully functional (verified manually against the same code
// paths via HTTP). Raise the timeout for this file rather than the query
// logic — this is real DB latency in this specific dev environment, not a
// hang in application code.
vi.setConfig({ testTimeout: 20_000, hookTimeout: 20_000 });
let dbReachable = false;
try {
  await prisma.$queryRaw`SELECT 1`;
  dbReachable = true;
} catch {
  dbReachable = false;
}

const createdUserIds: string[] = [];
const createdListingIds: string[] = [];

async function makePoster() {
  const user = await prisma.user.create({ data: { name: `test-poster-${randomUUID()}` } });
  createdUserIds.push(user.id);
  return user;
}

async function makeListing(posterId: string, status: "DRAFT" | "PENDING_PAYMENT" | "LIVE") {
  const listing = await prisma.listing.create({
    data: {
      posterId,
      category: "CLASSIFIED",
      title: "State machine test",
      description: "A listing exercised by the checkout state-machine test.",
      location: "Kigali",
      status,
      publishedAt: status === "LIVE" ? new Date() : null,
    },
  });
  createdListingIds.push(listing.id);
  return listing;
}

async function makePayment(params: {
  userId: string;
  listingId: string;
  type: "LISTING_PUBLISH" | "BOOST";
  depositId: string;
}) {
  return prisma.payment.create({
    data: {
      userId: params.userId,
      listingId: params.listingId,
      type: params.type,
      amount: 10000,
      status: "PENDING",
      pawapayTransactionId: params.depositId,
    },
  });
}

afterAll(async () => {
  if (!dbReachable) return;
  await prisma.boost.deleteMany({ where: { listingId: { in: createdListingIds } } });
  await prisma.notificationLog.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.payment.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.listing.deleteMany({ where: { id: { in: createdListingIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.$disconnect();
});

describe.skipIf(!dbReachable)("handleDepositCompleted", () => {
  it("publishes the listing, activates exactly one boost, and marks the payment COMPLETED", async () => {
    const user = await makePoster();
    const listing = await makeListing(user.id, "PENDING_PAYMENT");
    const depositId = randomUUID();
    await makePayment({ userId: user.id, listingId: listing.id, type: "LISTING_PUBLISH", depositId });

    await handleDepositCompleted(depositId);

    const after = await prisma.listing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(after.status).toBe("LIVE");
    expect(after.isCurrentlyBoosted).toBe(true);
    expect(after.publishedAt).not.toBeNull();

    const payment = await prisma.payment.findFirstOrThrow({ where: { pawapayTransactionId: depositId } });
    expect(payment.status).toBe("COMPLETED");
    expect(payment.completedAt).not.toBeNull();

    const boosts = await prisma.boost.count({ where: { listingId: listing.id } });
    expect(boosts).toBe(1);
  });

  it("is idempotent — a duplicate webhook does not double-publish or double-boost", async () => {
    const user = await makePoster();
    const listing = await makeListing(user.id, "PENDING_PAYMENT");
    const depositId = randomUUID();
    await makePayment({ userId: user.id, listingId: listing.id, type: "LISTING_PUBLISH", depositId });

    await handleDepositCompleted(depositId);
    await handleDepositCompleted(depositId); // second delivery of the same event

    const boosts = await prisma.boost.count({ where: { listingId: listing.id } });
    expect(boosts).toBe(1);
    const after = await prisma.listing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(after.status).toBe("LIVE");
  });
});

describe.skipIf(!dbReachable)("handleDepositFailed", () => {
  it("reverts a LISTING_PUBLISH listing from PENDING_PAYMENT back to DRAFT", async () => {
    const user = await makePoster();
    const listing = await makeListing(user.id, "PENDING_PAYMENT");
    const depositId = randomUUID();
    await makePayment({ userId: user.id, listingId: listing.id, type: "LISTING_PUBLISH", depositId });

    await handleDepositFailed(depositId);

    const after = await prisma.listing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(after.status).toBe("DRAFT");
    const payment = await prisma.payment.findFirstOrThrow({ where: { pawapayTransactionId: depositId } });
    expect(payment.status).toBe("FAILED");
  });

  it("does NOT un-publish a LIVE listing when a BOOST re-boost payment fails", async () => {
    const user = await makePoster();
    const listing = await makeListing(user.id, "LIVE");
    const depositId = randomUUID();
    await makePayment({ userId: user.id, listingId: listing.id, type: "BOOST", depositId });

    await handleDepositFailed(depositId);

    const after = await prisma.listing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(after.status).toBe("LIVE");
  });
});
