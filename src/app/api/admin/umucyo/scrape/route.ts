import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { runUmucyoScrape } from "@/lib/umucyo-ingest";

/**
 * Manual trigger from the admin panel. The P0-3 "daily run" lands as a
 * scheduled invocation of the same runUmucyoScrape() once hosting exists
 * (T0.7 — e.g. Vercel cron hitting a secret-gated route); this admin-gated
 * route is the on-demand path either way.
 */
export async function POST() {
  await requireAdmin();
  const result = await runUmucyoScrape();
  return NextResponse.json(result);
}
