/**
 * Dev-only capture of outbound notifications while no vendor is configured
 * (Twilio/Resend — T7.1/T0.6). Lets tests and /api/dev/outbox verify what
 * would have been sent. TODO(T0.6): delete once vendors are live everywhere.
 */
export type DevOutboxEntry = {
  channel: "SMS" | "WHATSAPP" | "EMAIL";
  to: string;
  body: string;
  sentAt: string;
};

export const devOutbox: DevOutboxEntry[] = [];

export function recordDevMessage(entry: Omit<DevOutboxEntry, "sentAt">) {
  devOutbox.push({ ...entry, sentAt: new Date().toISOString() });
  console.log(`[dev-outbox] ${entry.channel} to ${entry.to}: ${entry.body.slice(0, 120)}`);
}
