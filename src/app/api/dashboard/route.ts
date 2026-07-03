import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** T10.2 — poster's own listings with per-category benchmark comparison. */
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [listings, benchmarks] = await Promise.all([
    prisma.listing.findMany({
      where: { posterId: userId },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        viewCount: true,
        applicationCount: true,
        isCurrentlyBoosted: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
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
