import { useFormatter, useTranslations } from "next-intl";

import type { ListingCardData } from "@/components/listing-card";

/**
 * Derives the one headline fact and the supporting tags for a listing from
 * whichever category-specific detail relation is populated.
 *
 * Extracted from ListingCard so the card and the row can't drift: both
 * surfaces show the same salary / deadline / price, worded identically.
 */
export function useListingFacts(listing: ListingCardData) {
  const t = useTranslations("listing");
  const tp = useTranslations("post");
  const format = useFormatter();

  const shortDate = (value: string | Date) => format.dateTime(new Date(value), { dateStyle: "medium" });
  const rwf = (amount: number) => `${format.number(amount)} RWF`;

  let keyFact: string | null = null;
  const tags: string[] = [];
  if (listing.location) tags.push(listing.location);
  if (listing.classifiedDetails) {
    if (listing.classifiedDetails.price != null) keyFact = rwf(listing.classifiedDetails.price);
    if (listing.classifiedDetails.subcategory) tags.push(listing.classifiedDetails.subcategory);
  } else if (listing.jobDetails) {
    const { salaryRangeMin: min, salaryRangeMax: max } = listing.jobDetails;
    if (min != null && max != null) keyFact = `${format.number(min)} – ${rwf(max)}`;
    else if (min != null || max != null) keyFact = rwf(min ?? max ?? 0);
    if (listing.jobDetails.sector) tags.push(listing.jobDetails.sector);
    tags.push(tp(`experienceLevel${listing.jobDetails.experienceLevel}`));
  } else if (listing.tenderDetails) {
    keyFact = `${t("submissionDeadline")}: ${shortDate(listing.tenderDetails.submissionDeadline)}`;
    if (listing.tenderDetails.sector) tags.push(listing.tenderDetails.sector);
  } else if (listing.auctionDetails) {
    keyFact = `${t("auctionDate")}: ${shortDate(listing.auctionDetails.auctionDate)}`;
    if (listing.auctionDetails.startingPrice != null) {
      tags.push(`${t("startingPrice")}: ${format.number(listing.auctionDetails.startingPrice)} ${listing.auctionDetails.currency}`);
    }
  }

  return { keyFact, tags };
}
