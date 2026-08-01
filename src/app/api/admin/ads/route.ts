import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const adSlots = ["SIDEBAR_TOP", "SIDEBAR_MID", "SIDEBAR_BOTTOM", "FEED_INLINE", "HEADER_LEADERBOARD"] as const;
const adStatuses = ["DRAFT", "ACTIVE", "PAUSED"] as const;

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  advertiserName: z.string().trim().min(1).max(200),
  slot: z.enum(adSlots),
  imageUrl: z.string().trim().url(),
  targetUrl: z.string().trim().url(),
  altText: z.string().trim().min(1).max(300),
  status: z.enum(adStatuses).default("DRAFT"),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  weight: z.coerce.number().int().positive().default(1),
});

const updateSchema = createSchema.partial().extend({ id: z.string().min(1) });

export async function GET() {
  await requireAdmin();
  const ads = await prisma.ad.findMany({ orderBy: [{ slot: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ ads });
}

export async function POST(request: Request) {
  await requireAdmin();

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ad = await prisma.ad.create({ data: parsed.data });
  return NextResponse.json({ ad }, { status: 201 });
}

export async function PATCH(request: Request) {
  await requireAdmin();

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...data } = parsed.data;
  const ad = await prisma.ad.update({ where: { id }, data });
  return NextResponse.json({ ad });
}

export async function DELETE(request: Request) {
  await requireAdmin();

  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await prisma.ad.deleteMany({ where: { id } });
  return NextResponse.json({ success: true });
}
