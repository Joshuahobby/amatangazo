import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { getModerationQueue, type ModerationQueueFilter } from "@/lib/moderation";

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const filterParam = searchParams.get("filter");
  const filter: ModerationQueueFilter =
    filterParam === "flagged" || filterParam === "pending" ? filterParam : "all";

  const listings = await getModerationQueue(filter);
  return NextResponse.json({ listings });
}
