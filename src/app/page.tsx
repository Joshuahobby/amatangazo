import { listingInclude } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

import { MotionProvider } from "@/components/motion-provider";
import { HeroSection } from "@/components/hero-section";
import { TrustSection } from "@/components/trust-section";
import { FeaturedListing } from "@/components/featured-listing";
import { CategoryShowcase } from "@/components/category-showcase";
import { FeedFeatured } from "@/components/feed-featured";
import { FeedFilters } from "@/components/feed-filters";
import { FeedLatest } from "@/components/feed-latest";
import { FeedJobsHighPaying } from "@/components/feed-jobs-high-paying";
import { FeedTendersUrgent } from "@/components/feed-tenders-urgent";
import { FeedAuctionsEnding } from "@/components/feed-auctions-ending";
import { AdBanner } from "@/components/ad-banner";
import { Testimonials } from "@/components/testimonials";
import { Newsletter } from "@/components/newsletter";
import { HowItWorks } from "@/components/how-it-works";
import { StickySearch } from "@/components/sticky-search";

export default async function Home() {
  const [
    liveCount,
    tenderCount,
    verifiedCount,
    userCount,
    applicationAgg,
    categoryCounts,
    boostedListings,
    latestListings,
    highPayingJobs,
    urgentTenders,
    endingAuctions,
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
    prisma.listing.findMany({
      where: { status: "LIVE", category: "JOB" },
      orderBy: { jobDetails: { salaryRangeMax: "desc" } },
      take: 8,
      include: listingInclude,
    }),
    prisma.listing.findMany({
      where: {
        status: "LIVE",
        category: "TENDER",
        tenderDetails: { submissionDeadline: { gt: new Date() } },
      },
      orderBy: { tenderDetails: { submissionDeadline: "asc" } },
      take: 3,
      include: listingInclude,
    }),
    prisma.listing.findMany({
      where: {
        status: "LIVE",
        category: "AUCTION",
        auctionDetails: { auctionDate: { gt: new Date() } },
      },
      orderBy: { auctionDetails: { auctionDate: "asc" } },
      take: 4,
      include: listingInclude,
    }),
  ]);

  const counts = Object.fromEntries(
    categoryCounts.map((c) => [c.category, c._count._all]),
  ) as Record<string, number>;

  const stats = [
    { key: "statListings", value: liveCount },
    { key: "statTenders", value: tenderCount },
    { key: "statVerified", value: verifiedCount },
  ].filter((stat) => stat.value > 0);

  const featuredListing = boostedListings[0] ?? latestListings[0] ?? null;

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

        <FeaturedListing listing={featuredListing} />

        <CategoryShowcase counts={counts} />

        <FeedFeatured listings={boostedListings} />

        <div className="mt-24">
          <FeedFilters />
          <div className="mt-4">
            <FeedLatest listings={latestListings} />
          </div>
        </div>

        <div className="mt-16 px-4 sm:px-6 lg:px-8">
          <AdBanner type="horizontal" />
        </div>

        <FeedJobsHighPaying listings={highPayingJobs} />

        <div className="mt-24 flex flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:items-start lg:px-8">
          <FeedAuctionsEnding listings={endingAuctions} />
          <div className="hidden shrink-0 lg:block">
            <AdBanner type="vertical" />
          </div>
          <FeedTendersUrgent listings={urgentTenders} />
        </div>

        <HowItWorks />

        <Testimonials />

        <Newsletter />
      </MotionProvider>
    </main>
  );
}
