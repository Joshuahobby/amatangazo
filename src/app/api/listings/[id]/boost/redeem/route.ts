import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { redeemBoostFromAllotment } from "@/lib/checkout";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const listing = await redeemBoostFromAllotment(id, userId);
    return NextResponse.json({ listing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not redeem boost";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
