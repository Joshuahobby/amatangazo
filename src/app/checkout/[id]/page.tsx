"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { MobileMoneyFields } from "@/components/mobile-money-fields";
import { describeApiError } from "@/lib/api-error";
import { isDevEnvironment } from "@/lib/env";
import { type PawaPayProvider } from "@/lib/pawapay";

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
  const format = useFormatter();
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
        setError(t("paymentFailed"));
        setPhase("failed");
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [phase, id, t]);

  async function handleFreePublish() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/checkout/${id}/free-publish`, { method: "POST" });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(describeApiError(data.error, t("couldNotPublish")));
      setPhase("failed");
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
      setError(describeApiError(data.error, t("couldNotRedeemCredit")));
      setPhase("failed");
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
      setError(describeApiError(data.error, t("couldNotStartPayment")));
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

  if (!info) return <main className="page-sm text-muted">{tc("loading")}</main>;

  if (phase === "done" || info.listingStatus === "LIVE") {
    return (
      <main className="page-sm text-center">
        <h1 className="page-title">{t("listingIsLive")}</h1>
        <Link href={`/listings/${id}`} className="btn-primary mt-4 inline-flex">
          {t("viewListing")}
        </Link>
      </main>
    );
  }

  const breakEvenListings = Math.ceil(info.pricing.annualSubscription / info.pricing.payPerBoost);

  return (
    <main className="page-sm">
      <h1 className="page-title">{t("title")}</h1>

      {phase === "waiting" && <p className="mt-4 text-sm text-muted">{t("waiting")}</p>}

      {phase !== "waiting" && info.hasActiveSubscription && (
        <div className="card mt-4">
          <p className="text-sm text-foreground">{t("hasSubscription")}</p>
          <button type="button" onClick={handleFreePublish} disabled={submitting} className="btn-primary btn-sm mt-3">
            {t("publishForFree")}
          </button>
        </div>
      )}

      {phase !== "waiting" && !info.hasActiveSubscription && info.availableCredits.length > 0 && (
        <div className="card mt-4">
          <p className="text-sm text-foreground">{t("hasCredit")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
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
          </div>
        </div>
      )}

      {phase !== "waiting" && !info.hasActiveSubscription && (
        <>
          <div className="mt-4 flex gap-3">
            <label
              className={`card flex-1 cursor-pointer ${tier === "PAY_PER_BOOST" ? "border-primary" : ""}`}
            >
              <input
                type="radio"
                name="tier"
                checked={tier === "PAY_PER_BOOST"}
                onChange={() => setTier("PAY_PER_BOOST")}
                className="mr-1.5"
              />
              {t("payPerListing")}
              <p className="mt-1 font-bold text-foreground">RWF {format.number(info.pricing.payPerBoost)}</p>
              <p className="mt-1 text-xs text-muted">{t("payPerListingDetail")}</p>
            </label>
            <label
              className={`card flex-1 cursor-pointer ${tier === "ANNUAL_SUBSCRIPTION" ? "border-primary" : ""}`}
            >
              <input
                type="radio"
                name="tier"
                checked={tier === "ANNUAL_SUBSCRIPTION"}
                onChange={() => setTier("ANNUAL_SUBSCRIPTION")}
                className="mr-1.5"
              />
              {t("annualSubscription")}
              <p className="mt-1 font-bold text-foreground">
                RWF {format.number(info.pricing.annualSubscription)}
                {t("perYear")}
              </p>
              <p className="mt-1 text-xs text-muted">{t("subscriptionDetail", { count: breakEvenListings })}</p>
            </label>
          </div>

          <MobileMoneyFields
            provider={provider}
            onProviderChange={setProvider}
            phoneNumber={phoneNumber}
            onPhoneNumberChange={setPhoneNumber}
          />

          <div className="card mt-4 bg-background">
            <p className="text-sm font-medium text-foreground">{t("howItWorks")}</p>
            <ol className="mt-2 flex flex-col gap-2">
              {["step1", "step2", "step3"].map((step, i) => (
                <li key={step} className="flex gap-2.5 text-sm text-muted">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-contrast">
                    {i + 1}
                  </span>
                  {t(step)}
                </li>
              ))}
            </ol>
          </div>

          {error && (
            <p className="mt-3 form-error">
              {error}
              {phase === "failed" && ` ${t("tryAgainBelow")}`}
            </p>
          )}

          <button type="button" onClick={handlePay} disabled={submitting} className="btn-primary mt-4 w-full">
            {t("payWithMobileMoney")}
          </button>

          <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
            <span aria-hidden>🔒</span>
            {t("securePayment")}
          </p>

          {isDevEnvironment && (
            <div className="mt-6 border-t border-dashed border-border pt-4">
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
    </main>
  );
}
