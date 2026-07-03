import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const addImageSchema = z.object({ url: z.string().trim().url() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const body = await request.json().catch(() => null);
  const parsed = addImageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const lastImage = await prisma.listingImage.findFirst({
    where: { listingId: id },
    orderBy: { sortOrder: "desc" },
  });

  const image = await prisma.listingImage.create({
    data: {
      listingId: id,
      url: parsed.data.url,
      sortOrder: (lastImage?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ image }, { status: 201 });
}
