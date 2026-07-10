import { describe, expect, it } from "vitest";

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
