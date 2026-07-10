import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["LIVE", "DRAFT", "EXPIRED", "REMOVED", "PENDING_PAYMENT", "REJECTED"] as const;

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  const where = { posterId: userId } as Record<string, unknown>;
  if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    where.status = status;
  }

  const [listings, benchmarks] = await Promise.all([
    prisma.listing.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        viewCount: true,
        applicationCount: true,
        isCurrentlyBoosted: true,
        publishedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.listing.groupBy({
      by: ["category"],
      where: { status: "LIVE" },
      _avg: { viewCount: true, applicationCount: true },
    }),
  ]);

  return NextResponse.json({
    listings,
    benchmarks: Object.fromEntries(
      benchmarks.map((b) => [
        b.category,
        {
          avgViews: Math.round(b._avg.viewCount ?? 0),
          avgApplications: Math.round(b._avg.applicationCount ?? 0),
        },
      ]),
    ),
  });
}
