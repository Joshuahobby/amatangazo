/**
 * No email vendor is set up yet (Resend is the PRD's named choice for
 * transactional email, but the API key hasn't been provisioned — Epic 7/T0.6).
 * TODO(Epic 7): confirm the real-send branch below once RESEND_API_KEY exists.
 */
import { recordDevMessage } from "@/lib/dev-outbox";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = "Amatangazo <auth@amatangazo.com>";

export function isEmailConfigured() {
  return Boolean(RESEND_API_KEY);
}

/** Dev-only in-memory store — lets /api/dev/last-otp hand back a code without server-log access. */
export const lastDevOtpByEmail = new Map<string, string>();

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (isEmailConfigured()) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, text }),
    });
    if (!response.ok) {
      throw new Error(`Resend email send failed: ${response.status} ${await response.text()}`);
    }
    return;
  }
  // TODO(T0.6): delete this branch once Resend is configured everywhere.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Email is not configured (RESEND_API_KEY missing) and the dev fallback is disabled in production");
  }
  recordDevMessage({ channel: "EMAIL", to, body: `${subject}\n${text}` });
}

/**
 * `subject`/`text` are composed by the caller so the copy can be localised —
 * see otpMessage() in notification-messages.ts. `otp` is still passed
 * separately because the dev fallback below stores it for /api/dev/last-otp.
 */
export async function sendOtpEmail(email: string, otp: string, subject: string, text: string): Promise<void> {
  if (isEmailConfigured()) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: email, subject, text }),
    });
    if (!response.ok) {
      throw new Error(`Resend email send failed: ${response.status} ${await response.text()}`);
    }
    return;
  }

  // TODO(Epic 7): delete this branch once Resend is configured everywhere.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Email is not configured (RESEND_API_KEY missing) and the dev fallback is disabled in production");
  }
  console.log(`[dev-otp] Email to ${email}: ${text}`);
  lastDevOtpByEmail.set(email, otp);
}
