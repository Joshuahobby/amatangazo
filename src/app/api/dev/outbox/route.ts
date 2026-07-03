import { NextResponse } from "next/server";

import { devOutbox } from "@/lib/dev-outbox";

/** Dev-only: inspect messages captured while no SMS/WhatsApp/email vendor is configured. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ outbox: devOutbox });
}
