/**
 * T7.1 (Twilio account setup) hasn't run yet, so these env vars won't be set
 * until it does — this just needs to exist and be correctly wired for when
 * they are. TODO(Epic 7): replace the real-send branch below with an actual
 * Twilio Messages API call once TWILIO_* env vars are configured.
 */
import { recordDevMessage } from "@/lib/dev-outbox";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

export function isTwilioConfigured() {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER);
}

/** Dev-only in-memory store — lets /api/dev/last-otp hand back a code without server-log access. */
export const lastDevOtpByPhone = new Map<string, string>();

async function sendTwilioMessage(to: string, from: string, body: string): Promise<void> {
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    },
  );
  if (!response.ok) {
    throw new Error(`Twilio send failed: ${response.status} ${await response.text()}`);
  }
}

export async function sendSms(phoneNumber: string, body: string): Promise<void> {
  if (isTwilioConfigured()) {
    await sendTwilioMessage(phoneNumber, TWILIO_FROM_NUMBER!, body);
    return;
  }
  // TODO(T7.1): delete this branch once Twilio is configured everywhere.
  if (process.env.NODE_ENV === "production") {
    throw new Error("SMS is not configured (Twilio env vars missing) and the dev fallback is disabled in production");
  }
  recordDevMessage({ channel: "SMS", to: phoneNumber, body });
}

/**
 * T7.4 — WhatsApp rides the same Twilio Messages API; only the address prefix
 * differs. Requires the WhatsApp sender to be approved (T7.1 registers it).
 */
export async function sendWhatsApp(phoneNumber: string, body: string): Promise<void> {
  if (isTwilioConfigured()) {
    await sendTwilioMessage(`whatsapp:${phoneNumber}`, `whatsapp:${TWILIO_FROM_NUMBER!}`, body);
    return;
  }
  // TODO(T7.1): delete this branch once Twilio is configured everywhere.
  if (process.env.NODE_ENV === "production") {
    throw new Error("WhatsApp is not configured (Twilio env vars missing) and the dev fallback is disabled in production");
  }
  recordDevMessage({ channel: "WHATSAPP", to: phoneNumber, body });
}

export async function sendOtpSms(phoneNumber: string, code: string): Promise<void> {
  if (isTwilioConfigured()) {
    await sendTwilioMessage(phoneNumber, TWILIO_FROM_NUMBER!, `Your Amatangazo verification code is ${code}`);
    return;
  }

  // TODO(Epic 7): delete this branch once Twilio is configured everywhere.
  if (process.env.NODE_ENV === "production") {
    throw new Error("SMS is not configured (Twilio env vars missing) and the dev fallback is disabled in production");
  }
  console.log(`[dev-otp] SMS to ${phoneNumber}: your Amatangazo code is ${code}`);
  lastDevOtpByPhone.set(phoneNumber, code);
}
