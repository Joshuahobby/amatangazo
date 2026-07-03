import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getBoostQuote, initiateBoostCheckout } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { getAvailableCredits } from "@/lib/referrals";
import { checkoutRequestSchema } from "@/lib/validations/checkout";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.posterId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [quote, latestBoostPayment, credits] = await Promise.all([
    getBoostQuote(userId),
    prisma.payment.findFirst({ where: { listingId: id, type: "BOOST" }, orderBy: { createdAt: "desc" } }),
    getAvailableCredits(userId),
  ]);

  return NextResponse.json({
    quote,
    isCurrentlyBoosted: listing.isCurrentlyBoosted,
    boostExpiresAt: listing.boostExpiresAt,
    latestBoostPayment: latestBoostPayment && { id: latestBoostPayment.id, status: latestBoostPayment.status },
    availableCredits: credits.map((c) => ({ id: c.id, amount: c.amount })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutRequestSchema.omit({ tier: true }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await initiateBoostCheckout({ listingId: id, userId, ...parsed.data });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ payment: result.payment }, { status: 201 });
}
