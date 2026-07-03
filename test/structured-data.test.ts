import { describe, expect, it } from "vitest";

import type { ListingWithDetails } from "@/lib/listings";
import { buildListingJsonLd, serializeJsonLd } from "@/lib/structured-data";

// Minimal listing factory — only the fields the JSON-LD builder reads.
function makeListing(overrides: Partial<ListingWithDetails> = {}): ListingWithDetails {
  return {
    id: "l1",
    title: "Test listing",
    description: "A description",
    location: "Kigali",
    category: "JOB",
    publishedAt: new Date("2026-01-15T00:00:00Z"),
    createdAt: new Date("2026-01-10T00:00:00Z"),
    poster: { businessName: null, name: "Acme Ltd" },
    jobDetails: {
      sector: "IT",
      experienceLevel: "MID",
      applicationDeadline: new Date("2026-03-01T00:00:00Z"),
      salaryRangeMin: null,
      salaryRangeMax: null,
    },
    ...overrides,
  } as unknown as ListingWithDetails;
}

describe("serializeJsonLd (stored-XSS regression guard)", () => {
  it("neutralizes a </script> breakout in poster-controlled content", () => {
    const out = serializeJsonLd({ title: "Nice job</script><script>alert(document.cookie)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
  });

  it("escapes ampersands too, and stays valid JSON", () => {
    const out = serializeJsonLd({ title: "R&D role", note: "a < b > c & d" });
    expect(out).not.toContain("&");
    expect(() => JSON.parse(out)).not.toThrow();
    // round-trips back to the original values once parsed
    expect(JSON.parse(out)).toEqual({ title: "R&D role", note: "a < b > c & d" });
  });
});

describe("buildListingJsonLd", () => {
  it("emits a JobPosting for JOB listings", () => {
    const ld = buildListingJsonLd(makeListing());
    expect(ld?.["@type"]).toBe("JobPosting");
    expect(ld?.title).toBe("Test listing");
  });

  it("uses businessName as the hiring organization when present", () => {
    const ld = buildListingJsonLd(makeListing({ poster: { businessName: "Big Corp", name: "ignored" } as never }));
    expect((ld?.hiringOrganization as { name: string }).name).toBe("Big Corp");
  });

  it("returns null when the category's detail row is missing (never a half-built node)", () => {
    expect(buildListingJsonLd(makeListing({ jobDetails: null } as never))).toBeNull();
  });

  it("maps TENDER to a generic WebPage rather than forcing a rich-result type", () => {
    const ld = buildListingJsonLd(
      makeListing({
        category: "TENDER",
        jobDetails: null,
        tenderDetails: { sector: "Works", submissionDeadline: new Date() },
      } as never),
    );
    expect(ld?.["@type"]).toBe("WebPage");
  });
});
