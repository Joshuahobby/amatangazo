import { ListingsSearch, type ListingsSearchInitial } from "@/components/listings-search";
import { Sidebar } from "@/components/sidebar";
import { listingInclude } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { experienceLevels, listingCategories } from "@/lib/validations/listing";

const SORT_OPTIONS = ["relevance", "newest", "salary_desc", "deadline_asc", "price_asc", "price_desc"] as const;

type RawSearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function oneOf(value: string, allowed: readonly string[]): string {
  return allowed.includes(value) ? value : "";
}

export default async function ListingsSearchPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const initial: ListingsSearchInitial = {
    q: first(params.q),
    category: oneOf(first(params.category), listingCategories),
    location: first(params.location),
    sector: first(params.sector),
    experienceLevel: oneOf(first(params.experienceLevel), experienceLevels),
    sort: oneOf(first(params.sort), SORT_OPTIONS),
  };

  // Sidebar data is independent of the client-side search, so it renders on the
  // server once and stays put while filters change.
  const [categoryCounts, boosted] = await Promise.all([
    prisma.listing.groupBy({
      by: ["category"],
      where: { status: "LIVE" },
      _count: { _all: true },
    }),
    prisma.listing.findMany({
      where: { status: "LIVE", isCurrentlyBoosted: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
      include: listingInclude,
    }),
  ]);

  const counts = Object.fromEntries(
    categoryCounts.map((c) => [c.category, c._count._all]),
  ) as Record<string, number>;

  return (
    <main className="page-wide">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {/* Keying by the incoming filters remounts the client search with fresh
              state on real navigations (home tiles, header search, back/forward)
              while its own history.replaceState URL syncing never re-renders
              this server page. */}
          <ListingsSearch key={JSON.stringify(initial)} initial={initial} />
        </div>

        <Sidebar boosted={boosted} counts={counts} />
      </div>
    </main>
  );
}
