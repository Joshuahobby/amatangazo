"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

type PaymentItem = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  listing: { id: string; title: string } | null;
};

type SubscriptionInfo = {
  id: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  boostsIncludedPerMonth: number;
  boostAllotmentRemaining: number;
  boostAllotmentTotal: number;
};

type CreditInfo = {
  id: string;
  amount: number;
  expiresAt: string;
};

export default function BillingPage() {
  const t = useTranslations("billing");
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [credits, setCredits] = useState<CreditInfo[]>([]);

  useEffect(() => {
    fetch("/api/billing").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments ?? []);
        setSubscription(data.subscription);
        setCredits(data.availableCredits ?? []);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <main className="page">
        <div className="skeleton h-8 w-48" />
        <div className="mt-6 flex flex-col gap-4">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-24 w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <h1 className="page-title">{t("title")}</h1>
      <Link href="/dashboard" className="link text-sm">&larr; {t("backToDashboard")}</Link>

      {/* Subscription status */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-foreground">{t("subscriptionTitle")}</h2>
        {subscription ? (
          <div className="card mt-2 p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {t("subscriptionActive")}
              </span>
              <span className="text-sm text-muted">
                {t("expires")} {new Date(subscription.expiresAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-3 text-sm text-foreground">
              {t("boostAllotment")}: {subscription.boostAllotmentRemaining}/{subscription.boostAllotmentTotal} {t("remaining")}
            </p>
          </div>
        ) : (
          <div className="card mt-2 p-4">
            <p className="text-sm text-muted">{t("noSubscription")}</p>
            <Link href={`/checkout/${payments[0]?.listing?.id ?? ""}`} className="btn-outline btn-sm mt-2 inline-block">
              {t("subscribe")}
            </Link>
          </div>
        )}
      </section>

      {/* Available credits */}
      {credits.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-foreground">{t("creditsTitle")}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {credits.map((c) => (
              <div key={c.id} className="card p-3 text-sm">
                <span className="font-semibold text-primary">{c.amount} RWF</span>
                <span className="text-muted"> — {t("expires")} {new Date(c.expiresAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Payment history */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-foreground">{t("paymentHistory")}</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t("noPayments")}</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-muted">
                  <th className="p-3 font-medium">{t("colDate")}</th>
                  <th className="p-3 font-medium">{t("colType")}</th>
                  <th className="p-3 font-medium">{t("colAmount")}</th>
                  <th className="p-3 font-medium">{t("colStatus")}</th>
                  <th className="p-3 font-medium">{t("colListing")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface">
                    <td className="p-3 text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 font-medium text-foreground">{p.type.replace(/_/g, " ")}</td>
                    <td className="p-3 text-foreground">{p.amount} {p.currency}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "COMPLETED" ? "bg-primary/10 text-primary" :
                        p.status === "FAILED" ? "bg-danger-surface text-danger" :
                        "bg-border/40 text-muted"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {p.listing ? (
                        <Link href={`/listings/${p.listing.id}`} className="link">
                          {p.listing.title}
                        </Link>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
