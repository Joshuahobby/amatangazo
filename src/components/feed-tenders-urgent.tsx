"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";

import type { ListingCardData } from "@/components/listing-card";

function DeadlineCountdown({ deadline }: { deadline: string | Date }) {
  const now = new Date();
  const target = new Date(deadline);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cat-tender/15 px-2.5 py-0.5 text-[10px] font-bold text-cat-tender">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {diffDays > 0 ? `${diffDays}d left` : "Today"}
    </span>
  );
}

export function FeedTendersUrgent({ listings }: { listings: ListingCardData[] }) {
  const t = useTranslations("home");

  if (listings.length === 0) return null;

  return (
    <section className="mt-24 flex-1">
      <div className="mb-8 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <span className="text-cat-tender" aria-hidden>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          {t("tendersTitle")}
        </h2>
        <Link href="/listings?category=TENDER&sort=deadline" className="text-sm font-semibold text-primary hover:underline">
          {t("viewAll")} →
        </Link>
      </div>

      <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-8">
        {listings.map((listing, i) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Link
              href={`/listings/${listing.id}`}
              className="group relative flex items-start gap-4 rounded-2xl border border-cat-tender/20 bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cat-tender/40 hover:shadow-md"
            >
              {/* Left accent bar */}
              <div className="hidden h-full w-1 shrink-0 rounded-full bg-cat-tender/30 sm:block" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-cat-tender/15 px-2.5 py-0.5 text-[10px] font-semibold text-cat-tender">
                    TENDER
                  </span>
                  {listing.tenderDetails?.submissionDeadline && (
                    <DeadlineCountdown deadline={listing.tenderDetails.submissionDeadline} />
                  )}
                </div>
                <h3 className="mt-2 text-base font-bold text-foreground group-hover:text-cat-tender line-clamp-1">
                  {listing.title}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  {listing.tenderDetails?.sector && (
                    <span>Sector: {listing.tenderDetails.sector}</span>
                  )}
                  {listing.poster?.businessName && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {listing.poster.businessName}
                    </span>
                  )}
                  {listing.location && (
                    <span>{listing.location}</span>
                  )}
                  {listing.tenderDetails?.submissionDeadline && (
                    <span className="font-medium text-cat-tender">
                      Closes: {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(listing.tenderDetails.submissionDeadline))}
                    </span>
                  )}
                </div>
              </div>

              <div className="hidden shrink-0 items-center gap-1 text-cat-tender sm:flex">
                <span className="text-sm font-semibold">View</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
