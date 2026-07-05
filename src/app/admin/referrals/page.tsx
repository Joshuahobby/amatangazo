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

  if (!data) return <p className="text-muted">Loading...</p>;

  return (
    <div>
      <h1 className="page-title">Referrals</h1>

      <div className="my-4 flex flex-wrap gap-3">
        <div className="stat-card">
          <p className="stat-value">{data.totalReferrals}</p>
          <p className="stat-label">Total referrals</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{data.statusCounts.CREDITED ?? 0}</p>
          <p className="stat-label">Converted</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{data.statusCounts.FRAUD_HOLD ?? 0}</p>
          <p className="stat-label">Fraud holds</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">RWF {data.creditsIssuedTotal.toLocaleString()}</p>
          <p className="stat-label">Total credit cost ({data.creditsIssuedCount} credits)</p>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Referrer</th>
            <th>Referred</th>
            <th>Status</th>
            <th>Credit</th>
            <th>Note</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.recentReferrals.map((r) => (
            <tr key={r.id}>
              <td>{r.referrer.name}</td>
              <td>{r.referredUser.name}</td>
              <td>{r.status}</td>
              <td>{r.creditValue ? `RWF ${r.creditValue.toLocaleString()}` : "—"}</td>
              <td>{r.fraudFlagReason ?? "—"}</td>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
