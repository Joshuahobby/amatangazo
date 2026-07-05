"use client";

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
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referrals/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  if (!data) return <p className="page text-muted">Loading...</p>;

  return (
    <main className="page max-w-xl">
      <h1 className="page-title">Referrals</h1>

      <div className="card mt-4">
        <p className="text-sm text-foreground">
          Share your link — you earn a credit when someone you refer makes their first paid listing or subscribes.
        </p>
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
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <div className="card flex-1">
          <p className="text-2xl font-bold text-foreground">{data.referralCount}</p>
          <p className="text-sm text-muted">Referred signups</p>
        </div>
        <div className="card flex-1">
          <p className="text-2xl font-bold text-foreground">{data.convertedCount}</p>
          <p className="text-sm text-muted">Converted (earned credit)</p>
        </div>
        <div className="card flex-1">
          <p className="text-2xl font-bold text-foreground">RWF {data.availableCreditTotal.toLocaleString()}</p>
          <p className="text-sm text-muted">Available credit</p>
        </div>
      </div>

      {data.availableCredits.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-muted">Available credits</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground">
            {data.availableCredits.map((c) => (
              <li key={c.id}>
                RWF {c.amount.toLocaleString()} — expires {new Date(c.expiresAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted">
            Apply a credit from any listing&apos;s checkout page or its boost button.
          </p>
        </div>
      )}

      <h2 className="mt-6 text-sm font-semibold text-muted">Referral history</h2>
      <table className="admin-table mt-2">
        <thead>
          <tr>
            <th>Referred user</th>
            <th>Status</th>
            <th>Date</th>
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
