import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const { id, imageId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (listing.posterId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const image = await prisma.listingImage.findUnique({ where: { id: imageId } });
  if (!image || image.listingId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.listingImage.delete({ where: { id: imageId } });
  return NextResponse.json({ success: true });
}
