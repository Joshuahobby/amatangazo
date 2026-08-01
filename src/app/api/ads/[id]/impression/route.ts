import { NextResponse } from "next/server";

import { recordImpression } from "@/lib/ads";

/** Viewability beacon target — see components/ad-impression.tsx. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await recordImpression(id);
  return NextResponse.json({ ok: true });
}
