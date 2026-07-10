"use client";

import { useTranslations } from "next-intl";
import Form from "next/form";

const CATEGORIES = [
  { value: "", label: "searchCategory" },
  { value: "JOB", labelKey: "categoryJOB" },
  { value: "TENDER", labelKey: "categoryTENDER" },
  { value: "AUCTION", labelKey: "categoryAUCTION" },
  { value: "CLASSIFIED", labelKey: "categoryCLASSIFIED" },
] as const;

export function MarketplaceSearch() {
  const t = useTranslations("home");
  const tb = useTranslations("browse");

  return (
    <Form
      action="/listings"
      role="search"
      className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row"
    >
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
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
          className="w-full rounded-xl border border-white/20 bg-white/10 px-10 py-3 text-sm text-white placeholder:text-white/50 backdrop-blur-sm transition-all focus:border-white/40 focus:bg-white/15 focus:outline-none"
        />
      </div>
      <select
        name="category"
        aria-label={t("searchCategory")}
        defaultValue=""
        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-sm transition-all focus:border-white/40 focus:bg-white/15 focus:outline-none sm:w-auto"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value} className="text-foreground">
            {"labelKey" in cat ? tb(cat.labelKey) : t(cat.label)}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="location"
        placeholder={t("searchLocation")}
        aria-label={t("searchLocation")}
        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 backdrop-blur-sm transition-all focus:border-white/40 focus:bg-white/15 focus:outline-none sm:w-40"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-contrast shadow-lg transition-all hover:bg-primary-hover hover:shadow-xl"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {t("searchButton")}
      </button>
    </Form>
  );
}
