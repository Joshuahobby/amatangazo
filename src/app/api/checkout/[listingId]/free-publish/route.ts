import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { publishWithSubscription } from "@/lib/checkout";

export async function POST(_request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const listing = await publishWithSubscription(listingId, userId);
    return NextResponse.json({ listing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not publish listing";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
