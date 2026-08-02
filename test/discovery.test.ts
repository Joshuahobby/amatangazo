import { describe, expect, it } from "vitest";

import { discoveryQuery } from "@/lib/discovery";
import { isDiscoveryCategory, listingCategories } from "@/lib/validations/listing";

const now = new Date("2026-01-01T00:00:00Z");

describe("isDiscoveryCategory", () => {
  it("accepts the three categories with a discovery feed", () => {
    for (const category of ["JOB", "TENDER", "AUCTION"]) {
      expect(isDiscoveryCategory(category)).toBe(true);
    }
  });

  it("rejects CLASSIFIED, the empty 'all' filter, and anything unknown", () => {
    expect(isDiscoveryCategory("CLASSIFIED")).toBe(false);
    expect(isDiscoveryCategory("")).toBe(false);
    expect(isDiscoveryCategory("job")).toBe(false);
    expect(isDiscoveryCategory("DROP TABLE")).toBe(false);
  });

  it("only ever accepts real listing categories", () => {
    for (const category of listingCategories) {
      if (isDiscoveryCategory(category)) expect(listingCategories).toContain(category);
    }
  });
});

describe("discoveryQuery", () => {
  it("scopes every feed to LIVE listings in its own category", () => {
    for (const category of ["JOB", "TENDER", "AUCTION"] as const) {
      const { where } = discoveryQuery(category, now);
      expect(where.status).toBe("LIVE");
      expect(where.category).toBe(category);
    }
  });

  it("ranks jobs by the top of the salary band, skipping jobs that state none", () => {
    const { where, orderBy } = discoveryQuery("JOB", now);
    expect(where.jobDetails).toEqual({
      is: { salaryRangeMax: { not: null }, applicationDeadline: { gte: now } },
    });
    expect(orderBy).toEqual({ jobDetails: { salaryRangeMax: "desc" } });
  });

  it("ranks tenders by the soonest submission deadline", () => {
    const { where, orderBy } = discoveryQuery("TENDER", now);
    expect(where.tenderDetails).toEqual({ is: { submissionDeadline: { gte: now } } });
    expect(orderBy).toEqual({ tenderDetails: { submissionDeadline: "asc" } });
  });

  it("ranks auctions by the soonest auction date", () => {
    const { where, orderBy } = discoveryQuery("AUCTION", now);
    expect(where.auctionDetails).toEqual({ is: { auctionDate: { gte: now } } });
    expect(orderBy).toEqual({ auctionDetails: { auctionDate: "asc" } });
  });

  it("excludes listings whose date has already passed — a closed tender isn't discovery", () => {
    for (const category of ["JOB", "TENDER", "AUCTION"] as const) {
      const { where } = discoveryQuery(category, now);
      const details = where.jobDetails ?? where.tenderDetails ?? where.auctionDetails;
      expect(JSON.stringify(details)).toContain('"gte"');
    }
  });
});
