import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { buildReferralLink, getReferralStats } from "@/lib/referrals";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const stats = await getReferralStats(user.id);
  return NextResponse.json({
    referralCode: user.referralCode,
    referralLink: buildReferralLink(user.referralCode),
    ...stats,
  });
}
