import { useTranslations } from "next-intl";
import Link from "next/link";

import { MarketplaceSearch } from "@/components/marketplace-search";

const STAT_ICONS = {
  statListings:
    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  statTenders:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  statVerified:
    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
} as const;

/*
 * Flat, search-first hero (see docs/design-system.md § Design language).
 * Deliberately no dark gradient, blurred orbs, glass, shimmer, or count-up
 * animation — those are GPU-expensive on low-end Android and off-brand. The
 * search field is the primary element; everything else defers to it.
 */
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

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface sm:mt-4">
      <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16">
        <span className="badge-verified mb-5 inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("heroBadge")}
        </span>

        <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {t("heroTitle")}
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
          {t("heroSubtitle")}
        </p>

        <div className="mt-8">
          <MarketplaceSearch />
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/listings" className="btn-primary btn-lg w-full sm:w-auto">
            {t("ctaBrowse")}
          </Link>
          <Link href="/post" className="btn-outline btn-lg w-full sm:w-auto">
            {t("ctaPost")}
          </Link>
        </div>

        {stats.length > 0 && (
          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 sm:gap-4">
            {stats.map((stat) => (
              <div key={stat.key} className="card text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={STAT_ICONS[stat.key as keyof typeof STAT_ICONS] ?? STAT_ICONS.statListings} />
                  </svg>
                </div>
                <dt className="mt-2 text-xs font-medium text-muted">{t(stat.key)}</dt>
                <dd className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
                  {stat.value.toLocaleString()}+
                </dd>
                <dd className="mt-0.5 text-[11px] text-muted">
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
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Sentinel for sticky search observer */}
      <div data-hero-end aria-hidden className="h-px" />
    </section>
  );
}
