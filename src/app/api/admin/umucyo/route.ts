import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireAdmin();

  const [logs, mirroredCount] = await Promise.all([
    prisma.umucyoScrapeLog.findMany({ orderBy: { runAt: "desc" }, take: 30 }),
    prisma.listing.count({ where: { source: "GOVERNMENT_MIRROR" } }),
  ]);

  return NextResponse.json({ logs, mirroredCount });
}
