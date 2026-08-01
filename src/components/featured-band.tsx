import { getTranslations } from "next-intl/server";
import Link from "next/link";

import type { ListingRowData } from "@/components/listing-row";
import { ListingRow } from "@/components/listing-row";

function StarIcon() {
  return (
    <svg className="h-5 w-5 text-accent" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/**
 * Boosted listings, pinned above the general feed.
 *
 * Replaces the old horizontal card carousel: a row list shows roughly three
 * times as many paid placements in the same vertical space, and drops the
 * scroll-arrow client JS entirely.
 */
export async function FeaturedBand({ listings }: { listings: ListingRowData[] }) {
  if (listings.length === 0) return null;
  const t = await getTranslations("home");

  return (
    <section aria-labelledby="featured-heading">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id="featured-heading" className="section-label">
          <StarIcon />
          {t("featuredTitle")}
        </h2>
        <Link href="/listings?boosted=true" className="text-sm font-semibold text-primary hover:underline">
          {t("viewAll")} →
        </Link>
      </div>

      <div className="row-list">
        {listings.map((listing) => (
          <ListingRow key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
