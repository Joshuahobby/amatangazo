import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { getVerificationQueue } from "@/lib/verification";

export async function GET() {
  await requireAdmin();
  const result = await getVerificationQueue();
  return NextResponse.json(result);
}
