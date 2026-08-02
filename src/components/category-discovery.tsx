"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ListingRow, type ListingRowData } from "@/components/listing-row";
import { isDiscoveryCategory } from "@/lib/validations/listing";

/**
 * The editorial strip above the browse results — highest-paying jobs, tenders
 * closing next, auctions happening next — depending on which category is
 * filtered. Renders nothing for "all" and for CLASSIFIED.
 *
 * A client component fetching for itself rather than a server-rendered section,
 * because the browse page changes category without a navigation (ListingsSearch
 * syncs the URL with `history.replaceState`). Server-rendering this from the
 * search params would leave a "high-paying jobs" strip sitting above a list of
 * tenders.
 *
 * Some of these listings appear again in the results below — that repetition is
 * the point, since the strip reorders them by a signal the default sort doesn't
 * carry. It only earns the repetition while it stays a highlight, so a category
 * thin enough that the strip would be half its results or more gets no strip at
 * all (`totalResults`): showing the same four tenders twice is not discovery.
 *
 * Mount it keyed by category — the key drops the previous category's rows on
 * the spot instead of leaving them under the new heading until the fetch lands.
 */
export function CategoryDiscovery({
  category,
  totalResults,
}: {
  category: string;
  totalResults: number;
}) {
  const t = useTranslations("browse");
  const [listings, setListings] = useState<ListingRowData[]>([]);

  useEffect(() => {
    if (!isDiscoveryCategory(category)) return;

    let current = true;
    fetch(`/api/listings/discovery?category=${category}`)
      .then((r) => r.json())
      .then((data) => {
        if (current) setListings(data.listings ?? []);
      })
      .catch(() => {
        // A secondary module: if it can't load, the results below still stand.
      });

    return () => {
      current = false;
    };
  }, [category]);

  if (listings.length === 0 || totalResults <= listings.length * 2) return null;

  return (
    <section aria-labelledby="discovery-heading" className="mt-6">
      <h2 id="discovery-heading" className="section-label">
        {t(`discovery${category}`)}
      </h2>

      <div className="row-list mt-3">
        {listings.map((listing) => (
          <ListingRow key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
