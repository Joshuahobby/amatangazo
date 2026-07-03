import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/lib/auth";
import { simulateBoostCheckoutInitiation } from "@/lib/checkout";

/**
 * TODO(T2.3/T2.7): delete once there's a real PawaPay sandbox account.
 * Mirrors /api/dev/simulate-checkout for the re-boost flow.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const result = await simulateBoostCheckoutInitiation({ listingId: id, userId });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ payment: { id: result.payment.id, pawapayTransactionId: result.depositId } });
}
