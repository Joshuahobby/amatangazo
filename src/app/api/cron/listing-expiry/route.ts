import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const result = await prisma.listing.updateMany({
    where: { status: "LIVE", expiresAt: { lte: new Date() } },
    data: { status: "EXPIRED", isCurrentlyBoosted: false, boostExpiresAt: null },
  });

  return NextResponse.json({ expired: result.count });
}
