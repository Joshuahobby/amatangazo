import { describe, expect, it } from "vitest";

import { DEFAULT_PRICES, PRICING_TIERS, mergeWithDefaults, type StoredPrice } from "@/lib/pricing";

describe("mergeWithDefaults", () => {
  // The regression this guards. The admin screen used to render one row per
  // *existing* PricingConfig record, but prices fall back to code when no row
  // exists — so a fresh install showed an empty table and the admin could never
  // save the first price. Every tier has to be offered regardless of storage.
  it("offers every tier when the table is empty", () => {
    const merged = mergeWithDefaults([]);

    expect(merged.map((row) => row.tier)).toEqual([...PRICING_TIERS]);
    for (const row of merged) {
      expect(row.price, `${row.tier} price`).toBe(DEFAULT_PRICES[row.tier]);
      expect(row.isDefault, `${row.tier} isDefault`).toBe(true);
    }
  });

  it("prefers a stored price over the default and marks it as stored", () => {
    const merged = mergeWithDefaults([{ tier: "PAY_PER_BOOST", category: null, price: 100 }]);
    const payPerBoost = merged.find((row) => row.tier === "PAY_PER_BOOST");

    expect(payPerBoost).toEqual({ tier: "PAY_PER_BOOST", price: 100, isDefault: false });
  });

  it("still offers the tiers that have no row alongside one that does", () => {
    const merged = mergeWithDefaults([{ tier: "PAY_PER_BOOST", category: null, price: 100 }]);

    expect(merged).toHaveLength(PRICING_TIERS.length);
    expect(merged.filter((row) => row.isDefault).map((row) => row.tier)).toEqual([
      "ANNUAL_SUBSCRIPTION",
      "SUBSCRIBER_BOOST_DISCOUNT",
    ]);
  });

  // getPricing() reads only `category: null`, so a category-scoped row has no
  // effect on checkout. Surfacing one here would imply an effect that isn't real.
  it("ignores category-scoped rows", () => {
    const rows: StoredPrice[] = [{ tier: "PAY_PER_BOOST", category: "JOB", price: 55 }];
    const payPerBoost = mergeWithDefaults(rows).find((row) => row.tier === "PAY_PER_BOOST");

    expect(payPerBoost?.price).toBe(DEFAULT_PRICES.PAY_PER_BOOST);
    expect(payPerBoost?.isDefault).toBe(true);
  });

  it("returns the tiers in a stable order, so the rows do not jump around on save", () => {
    const before = mergeWithDefaults([]).map((row) => row.tier);
    const after = mergeWithDefaults([{ tier: "SUBSCRIBER_BOOST_DISCOUNT", category: null, price: 1 }]).map(
      (row) => row.tier,
    );

    expect(after).toEqual(before);
  });
});
