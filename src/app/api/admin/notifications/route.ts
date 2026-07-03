import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireAdmin();

  const [logs, savedSearchCount] = await Promise.all([
    prisma.notificationLog.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
      include: {
        user: { select: { name: true, email: true, phoneNumber: true } },
        listing: { select: { title: true } },
      },
    }),
    prisma.savedSearch.count(),
  ]);

  return NextResponse.json({ logs, savedSearchCount });
}
