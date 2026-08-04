import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Covers the bookkeeping half of runNotificationDigest — what it writes after a
 * send succeeds or fails. test/digest-matching.test.ts covers the query half
 * (buildSearchWhere), which is a pure function and needs no mocking.
 *
 * The regression under test: a failed send used to advance lastNotifiedAt
 * anyway, which pushed those listings out of the next run's candidate window
 * for good.
 */

const { prismaMock, sendEmailMock } = vi.hoisted(() => ({
  prismaMock: {
    savedSearch: { findMany: vi.fn(), update: vi.fn() },
    listing: { findMany: vi.fn() },
    notificationLog: { findMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
  sendEmailMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/email", () => ({ sendEmail: sendEmailMock }));
vi.mock("@/lib/sms", () => ({ sendSms: vi.fn(), sendWhatsApp: vi.fn() }));

const { runNotificationDigest } = await import("@/lib/notifications");

const LAST_NOTIFIED = new Date("2026-02-01T00:00:00Z");

function savedSearch() {
  return {
    id: "search-1",
    userId: "user-1",
    category: "JOB",
    filters: {},
    channel: "EMAIL",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    lastNotifiedAt: LAST_NOTIFIED,
    user: {
      id: "user-1",
      email: "seeker@example.com",
      phoneNumber: null,
      preferredLanguage: "EN",
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});

  // The row is stateful on purpose. If findMany just replayed a constant, the
  // two-run test below would pass even with the bug present, because the second
  // run would re-read the original lastNotifiedAt no matter what was written.
  let row = savedSearch();
  prismaMock.savedSearch.findMany.mockImplementation(async () => [row]);
  prismaMock.savedSearch.update.mockImplementation(({ data }) => {
    row = { ...row, lastNotifiedAt: data.lastNotifiedAt };
    return { op: "update" };
  });

  prismaMock.listing.findMany.mockResolvedValue([{ id: "listing-1", title: "Driver" }]);
  prismaMock.notificationLog.findMany.mockResolvedValue([]);
  prismaMock.notificationLog.createMany.mockReturnValue({ op: "createMany" });
  prismaMock.$transaction.mockResolvedValue([]);
});

describe("runNotificationDigest bookkeeping", () => {
  it("advances lastNotifiedAt when the digest is delivered", async () => {
    sendEmailMock.mockResolvedValue(undefined);

    const result = await runNotificationDigest();

    expect(result.notificationsSent).toBe(1);
    expect(prismaMock.savedSearch.update).toHaveBeenCalledWith({
      where: { id: "search-1" },
      data: { lastNotifiedAt: expect.any(Date) },
    });
  });

  it("leaves lastNotifiedAt alone when delivery fails", async () => {
    sendEmailMock.mockRejectedValue(new Error("SMS is not configured"));

    const result = await runNotificationDigest();

    expect(result.notificationsFailed).toBe(1);
    expect(prismaMock.savedSearch.update).not.toHaveBeenCalled();
  });

  it("keeps the same candidate window across a failed run, so nothing is dropped", async () => {
    sendEmailMock.mockRejectedValue(new Error("vendor down"));

    await runNotificationDigest();
    await runNotificationDigest();

    // Both runs must ask for the same publishedAt window. If the failed run had
    // advanced lastNotifiedAt, the second window would start later and
    // listing-1 would never be offered again.
    const [first, second] = prismaMock.listing.findMany.mock.calls;
    expect(first[0].where.publishedAt).toEqual({ gt: LAST_NOTIFIED });
    expect(second[0].where.publishedAt).toEqual(first[0].where.publishedAt);
  });

  it("still logs the failure, so a broken vendor leaves a trail", async () => {
    sendEmailMock.mockRejectedValue(new Error("vendor down"));

    await runNotificationDigest();

    expect(prismaMock.notificationLog.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ listingId: "listing-1", status: "failed" })],
    });
  });

  it("does not re-notify a listing already logged as sent", async () => {
    prismaMock.notificationLog.findMany.mockResolvedValue([{ listingId: "listing-1" }]);
    sendEmailMock.mockResolvedValue(undefined);

    const result = await runNotificationDigest();

    expect(result.searchesMatched).toBe(0);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(prismaMock.savedSearch.update).not.toHaveBeenCalled();
  });
});
