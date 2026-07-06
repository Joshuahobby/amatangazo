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
      <h1 className="page-title">Moderation</h1>

      <div className="mt-4 flex gap-2">
        {(["flagged", "pending", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={filter === f ? "btn-primary btn-sm" : "btn-outline btn-sm"}
          >
            {f === "flagged" ? "AI-flagged" : f === "pending" ? "Awaiting payment/draft" : "All recent"}
          </button>
        ))}
      </div>

      {message && <p className="mt-2 text-sm text-primary">{message}</p>}
      {listings.length === 0 && <p className="mt-4 text-sm text-muted">Nothing in this queue.</p>}

      <ul className="mt-4 flex flex-col gap-3">
        {listings.map((listing) => (
          <li key={listing.id} className="card">
            <div className="flex flex-wrap items-baseline gap-2">
              <Link href={`/listings/${listing.id}`} className="font-semibold text-foreground hover:text-primary">
                {listing.title}
              </Link>
              <span className="badge-neutral">{listing.category}</span>
              <span className="badge-neutral">{listing.status}</span>
              {listing.source === "GOVERNMENT_MIRROR" && (
                <span className="badge-cat-tender">Gov mirror</span>
              )}
            </div>

            <p className="mt-1 text-sm text-muted">
              By {listing.poster.businessName ?? listing.poster.name} · {new Date(listing.createdAt).toLocaleString()}
            </p>

            {listing.aiFlags.length > 0 && (
              <p className="mt-1 form-error">
                {listing.aiFlags
                  .map((flag) => `${flag.flagType} (${Math.round(flag.confidenceScore * 100)}%)`)
                  .join(" · ")}
              </p>
            )}

            {listing.moderationLogs.length > 0 && (
              <p className="mt-1 text-xs text-muted">
                Last: {listing.moderationLogs[0].action} by {listing.moderationLogs[0].admin.name}
                {listing.moderationLogs[0].reason ? ` — ${listing.moderationLogs[0].reason}` : ""}
              </p>
            )}

            <div className="mt-3 flex gap-2">
              <button type="button" disabled={busyId === listing.id} onClick={() => act(listing.id, "APPROVE")} className="btn-primary btn-sm">
                Approve
              </button>
              <button type="button" disabled={busyId === listing.id} onClick={() => act(listing.id, "REJECT")} className="btn-danger btn-sm">
                Reject
              </button>
              <button type="button" disabled={busyId === listing.id} onClick={() => act(listing.id, "REFUND")} className="btn-outline btn-sm">
                Refund
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
