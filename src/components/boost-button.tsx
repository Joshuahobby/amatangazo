"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { MobileMoneyFields } from "@/components/mobile-money-fields";
import { describeApiError } from "@/lib/api-error";
import { isDevEnvironment } from "@/lib/env";
import { type PawaPayProvider } from "@/lib/pawapay";

/** How often to re-check whether the mobile-money deposit has settled. */
const POLL_MS = 2000;

type BoostInfo = {
  quote: { kind: "FROM_ALLOTMENT" } | { kind: "SUBSCRIBER_DISCOUNT" | "STANDARD"; price: number };
  isCurrentlyBoosted: boolean;
  boostExpiresAt: string | null;
  latestBoostPayment: { id: string; status: string } | null;
  availableCredits: { id: string; amount: number }[];
};

export function BoostButton({ listingId }: { listingId: string }) {
  const t = useTranslations("boost");
  const format = useFormatter();
  const [info, setInfo] = useState<BoostInfo | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "waiting">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("2507");
  const [provider, setProvider] = useState<PawaPayProvider>("MTN_MOMO_RWA");

  const load = useCallback(
    () =>
      fetch(`/api/listings/${listingId}/boost`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: BoostInfo | null) => {
          setInfo(data);
          return data;
        }),
    [listingId],
  );

  useEffect(() => {
    load();
  }, [load]);

  // PawaPay settles out of band — the payer approves on their handset and the
  // webhook flips the payment — so the only way to know we're done is to ask.
  useEffect(() => {
    if (phase !== "waiting") return;

    const interval = setInterval(async () => {
      const data = await load();
      if (data?.latestBoostPayment?.status === "COMPLETED") {
        setPhase("idle");
        setMessage(t("boosted"));
      } else if (data?.latestBoostPayment?.status === "FAILED") {
        setPhase("idle");
        setError(t("paymentFailed"));
      }
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [phase, load, t]);

  function begin() {
    setSubmitting(true);
    setMessage(null);
    setError(null);
  }

  async function handleRedeem() {
    begin();
    const res = await fetch(`/api/listings/${listingId}/boost/redeem`, { method: "POST" });
    setSubmitting(false);
    if (res.ok) setMessage(t("boostedFromAllotment"));
    else setError(describeApiError((await res.json()).error, t("couldNotStart")));
    load();
  }

  async function handleRedeemCredit(creditId: string) {
    begin();
    const res = await fetch(`/api/listings/${listingId}/boost/redeem-credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditId }),
    });
    setSubmitting(false);
    if (res.ok) setMessage(t("boostedFromCredit"));
    else setError(describeApiError((await res.json()).error, t("couldNotStart")));
    load();
  }

  async function handlePay() {
    begin();
    const res = await fetch(`/api/listings/${listingId}/boost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, provider }),
    });
    setSubmitting(false);

    const data = await res.json();
    if (!res.ok) {
      // Covers the not-configured case too: the server answers with a plain
      // "payments aren't available right now" rather than throwing.
      setError(describeApiError(data.error, t("payError")));
      return;
    }
    setPhase("waiting");
  }

  /** TODO(T2.1): delete once there's a live PawaPay sandbox account. */
  async function handleSimulatePayment(outcome: "COMPLETED" | "FAILED") {
    begin();
    const initiate = await fetch(`/api/dev/simulate-boost/${listingId}`, { method: "POST" }).then((r) => r.json());
    if (!initiate.payment) {
      setSubmitting(false);
      setError(describeApiError(initiate.error, t("couldNotStart")));
      return;
    }
    await fetch("/api/dev/pawapay-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: initiate.payment.id, outcome }),
    });
    setSubmitting(false);
    if (outcome === "COMPLETED") setMessage(t("boostedSimulated"));
    else setError(t("paymentFailed"));
    load();
  }

  if (!info) return null;

  const paidBoost = info.quote.kind !== "FROM_ALLOTMENT" ? info.quote : null;

  return (
    <div className="card border-dashed">
      {info.isCurrentlyBoosted && info.boostExpiresAt && (
        <p className="text-sm text-muted">
          {t("currentlyFeaturedUntil", {
            date: format.dateTime(new Date(info.boostExpiresAt), { dateStyle: "medium", timeStyle: "short" }),
          })}
        </p>
      )}

      {phase === "waiting" && <p className="mt-1 text-sm text-muted">{t("waiting")}</p>}
      {message && <p className="mt-1 text-sm text-foreground">{message}</p>}
      {error && <p className="mt-1 form-error">{error}</p>}

      {/* While the handset prompt is outstanding, hide every way to start a
          second payment for the same boost. */}
      {phase !== "waiting" && (
        <>
          <div className="mt-2 flex flex-wrap gap-2">
            {info.availableCredits.map((credit) => (
              <button
                key={credit.id}
                type="button"
                onClick={() => handleRedeemCredit(credit.id)}
                disabled={submitting}
                className="btn-accent btn-sm"
              >
                {t("useCredit", { amount: format.number(credit.amount) })}
              </button>
            ))}

            {!paidBoost && (
              <button type="button" onClick={handleRedeem} disabled={submitting} className="btn-primary btn-sm">
                {t("boostFree")}
              </button>
            )}
          </div>

          {paidBoost && (
            <>
              <MobileMoneyFields
                provider={provider}
                onProviderChange={setProvider}
                phoneNumber={phoneNumber}
                onPhoneNumberChange={setPhoneNumber}
              />

              <button type="button" onClick={handlePay} disabled={submitting} className="btn-primary btn-sm mt-3">
                {t("boostPaid", { price: format.number(paidBoost.price) })}
              </button>

              {/* TODO(T2.1): delete alongside handleSimulatePayment. Dev-only, so
                  the copy stays English like the checkout page's sandbox block. */}
              {isDevEnvironment && (
                <div className="mt-3 border-t border-dashed border-border pt-3">
                  <p className="text-xs text-muted">Sandbox mode — simulate the payment outcome:</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment("COMPLETED")}
                      disabled={submitting}
                      className="btn-outline btn-sm"
                    >
                      Simulate success
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulatePayment("FAILED")}
                      disabled={submitting}
                      className="btn-outline btn-sm"
                    >
                      Simulate failure
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
