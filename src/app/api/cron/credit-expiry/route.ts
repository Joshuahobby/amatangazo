import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron";
import { expireStaleCredits } from "@/lib/referrals";

// T4.6 (scheduled half) — flips referral credits past their 90-day window to
// EXPIRED. Reads already exclude them; this keeps the stored status accurate.
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await expireStaleCredits();
  return NextResponse.json({ result });
}
