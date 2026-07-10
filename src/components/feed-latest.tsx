"use client";

import { useTranslations } from "next-intl";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { motion } from "framer-motion";
import Link from "next/link";

export function FeedLatest({ listings }: { listings: ListingCardData[] }) {
  const t = useTranslations("home");

  if (listings.length === 0) return null;

  return (
    <section className="mt-24">
      <div className="mb-8 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("latestTitle")}</h2>
        <Link href="/listings" className="text-sm font-semibold text-primary hover:underline">
          {t("viewAll")} →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-5 px-4 sm:gap-6 sm:px-6 md:grid-cols-3 lg:grid-cols-4 lg:px-8">
        {listings.map((listing, i) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.05 }}
          >
            <ListingCard listing={listing} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
