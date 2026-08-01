import { NextResponse } from "next/server";

import { recordClick } from "@/lib/ads";

/**
 * Counts a click and forwards to the advertiser. Redirect-based rather than a
 * beacon so the count can't be lost to a page unload, and costs no client JS.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const targetUrl = await recordClick(id);
  if (!targetUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.redirect(targetUrl, 302);
}
