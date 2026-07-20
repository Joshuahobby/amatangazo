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
          className="input pl-10 py-3"
        />
      </div>
      <select
        name="category"
        aria-label={t("searchCategory")}
        defaultValue=""
        className="input py-3 sm:w-auto"
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
        className="input py-3 sm:w-40"
      />
      <button type="submit" className="btn-primary py-3">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {t("searchButton")}
      </button>
    </Form>
  );
}
