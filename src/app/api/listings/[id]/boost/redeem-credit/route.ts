import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/auth";
import { boostWithReferralCredit } from "@/lib/checkout";

const bodySchema = z.object({ creditId: z.string() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const listing = await boostWithReferralCredit(id, userId, parsed.data.creditId);
    return NextResponse.json({ listing });
  } catch (error) {
    console.error("boost redeem-credit failed", error);
    const message = error instanceof Error ? error.message : "Could not redeem credit";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
