"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { motion } from "framer-motion";
import Link from "next/link";

export function FeedFeatured({ listings }: { listings: ListingCardData[] }) {
  const t = useTranslations("home");
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (listings.length === 0) return null;

  const scrollByCard = (dir: number) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="mt-24">
      <div className="mb-8 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <span className="text-accent" aria-hidden>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </span>
          {t("featuredTitle")}
        </h2>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label={t("scrollPrev")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label={t("scrollNext")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <Link href="/listings?boosted=true" className="text-sm font-semibold text-primary hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex w-full snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-8 pt-4 hide-scrollbar sm:px-6 lg:px-8"
        >
          {listings.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.08 }}
              className="min-w-[280px] max-w-[320px] flex-none snap-start"
            >
              <div className="h-full rounded-2xl ring-2 ring-accent/30 ring-offset-2 ring-offset-background transition-shadow duration-300 hover:shadow-xl">
                <div className="overflow-hidden rounded-2xl">
                  <ListingCard listing={listing} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
