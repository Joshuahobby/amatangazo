import { useTranslations } from "next-intl";
import Link from "next/link";

import { CategoryBadge, FeaturedBadge, VerifiedBadge } from "@/components/listing-badges";
import type { ListingCardData } from "@/components/listing-card";
import { ListingLogo } from "@/components/listing-thumbnail";
import { useListingFacts } from "@/components/use-listing-facts";

export type ListingRowData = ListingCardData & { viewCount?: number };

/**
 * Compact directory row — the default listing surface on the landing and
 * browse pages. Deliberately not a card: a small company logo plus one line
 * of title and one line of facts fits several times more opportunities on a
 * screen than the 16:10 hero thumbnail ListingCard uses.
 *
 * Boosted listings carry the accent edge (.listing-row-featured) so paid
 * placement reads identically wherever a row appears.
 */
export function ListingRow({ listing }: { listing: ListingRowData }) {
  const t = useTranslations("browse");
  const { keyFact } = useListingFacts(listing);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group ${listing.isCurrentlyBoosted ? "listing-row-featured" : "listing-row"}`}
    >
      <ListingLogo listing={listing} />

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">
          {listing.title}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <CategoryBadge category={listing.category} />
          {listing.isCurrentlyBoosted && <FeaturedBadge />}
          {keyFact && <span className="font-medium text-primary">{keyFact}</span>}
          {listing.location && <span className="hidden sm:inline">{listing.location}</span>}
          {listing.viewCount != null && listing.viewCount > 0 && (
            <span className="hidden sm:inline">{t("views", { count: listing.viewCount })}</span>
          )}
          {listing.poster?.verificationStatus === "VERIFIED" && <VerifiedBadge />}
        </div>
      </div>

      {/* Visual affordance only — the whole row is already the link, so this
          must not be an interactive element of its own. */}
      <span
        aria-hidden
        className="hidden shrink-0 self-center rounded-lg px-3 py-1 text-xs font-medium text-primary transition-colors group-hover:bg-primary group-hover:text-primary-contrast sm:inline-block"
      >
        {t("readMore")}
      </span>
    </Link>
  );
}
