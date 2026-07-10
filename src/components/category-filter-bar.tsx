import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { CategoryIcon } from "@/components/category-icon";

const CATEGORIES = ["JOB", "TENDER", "AUCTION", "CLASSIFIED"] as const;

/*
 * Sticky quick-nav under the hero. Chips deep-link into the browse page filtered
 * by category, so the four listing types are always one tap away. Kept out of
 * the page's overflow-hidden content wrapper so `position: sticky` works.
 */
export async function CategoryFilterBar() {
  const tb = await getTranslations("browse");

  return (
    <nav aria-label={tb("title")} className="sticky top-3 z-30">
      <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-border bg-background/85 p-1.5 shadow-sm backdrop-blur-md hide-scrollbar sm:justify-center">
        <Link
          href="/listings"
          className="whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast transition-colors hover:bg-primary-hover"
        >
          {tb("all")}
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/listings?category=${c}`}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border/50"
          >
            <CategoryIcon category={c} className="h-4 w-4" />
            {tb(`category${c}`)}
          </Link>
        ))}
      </div>
    </nav>
  );
}
