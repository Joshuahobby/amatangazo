import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import type { ListingRowData } from "@/components/listing-row";
import { ListingRow } from "@/components/listing-row";

/** Rows to show before breaking the feed for the in-feed ad slot. */
const AD_AFTER = 8;

/**
 * The main opportunity feed. Rows rather than cards so the landing page shows
 * a directory's worth of listings above the fold instead of half a dozen.
 *
 * Server-rendered: dropping the per-item framer-motion entrance removes the
 * client bundle this feed used to pull in, and lets the in-feed ad slot (a
 * server component) compose directly into the list.
 */
export async function FeedLatest({ listings }: { listings: ListingRowData[] }) {
  if (listings.length === 0) return null;
  const t = await getTranslations("home");

  const head = listings.slice(0, AD_AFTER);
  const tail = listings.slice(AD_AFTER);

  return (
    <section aria-labelledby="latest-heading">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id="latest-heading" className="section-label">
          {t("latestTitle")}
        </h2>
        <Link href="/listings" className="text-sm font-semibold text-primary hover:underline">
          {t("viewAll")} →
        </Link>
      </div>

      <div className="row-list">
        {head.map((listing) => (
          <ListingRow key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Collapses to nothing when the slot is unsold, leaving the feed as one
          continuous list. */}
      <AdSlot slot="FEED_INLINE" className="my-4" />

      {tail.length > 0 && (
        <div className="row-list">
          {tail.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <Link href="/listings" className="btn-outline">
          {t("viewAll")}
        </Link>
      </div>
    </section>
  );
}
