import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireAdmin();

  const [totalReferrals, byStatus, credits, recentReferrals] = await Promise.all([
    prisma.referral.count(),
    prisma.referral.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.referralCredit.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
    prisma.referral.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        referrer: { select: { name: true, phoneNumber: true, email: true } },
        referredUser: { select: { name: true, phoneNumber: true, email: true } },
      },
    }),
  ]);

  const statusCounts = Object.fromEntries(byStatus.map((row) => [row.status, row._count._all]));

  return NextResponse.json({
    totalReferrals,
    statusCounts,
    creditsIssuedCount: credits._count._all,
    creditsIssuedTotal: credits._sum.amount ?? 0,
    recentReferrals,
  });
}
