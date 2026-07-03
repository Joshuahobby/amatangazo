import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { reviewVerification } from "@/lib/verification";

const reviewSchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED"]),
  reason: z.string().max(1000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireAdmin();
  const { userId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await reviewVerification(admin.id, userId, parsed.data.decision, parsed.data.reason);
  return NextResponse.json({ user });
}
