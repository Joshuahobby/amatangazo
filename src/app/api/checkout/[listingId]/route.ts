import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getActiveSubscription, getPricing, initiateListingCheckout } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { getAvailableCredits } from "@/lib/referrals";
import { checkoutRequestSchema } from "@/lib/validations/checkout";

export async function GET(_request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.posterId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [pricing, subscription, credits] = await Promise.all([
    getPricing(),
    getActiveSubscription(userId),
    getAvailableCredits(userId),
  ]);

  return NextResponse.json({
    listingStatus: listing.status,
    pricing,
    hasActiveSubscription: Boolean(subscription),
    availableCredits: credits.map((c) => ({ id: c.id, amount: c.amount })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await initiateListingCheckout({ listingId, userId, ...parsed.data });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ payment: result.payment }, { status: 201 });
}
