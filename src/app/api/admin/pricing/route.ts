import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { getCurrentUserId } from "@/lib/auth";
import { PRICING_TIERS } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { listingCategories } from "@/lib/validations/listing";

export async function GET() {
  await requireAdmin();
  const rows = await prisma.pricingConfig.findMany({ orderBy: [{ tier: "asc" }, { category: "asc" }] });
  return NextResponse.json({ rows });
}

const updateSchema = z.object({
  // From the shared tier list rather than a second copy of the enum, so the
  // admin screen and this validator cannot drift apart.
  tier: z.enum(PRICING_TIERS),
  category: z.enum(listingCategories).nullable(),
  price: z.coerce.number().int().positive(),
});

export async function PATCH(request: Request) {
  await requireAdmin();
  const adminId = await getCurrentUserId();

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { tier, category, price } = parsed.data;

  // Prisma's compound-unique `where` input rejects `null` for a nullable field.
  const existing = await prisma.pricingConfig.findFirst({ where: { tier, category } });
  const row = existing
    ? await prisma.pricingConfig.update({
        where: { id: existing.id },
        data: { price, updatedByAdminId: adminId },
      })
    : await prisma.pricingConfig.create({
        data: { tier, category, price, updatedByAdminId: adminId },
      });

  return NextResponse.json({ row });
}
