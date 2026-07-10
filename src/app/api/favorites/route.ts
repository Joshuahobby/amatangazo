import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { listingInclude } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: { listing: { include: listingInclude } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ favorites: favorites.map((f) => ({ ...f.listing, favoritedAt: f.createdAt })) });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { listingId } = await request.json().catch(() => ({}));
  if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId, listingId } },
  });
  if (existing) return NextResponse.json({ favorite: existing });

  const favorite = await prisma.favorite.create({ data: { userId, listingId } });
  return NextResponse.json({ favorite }, { status: 201 });
}

export async function DELETE(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { listingId } = await request.json().catch(() => ({}));
  if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 });

  await prisma.favorite.deleteMany({ where: { userId, listingId } });
  return NextResponse.json({ success: true });
}
