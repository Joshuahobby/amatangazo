import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { runAiFlagging } from "@/lib/ai-flagging";
import { generateTenderSummary } from "@/lib/tender-summary";
import { getCurrentUserId } from "@/lib/auth";
import { createListingWithDetails, listingInclude } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { createListingSchema, listingQuerySchema } from "@/lib/validations/listing";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = listingQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { category, page, limit } = parsed.data;
  const mine = searchParams.get("mine") === "true";

  const where: Prisma.ListingWhereInput = category ? { category } : {};

  if (mine) {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    where.posterId = userId;
  } else {
    where.status = "LIVE";
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: listingInclude,
      orderBy: [{ isCurrentlyBoosted: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({ listings, total, page, limit });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const listing = await createListingWithDetails(userId, parsed.data);
    // Advisory only — must never block or delay creation (P0-5).
    void runAiFlagging(listing.id);
    if (listing.category === "TENDER") void generateTenderSummary(listing.id);
    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Failed to create listing", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
