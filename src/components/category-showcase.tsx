import { useTranslations } from "next-intl";
import Link from "next/link";

import { CategoryIcon, CATEGORY_COLOR_VAR } from "@/components/category-icon";

// Entrance motion removed — see the note in trust-section.tsx. `initial="hidden"`
// server-renders as inline opacity:0, which hid these tiles until JS hydrated.

// The four real pillars the hero promises. Businesses (a conversion page, not a
// browse category) and Real estate (a duplicate of Classifieds — the PRD ships
// classifieds as a general category, not a vertical) were removed so the row
// doesn't dilute the four categories or route browse-shaped tiles elsewhere.
const CATEGORIES = ["JOB", "TENDER", "AUCTION", "CLASSIFIED"] as const;

export function CategoryShowcase({ counts = {} }: { counts?: Record<string, number> }) {
  const tb = useTranslations("browse");

  return (
    <section className="mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-4 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
      {CATEGORIES.map((key) => {
        const color = CATEGORY_COLOR_VAR[key];
        const count = counts[key] ?? null;

        return (
          <div key={key}>
            <Link
              href={`/listings?category=${key}`}
              className="group relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md active:translate-y-0"
            >
              <div className="relative z-10">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-inner transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: color }}
                >
                  <CategoryIcon category={key} className="h-6 w-6" />
                </div>
              </div>

              <div className="relative z-10 mt-4">
                <h3 className="text-sm font-bold text-foreground">{tb(`category${key}`)}</h3>
                <p className="mt-0.5 text-xs text-muted">{tb(`category${key}Desc`)}</p>
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
          </div>
        );
      })}
    </section>
  );
}
