/**
 * T2.1 spike findings: PawaPay's Merchant API is server-to-server (no hosted
 * checkout redirect) and async — initiateDeposit only confirms PawaPay
 * *accepted* the request; the real outcome (COMPLETED/FAILED) arrives via
 * webhook (see pawapay-webhook.ts). Card isn't supported — payer.type is
 * always "MMO" (mobile money) per PawaPay's docs; PRD decision log v5 #13.
 */

const PAWAPAY_BASE_URL =
  process.env.PAWAPAY_ENV === "production" ? "https://api.pawapay.io" : "https://api.sandbox.pawapay.io";
const PAWAPAY_API_TOKEN = process.env.PAWAPAY_API_TOKEN;

export function isPawaPayConfigured() {
  return Boolean(PAWAPAY_API_TOKEN);
}

export const pawapayProviders = ["MTN_MOMO_RWA", "AIRTEL_RWA"] as const;
export type PawaPayProvider = (typeof pawapayProviders)[number];

export type InitiateDepositResult =
  | { ok: true; status: "ACCEPTED" | "DUPLICATE_IGNORED"; depositId: string }
  | { ok: false; status: "REJECTED"; failureCode?: string; failureMessage?: string };

export async function initiateDeposit(params: {
  depositId: string;
  amount: number;
  phoneNumber: string;
  provider: PawaPayProvider;
  customerMessage: string;
}): Promise<InitiateDepositResult> {
  if (!PAWAPAY_API_TOKEN) {
    throw new Error("PawaPay is not configured (PAWAPAY_API_TOKEN missing)");
  }

  const response = await fetch(`${PAWAPAY_BASE_URL}/v2/deposits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PAWAPAY_API_TOKEN}`,
    },
    body: JSON.stringify({
      depositId: params.depositId,
      amount: params.amount.toString(),
      currency: "RWF",
      payer: {
        type: "MMO",
        accountDetails: {
          phoneNumber: params.phoneNumber,
          provider: params.provider,
        },
      },
      customerMessage: params.customerMessage.slice(0, 22),
    }),
  });

  const body = await response.json();

  if (body.status === "REJECTED") {
    return {
      ok: false,
      status: "REJECTED",
      failureCode: body.failureReason?.failureCode,
      failureMessage: body.failureReason?.failureMessage,
    };
  }

  return { ok: true, status: body.status, depositId: body.depositId };
}

export type DepositStatus = {
  depositId: string;
  status: "ACCEPTED" | "PROCESSING" | "IN_RECONCILIATION" | "COMPLETED" | "FAILED";
  amount: string;
  currency: string;
  failureReason?: { failureCode: string; failureMessage: string };
};

export async function checkDepositStatus(depositId: string): Promise<DepositStatus | null> {
  if (!PAWAPAY_API_TOKEN) {
    throw new Error("PawaPay is not configured (PAWAPAY_API_TOKEN missing)");
  }

  const response = await fetch(`${PAWAPAY_BASE_URL}/v2/deposits/${depositId}`, {
    headers: { Authorization: `Bearer ${PAWAPAY_API_TOKEN}` },
  });
  const body = await response.json();
  if (body.status === "NOT_FOUND") return null;
  return body.data;
}

export { PAWAPAY_BASE_URL };
