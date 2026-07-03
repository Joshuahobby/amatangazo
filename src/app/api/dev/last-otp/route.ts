import { NextResponse } from "next/server";

import { lastDevOtpByEmail } from "@/lib/email";
import { lastDevOtpByPhone } from "@/lib/sms";

/**
 * TODO(Epic 7): delete once Twilio/Resend are configured everywhere and the
 * dev-fallback branches in src/lib/sms.ts and src/lib/email.ts are removed.
 * Lets a human or browser-automation test read back a dev-mode OTP without
 * server-log access.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const phoneNumber = searchParams.get("phoneNumber");
  const email = searchParams.get("email");

  if (phoneNumber) {
    return NextResponse.json({ code: lastDevOtpByPhone.get(phoneNumber) ?? null });
  }
  if (email) {
    return NextResponse.json({ code: lastDevOtpByEmail.get(email) ?? null });
  }
  return NextResponse.json({ error: "phoneNumber or email required" }, { status: 400 });
}
