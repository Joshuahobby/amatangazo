import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { listingInclude } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { updateListingSchema } from "@/lib/validations/listing";

const detailsRelationKey = {
  JOB: "jobDetails",
  TENDER: "tenderDetails",
  AUCTION: "auctionDetails",
  CLASSIFIED: "classifiedDetails",
} as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, include: listingInclude });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (listing.status !== "LIVE") {
    const userId = await getCurrentUserId();
    if (userId !== listing.posterId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ listing });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.posterId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  // Validated against the category this listing already is — the payload does
  // not carry one, and guessing from the payload is what silently dropped the
  // detail fields before.
  const parsed = updateListingSchema(existing.category).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { details, ...base } = parsed.data;

  // An empty `details` is a no-op update, not an update to nothing: skip it so
  // a caller sending `{}` can't read a 200 as "your change was saved".
  const hasDetails = details && Object.keys(details).length > 0;

  const listing = await prisma.listing.update({
    where: { id },
    data: {
      ...base,
      ...(hasDetails ? { [detailsRelationKey[existing.category]]: { update: details } } : {}),
    },
    include: listingInclude,
  });

  return NextResponse.json({ listing });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.posterId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const listing = await prisma.listing.update({
    where: { id },
    data: { status: "REMOVED" },
  });

  return NextResponse.json({ listing });
}
