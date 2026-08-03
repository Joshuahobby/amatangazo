import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { buildOrderBy } from "@/lib/search";
import { listingSearchQuerySchema } from "@/lib/validations/search";

describe("listingSearchQuerySchema", () => {
  it("defaults page to 1 and sort is optional", () => {
    const result = listingSearchQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it("accepts all sort values", () => {
    const sorts = ["relevance", "newest", "salary_desc", "deadline_asc", "price_asc", "price_desc"];
    for (const sort of sorts) {
      const result = listingSearchQuerySchema.safeParse({ sort });
      expect(result.success).toBe(true);
    }
  });

  it("coerces string page numbers", () => {
    const result = listingSearchQuerySchema.safeParse({ page: "3" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.page).toBe(3);
  });

  it("rejects negative page numbers", () => {
    const result = listingSearchQuerySchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });
});

describe("buildOrderBy", () => {
  const rank = Prisma.sql`ts_rank(to_tsvector('english', l.title || ' ' || l.description), plainto_tsquery('english', ${"road"}))`;

  /** ASC/DESC only — case-sensitive so it can't match `l.description`. */
  const directions = (sql: Prisma.Sql) => sql.text.match(/\b(ASC|DESC)\b/g) ?? [];

  const sorts = ["relevance", "newest", "salary_desc", "deadline_asc", "price_asc", "price_desc"];
  const categories = [undefined, "JOB", "TENDER", "AUCTION", "CLASSIFIED"];

  // The regression this guards: a direction used to be appended to whatever the
  // sort returned, so a term that already carried one came out as
  // `… ASC NULLS LAST DESC` and Postgres rejected the whole query (42601) —
  // four of the six sort options were dead in the browse dropdown.
  it("gives every sort/category pairing one direction per ordering term", () => {
    for (const sort of sorts) {
      for (const category of categories) {
        // The primary term plus the createdAt tiebreaker: two, never three.
        expect(directions(buildOrderBy(sort, rank, category)), `${sort} + ${category}`).toHaveLength(2);
      }
    }
  });

  it("orders by the category's own column when the sort applies to it", () => {
    expect(buildOrderBy("salary_desc", rank, "JOB").text).toBe(
      'ORDER BY jd."salaryRangeMax" DESC NULLS LAST, l."createdAt" DESC',
    );
    expect(buildOrderBy("deadline_asc", rank, "TENDER").text).toBe(
      'ORDER BY td."submissionDeadline" ASC NULLS LAST, l."createdAt" DESC',
    );
    expect(buildOrderBy("price_asc", rank, "CLASSIFIED").text).toBe(
      'ORDER BY cd.price ASC NULLS LAST, l."createdAt" DESC',
    );
    expect(buildOrderBy("price_desc", rank, "CLASSIFIED").text).toBe(
      'ORDER BY cd.price DESC NULLS LAST, l."createdAt" DESC',
    );
  });

  it("falls back to newest-first when the sort has no column in the filtered category", () => {
    for (const [sort, category] of [["salary_desc", "TENDER"], ["deadline_asc", "JOB"], ["price_asc", undefined]] as const) {
      expect(buildOrderBy(sort, rank, category).text, `${sort} + ${category}`).toBe(
        'ORDER BY l."createdAt" DESC, l."createdAt" DESC',
      );
    }
  });

  it("ranks by relevance, descending, for the default sort", () => {
    const order = buildOrderBy(undefined, rank, undefined);
    expect(order.text).toContain("ts_rank");
    expect(order.text).toMatch(/DESC, l\."createdAt" DESC$/);
    // The keyword is still bound as a parameter, not inlined into the SQL.
    expect(order.values).toEqual(["road"]);
  });
});
