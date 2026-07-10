import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const applications = await prisma.application.findMany({
    where: { userId },
    include: {
      listing: { select: { id: true, title: true, category: true, posterId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { listingId, message } = await request.json().catch(() => ({}));
  if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 });

  const existing = await prisma.application.findUnique({
    where: { listingId_userId: { listingId, userId } },
  });
  if (existing) return NextResponse.json({ error: "Already applied" }, { status: 409 });

  const application = await prisma.application.create({
    data: { listingId, userId, message },
  });

  await prisma.listing.update({
    where: { id: listingId },
    data: { applicationCount: { increment: 1 } },
  });

  return NextResponse.json({ application }, { status: 201 });
}
