import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const notifications = await prisma.notificationLog.findMany({
    where: { userId },
    include: {
      listing: { select: { id: true, title: true } },
      savedSearch: { select: { id: true, category: true } },
    },
    orderBy: { sentAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications });
}
