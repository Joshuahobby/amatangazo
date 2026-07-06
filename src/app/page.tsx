import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

const CATEGORIES = [
  { key: "JOB", href: "/listings?category=JOB", color: "var(--cat-job)" },
  { key: "TENDER", href: "/listings?category=TENDER", color: "var(--cat-tender)" },
  { key: "AUCTION", href: "/listings?category=AUCTION", color: "var(--cat-auction)" },
  { key: "CLASSIFIED", href: "/listings?category=CLASSIFIED", color: "var(--cat-classified)" },
] as const;

export default async function Home() {
  const t = await getTranslations("home");
  const tb = await getTranslations("browse");
  const tc = await getTranslations("common");

  const [latest, tenderCount] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "LIVE" },
      orderBy: [{ isCurrentlyBoosted: "desc" }, { publishedAt: "desc" }],
      take: 6,
      select: { id: true, title: true, category: true, location: true, isCurrentlyBoosted: true },
    }),
    prisma.listing.count({ where: { status: "LIVE", category: "TENDER" } }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="py-14 text-center sm:py-20">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{t("heroSubtitle")}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/listings" className="btn-primary btn-lg">
            {t("ctaBrowse")}
          </Link>
          <Link href="/post/job" className="btn-outline btn-lg">
            {t("ctaPost")}
          </Link>
        </div>
        {tenderCount > 0 && (
          <p className="mt-4 text-sm text-muted">{t("tenderPitch", { count: tenderCount })}</p>
        )}
      </section>

      {/* Category tiles */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            href={cat.href}
            className="group rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
          >
            <span
              className="inline-block h-2 w-10 rounded-full"
              style={{ backgroundColor: cat.color }}
              aria-hidden
            />
            <span className="mt-3 block font-semibold text-foreground group-hover:text-primary">
              {tb(`category${cat.key}`)}
            </span>
          </Link>
        ))}
      </section>

      {/* Latest listings */}
      {latest.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">{t("latestTitle")}</h2>
            <Link href="/listings" className="text-sm font-medium text-primary hover:underline">
              {t("seeAll")}
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {latest.map((listing) => (
              <li key={listing.id}>
                <Link
                  href={`/listings/${listing.id}`}
                  className="block rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground">{listing.title}</span>
                    {listing.isCurrentlyBoosted && (
                      <span className="badge-featured shrink-0" role="img" aria-label={tc("featured")}>
                        ★
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {tb(`category${listing.category}`)} · {listing.location}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
