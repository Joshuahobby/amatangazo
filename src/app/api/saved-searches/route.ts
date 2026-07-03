import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listingCategories } from "@/lib/validations/listing";

const createSavedSearchSchema = z.object({
  category: z.enum(listingCategories),
  channel: z.enum(["SMS", "WHATSAPP", "EMAIL"]),
  filters: z
    .object({
      keyword: z.string().max(200).optional(),
      location: z.string().max(200).optional(),
      sector: z.string().max(200).optional(),
      experienceLevel: z.string().max(50).optional(),
    })
    .default({}),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const savedSearches = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ savedSearches });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSavedSearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const savedSearch = await prisma.savedSearch.create({
    data: {
      userId,
      category: parsed.data.category,
      channel: parsed.data.channel,
      filters: parsed.data.filters,
    },
  });
  return NextResponse.json({ savedSearch }, { status: 201 });
}
