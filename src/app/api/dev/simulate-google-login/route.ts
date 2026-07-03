import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth-server";
import { lastDevOtpByEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

/**
 * TODO(Epic 7/T0.6): delete once real Google OAuth credentials exist and
 * GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are configured.
 *
 * There's no way to exercise a real OAuth redirect without live Google
 * credentials, so this bypasses the handshake rather than faking it: it
 * drives Better Auth's own real email-OTP sign-in machinery (so session
 * creation, cookie signing, etc. are all genuine, not reimplemented here),
 * then tags the resulting user with a `providerId: "google"` Account row so
 * the data shape matches what a real Google sign-in would produce. The one
 * thing this cannot test is the actual OAuth wire handshake with Google.
 */
const bodySchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, name } = parsed.data;

  await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  const code = lastDevOtpByEmail.get(email);
  if (!code) {
    return NextResponse.json({ error: "Failed to generate a dev OTP for sign-in" }, { status: 500 });
  }

  // Forward the original request's headers (cookies) so hooks that read
  // request-scoped cookies — e.g. the referral-attribution cookie set by
  // src/proxy.ts — see them during this simulated sign-in.
  const signInResponse = await auth.api.signInEmailOTP({
    body: { email, otp: code, name },
    headers: request.headers,
    asResponse: true,
  });

  if (!signInResponse.ok) {
    return NextResponse.json({ error: "Simulated sign-in failed" }, { status: 500 });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const existingGoogleAccount = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "google" },
  });
  if (!existingGoogleAccount) {
    await prisma.account.create({
      data: { userId: user.id, providerId: "google", accountId: user.id },
    });
  }

  return signInResponse;
}
