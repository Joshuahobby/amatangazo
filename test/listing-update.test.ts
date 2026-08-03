import { describe, expect, it } from "vitest";

import { listingCategories, updateListingSchema, type ListingCategory } from "@/lib/validations/listing";

/** One field that belongs to each category, and a value the schema accepts. */
const OWN_FIELD: Record<ListingCategory, { field: string; value: unknown }> = {
  JOB: { field: "salaryRangeMax", value: 900000 },
  TENDER: { field: "budgetMax", value: 4000000 },
  AUCTION: { field: "auctionLocation", value: "Nyabugogo" },
  CLASSIFIED: { field: "price", value: 65000 },
};

describe("updateListingSchema", () => {
  // The regression this guards. `details` used to be a union of four
  // `.partial()` schemas; Zod returns the first branch that parses, every
  // branch accepts `{}`, and unknown keys are stripped by default — so every
  // payload parsed as the JOB branch and came back as `{}`. The route handed
  // Prisma an empty update, which is a no-op that still answers 200, so
  // editing a classified's price appeared to work and saved nothing.
  it("keeps each category's own detail fields instead of stripping them", () => {
    for (const category of listingCategories) {
      const { field, value } = OWN_FIELD[category];
      const result = updateListingSchema(category).safeParse({ details: { [field]: value } });

      expect(result.success, `${category} rejected its own field ${field}`).toBe(true);
      if (result.success) {
        expect(result.data.details, `${category} dropped ${field}`).toEqual({ [field]: value });
      }
    }
  });

  it("rejects a field belonging to a different category rather than dropping it", () => {
    // A classified has no salary band. Silently stripping it is how the
    // original defect stayed invisible, so this has to be an error.
    const result = updateListingSchema("CLASSIFIED").safeParse({ details: { salaryRangeMax: 900000 } });
    expect(result.success).toBe(false);
  });

  it("never returns an empty details object for a payload that carried fields", () => {
    for (const category of listingCategories) {
      const { field, value } = OWN_FIELD[category];
      const result = updateListingSchema(category).safeParse({ details: { [field]: value } });
      if (result.success) {
        expect(Object.keys(result.data.details ?? {}), `${category} emptied its details`).not.toHaveLength(0);
      }
    }
  });

  it("allows a partial update — no category requires its full detail set", () => {
    const result = updateListingSchema("JOB").safeParse({ title: "Senior driver wanted" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Senior driver wanted");
      expect(result.data.details).toBeUndefined();
    }
  });

  it("still validates the base fields it shares with create", () => {
    for (const title of ["", "ab"]) {
      expect(updateListingSchema("JOB").safeParse({ title }).success, `title ${JSON.stringify(title)}`).toBe(false);
    }
    expect(updateListingSchema("JOB").safeParse({ description: "too short" }).success).toBe(false);
  });

  it("coerces detail values the same way the create schema does", () => {
    // The edit form posts numbers it read out of text inputs.
    const result = updateListingSchema("CLASSIFIED").safeParse({ details: { price: "65000" } });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.details).toEqual({ price: 65000 });
  });

  // `.partial()` leaves `.default()` in place, so these used to come back
  // carrying fields the caller never sent — and the route wrote them, resetting
  // a job's experience level or an auction's currency as a side effect of
  // editing something else entirely.
  it("does not invent fields from create-time defaults", () => {
    const job = updateListingSchema("JOB").safeParse({ details: { salaryRangeMax: 900000 } });
    expect(job.success).toBe(true);
    if (job.success) expect(job.data.details).toEqual({ salaryRangeMax: 900000 });

    const auction = updateListingSchema("AUCTION").safeParse({ details: { startingPrice: 250000 } });
    expect(auction.success).toBe(true);
    if (auction.success) expect(auction.data.details).toEqual({ startingPrice: 250000 });
  });

  it("still lets a caller set a field that has a default, when they mean to", () => {
    const result = updateListingSchema("AUCTION").safeParse({ details: { currency: "USD" } });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.details).toEqual({ currency: "USD" });
  });
});
