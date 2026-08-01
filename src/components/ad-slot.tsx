import type { AdSlot as AdSlotName } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { AdImpression } from "@/components/ad-impression";
import { AD_SLOT_SIZE, getAdForSlot } from "@/lib/ads";

/**
 * Renders the ad sold into a slot, or nothing at all.
 *
 * The null return is the point: unsold inventory must leave no trace. A
 * placeholder here reads as fabricated inventory, which is exactly why the
 * previous static ad banner was pulled from the landing page.
 */
export async function AdSlot({ slot, className = "" }: { slot: AdSlotName; className?: string }) {
  const ad = await getAdForSlot(slot);
  if (!ad) return null;

  const t = await getTranslations("home");
  const { width, height } = AD_SLOT_SIZE[slot];

  return (
    <a
      href={`/api/ads/${ad.id}/click`}
      target="_blank"
      rel="noopener sponsored"
      className={`ad-slot ${className}`}
      // Reserve the creative's aspect ratio so decoding doesn't shift layout.
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.imageUrl}
        alt={ad.altText}
        width={width}
        height={height}
        loading="lazy"
        // object-contain, never object-cover: an advertiser supplies an
        // exact-size creative and paid for all of it. A ratio mismatch
        // letterboxes against the card surface rather than cropping their art.
        className="h-full w-full object-contain"
      />
      <span className="ad-slot-label">{t("sponsoredLabel")}</span>
      <AdImpression adId={ad.id} />
    </a>
  );
}
