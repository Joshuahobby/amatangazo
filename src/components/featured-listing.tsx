"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";

import { CategoryBadge, FeaturedBadge } from "@/components/listing-badges";
import type { ListingCardData } from "@/components/listing-card";
import { CATEGORY_COLOR_VAR } from "@/components/category-icon";

export function FeaturedListing({ listing }: { listing: ListingCardData | null }) {
  const t = useTranslations("home");
  const format = useFormatter();

  if (!listing) return null;

  const imageUrl = listing.images[0]?.url ?? null;
  const publishedAt = listing.publishedAt ? new Date(listing.publishedAt) : null;
  const shortDate = (value: string | Date) => format.dateTime(new Date(value), { dateStyle: "medium" });

  let keyDetail: string | null = null;
  let location = listing.location;
  if (listing.jobDetails) {
    const { salaryRangeMin: min, salaryRangeMax: max } = listing.jobDetails;
    if (min != null && max != null) keyDetail = `${format.number(min)} – ${format.number(max)} RWF`;
    else if (min != null || max != null) keyDetail = `${format.number(min ?? max ?? 0)} RWF`;
  } else if (listing.tenderDetails) {
    keyDetail = `${t("featuredListingApply")}: ${shortDate(listing.tenderDetails.submissionDeadline)}`;
  } else if (listing.auctionDetails) {
    keyDetail = `${t("featuredListingView")}: ${shortDate(listing.auctionDetails.auctionDate)}`;
    location = listing.auctionDetails.startingPrice
      ? `${location} · ${format.number(listing.auctionDetails.startingPrice)} ${listing.auctionDetails.currency}`
      : location;
  } else if (listing.classifiedDetails?.price != null) {
    keyDetail = `${format.number(listing.classifiedDetails.price)} RWF`;
  }

  const categoryColor = CATEGORY_COLOR_VAR[listing.category] ?? "var(--primary)";
  const posterLabel = listing.poster?.businessName ?? listing.poster?.name;

  return (
    <section className="mx-auto mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Link
          href={`/listings/${listing.id}`}
          className="group relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-md transition-all duration-500 hover:shadow-2xl sm:flex-row"
        >
          {/* Category accent strip */}
          <div
            className="absolute top-0 left-0 right-0 z-10 h-1.5 sm:h-full sm:w-1.5 sm:left-0 sm:top-0"
            style={{ backgroundColor: categoryColor }}
          />

          {imageUrl ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-auto sm:w-[45%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={listing.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10" />
            </div>
          ) : (
            <div className="relative flex aspect-[16/9] w-full items-center justify-center sm:aspect-auto sm:w-[45%]"
              style={{
                background: `linear-gradient(135deg, ${categoryColor} 0%, color-mix(in srgb, ${categoryColor} 55%, #000) 100%)`,
              }}
            >
              <svg className="h-24 w-24 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <div className="flex flex-1 flex-col justify-center p-7 sm:p-10">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={listing.category} />
              {listing.isCurrentlyBoosted && <FeaturedBadge />}
              {publishedAt && (
                <span className="text-xs text-muted">{format.relativeTime(publishedAt)}</span>
              )}
            </div>

            <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-3xl">
              {listing.title}
            </h3>

            {posterLabel && (
              <p className="mt-2 text-sm font-medium text-muted">
                <span className="text-foreground">{posterLabel}</span>
              </p>
            )}

            {keyDetail && (
              <p className="mt-3 text-lg font-bold text-primary sm:text-xl">{keyDetail}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              {location && (
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {location}
                </span>
              )}
              {listing.jobDetails?.sector && (
                <span>{listing.jobDetails.sector}</span>
              )}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-contrast shadow-lg transition-all hover:bg-primary-hover hover:shadow-xl sm:text-base">
                {t("featuredListingView")}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              <span className="text-sm font-medium text-primary transition-colors hover:text-primary-hover">
                {t("featuredListingApply")}
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </section>
  );
}
