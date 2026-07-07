import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";

import { CategoryBadge, FeaturedBadge, VerifiedBadge } from "@/components/listing-badges";

/*
 * Structural subset of ListingWithDetails that the card needs. Dates are
 * `string | Date` because the search API delivers JSON-serialized records
 * while server pages pass live Prisma objects.
 */
export type ListingCardData = {
  id: string;
  title: string;
  category: string;
  location: string;
  isCurrentlyBoosted: boolean;
  publishedAt: string | Date | null;
  images: { url: string }[];
  poster: { name: string; businessName: string | null; verificationStatus: string } | null;
  jobDetails: {
    sector: string;
    experienceLevel: string;
    salaryRangeMin: number | null;
    salaryRangeMax: number | null;
  } | null;
  tenderDetails: { sector: string; submissionDeadline: string | Date } | null;
  auctionDetails: { auctionDate: string | Date; startingPrice: number | null; currency: string } | null;
  classifiedDetails: { subcategory: string; price: number | null } | null;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const t = useTranslations("listing");
  const tp = useTranslations("post");
  const format = useFormatter();

  const imageUrl = listing.images[0]?.url ?? null;
  const publishedAt = listing.publishedAt ? new Date(listing.publishedAt) : null;
  const shortDate = (value: string | Date) => format.dateTime(new Date(value), { dateStyle: "medium" });
  const rwf = (amount: number) => `${format.number(amount)} RWF`;

  // One highlighted fact (price/salary/deadline) plus one muted meta detail per category.
  let keyFact: string | null = null;
  let secondaryMeta: string | null = null;
  if (listing.classifiedDetails) {
    if (listing.classifiedDetails.price != null) keyFact = rwf(listing.classifiedDetails.price);
    secondaryMeta = listing.classifiedDetails.subcategory;
  } else if (listing.jobDetails) {
    const { salaryRangeMin: min, salaryRangeMax: max } = listing.jobDetails;
    if (min != null && max != null) keyFact = `${format.number(min)} – ${rwf(max)}`;
    else if (min != null || max != null) keyFact = rwf(min ?? max ?? 0);
    secondaryMeta = `${listing.jobDetails.sector} · ${tp(`experienceLevel${listing.jobDetails.experienceLevel}`)}`;
  } else if (listing.tenderDetails) {
    keyFact = `${t("submissionDeadline")}: ${shortDate(listing.tenderDetails.submissionDeadline)}`;
    secondaryMeta = listing.tenderDetails.sector;
  } else if (listing.auctionDetails) {
    keyFact = `${t("auctionDate")}: ${shortDate(listing.auctionDetails.auctionDate)}`;
    if (listing.auctionDetails.startingPrice != null) {
      secondaryMeta = `${t("startingPrice")}: ${format.number(listing.auctionDetails.startingPrice)} ${listing.auctionDetails.currency}`;
    }
  }

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="card-media group block transition-shadow hover:shadow-md"
    >
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- R2 URLs, not part of Next's image optimization domain list yet
        <img src={imageUrl} alt="" loading="lazy" className="h-36 w-full border-b border-border object-cover" />
      )}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={listing.category} />
          {listing.isCurrentlyBoosted && <FeaturedBadge />}
          {publishedAt && <span className="ml-auto text-xs text-muted">{format.relativeTime(publishedAt)}</span>}
        </div>
        <p className="mt-2 line-clamp-2 font-semibold text-foreground group-hover:text-primary">{listing.title}</p>
        {keyFact && <p className="mt-1 text-sm font-medium text-primary">{keyFact}</p>}
        <p className="mt-1 text-sm text-muted">
          {listing.location}
          {secondaryMeta && ` · ${secondaryMeta}`}
        </p>
        {listing.poster && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="truncate text-xs text-muted">{listing.poster.businessName ?? listing.poster.name}</span>
            {listing.poster.verificationStatus === "VERIFIED" && <VerifiedBadge />}
          </div>
        )}
      </div>
    </Link>
  );
}
