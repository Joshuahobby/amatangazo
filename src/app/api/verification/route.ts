import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { submitVerification } from "@/lib/verification";

const submitSchema = z.object({
  documentUrl: z.url().max(1000),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({
    status: user.verificationStatus,
    submittedAt: user.verificationSubmittedAt,
    reviewedAt: user.verificationReviewedAt,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.verificationStatus === "VERIFIED" || user.verificationStatus === "PENDING") {
    return NextResponse.json({ error: `Already ${user.verificationStatus.toLowerCase()}` }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await submitVerification(user.id, parsed.data.documentUrl);
  return NextResponse.json(result, { status: 201 });
}
