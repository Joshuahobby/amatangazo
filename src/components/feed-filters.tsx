"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

const FILTERS = [
  { key: "filterNewest", href: "/listings?sort=newest" },
  { key: "filterRemote", href: "/listings?location=Remote" },
  { key: "filterVerified", href: "/listings?verified=true" },
  { key: "filterHighSalary", href: "/listings?category=JOB&sort=salary" },
  { key: "filterToday", href: "/listings?since=today" },
  { key: "filterThisWeek", href: "/listings?since=week" },
] as const;

export function FeedFilters() {
  const t = useTranslations("home");

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 lg:px-8">
      {FILTERS.map((filter) => (
        <Link
          key={filter.key}
          href={filter.href}
          className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted transition hover:border-primary/30 hover:text-primary active:scale-95"
        >
          {t(filter.key)}
        </Link>
      ))}
    </div>
  );
}
