import { ListingsSearch, type ListingsSearchInitial } from "@/components/listings-search";
import { experienceLevels, listingCategories } from "@/lib/validations/listing";

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
  };

  // Keying by the incoming filters remounts the client search with fresh state
  // on real navigations (home tiles, header search, back/forward) while its own
  // history.replaceState URL syncing never re-renders this server page.
  return <ListingsSearch key={JSON.stringify(initial)} initial={initial} />;
}
