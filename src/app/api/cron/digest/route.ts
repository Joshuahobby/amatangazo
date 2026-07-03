import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron";
import { runNotificationDigest } from "@/lib/notifications";

// T7.3 — scheduled saved-search digest. Scheduled in vercel.json; the admin
// panel (/admin/notifications) keeps a manual trigger.
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runNotificationDigest();
  return NextResponse.json({ result });
}
