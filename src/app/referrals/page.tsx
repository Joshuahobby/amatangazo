"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type ReferralData = {
  referralCode: string;
  referralLink: string;
  referralCount: number;
  convertedCount: number;
  availableCreditTotal: number;
  availableCredits: { id: string; amount: number; expiresAt: string }[];
  referrals: {
    id: string;
    status: string;
    createdAt: string;
    referredUser: { name: string; createdAt: string };
  }[];
};

export default function ReferralsPage() {
  const t = useTranslations("referrals");
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referrals/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  if (!data) return <main className="page-md text-muted">{t("loading")}</main>;

  return (
    <main className="page-md">
      <h1 className="page-title">{t("title")}</h1>

      <div className="card mt-4">
        <p className="text-sm text-foreground">{t("shareText")}</p>
        <div className="mt-3 flex gap-2">
          <input readOnly value={data.referralLink} className="input flex-1" />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(data.referralLink);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="btn-outline"
          >
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <div className="card flex-1">
          <p className="text-2xl font-bold text-foreground">{data.referralCount}</p>
          <p className="text-sm text-muted">{t("referredSignups")}</p>
        </div>
        <div className="card flex-1">
          <p className="text-2xl font-bold text-foreground">{data.convertedCount}</p>
          <p className="text-sm text-muted">{t("converted")}</p>
        </div>
        <div className="card flex-1">
          <p className="text-2xl font-bold text-foreground">RWF {data.availableCreditTotal.toLocaleString()}</p>
          <p className="text-sm text-muted">{t("availableCredit")}</p>
        </div>
      </div>

      {data.availableCredits.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-muted">{t("availableCreditsTitle")}</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground">
            {data.availableCredits.map((c) => (
              <li key={c.id}>
                {t("creditExpires", {
                  amount: c.amount.toLocaleString(),
                  date: new Date(c.expiresAt).toLocaleDateString(),
                })}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted">{t("applyCreditHint")}</p>
        </div>
      )}

      <h2 className="mt-6 text-sm font-semibold text-muted">{t("historyTitle")}</h2>
      <table className="admin-table mt-2">
        <thead>
          <tr>
            <th>{t("colReferredUser")}</th>
            <th>{t("colStatus")}</th>
            <th>{t("colDate")}</th>
          </tr>
        </thead>
        <tbody>
          {data.referrals.map((r) => (
            <tr key={r.id}>
              <td>{r.referredUser.name}</td>
              <td>{r.status}</td>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
