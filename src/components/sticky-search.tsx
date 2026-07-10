"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Form from "next/form";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { value: "", label: "searchCategory" },
  { value: "JOB", labelKey: "categoryJOB" },
  { value: "TENDER", labelKey: "categoryTENDER" },
  { value: "AUCTION", labelKey: "categoryAUCTION" },
  { value: "CLASSIFIED", labelKey: "categoryCLASSIFIED" },
] as const;

export function StickySearch() {
  const t = useTranslations("home");
  const tb = useTranslations("browse");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-hero-end]");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-16 left-0 right-0 z-40 border-b border-border bg-surface/95 shadow-sm backdrop-blur-md"
        >
          <Form
            action="/listings"
            role="search"
            className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8"
          >
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                name="q"
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted transition-colors focus:border-primary focus:outline-none"
              />
            </div>
            <select
              name="category"
              aria-label={t("searchCategory")}
              defaultValue=""
              className="hidden w-36 rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none sm:block"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {"labelKey" in cat ? tb(cat.labelKey) : t(cat.label)}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="location"
              placeholder={t("searchLocation")}
              aria-label={t("searchLocation")}
              className="hidden w-32 rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none sm:block"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-hover"
            >
              {t("searchButton")}
            </button>
          </Form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
