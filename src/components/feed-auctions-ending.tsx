"use client";

import { useTranslations } from "next-intl";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { motion } from "framer-motion";
import Link from "next/link";

export function FeedAuctionsEnding({ listings }: { listings: ListingCardData[] }) {
  const t = useTranslations("home");

  if (listings.length === 0) return null;

  return (
    <section className="mt-16 flex-1">
      <div className="mb-6 flex items-center justify-between px-4 sm:px-0">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span className="text-danger" aria-hidden>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          {t("auctionsTitle")}
        </h2>
        <Link href="/listings?category=AUCTION&sort=ending_soon" className="text-sm font-semibold text-primary hover:underline">
          {t("seeAll")}
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 px-4 sm:px-0">
        {listings.map((listing, i) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <div className="relative">
              <div className="absolute -top-3 -right-3 z-10 rounded-full border border-danger-border bg-danger-surface px-3 py-1 text-xs font-bold text-danger shadow-sm">
                {t("urgentTag")}
              </div>
              <ListingCard listing={listing} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
