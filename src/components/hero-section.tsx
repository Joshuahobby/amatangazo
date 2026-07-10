"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

import { MarketplaceSearch } from "@/components/marketplace-search";

const STAT_ICONS = {
  statListings:
    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  statTenders:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  statVerified:
    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
} as const;

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const step = Math.max(1, Math.floor(value / 60));
    const interval = Math.floor(duration / (value / step));

    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

export function HeroSection({
  stats,
  userCount,
  applicationCount,
  categoryCount,
}: {
  stats: { key: string; value: number }[];
  userCount: number;
  applicationCount: number;
  categoryCount: number;
}) {
  const t = useTranslations("home");

  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <section ref={heroRef} className="relative overflow-hidden rounded-3xl bg-black text-white sm:mt-4 shadow-2xl">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-hover via-black to-accent/20 bg-[length:400%_400%] animate-gradient-x opacity-90" />

      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/40 blur-[120px] mix-blend-screen animate-float" />
      <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-accent/30 blur-[120px] mix-blend-screen animate-float" style={{ animationDelay: "2s" }} />

      <div className="absolute inset-0 z-0 bg-[url('/images/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-block mb-5 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-medium tracking-wide backdrop-blur-md"
        >
          <span aria-hidden>✨</span> {t("heroBadge")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-gray-300"
        >
          {t("heroTitle")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="mx-auto mt-4 max-w-2xl text-base text-gray-300 font-light leading-relaxed sm:text-lg"
        >
          {t("heroSubtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="mt-10"
        >
          <MarketplaceSearch />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/listings"
            className="group relative overflow-hidden rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-primary/50 w-full sm:w-auto"
          >
            <span className="relative z-10">{t("ctaBrowse")}</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
          </Link>
          <Link
            href="/post"
            className="rounded-full border border-white/20 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 w-full sm:w-auto"
          >
            {t("ctaPost")}
          </Link>
        </motion.div>

        {stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
            className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.key}
                whileHover={{ y: -4 }}
                className="stat-icon-card !border-white/10 !bg-white/5 text-center backdrop-blur-md hover:!bg-white/10"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/30 text-primary-contrast">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={STAT_ICONS[stat.key as keyof typeof STAT_ICONS] ?? STAT_ICONS.statListings} />
                  </svg>
                </div>
                <dt className="mt-3 text-xs font-medium uppercase tracking-wider text-gray-400">{t(stat.key)}</dt>
                <dd className="mt-1">
                  <AnimatedNumber value={stat.value} suffix="+" />
                </dd>
                <dd className="mt-0.5 text-[10px] text-gray-500">
                  {stat.key === "statListings" && applicationCount > 0 && (
                    <>{applicationCount.toLocaleString()}+ applications submitted</>
                  )}
                  {stat.key === "statVerified" && userCount > 0 && (
                    <>{userCount.toLocaleString()}+ registered users</>
                  )}
                  {stat.key === "statTenders" && categoryCount > 0 && (
                    <>{categoryCount} active categories</>
                  )}
                </dd>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Sentinel for sticky search observer */}
      <div data-hero-end aria-hidden className="h-px" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </section>
  );
}
