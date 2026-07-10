import { describe, expect, it } from "vitest";

import { createListingSchema, updateListingSchema } from "@/lib/validations/listing";

describe("createListingSchema", () => {
  it("accepts a valid JOB listing", () => {
    const result = createListingSchema.safeParse({
      category: "JOB",
      title: "Software Engineer",
      description: "We are hiring a senior engineer to join our team in Kigali.",
      location: "Kigali",
      language: "EN",
      details: {
        sector: "Technology",
        experienceLevel: "SENIOR",
        applicationDeadline: "2026-12-31T00:00:00Z",
        applicationMethod: "PLATFORM",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid CLASSIFIED listing", () => {
    const result = createListingSchema.safeParse({
      category: "CLASSIFIED",
      title: "Toyota Premio 2015",
      description: "Well-maintained Toyota Premio for sale.",
      location: "Kigali",
      language: "EN",
      details: { subcategory: "Vehicles", price: 15000000 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a listing with a title that is too short", () => {
    const result = createListingSchema.safeParse({
      category: "JOB",
      title: "AB",
      description: "A valid description that is long enough.",
      location: "Kigali",
      language: "EN",
      details: {
        sector: "Tech",
        experienceLevel: "ENTRY",
        applicationDeadline: "2026-12-31T00:00:00Z",
        applicationMethod: "PLATFORM",
      },
    });
    expect(result.success).toBe(false);
  });

  it("requires details for each category", () => {
    const result = createListingSchema.safeParse({
      category: "JOB",
      title: "A valid title",
      description: "A valid description that is long enough.",
      location: "Kigali",
      language: "EN",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateListingSchema", () => {
  it("accepts partial updates", () => {
    const result = updateListingSchema.safeParse({ title: "Updated title" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid fields", () => {
    const result = updateListingSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});
