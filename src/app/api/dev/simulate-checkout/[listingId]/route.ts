import { NextResponse } from "next/server";
import { z } from "zod";

import { simulateCheckoutInitiation } from "@/lib/checkout";
import { getCurrentUserId } from "@/lib/auth";

/**
 * TODO(T2.3): delete once there's a real PawaPay sandbox account. Same
 * DB-write path as initiateListingCheckout, minus the actual PawaPay call —
 * pair with /api/dev/pawapay-webhook to test the full initiate -> webhook
 * -> Listing/Subscription/Boost state machine without live credentials.
 */
const bodySchema = z.object({ tier: z.enum(["PAY_PER_BOOST", "ANNUAL_SUBSCRIPTION"]) });

export async function POST(request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const { listingId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await simulateCheckoutInitiation({ listingId, userId, tier: parsed.data.tier });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ payment: { id: result.payment.id, pawapayTransactionId: result.depositId } });
}
