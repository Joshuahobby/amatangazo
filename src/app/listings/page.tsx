import type { ListingRowData } from "@/components/listing-row";
import { ListingsSearch, type ListingsSearchInitial } from "@/components/listings-search";
import { Sidebar } from "@/components/sidebar";
import { getDiscoveryFeed } from "@/lib/discovery";
import { listingInclude } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { searchListings } from "@/lib/search";
import { listingSearchQuerySchema } from "@/lib/validations/search";
import { isDiscoveryCategory, experienceLevels, listingCategories } from "@/lib/validations/listing";

const SORT_OPTIONS = ["relevance", "newest", "salary_desc", "deadline_asc", "price_asc", "price_desc"] as const;

/** Must match PAGE_SIZE in ListingsSearch — the server renders that first page. */
const PAGE_SIZE = 20;

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

  // The first page of results is rendered here rather than fetched after mount.
  // It used to arrive client-side, so the list grew from eight skeletons to a
  // full page and shoved everything below it down — most of this page's
  // cumulative layout shift. ListingsSearch takes over once a filter changes.
  //
  // Sidebar data is independent of the search, so it renders once and stays put.
  const [categoryCounts, boosted, initialSearch, initialDiscovery] = await Promise.all([
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
    // Parsed through the same schema the search API uses, so the server's first
    // page can't drift from what the client would have asked for. Empty strings
    // are dropped rather than passed as filters.
    searchListings(
      listingSearchQuerySchema.parse({
        ...Object.fromEntries(Object.entries(initial).filter(([, v]) => v !== "")),
        page: 1,
        limit: PAGE_SIZE,
      }),
    ),
    // Same reasoning for the discovery strip: it sits *above* the results, so
    // arriving late moved the whole list. Only fetched when it could be shown —
    // a keyword search hides it, as does a category with no discovery angle.
    !initial.q && isDiscoveryCategory(initial.category) ? getDiscoveryFeed(initial.category) : null,
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
          <ListingsSearch
            key={JSON.stringify(initial)}
            initial={initial}
            initialResults={initialSearch.listings as unknown as ListingRowData[]}
            initialTotal={initialSearch.total}
            initialDiscovery={(initialDiscovery ?? []) as unknown as ListingRowData[]}
          />
        </div>

        <Sidebar boosted={boosted} counts={counts} />
      </div>
    </main>
  );
}
