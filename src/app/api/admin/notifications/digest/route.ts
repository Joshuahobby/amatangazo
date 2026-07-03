import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { runNotificationDigest } from "@/lib/notifications";

/** Manual digest trigger — T0.7 replaces this with a scheduled cron. */
export async function POST() {
  await requireAdmin();
  const result = await runNotificationDigest();
  return NextResponse.json({ result });
}
