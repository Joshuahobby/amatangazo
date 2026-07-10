import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [payments, subscription, credits] = await Promise.all([
    prisma.payment.findMany({
      where: { userId },
      include: { listing: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getActiveSubscription(userId),
    prisma.referralCredit.findMany({
      where: { userId, status: "AVAILABLE" },
      select: { id: true, amount: true, expiresAt: true },
    }),
  ]);

  let boostAllotmentUsed = 0;
  let boostAllotmentTotal = 0;
  if (subscription) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    boostAllotmentUsed = await prisma.boost.count({
      where: { subscriptionId: subscription.id, fromAllotment: true, createdAt: { gte: monthStart } },
    });
    boostAllotmentTotal = subscription.boostsIncludedPerMonth;
  }

  return NextResponse.json({
    payments,
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          startedAt: subscription.startedAt,
          expiresAt: subscription.expiresAt,
          boostsIncludedPerMonth: subscription.boostsIncludedPerMonth,
          boostAllotmentRemaining: boostAllotmentTotal - boostAllotmentUsed,
          boostAllotmentTotal,
        }
      : null,
    availableCredits: credits,
  });
}
