import { NextResponse } from "next/server";

import { searchListings } from "@/lib/search";
import { listingSearchQuerySchema } from "@/lib/validations/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listingSearchQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { listings, total } = await searchListings(parsed.data);
  return NextResponse.json({ listings, total, page: parsed.data.page, limit: parsed.data.limit });
}
