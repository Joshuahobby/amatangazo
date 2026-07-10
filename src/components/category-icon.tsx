/*
 * Single source of truth for the four listing-category glyphs. Used by the
 * category showcase, the filter bar, and the thumbnail placeholder so the
 * icons stay identical everywhere. Server-safe (no hooks, no client APIs).
 */

const PATHS: Record<string, string> = {
  JOB: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  TENDER: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  AUCTION: "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z",
  CLASSIFIED: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
};

export function CategoryIcon({
  category,
  className = "h-6 w-6",
}: {
  category: string;
  className?: string;
}) {
  const path = PATHS[category] ?? PATHS.CLASSIFIED;
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
}

/** Category → CSS custom property for its identity hue. */
export const CATEGORY_COLOR_VAR: Record<string, string> = {
  JOB: "var(--cat-job)",
  TENDER: "var(--cat-tender)",
  AUCTION: "var(--cat-auction)",
  CLASSIFIED: "var(--cat-classified)",
};
