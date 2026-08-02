import { listingInclude } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

import { MotionProvider } from "@/components/motion-provider";
import { HeroSection } from "@/components/hero-section";
import { TrustSection } from "@/components/trust-section";
import { CategoryFilterBar } from "@/components/category-filter-bar";
import { CategoryShowcase } from "@/components/category-showcase";
import { FeaturedBand } from "@/components/featured-band";
import { FeedLatest } from "@/components/feed-latest";
import { HowItWorks } from "@/components/how-it-works";
import { PosterCta } from "@/components/poster-cta";
import { PricingPackages } from "@/components/pricing-packages";
import { Sidebar } from "@/components/sidebar";

export default async function Home() {
  // Directory layout (see docs/design-system.md § Listing surfaces): a short
  // hero → two-column [featured band + latest feed | sidebar] → trust →
  // how-it-works → pricing → poster CTA. Listings render as compact rows rather
  // than cards so a visitor sees a directory's worth of opportunities per
  // screen, and the sidebar carries the boosted rail, categories, and ads.
  //
  // Ad slots collapse when unsold — nothing here fabricates inventory.
  //
  // The discovery feeds this page used to carry (high-paying jobs, urgent
  // tenders, auctions ending soon) now live on the category they belong to —
  // see CategoryDiscovery on /listings?category=… — rather than stacking three
  // more sections here.
  const [categoryCounts, boostedListings, latestListings] = await Promise.all([
      prisma.listing.groupBy({
        by: ["category"],
        where: { status: "LIVE" },
        _count: { _all: true },
      }),
      prisma.listing.findMany({
        where: { status: "LIVE", isCurrentlyBoosted: true },
        orderBy: { publishedAt: "desc" },
        take: 15,
        include: listingInclude,
      }),
      // Boosted listings are excluded here — they already have the featured
      // band and the sidebar rail. Without this they rendered a third time, as
      // the first rows of this feed, immediately repeating the band above.
      prisma.listing.findMany({
        where: { status: "LIVE", isCurrentlyBoosted: false },
        orderBy: { publishedAt: "desc" },
        take: 24,
        include: listingInclude,
      }),
  ]);

  // Band and rail draw from the same query but never overlap: the rail picks up
  // where the band stops. With 6 or fewer boosted listings the rail receives an
  // empty array and hides itself rather than mirroring the band.
  const bandListings = boostedListings.slice(0, 6);
  const railListings = boostedListings.slice(6, 11);

  const counts = Object.fromEntries(
    categoryCounts.map((c) => [c.category, c._count._all]),
  ) as Record<string, number>;

  return (
    <main className="pb-20">
      <MotionProvider>
        <HeroSection />

        {/* pt-4 rather than the scaffold's py-8: the hero already provides
            separation, and every pixel here pushes listings below the fold. */}
        <div className="page-wide pt-4">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-6">
              {/* Also the category nav on mobile, where the sidebar stacks below. */}
              <CategoryFilterBar />
              <FeaturedBand listings={bandListings} />
              <FeedLatest listings={latestListings} />
            </div>

            <Sidebar boosted={railListings} counts={counts} />
          </div>

          <CategoryShowcase counts={counts} />

          <TrustSection />

          <HowItWorks />

          <PricingPackages />

          <PosterCta />
        </div>
      </MotionProvider>
    </main>
  );
}
