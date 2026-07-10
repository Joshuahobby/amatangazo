"use client";

import { useFormatter, useTranslations } from "next-intl";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { motion } from "framer-motion";
import Link from "next/link";

function TrendingBadge() {
  const t = useTranslations("home");
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-danger-surface px-2 py-0.5 text-[10px] font-bold text-danger">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      {t("trendingBadge")}
    </span>
  );
}

export function FeedJobsHighPaying({ listings }: { listings: ListingCardData[] }) {
  const t = useTranslations("home");
  const format = useFormatter();

  if (listings.length === 0) return null;

  const topSalary = listings.length > 0
    ? Math.max(...listings.map((l) => l.jobDetails?.salaryRangeMax ?? 0))
    : 0;

  return (
    <section className="mt-24">
      <div className="mb-8 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          {t("jobsTitle")}
          {topSalary > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
              Up to {format.number(topSalary)} RWF
            </span>
          )}
        </h2>
        <Link href="/listings?category=JOB&sort=salary" className="text-sm font-semibold text-primary hover:underline">
          {t("viewAll")} →
        </Link>
      </div>

      <div className="grid gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {listings.map((listing, i) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative"
          >
            {i === 0 && (
              <div className="absolute -top-2 -right-2 z-10">
                <TrendingBadge />
              </div>
            )}
            <div className="relative">
              {listing.poster?.verificationStatus === "VERIFIED" && (
                <div className="absolute -left-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-contrast shadow-sm" title="Verified employer">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <ListingCard listing={listing} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
