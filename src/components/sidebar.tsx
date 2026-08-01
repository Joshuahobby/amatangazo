import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { CategoryIcon, CATEGORY_COLOR_VAR } from "@/components/category-icon";
import { FeaturedRail } from "@/components/featured-rail";
import type { ListingRowData } from "@/components/listing-row";
import { listingCategories } from "@/lib/validations/listing";

/**
 * Persistent right rail for the landing and browse surfaces.
 *
 * Stacks below the main column under `lg`. SIDEBAR_MID (the 300x600) is hidden
 * there on purpose — it is the heaviest creative in the set and the least
 * useful on a phone, and this platform's traffic skews to low-end Android.
 *
 * Two ad units, not three: SIDEBAR_BOTTOM was pulled so the rail doesn't read
 * ad-first. See PLACED_AD_SLOTS in lib/ads.ts.
 *
 * No search box and no stat counters here — the hero's search is the one search
 * affordance on these pages, and the category counts below already convey scale.
 */
export async function Sidebar({
  boosted = [],
  counts,
}: {
  boosted?: ListingRowData[];
  counts?: Record<string, number>;
}) {
  const t = await getTranslations("home");
  const tb = await getTranslations("browse");

  return (
    <aside className="space-y-4" aria-label={t("sidebarLabel")}>
      <AdSlot slot="SIDEBAR_TOP" />

      <FeaturedRail listings={boosted} />

      <AdSlot slot="SIDEBAR_MID" className="hidden lg:block" />

      <nav className="sidebar-widget" aria-label={t("categoriesLabel")}>
        <h2 className="text-sm font-bold text-foreground">{t("categoriesLabel")}</h2>
        <ul className="mt-2 space-y-1">
          {listingCategories.map((category) => (
            <li key={category}>
              <Link
                href={`/listings?category=${category}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-border/40"
              >
                <span style={{ color: CATEGORY_COLOR_VAR[category] }}>
                  <CategoryIcon category={category} className="h-4 w-4" />
                </span>
                <span className="flex-1">{tb(`category${category}`)}</span>
                {counts?.[category] != null && (
                  <span className="text-xs text-muted">{counts[category]}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
