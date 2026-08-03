"use client";

import { useCallback, useEffect, useState } from "react";

import { describeApiError } from "@/lib/api-error";
import { mergeWithDefaults, type PricingTier, type TierPrice } from "@/lib/pricing";

const tierLabels: Record<PricingTier, string> = {
  PAY_PER_BOOST: "Pay per listing/boost",
  ANNUAL_SUBSCRIPTION: "Annual subscription",
  SUBSCRIBER_BOOST_DISCOUNT: "Subscriber boost discount",
};

export default function AdminPricingPage() {
  const [tiers, setTiers] = useState<TierPrice[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingTier, setSavingTier] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Seeded from the tier list, not from the rows that happen to exist — a tier
  // with no row still needs to be editable, or the first one can never be set.
  //
  // Written as a promise chain rather than an async function so no setState is
  // reachable synchronously from the effect body.
  const load = useCallback(
    () =>
      fetch("/api/admin/pricing")
        .then((res) => {
          if (!res.ok) throw new Error(String(res.status));
          return res.json();
        })
        .then((data) => {
          const merged = mergeWithDefaults(data.rows ?? []);
          setTiers(merged);
          setDrafts(Object.fromEntries(merged.map((tier) => [tier.tier, String(tier.price)])));
          setError(null);
        })
        .catch(() => setError("Could not load pricing. Check your connection and try again."))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(tier: PricingTier) {
    setSavingTier(tier);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, category: null, price: Number(drafts[tier]) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(describeApiError(body?.error, `Could not save ${tierLabels[tier]}`));
        return;
      }
      setMessage(`Saved ${tierLabels[tier]}`);
      await load();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setSavingTier(null);
    }
  }

  return (
    <div>
      <h1 className="page-title">Pricing</h1>
      <p className="page-subtitle">
        Changes apply immediately — checkout reads these rates on every request, no deploy needed.
      </p>

      {message && <p className="mt-2 text-sm text-primary">{message}</p>}
      {error && (
        <p className="mt-2 form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-4 skeleton h-32 max-w-lg" />
      ) : (
        <table className="admin-table mt-4 max-w-lg">
          <tbody>
            {tiers.map((row) => (
              <tr key={row.tier}>
                <td>
                  {tierLabels[row.tier]}
                  {/* Says whether this number is stored or inherited from code —
                      without it a default is indistinguishable from a saved value. */}
                  {row.isDefault && <span className="ml-2 text-xs text-muted">default</span>}
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      aria-label={`${tierLabels[row.tier]} price in RWF`}
                      value={drafts[row.tier] ?? ""}
                      onChange={(e) => setDrafts({ ...drafts, [row.tier]: e.target.value })}
                      className="input w-28 py-1"
                    />
                    RWF
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleSave(row.tier)}
                    disabled={savingTier === row.tier}
                    className="btn-outline btn-sm"
                  >
                    {savingTier === row.tier ? "Saving…" : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
