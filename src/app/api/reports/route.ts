import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { listingId, reason, description } = await request.json().catch(() => ({}));
  if (!listingId || !reason) {
    return NextResponse.json({ error: "listingId and reason are required" }, { status: 400 });
  }

  const report = await prisma.listingReport.create({
    data: { listingId, reporterId: userId, reason, description },
  });

  return NextResponse.json({ report }, { status: 201 });
}
