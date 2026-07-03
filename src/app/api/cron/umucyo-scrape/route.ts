import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/cron";
import { runUmucyoScrape } from "@/lib/umucyo-ingest";

// T3.2 — scheduled daily Umucyo mirror. Scheduled in vercel.json; the admin
// panel (/admin/umucyo) keeps a manual trigger for on-demand runs.
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runUmucyoScrape(2);
  return NextResponse.json({ result });
}
