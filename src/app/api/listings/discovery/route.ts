import { NextResponse } from "next/server";

import { getDiscoveryFeed } from "@/lib/discovery";
import { isDiscoveryCategory } from "@/lib/validations/listing";

/**
 * Backs the discovery strip on the browse page. Separate from
 * `/api/listings/search` because its ordering is editorial (highest salary,
 * soonest deadline) and always drops expired listings, which the general
 * search must not do.
 */
export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category") ?? "";
  if (!isDiscoveryCategory(category)) {
    return NextResponse.json({ listings: [] });
  }

  return NextResponse.json({ listings: await getDiscoveryFeed(category) });
}
