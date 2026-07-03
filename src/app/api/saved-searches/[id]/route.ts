import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const deleted = await prisma.savedSearch.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Saved search not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
