"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { pawapayProviders, type PawaPayProvider } from "@/lib/pawapay";

type CheckoutInfo = {
  listingStatus: string;
  pricing: { payPerBoost: number; annualSubscription: number; subscriberBoostDiscount: number };
  hasActiveSubscription: boolean;
  availableCredits: { id: string; amount: number }[];
};

type Tier = "PAY_PER_BOOST" | "ANNUAL_SUBSCRIPTION";

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const [info, setInfo] = useState<CheckoutInfo | null>(null);
  const [tier, setTier] = useState<Tier>("PAY_PER_BOOST");
  const [phoneNumber, setPhoneNumber] = useState("2507");
  const [provider, setProvider] = useState<PawaPayProvider>("MTN_MOMO_RWA");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"selecting" | "waiting" | "done" | "failed">("selecting");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/checkout/${id}`)
      .then((r) => r.json())
      .then(setInfo);
  }, [id]);

  useEffect(() => {
    if (phase !== "waiting") return;
    const interval = setInterval(async () => {
      const status = await fetch(`/api/checkout/${id}/status`).then((r) => r.json());
      if (status.listingStatus === "LIVE") {
        setPhase("done");
      } else if (status.latestPayment?.status === "FAILED") {
        setError("Payment failed or was declined.");
        setPhase("failed");
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [phase, id]);

  async function handleFreePublish() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/checkout/${id}/free-publish`, { method: "POST" });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not publish");
      return;
    }
    setPhase("done");
  }

  async function handleRedeemCredit(creditId: string) {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/checkout/${id}/redeem-credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditId }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not redeem credit");
      return;
    }
    setPhase("done");
  }

  async function handlePay() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/checkout/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, phoneNumber, provider }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setPhase("failed");
      return;
    }
    setPhase("waiting");
  }

  /** TODO(T2.1/T2.3): delete once there's a live PawaPay sandbox account. */
  async function handleSimulatePayment(outcome: "COMPLETED" | "FAILED") {
    setSubmitting(true);
    setError(null);
    const initiate = await fetch(`/api/dev/simulate-checkout/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    }).then((r) => r.json());
    await fetch("/api/dev/pawapay-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: initiate.payment.id, outcome }),
    });
    setSubmitting(false);
    if (outcome === "COMPLETED") {
      setPhase("done");
    } else {
      setError("Simulated payment failure");
      setPhase("failed");
    }
  }

  if (!info) return <p style={{ padding: 24 }}>{tc("loading")}</p>;

  if (phase === "done" || info.listingStatus === "LIVE") {
    return (
      <main style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>
        <h1>{t("listingIsLive")}</h1>
        <Link href={`/listings/${id}`}>{t("viewListing")}</Link>
      </main>
    );
  }

  const breakEvenListings = Math.ceil(info.pricing.annualSubscription / info.pricing.payPerBoost);

  return (
    <main style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>{t("title")}</h1>

      {phase === "waiting" && (
        <p>{t("waiting")}</p>
      )}

      {phase !== "waiting" && info.hasActiveSubscription && (
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <p>{t("hasSubscription")}</p>
          <button type="button" onClick={handleFreePublish} disabled={submitting}>
            {t("publishForFree")}
          </button>
        </div>
      )}

      {phase !== "waiting" && !info.hasActiveSubscription && info.availableCredits.length > 0 && (
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <p>{t("hasCredit")}</p>
          {info.availableCredits.map((credit) => (
            <button
              key={credit.id}
              type="button"
              onClick={() => handleRedeemCredit(credit.id)}
              disabled={submitting}
              style={{ marginRight: 8 }}
            >
              {t("useCredit", { amount: credit.amount.toLocaleString() })}
            </button>
          ))}
        </div>
      )}

      {phase !== "waiting" && !info.hasActiveSubscription && (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <label style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, flex: 1 }}>
              <input
                type="radio"
                name="tier"
                checked={tier === "PAY_PER_BOOST"}
                onChange={() => setTier("PAY_PER_BOOST")}
              />{" "}
              {t("payPerListing")}
              <p style={{ fontWeight: "bold" }}>RWF {info.pricing.payPerBoost.toLocaleString()}</p>
              <p style={{ fontSize: 13, color: "#666" }}>{t("payPerListingDetail")}</p>
            </label>
            <label style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, flex: 1 }}>
              <input
                type="radio"
                name="tier"
                checked={tier === "ANNUAL_SUBSCRIPTION"}
                onChange={() => setTier("ANNUAL_SUBSCRIPTION")}
              />{" "}
              {t("annualSubscription")}
              <p style={{ fontWeight: "bold" }}>RWF {info.pricing.annualSubscription.toLocaleString()}{t("perYear")}</p>
              <p style={{ fontSize: 13, color: "#666" }}>
                {t("subscriptionDetail", { count: breakEvenListings })}
              </p>
            </label>
          </div>

          <label>
            {t("provider")}
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as PawaPayProvider)}
              style={{ display: "block", width: "100%" }}
            >
              {pawapayProviders.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("phoneNumber")}
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="2507XXXXXXXX"
              style={{ display: "block", width: "100%" }}
            />
          </label>

          {error && (
            <p style={{ color: "red" }}>
              {error}
              {phase === "failed" && ` ${t("tryAgainBelow")}`}
            </p>
          )}

          <button type="button" onClick={handlePay} disabled={submitting} style={{ marginTop: 12 }}>
            {t("payWithMobileMoney")}
          </button>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px dashed #ccc" }}>
            <p style={{ fontSize: 13, color: "#666" }}>
              No live PawaPay sandbox account in this environment (T2.1) — simulate the outcome instead:
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => handleSimulatePayment("COMPLETED")} disabled={submitting}>
                Simulate success
              </button>
              <button type="button" onClick={() => handleSimulatePayment("FAILED")} disabled={submitting}>
                Simulate failure
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
