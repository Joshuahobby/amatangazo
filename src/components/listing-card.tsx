import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";

import { CategoryBadge, FeaturedBadge, VerifiedBadge } from "@/components/listing-badges";
import { ListingThumbnail } from "@/components/listing-thumbnail";
import { CATEGORY_COLOR_VAR } from "@/components/category-icon";

export type ListingCardData = {
  id: string;
  title: string;
  category: string;
  location: string;
  isCurrentlyBoosted: boolean;
  publishedAt: string | Date | null;
  images: { url: string }[];
  poster: {
    name: string;
    businessName: string | null;
    verificationStatus: string;
    image?: string | null;
    accountType?: string | null;
  } | null;
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

function PosterAvatar({ name, businessName }: { name: string; businessName: string | null }) {
  const label = businessName ?? name;
  const parts = label.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "").toUpperCase();

  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
      {initials || "?"}
    </div>
  );
}

function CategoryAccent({ category }: { category: string }) {
  const color = CATEGORY_COLOR_VAR[category];
  if (!color) return null;
  return (
    <div
      className="pointer-events-none absolute top-0 left-0 right-0 z-10 h-1 rounded-t-2xl"
      style={{ backgroundColor: color }}
    />
  );
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const t = useTranslations("listing");
  const tp = useTranslations("post");
  const format = useFormatter();

  const publishedAt = listing.publishedAt ? new Date(listing.publishedAt) : null;
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

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group relative block h-full overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl"
    >
      <CategoryAccent category={listing.category} />
      <ListingThumbnail listing={listing} />
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={listing.category} />
          {listing.isCurrentlyBoosted && <FeaturedBadge />}
          {publishedAt && <span className="ml-auto text-xs text-muted">{format.relativeTime(publishedAt)}</span>}
        </div>
        <p className="mt-2 line-clamp-2 font-semibold text-foreground group-hover:text-primary">{listing.title}</p>
        {keyFact && <p className="mt-1 text-sm font-medium text-primary">{keyFact}</p>}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge-neutral max-w-[9rem] truncate align-middle">
                {tag}
              </span>
            ))}
          </div>
        )}
        {listing.poster && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <PosterAvatar name={listing.poster.name} businessName={listing.poster.businessName} />
              <span className="truncate text-xs text-muted">{listing.poster.businessName ?? listing.poster.name}</span>
            </span>
            {listing.poster.verificationStatus === "VERIFIED" && <VerifiedBadge />}
          </div>
        )}
      </div>
    </Link>
  );
}
