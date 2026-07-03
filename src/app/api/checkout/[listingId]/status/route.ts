import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const latestPayment = await prisma.payment.findFirst({
    where: { listingId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    listingStatus: listing.status,
    latestPayment: latestPayment && { id: latestPayment.id, status: latestPayment.status },
  });
}
