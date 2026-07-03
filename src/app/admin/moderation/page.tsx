"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type QueueListing = {
  id: string;
  title: string;
  category: string;
  status: string;
  source: string;
  createdAt: string;
  poster: { name: string; businessName: string | null };
  aiFlags: { id: string; flagType: string; confidenceScore: number }[];
  moderationLogs: { id: string; action: string; reason: string | null; admin: { name: string } }[];
};

type Filter = "flagged" | "pending" | "all";

export default function AdminModerationPage() {
  const [filter, setFilter] = useState<Filter>("flagged");
  const [listings, setListings] = useState<QueueListing[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/moderation?filter=${filter}`)
      .then((r) => r.json())
      .then((data) => setListings(data.listings ?? []));
  }, [filter]);

  useEffect(load, [load]);

  async function act(listingId: string, action: "APPROVE" | "REJECT" | "REFUND") {
    const reason =
      action === "APPROVE"
        ? undefined
        : window.prompt(`Reason for ${action.toLowerCase()} (shown to the poster):`) ?? undefined;
    if (action !== "APPROVE" && !reason) return;

    setBusyId(listingId);
    setMessage(null);
    const res = await fetch(`/api/admin/moderation/${listingId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(typeof data.error === "string" ? data.error : "Action failed");
      return;
    }
    setMessage(`${action} applied.`);
    load();
  }

  return (
    <div>
      <h1>Moderation</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["flagged", "pending", "all"] as Filter[]).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} style={{ fontWeight: filter === f ? "bold" : "normal" }}>
            {f === "flagged" ? "AI-flagged" : f === "pending" ? "Awaiting payment/draft" : "All recent"}
          </button>
        ))}
      </div>

      {message && <p>{message}</p>}
      {listings.length === 0 && <p style={{ color: "#666" }}>Nothing in this queue.</p>}

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {listings.map((listing) => (
          <li key={listing.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
              <Link href={`/listings/${listing.id}`} style={{ fontWeight: "bold" }}>
                {listing.title}
              </Link>
              <span style={{ fontSize: 12, background: "#eee", padding: "2px 6px", borderRadius: 4 }}>
                {listing.category}
              </span>
              <span style={{ fontSize: 12, background: "#eee", padding: "2px 6px", borderRadius: 4 }}>
                {listing.status}
              </span>
              {listing.source === "GOVERNMENT_MIRROR" && (
                <span style={{ fontSize: 12, background: "#eef", padding: "2px 6px", borderRadius: 4 }}>
                  Gov mirror
                </span>
              )}
            </div>

            <p style={{ margin: "4px 0", color: "#666", fontSize: 13 }}>
              By {listing.poster.businessName ?? listing.poster.name} · {new Date(listing.createdAt).toLocaleString()}
            </p>

            {listing.aiFlags.length > 0 && (
              <p style={{ margin: "4px 0", color: "#a00", fontSize: 13 }}>
                {listing.aiFlags
                  .map((flag) => `${flag.flagType} (${Math.round(flag.confidenceScore * 100)}%)`)
                  .join(" · ")}
              </p>
            )}

            {listing.moderationLogs.length > 0 && (
              <p style={{ margin: "4px 0", color: "#666", fontSize: 12 }}>
                Last: {listing.moderationLogs[0].action} by {listing.moderationLogs[0].admin.name}
                {listing.moderationLogs[0].reason ? ` — ${listing.moderationLogs[0].reason}` : ""}
              </p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" disabled={busyId === listing.id} onClick={() => act(listing.id, "APPROVE")}>
                Approve
              </button>
              <button type="button" disabled={busyId === listing.id} onClick={() => act(listing.id, "REJECT")}>
                Reject
              </button>
              <button type="button" disabled={busyId === listing.id} onClick={() => act(listing.id, "REFUND")}>
                Refund
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
