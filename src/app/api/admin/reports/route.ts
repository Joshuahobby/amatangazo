import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "PENDING";

  const reports = await prisma.listingReport.findMany({
    where: { status },
    include: {
      reporter: { select: { name: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ reports });
}

export async function PATCH(request: Request) {
  await requireAdmin();
  const { id, status } = await request.json().catch(() => ({}));
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

  await prisma.listingReport.update({
    where: { id },
    data: { status, reviewedAt: new Date(), reviewedBy: (await requireAdmin()).id },
  });

  return NextResponse.json({ success: true });
}
