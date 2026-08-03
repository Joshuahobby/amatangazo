"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { isDevEnvironment } from "@/lib/env";

type BoostInfo = {
  quote: { kind: "FROM_ALLOTMENT" } | { kind: "SUBSCRIBER_DISCOUNT" | "STANDARD"; price: number };
  isCurrentlyBoosted: boolean;
  boostExpiresAt: string | null;
  availableCredits: { id: string; amount: number }[];
};

export function BoostButton({ listingId }: { listingId: string }) {
  const t = useTranslations("boost");
  const format = useFormatter();
  const [info, setInfo] = useState<BoostInfo | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch(`/api/listings/${listingId}/boost`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setInfo);
  }

  useEffect(load, [listingId]);

  async function handleRedeem() {
    setSubmitting(true);
    setMessage(null);
    const res = await fetch(`/api/listings/${listingId}/boost/redeem`, { method: "POST" });
    setSubmitting(false);
    setMessage(res.ok ? t("boostedFromAllotment") : (await res.json()).error);
    load();
  }

  async function handleRedeemCredit(creditId: string) {
    setSubmitting(true);
    setMessage(null);
    const res = await fetch(`/api/listings/${listingId}/boost/redeem-credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditId }),
    });
    setSubmitting(false);
    setMessage(res.ok ? t("boostedFromCredit") : (await res.json()).error);
    load();
  }

  /** TODO(T2.1): delete once there's a live PawaPay sandbox account. */
  async function handleSimulatePay() {
    setSubmitting(true);
    setMessage(null);
    const initiate = await fetch(`/api/dev/simulate-boost/${listingId}`, { method: "POST" }).then((r) => r.json());
    if (!initiate.payment) {
      setSubmitting(false);
      setMessage(initiate.error ?? t("couldNotStart"));
      return;
    }
    await fetch("/api/dev/pawapay-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: initiate.payment.id, outcome: "COMPLETED" }),
    });
    setSubmitting(false);
    setMessage(t("boostedSimulated"));
    load();
  }

  if (!info) return null;

  return (
    <div className="card border-dashed">
      {info.isCurrentlyBoosted && info.boostExpiresAt && (
        <p className="text-sm text-muted">
          {t("currentlyFeaturedUntil", { date: format.dateTime(new Date(info.boostExpiresAt), { dateStyle: "medium", timeStyle: "short" }) })}
        </p>
      )}
      {message && <p className="mt-1 text-sm text-foreground">{message}</p>}
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
        {info.quote.kind === "FROM_ALLOTMENT" ? (
          <button type="button" onClick={handleRedeem} disabled={submitting} className="btn-primary btn-sm">
            {t("boostFree")}
          </button>
        ) : isDevEnvironment ? (
          <button type="button" onClick={handleSimulatePay} disabled={submitting} className="btn-primary btn-sm">
            {t("boostPaid", { price: format.number(info.quote.price) })}
          </button>
        ) : (
          <p className="text-sm text-muted">{t("boostUnavailable")}</p>
        )}
      </div>
    </div>
  );
}
