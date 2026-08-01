import type { AdSlot } from "@prisma/client";

/**
 * Ad slot constants, deliberately kept free of any database import.
 *
 * The admin UI is a client component and needs PLACED_AD_SLOTS. If these lived
 * in lib/ads.ts alongside the Prisma client, importing them would pull `pg`
 * into the browser bundle and fail the production build ("Can't resolve
 * 'dns'/'util/types'"). The dev server tolerates it; `next build` does not.
 * Anything a client component needs belongs here, not in lib/ads.ts.
 *
 * The AdSlot import is type-only, so it erases at compile time.
 */

/** Intrinsic size per slot — reserves space so a loading creative can't shift layout. */
export const AD_SLOT_SIZE: Record<AdSlot, { width: number; height: number }> = {
  SIDEBAR_TOP: { width: 300, height: 250 },
  SIDEBAR_MID: { width: 300, height: 600 },
  SIDEBAR_BOTTOM: { width: 300, height: 250 },
  FEED_INLINE: { width: 728, height: 90 },
  HEADER_LEADERBOARD: { width: 728, height: 90 },
};

/**
 * Slots actually placed on a page right now.
 *
 * SIDEBAR_BOTTOM and HEADER_LEADERBOARD remain in the enum — re-placing one is
 * a single line — but nothing renders them today, so the admin UI must not
 * offer them for new sales. Selling inventory that renders nowhere is worse
 * than having less inventory. Add a slot here in the same change that places it.
 */
export const PLACED_AD_SLOTS: AdSlot[] = ["SIDEBAR_TOP", "SIDEBAR_MID", "FEED_INLINE"];

export function isPlacedSlot(slot: AdSlot): boolean {
  return PLACED_AD_SLOTS.includes(slot);
}
