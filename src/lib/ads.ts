import type { Ad, AdSlot } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Server-only ad serving. This module imports Prisma, so a client component
 * must never import from it — see lib/ad-slots.ts for the browser-safe
 * constants (that split is what keeps `pg` out of the client bundle).
 */

// Re-exported for server consumers so they need only one import.
export { AD_SLOT_SIZE, PLACED_AD_SLOTS, isPlacedSlot } from "@/lib/ad-slots";

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
