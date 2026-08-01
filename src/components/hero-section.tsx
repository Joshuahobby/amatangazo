import { useTranslations } from "next-intl";

import { MarketplaceSearch } from "@/components/marketplace-search";

/*
 * Flat, search-first hero (see docs/design-system.md § Design language).
 * Deliberately no dark gradient, blurred orbs, glass, shimmer, or count-up
 * animation — those are GPU-expensive on low-end Android and off-brand.
 *
 * Kept deliberately short: the landing page is a directory, so the listings
 * below are the content. Five elements only — badge, headline, subtitle,
 * search, one CTA. Browsing is covered by CategoryFilterBar and the sidebar
 * category links directly below, and the payment-methods reassurance lives in
 * TrustSection rather than being repeated here.
 */
export function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface sm:mt-4">
      <div className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6 sm:py-10">
        <span className="badge-verified mb-4 inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("heroBadge")}
        </span>

        <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("heroTitle")}
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-base text-muted">
          {t("heroSubtitle")}
        </p>

        <div className="mt-6">
          <MarketplaceSearch />
        </div>
      </div>
    </section>
  );
}
