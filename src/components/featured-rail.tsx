import { getTranslations } from "next-intl/server";
import Link from "next/link";

import type { ListingRowData } from "@/components/listing-row";
import { ListingLogo } from "@/components/listing-thumbnail";

/**
 * Compact boosted-listing rail for the sidebar. Title and logo only — this
 * keeps paid placements on screen while the reader scrolls the main feed,
 * without competing with it for attention.
 */
export async function FeaturedRail({ listings }: { listings: ListingRowData[] }) {
  if (listings.length === 0) return null;
  const t = await getTranslations("home");

  return (
    <section aria-labelledby="featured-rail-heading" className="sidebar-widget">
      <h2 id="featured-rail-heading" className="text-sm font-bold text-foreground">
        {t("featuredTitle")}
      </h2>
      <ul className="mt-3 space-y-3">
        {listings.map((listing) => (
          <li key={listing.id}>
            <Link href={`/listings/${listing.id}`} className="group flex items-start gap-2">
              <ListingLogo listing={listing} />
              <span className="line-clamp-3 text-xs font-medium text-foreground group-hover:text-primary">
                {listing.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
