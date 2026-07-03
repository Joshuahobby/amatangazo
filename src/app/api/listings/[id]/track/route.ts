import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/** T10.1 — application-intent tracking: fired when a viewer clicks an apply link. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updated = await prisma.listing.updateMany({
    where: { id, status: "LIVE" },
    data: { applicationCount: { increment: 1 } },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
