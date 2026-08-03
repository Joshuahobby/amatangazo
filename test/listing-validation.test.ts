import { describe, expect, it } from "vitest";

import { createListingSchema } from "@/lib/validations/listing";

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

// updateListingSchema is covered in test/listing-update.test.ts, which owns it
// end to end. The two cases that lived here — a partial update is accepted, an
// invalid title is rejected — moved there intact. Both only ever touched the
// base fields, never `details`, which is how the union that emptied every
// detail payload went unnoticed for so long.
