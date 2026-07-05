"use client";

import { useEffect, useState } from "react";

type BoostInfo = {
  quote: { kind: "FROM_ALLOTMENT" } | { kind: "SUBSCRIBER_DISCOUNT" | "STANDARD"; price: number };
  isCurrentlyBoosted: boolean;
  boostExpiresAt: string | null;
  availableCredits: { id: string; amount: number }[];
};

export function BoostButton({ listingId }: { listingId: string }) {
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
    setMessage(res.ok ? "Boosted using your monthly allotment." : (await res.json()).error);
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
    setMessage(res.ok ? "Boosted using your referral credit." : (await res.json()).error);
    load();
  }

  /** TODO(T2.1): delete once there's a live PawaPay sandbox account. */
  async function handleSimulatePay() {
    setSubmitting(true);
    setMessage(null);
    const initiate = await fetch(`/api/dev/simulate-boost/${listingId}`, { method: "POST" }).then((r) => r.json());
    if (!initiate.payment) {
      setSubmitting(false);
      setMessage(initiate.error ?? "Could not start boost checkout");
      return;
    }
    await fetch("/api/dev/pawapay-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: initiate.payment.id, outcome: "COMPLETED" }),
    });
    setSubmitting(false);
    setMessage("Boosted (simulated payment).");
    load();
  }

  if (!info) return null;

  return (
    <div className="card border-dashed">
      {info.isCurrentlyBoosted && info.boostExpiresAt && (
        <p className="text-sm text-muted">Currently featured until {new Date(info.boostExpiresAt).toLocaleString()}.</p>
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
            Use RWF {credit.amount.toLocaleString()} referral credit
          </button>
        ))}
        {info.quote.kind === "FROM_ALLOTMENT" ? (
          <button type="button" onClick={handleRedeem} disabled={submitting} className="btn-primary btn-sm">
            Boost now (free — monthly allotment)
          </button>
        ) : (
          <button type="button" onClick={handleSimulatePay} disabled={submitting} className="btn-primary btn-sm">
            Boost now — RWF {info.quote.price.toLocaleString()} (simulated, no live PawaPay account)
          </button>
        )}
      </div>
    </div>
  );
}
