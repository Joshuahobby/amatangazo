"use client";

import { useTranslations } from "next-intl";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { motion } from "framer-motion";
import Link from "next/link";

import { fadeUp, viewportOnce } from "@/lib/motion";

export function FeedLatest({ listings }: { listings: ListingCardData[] }) {
  const t = useTranslations("home");

  if (listings.length === 0) return null;

  return (
    <section>
      <div className="mb-8 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("latestTitle")}</h2>
        <Link href="/listings" className="text-sm font-semibold text-primary hover:underline">
          {t("viewAll")} →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-5 px-4 sm:gap-6 sm:px-6 md:grid-cols-3 lg:grid-cols-4 lg:px-8">
        {listings.map((listing) => (
          <motion.div
            key={listing.id}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <ListingCard listing={listing} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
