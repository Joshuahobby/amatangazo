"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";

import { CategoryIcon, CATEGORY_COLOR_VAR } from "@/components/category-icon";

const CATEGORIES = [
  { key: "JOB", color: "var(--cat-job)" },
  { key: "TENDER", color: "var(--cat-tender)" },
  { key: "AUCTION", color: "var(--cat-auction)" },
  { key: "CLASSIFIED", color: "var(--cat-classified)" },
  { key: "BUSINESSES", color: "var(--primary)" },
  { key: "REAL_ESTATE", color: "var(--cat-classified)" },
] as const;

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
};

export function CategoryShowcase({ counts = {} }: { counts?: Record<string, number> }) {
  const tb = useTranslations("browse");

  return (
    <motion.section
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className="mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
    >
      {CATEGORIES.map((cat) => {
        const color = CATEGORY_COLOR_VAR[cat.key] ?? cat.color;
        const count = counts[cat.key] ?? null;
        const href = cat.key === "BUSINESSES"
          ? "/verification"
          : cat.key === "REAL_ESTATE"
            ? "/listings?category=CLASSIFIED"
            : `/listings?category=${cat.key}`;

        return (
          <motion.div key={cat.key} variants={item}>
            <Link
              href={href}
              className="group relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
            >
              <div className="relative z-10">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-inner transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: color }}
                >
                  {cat.key === "BUSINESSES" || cat.key === "REAL_ESTATE" ? (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      {cat.key === "BUSINESSES" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      )}
                    </svg>
                  ) : (
                    <CategoryIcon category={cat.key} className="h-6 w-6" />
                  )}
                </div>
              </div>

              <div className="relative z-10 mt-4">
                <h3 className="text-sm font-bold text-foreground">{tb(`category${cat.key}`)}</h3>
                <p className="mt-0.5 text-xs text-muted">{tb(`category${cat.key}Desc`)}</p>
                {count !== null && (
                  <span className="mt-2 inline-block rounded-full bg-border/50 px-2 py-0.5 text-[10px] font-semibold text-muted">
                    {tb("liveCount", { count })}
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 right-4 z-10 flex h-7 w-7 translate-x-0.5 items-center justify-center rounded-full bg-border/40 opacity-0 shadow-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                <svg className="h-3 w-3" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.section>
  );
}
