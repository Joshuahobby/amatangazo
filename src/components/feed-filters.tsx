"use client";

import Link from "next/link";

const FILTERS = [
  { label: "Newest", href: "/listings?sort=newest" },
  { label: "Remote", href: "/listings?location=Remote" },
  { label: "Verified", href: "/listings?verified=true" },
  { label: "High Salary", href: "/listings?category=JOB&sort=salary" },
  { label: "Today", href: "/listings?since=today" },
  { label: "This Week", href: "/listings?since=week" },
] as const;

export function FeedFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 lg:px-8">
      {FILTERS.map((filter) => (
        <Link
          key={filter.label}
          href={filter.href}
          className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary/30 hover:text-primary"
        >
          {filter.label}
        </Link>
      ))}
    </div>
  );
}
