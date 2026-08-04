/**
 * Pricing tiers and their fallbacks, kept free of Prisma imports so the admin
 * screen can read them without pulling the client into the browser bundle —
 * the same reason `discoveryCategories` lives in `lib/validations/listing`.
 */

export const PRICING_TIERS = ["PAY_PER_BOOST", "ANNUAL_SUBSCRIPTION", "SUBSCRIBER_BOOST_DISCOUNT"] as const;

export type PricingTier = (typeof PRICING_TIERS)[number];

/**
 * What a tier costs when no PricingConfig row exists for it.
 *
 * A fresh install has an empty table, so these are the real prices until an
 * admin saves something — which is why they can't just live inside the query.
 */
export const DEFAULT_PRICES: Record<PricingTier, number> = {
  PAY_PER_BOOST: 10000,
  ANNUAL_SUBSCRIPTION: 300000,
  SUBSCRIBER_BOOST_DISCOUNT: 8000,
};

export type StoredPrice = { tier: string; category: string | null; price: number };

export type TierPrice = { tier: PricingTier; price: number; isDefault: boolean };

/**
 * Every tier, whether or not the database has a row for it.
 *
 * Listing only the stored rows is a deadlock: prices fall back to code when no
 * row exists, so a fresh install renders an empty table and the admin can never
 * create the first row. Driving the list from the tier enum instead means a
 * tier is always editable, and `isDefault` says whether what you're looking at
 * is stored or inherited.
 *
 * Category-scoped rows are ignored on purpose — `getPricing()` only reads
 * `category: null`, so offering per-category fields would imply an effect the
 * checkout doesn't honour.
 */
export function mergeWithDefaults(rows: StoredPrice[]): TierPrice[] {
  const stored = new Map(rows.filter((row) => row.category === null).map((row) => [row.tier, row.price]));

  return PRICING_TIERS.map((tier) => ({
    tier,
    price: stored.get(tier) ?? DEFAULT_PRICES[tier],
    isDefault: !stored.has(tier),
  }));
}
