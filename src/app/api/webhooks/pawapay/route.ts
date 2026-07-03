import { NextResponse } from "next/server";

import { handleDepositCompleted, handleDepositFailed } from "@/lib/checkout";
import { verifyPawaPayWebhook } from "@/lib/pawapay-webhook";

/**
 * Requires "Signed callbacks" enabled in the PawaPay dashboard (account
 * setting, not code) and PAWAPAY_API_TOKEN configured — see T2.1 spike
 * notes in src/lib/pawapay.ts. Untested against a live PawaPay account;
 * see /api/dev/pawapay-webhook for the local state-transition test path.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const verified = await verifyPawaPayWebhook({
    method: "POST",
    url: request.url,
    headers,
    body: rawBody,
  });

  if (!verified) {
    console.error("Rejected PawaPay webhook: signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const deposit = payload.data ?? payload;
  const { depositId, status } = deposit;

  try {
    if (status === "COMPLETED") {
      await handleDepositCompleted(depositId);
    } else if (status === "FAILED") {
      await handleDepositFailed(depositId);
    }
  } catch (error) {
    console.error("Failed to process PawaPay webhook", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
