import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

export const revalidate = 3600; // regenerate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/listings`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Guarded so a build with no DB reachable still emits a valid sitemap.
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "LIVE" },
      select: { id: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 5000,
    });
    return [
      ...staticRoutes,
      ...listings.map((l) => ({
        url: `${BASE_URL}/listings/${l.id}`,
        lastModified: l.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.error("sitemap: listing query failed, emitting static routes only", error);
    return staticRoutes;
  }
}
