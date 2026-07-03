import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/auth";
import { handleDepositCompleted, handleDepositFailed } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";

/**
 * TODO(T2.3): delete once there's a real PawaPay sandbox account to send
 * live signed callbacks from. Exercises the exact same handleDeposit*
 * functions the real webhook (src/app/api/webhooks/pawapay/route.ts) calls
 * after signature verification — this just skips the signature step, which
 * can't be tested without PawaPay's private signing key.
 */
const bodySchema = z.object({ paymentId: z.string(), outcome: z.enum(["COMPLETED", "FAILED"]) });

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { id: parsed.data.paymentId } });
  if (!payment || payment.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!payment.pawapayTransactionId) {
    return NextResponse.json({ error: "Payment has no deposit id" }, { status: 400 });
  }

  const updated =
    parsed.data.outcome === "COMPLETED"
      ? await handleDepositCompleted(payment.pawapayTransactionId)
      : await handleDepositFailed(payment.pawapayTransactionId);

  return NextResponse.json({ payment: updated });
}
