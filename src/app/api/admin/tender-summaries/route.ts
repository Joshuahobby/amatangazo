import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { generateMissingSummaries } from "@/lib/tender-summary";

export async function GET() {
  await requireAdmin();
  const [missing, done] = await Promise.all([
    prisma.tenderDetails.count({ where: { aiSummaryGeneratedAt: null, listing: { status: "LIVE" } } }),
    prisma.tenderDetails.count({ where: { aiSummaryGeneratedAt: { not: null } } }),
  ]);
  return NextResponse.json({ missing, done });
}

export async function POST() {
  await requireAdmin();
  const result = await generateMissingSummaries(10);
  return NextResponse.json({ result });
}
