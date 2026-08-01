import type { Ad, AdSlot } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Fixed intrinsic size per slot, used to reserve space so a slot that resolves
 * to an ad doesn't shift the layout once the image decodes.
 */
export const AD_SLOT_SIZE: Record<AdSlot, { width: number; height: number }> = {
  SIDEBAR_TOP: { width: 300, height: 250 },
  SIDEBAR_MID: { width: 300, height: 600 },
  SIDEBAR_BOTTOM: { width: 300, height: 250 },
  FEED_INLINE: { width: 728, height: 90 },
  HEADER_LEADERBOARD: { width: 728, height: 90 },
};

/**
 * Slots that are actually placed on a page right now.
 *
 * SIDEBAR_BOTTOM and HEADER_LEADERBOARD remain in the enum — re-placing one is
 * a single line — but nothing renders them today, so the admin UI must not
 * offer them for new sales. Selling inventory that renders nowhere is worse
 * than having less inventory.
 */
export const PLACED_AD_SLOTS: AdSlot[] = ["SIDEBAR_TOP", "SIDEBAR_MID", "FEED_INLINE"];

export function isPlacedSlot(slot: AdSlot): boolean {
  return PLACED_AD_SLOTS.includes(slot);
}

/**
 * Picks the ad to show in a slot, or null when nothing is sold.
 *
 * Returning null is load-bearing: AdSlot renders nothing at all in that case,
 * so an empty slot leaves no trace instead of advertising fake inventory.
 */
export async function getAdForSlot(slot: AdSlot): Promise<Ad | null> {
  const now = new Date();

  const candidates = await prisma.ad.findMany({
    where: {
      slot,
      status: "ACTIVE",
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
  });

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Weighted random pick, so an advertiser paying for a bigger share of a
  // slot gets it without needing per-impression scheduling.
  const totalWeight = candidates.reduce((sum, ad) => sum + Math.max(1, ad.weight), 0);
  let cursor = Math.random() * totalWeight;
  for (const ad of candidates) {
    cursor -= Math.max(1, ad.weight);
    if (cursor <= 0) return ad;
  }
  return candidates[candidates.length - 1];
}

export async function recordImpression(id: string): Promise<void> {
  await prisma.ad.updateMany({ where: { id }, data: { impressions: { increment: 1 } } });
}

/** Increments the click counter and returns the destination, or null if unknown. */
export async function recordClick(id: string): Promise<string | null> {
  const ad = await prisma.ad.findUnique({ where: { id }, select: { targetUrl: true } });
  if (!ad) return null;
  await prisma.ad.update({ where: { id }, data: { clicks: { increment: 1 } } });
  return ad.targetUrl;
}
