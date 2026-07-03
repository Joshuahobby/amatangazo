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

  if (!data) return <p style={{ padding: 24 }}>Loading...</p>;

  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Referrals</h1>

      <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <p>Share your link — you earn a credit when someone you refer makes their first paid listing or subscribes.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input readOnly value={data.referralLink} style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(data.referralLink);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, flex: 1 }}>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>{data.referralCount}</p>
          <p>Referred signups</p>
        </div>
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, flex: 1 }}>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>{data.convertedCount}</p>
          <p>Converted (earned credit)</p>
        </div>
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, flex: 1 }}>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>RWF {data.availableCreditTotal.toLocaleString()}</p>
          <p>Available credit</p>
        </div>
      </div>

      {data.availableCredits.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16 }}>Available credits</h2>
          <ul>
            {data.availableCredits.map((c) => (
              <li key={c.id}>
                RWF {c.amount.toLocaleString()} — expires {new Date(c.expiresAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 13, color: "#666" }}>
            Apply a credit from any listing&apos;s checkout page or its boost button.
          </p>
        </div>
      )}

      <h2 style={{ fontSize: 16 }}>Referral history</h2>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>Referred user</th>
            <th style={{ textAlign: "left", padding: 8 }}>Status</th>
            <th style={{ textAlign: "left", padding: 8 }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.referrals.map((r) => (
            <tr key={r.id}>
              <td style={{ padding: 8 }}>{r.referredUser.name}</td>
              <td style={{ padding: 8 }}>{r.status}</td>
              <td style={{ padding: 8 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
