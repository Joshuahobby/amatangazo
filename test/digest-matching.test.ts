import type { SavedSearch } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { buildSearchWhere } from "@/lib/notifications";

function search(overrides: Partial<Pick<SavedSearch, "category" | "filters">>) {
  return { category: "JOB", filters: {}, ...overrides } as Pick<SavedSearch, "category" | "filters">;
}

const since = new Date("2026-01-01T00:00:00Z");

describe("buildSearchWhere (T7.3 digest matching)", () => {
  it("always scopes to LIVE listings in the search's category, published after `since`", () => {
    const where = buildSearchWhere(search({ category: "TENDER" }), since);
    expect(where.status).toBe("LIVE");
    expect(where.category).toBe("TENDER");
    expect(where.publishedAt).toEqual({ gt: since });
  });

  it("turns a keyword filter into a case-insensitive title/description OR", () => {
    const where = buildSearchWhere(search({ filters: { keyword: "generator" } }), since);
    expect(where.OR).toEqual([
      { title: { contains: "generator", mode: "insensitive" } },
      { description: { contains: "generator", mode: "insensitive" } },
    ]);
  });

  it("applies a location filter case-insensitively", () => {
    const where = buildSearchWhere(search({ filters: { location: "Kigali" } }), since);
    expect(where.location).toEqual({ contains: "Kigali", mode: "insensitive" });
  });

  it("routes the sector filter to jobDetails for JOB searches", () => {
    const where = buildSearchWhere(search({ category: "JOB", filters: { sector: "IT" } }), since);
    expect(where.jobDetails).toEqual({ sector: { contains: "IT", mode: "insensitive" } });
    expect(where.tenderDetails).toBeUndefined();
  });

  it("routes the sector filter to tenderDetails for TENDER searches", () => {
    const where = buildSearchWhere(search({ category: "TENDER", filters: { sector: "Works" } }), since);
    expect(where.tenderDetails).toEqual({ sector: { contains: "Works", mode: "insensitive" } });
    expect(where.jobDetails).toBeUndefined();
  });

  it("merges experienceLevel with sector on jobDetails rather than overwriting it", () => {
    const where = buildSearchWhere(search({ category: "JOB", filters: { sector: "IT", experienceLevel: "SENIOR" } }), since);
    expect(where.jobDetails).toEqual({
      sector: { contains: "IT", mode: "insensitive" },
      experienceLevel: "SENIOR",
    });
  });

  it("ignores a sector filter for categories without a sector field", () => {
    const where = buildSearchWhere(search({ category: "CLASSIFIED", filters: { sector: "IT" } }), since);
    expect(where.jobDetails).toBeUndefined();
    expect(where.tenderDetails).toBeUndefined();
  });
});
