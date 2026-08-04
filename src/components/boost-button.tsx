"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { MobileMoneyFields } from "@/components/mobile-money-fields";
import { StatusMessage } from "@/components/status-message";
import { describeApiError, readApiError } from "@/lib/api-error";
import { isDevEnvironment } from "@/lib/env";
import { type PawaPayProvider } from "@/lib/pawapay";

/** How often to re-check whether the mobile-money deposit has settled. */
const POLL_MS = 2000;

/**
 * How long to keep asking before giving up on a handset prompt.
 *
 * A deposit only ever leaves PENDING when the payer acts, so a prompt that is
 * ignored — the common case, not the rare one — used to leave this polling
 * every two seconds for as long as the tab stayed open, on a connection the
 * payer is most likely paying for by the megabyte. Three minutes is past the
 * point where someone who meant to approve still would have.
 */
const POLL_TIMEOUT_MS = 3 * 60_000;

type BoostInfo = {
  quote: { kind: "FROM_ALLOTMENT" } | { kind: "SUBSCRIBER_DISCOUNT" | "STANDARD"; price: number };
  isCurrentlyBoosted: boolean;
  boostExpiresAt: string | null;
  latestBoostPayment: { id: string; status: string } | null;
  availableCredits: { id: string; amount: number }[];
};

export function BoostButton({ listingId }: { listingId: string }) {
  const t = useTranslations("boost");
  const tc = useTranslations("common");
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
          // Keep the last good state on a transient failure. Writing the null
          // through would trip the `!info` guard below and unmount the whole
          // card mid-payment, taking the pending-payment notice with it.
          if (data) setInfo(data);
          return data;
        })
        .catch(() => null),
    [listingId],
  );

  useEffect(() => {
    load();
  }, [load]);

  // PawaPay settles out of band — the payer approves on their handset and the
  // webhook flips the payment — so the only way to know we're done is to ask.
  useEffect(() => {
    if (phase !== "waiting") return;

    let waited = 0;
    const interval = setInterval(async () => {
      waited += POLL_MS;
      const data = await load();
      const status = data?.latestBoostPayment?.status;

      if (status === "COMPLETED") {
        setPhase("idle");
        setMessage(t("boosted"));
      } else if (status === "FAILED") {
        setPhase("idle");
        setError(t("paymentFailed"));
      } else if (waited >= POLL_TIMEOUT_MS) {
        // Deliberately not an error: the deposit may still land, and the
        // webhook records it either way. This only stops us asking.
        setPhase("idle");
        setMessage(t("waitingTimedOut"));
      }
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [phase, load, t]);

  function begin() {
    setSubmitting(true);
    setMessage(null);
    setError(null);
  }

  /**
   * Every handler below runs its network work through here.
   *
   * `submitting` disables all of these buttons, so whatever happens, clearing
   * it has to be unconditional — a dropped connection mid-request used to
   * reject before the `setSubmitting(false)` line was reached and leave the
   * payment controls dead until the visitor thought to reload the page.
   */
  async function run(work: () => Promise<void>) {
    begin();
    try {
      await work();
    } catch {
      setError(tc("networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  function handleRedeem() {
    return run(async () => {
      const res = await fetch(`/api/listings/${listingId}/boost/redeem`, { method: "POST" });
      if (res.ok) setMessage(t("boostedFromAllotment"));
      else setError(await readApiError(res, t("couldNotStart")));
      load();
    });
  }

  function handleRedeemCredit(creditId: string) {
    return run(async () => {
      const res = await fetch(`/api/listings/${listingId}/boost/redeem-credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditId }),
      });
      if (res.ok) setMessage(t("boostedFromCredit"));
      else setError(await readApiError(res, t("couldNotStart")));
      load();
    });
  }

  function handlePay() {
    return run(async () => {
      const res = await fetch(`/api/listings/${listingId}/boost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, provider }),
      });
      if (!res.ok) {
        // Covers the not-configured case too: the server answers with a plain
        // "payments aren't available right now" rather than throwing.
        setError(await readApiError(res, t("payError")));
        return;
      }
      setPhase("waiting");
    });
  }

  /** TODO(T2.1): delete once there's a live PawaPay sandbox account. */
  function handleSimulatePayment(outcome: "COMPLETED" | "FAILED") {
    return run(async () => {
      const res = await fetch(`/api/dev/simulate-boost/${listingId}`, { method: "POST" });
      const initiate = await res.json().catch(() => ({}));
      if (!initiate.payment) {
        setError(describeApiError(initiate.error, t("couldNotStart")));
        return;
      }
      await fetch("/api/dev/pawapay-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: initiate.payment.id, outcome }),
      });
      if (outcome === "COMPLETED") setMessage(t("boostedSimulated"));
      else setError(t("paymentFailed"));
      load();
    });
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

      {/* Kept outside the `waiting` branch below so the region is already in the
          DOM when the notice lands — mounting a live region and its text in one
          commit is why nothing gets announced. */}
      <StatusMessage tone="info" className="mt-1 text-sm text-muted">
        {phase === "waiting" ? t("waiting") : null}
      </StatusMessage>

      {/* Waiting hides every other control, so without this the visitor whose
          prompt never arrived has no way back short of reloading the page. */}
      {phase === "waiting" && (
        <button type="button" onClick={() => setPhase("idle")} className="btn-outline btn-sm mt-2">
          {t("stopWaiting")}
        </button>
      )}
      <StatusMessage tone="success" className="mt-1 text-sm text-foreground">{message}</StatusMessage>
      <StatusMessage tone="error" className="mt-1 form-error">{error}</StatusMessage>

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
