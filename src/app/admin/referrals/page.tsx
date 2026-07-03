"use client";

import { useEffect, useState } from "react";

type AdminReferralData = {
  totalReferrals: number;
  statusCounts: Record<string, number>;
  creditsIssuedCount: number;
  creditsIssuedTotal: number;
  recentReferrals: {
    id: string;
    status: string;
    fraudFlagReason: string | null;
    createdAt: string;
    creditValue: number | null;
    referrer: { name: string; phoneNumber: string | null; email: string | null };
    referredUser: { name: string; phoneNumber: string | null; email: string | null };
  }[];
};

export default function AdminReferralsPage() {
  const [data, setData] = useState<AdminReferralData | null>(null);

  useEffect(() => {
    fetch("/api/admin/referrals")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h1>Referrals</h1>

      <div style={{ display: "flex", gap: 16, margin: "16px 0" }}>
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>{data.totalReferrals}</p>
          <p>Total referrals</p>
        </div>
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>{data.statusCounts.CREDITED ?? 0}</p>
          <p>Converted</p>
        </div>
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>{data.statusCounts.FRAUD_HOLD ?? 0}</p>
          <p>Fraud holds</p>
        </div>
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
          <p style={{ fontSize: 24, fontWeight: "bold" }}>RWF {data.creditsIssuedTotal.toLocaleString()}</p>
          <p>Total credit cost ({data.creditsIssuedCount} credits)</p>
        </div>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>Referrer</th>
            <th style={{ textAlign: "left", padding: 8 }}>Referred</th>
            <th style={{ textAlign: "left", padding: 8 }}>Status</th>
            <th style={{ textAlign: "left", padding: 8 }}>Credit</th>
            <th style={{ textAlign: "left", padding: 8 }}>Note</th>
            <th style={{ textAlign: "left", padding: 8 }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.recentReferrals.map((r) => (
            <tr key={r.id}>
              <td style={{ padding: 8 }}>{r.referrer.name}</td>
              <td style={{ padding: 8 }}>{r.referredUser.name}</td>
              <td style={{ padding: 8 }}>{r.status}</td>
              <td style={{ padding: 8 }}>{r.creditValue ? `RWF ${r.creditValue.toLocaleString()}` : "—"}</td>
              <td style={{ padding: 8 }}>{r.fraudFlagReason ?? "—"}</td>
              <td style={{ padding: 8 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
