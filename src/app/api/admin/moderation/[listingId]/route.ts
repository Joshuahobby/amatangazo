import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import {
  approveListing,
  editListing,
  markFlagsReviewed,
  refundListing,
  rejectListing,
} from "@/lib/moderation";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("APPROVE"), reason: z.string().trim().optional() }),
  z.object({ action: z.literal("REJECT"), reason: z.string().trim().min(1, "Rejections need a stated reason") }),
  z.object({ action: z.literal("REFUND"), reason: z.string().trim().min(1, "Refunds need a stated reason") }),
  z.object({
    action: z.literal("EDIT"),
    reason: z.string().trim().optional(),
    edits: z
      .object({
        title: z.string().trim().min(3).max(200).optional(),
        description: z.string().trim().min(10).optional(),
        location: z.string().trim().min(1).optional(),
      })
      .refine((edits) => Object.keys(edits).length > 0, "At least one field to edit"),
  }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const admin = await requireAdmin();
  const { listingId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = parsed.data;
    const listing =
      data.action === "APPROVE"
        ? await approveListing(admin.id, listingId, data.reason)
        : data.action === "REJECT"
          ? await rejectListing(admin.id, listingId, data.reason)
          : data.action === "REFUND"
            ? await refundListing(admin.id, listingId, data.reason)
            : await editListing(admin.id, listingId, data.edits, data.reason);

    // Acting on a listing counts as having reviewed its outstanding flags.
    await markFlagsReviewed(listingId);

    return NextResponse.json({ listing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Moderation action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
