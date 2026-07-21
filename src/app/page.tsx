import { listingInclude } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

import { MotionProvider } from "@/components/motion-provider";
import { HeroSection } from "@/components/hero-section";
import { TrustSection } from "@/components/trust-section";
import { CategoryShowcase } from "@/components/category-showcase";
import { FeedFeatured } from "@/components/feed-featured";
import { FeedFilters } from "@/components/feed-filters";
import { FeedLatest } from "@/components/feed-latest";
import { HowItWorks } from "@/components/how-it-works";
import { PosterCta } from "@/components/poster-cta";
import { StickySearch } from "@/components/sticky-search";

export default async function Home() {
  // Trimmed landing (see docs/design-system.md § Design language + the UX
  // remediation plan P1.4): hero+search → trust → categories → featured →
  // latest → how-it-works → poster CTA. The category-specific discovery feeds
  // (high-paying jobs, ending auctions, urgent tenders) and the testimonials/
  // newsletter blocks were removed from the homepage to cut initial payload
  // on low-end mobile; the mid-feed placeholder ad banner was removed (it read
  // as fabricated inventory) and its slot repurposed as the closing poster CTA.
  // TODO(claude-code): re-surface the discovery feeds on their category pages.
  const [
    liveCount,
    tenderCount,
    verifiedCount,
    userCount,
    applicationAgg,
    categoryCounts,
    boostedListings,
    latestListings,
  ] = await Promise.all([
    prisma.listing.count({ where: { status: "LIVE" } }),
    prisma.listing.count({ where: { status: "LIVE", category: "TENDER" } }),
    prisma.user.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.user.count(),
    prisma.listing.aggregate({ _sum: { applicationCount: true } }),
    prisma.listing.groupBy({
      by: ["category"],
      where: { status: "LIVE" },
      _count: { _all: true },
    }),
    prisma.listing.findMany({
      where: { status: "LIVE", isCurrentlyBoosted: true },
      orderBy: { publishedAt: "desc" },
      take: 10,
      include: listingInclude,
    }),
    prisma.listing.findMany({
      where: { status: "LIVE" },
      orderBy: { publishedAt: "desc" },
      take: 18,
      include: listingInclude,
    }),
  ]);

  const counts = Object.fromEntries(
    categoryCounts.map((c) => [c.category, c._count._all]),
  ) as Record<string, number>;

  // Only surface a stat once it clears a credibility floor. A "4+ live
  // listings" / "1+ verified businesses" strip reads as empty and costs more
  // trust than it earns; below the floor the whole strip simply doesn't render
  // (the hero's Umucyo/mobile-money proof carries credibility at launch).
  const STAT_MIN: Record<string, number> = {
    statListings: 25,
    statTenders: 5,
    statVerified: 5,
  };
  const stats = [
    { key: "statListings", value: liveCount },
    { key: "statTenders", value: tenderCount },
    { key: "statVerified", value: verifiedCount },
  ].filter((stat) => stat.value >= (STAT_MIN[stat.key] ?? 1));

  return (
    <main className="mx-auto max-w-6xl pb-20">
      <MotionProvider>
        <StickySearch />

        <HeroSection
          stats={stats}
          userCount={userCount}
          applicationCount={applicationAgg._sum.applicationCount ?? 0}
          categoryCount={categoryCounts.length}
        />

        <TrustSection />

        <CategoryShowcase counts={counts} />

        <FeedFeatured listings={boostedListings} />

        <div className="mt-16">
          <FeedFilters />
          <div className="mt-6">
            <FeedLatest listings={latestListings} />
          </div>
        </div>

        <HowItWorks />

        <PosterCta />
      </MotionProvider>
    </main>
  );
}
