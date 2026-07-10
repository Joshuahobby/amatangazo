import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      businessName: true,
      email: true,
      phoneNumber: true,
      image: true,
      accountType: true,
      verificationStatus: true,
      preferredLanguage: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { name, businessName, email, phoneNumber } = body;

  const data: Record<string, string> = {};
  if (typeof name === "string" && name.trim().length >= 1) data.name = name.trim();
  if (typeof businessName === "string") data.businessName = businessName.trim() || "";
  if (typeof email === "string") data.email = email.trim() || undefined as unknown as string;
  if (typeof phoneNumber === "string") data.phoneNumber = phoneNumber.trim() || undefined as unknown as string;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      businessName: true,
      email: true,
      phoneNumber: true,
      image: true,
      accountType: true,
      verificationStatus: true,
      preferredLanguage: true,
    },
  });

  return NextResponse.json({ user });
}
