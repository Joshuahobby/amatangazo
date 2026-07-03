"use client";

import { useEffect, useState } from "react";

type PricingRow = { id: string; tier: string; category: string | null; price: number };

const tierLabels: Record<string, string> = {
  PAY_PER_BOOST: "Pay per listing/boost",
  ANNUAL_SUBSCRIPTION: "Annual subscription",
  SUBSCRIBER_BOOST_DISCOUNT: "Subscriber boost discount",
};

export default function AdminPricingPage() {
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingTier, setSavingTier] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/pricing")
      .then((r) => r.json())
      .then((data) => {
        const globalRows: PricingRow[] = data.rows.filter((row: PricingRow) => row.category === null);
        setRows(globalRows);
        setDrafts(Object.fromEntries(globalRows.map((row) => [row.tier, String(row.price)])));
      });
  }

  useEffect(load, []);

  async function handleSave(tier: string) {
    setSavingTier(tier);
    setMessage(null);
    const res = await fetch("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, category: null, price: Number(drafts[tier]) }),
    });
    setSavingTier(null);
    if (!res.ok) {
      setMessage("Failed to save");
      return;
    }
    setMessage(`Saved ${tierLabels[tier] ?? tier}`);
    load();
  }

  return (
    <div>
      <h1>Pricing</h1>
      <p style={{ color: "#666" }}>
        Changes apply immediately — checkout reads these rates on every request, no deploy needed.
      </p>
      {message && <p>{message}</p>}
      <table style={{ borderCollapse: "collapse" }}>
        <tbody>
          {rows.map((row) => (
            <tr key={row.tier}>
              <td style={{ padding: 8 }}>{tierLabels[row.tier] ?? row.tier}</td>
              <td style={{ padding: 8 }}>
                <input
                  type="number"
                  min={0}
                  value={drafts[row.tier] ?? ""}
                  onChange={(e) => setDrafts({ ...drafts, [row.tier]: e.target.value })}
                  style={{ width: 120 }}
                />{" "}
                RWF
              </td>
              <td style={{ padding: 8 }}>
                <button type="button" onClick={() => handleSave(row.tier)} disabled={savingTier === row.tier}>
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
