"use client";

import { useEffect, useState } from "react";

// From lib/ad-slots, not lib/ads: this is a client component, and lib/ads
// imports Prisma, which would pull `pg` into the browser bundle.
import { StatusMessage } from "@/components/status-message";
import { PLACED_AD_SLOTS } from "@/lib/ad-slots";

type Ad = {
  id: string;
  name: string;
  advertiserName: string;
  slot: string;
  imageUrl: string;
  targetUrl: string;
  altText: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  weight: number;
  impressions: number;
  clicks: number;
};

const SLOT_LABELS: Record<string, string> = {
  SIDEBAR_TOP: "Sidebar top (300×250)",
  SIDEBAR_MID: "Sidebar mid (300×600, desktop only)",
  SIDEBAR_BOTTOM: "Sidebar bottom (300×250)",
  FEED_INLINE: "In-feed banner (728×90)",
  HEADER_LEADERBOARD: "Header leaderboard (728×90)",
};

// Only slots actually placed on a page can be sold. Existing ads in unplaced
// slots stay editable and are flagged in the table below.
const SLOTS = PLACED_AD_SLOTS.map((value) => ({ value, label: SLOT_LABELS[value] ?? value }));

const STATUSES = ["DRAFT", "ACTIVE", "PAUSED"];

const EMPTY = {
  name: "",
  advertiserName: "",
  slot: "SIDEBAR_TOP",
  imageUrl: "",
  targetUrl: "",
  altText: "",
  status: "DRAFT",
  startsAt: "",
  endsAt: "",
  weight: "1",
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [draft, setDraft] = useState({ ...EMPTY });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/ads")
      .then((r) => r.json())
      .then((data) => setAds(data.ads ?? []));
  }

  useEffect(load, []);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setMessage(null);
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, purpose: "ad-creative" }),
      });
      const presign = await presignRes.json();
      if (!presignRes.ok) {
        setMessage(typeof presign.error === "string" ? presign.error : "Could not start upload");
        return;
      }

      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        setMessage("Upload to storage failed");
        return;
      }

      setDraft((prev) => ({ ...prev, imageUrl: presign.publicUrl }));
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        weight: Number(draft.weight) || 1,
        startsAt: draft.startsAt || null,
        endsAt: draft.endsAt || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Failed to create — check every field is filled and the URLs are absolute.");
      return;
    }
    setDraft({ ...EMPTY });
    setMessage("Ad created");
    load();
  }

  async function handleStatus(id: string, status: string) {
    await fetch("/api/admin/ads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/admin/ads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div>
      <h1 className="page-title">Ads</h1>
      <p className="page-subtitle">
        Slots render nothing when no ad is ACTIVE and inside its date window — an unsold slot
        collapses rather than showing a placeholder.
      </p>
      {/* One channel for both outcomes here — polite, since a failed admin
          action is not something to interrupt a screen reader mid-sentence. */}
      <StatusMessage tone="info" className="mt-2 text-sm text-primary">{message}</StatusMessage>

      <h2 className="mt-6 font-semibold text-foreground">New ad</h2>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="field">
          Internal name
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" />
        </label>
        <label className="field">
          Advertiser
          <input value={draft.advertiserName} onChange={(e) => setDraft({ ...draft, advertiserName: e.target.value })} className="input" />
        </label>
        <label className="field">
          Slot
          <select value={draft.slot} onChange={(e) => setDraft({ ...draft, slot: e.target.value })} className="input">
            {SLOTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Status
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} className="input">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Creative
          <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="text-sm font-normal text-muted" />
        </label>
        <label className="field">
          Creative URL
          <input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} placeholder="Uploads fill this in" className="input" />
        </label>
        <label className="field">
          Click-through URL
          <input value={draft.targetUrl} onChange={(e) => setDraft({ ...draft, targetUrl: e.target.value })} placeholder="https://…" className="input" />
        </label>
        <label className="field">
          Alt text
          <input value={draft.altText} onChange={(e) => setDraft({ ...draft, altText: e.target.value })} className="input" />
        </label>
        <label className="field">
          Starts (blank = immediately)
          <input type="date" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} className="input" />
        </label>
        <label className="field">
          Ends (blank = until paused)
          <input type="date" value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} className="input" />
        </label>
        <label className="field">
          Rotation weight
          <input type="number" min={1} value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: e.target.value })} className="input" />
        </label>
      </div>
      <StatusMessage tone="info" className="mt-1 text-sm text-muted">
        {uploading ? "Uploading…" : null}
      </StatusMessage>
      <button type="button" onClick={handleCreate} disabled={saving || uploading} className="btn-primary mt-3">
        {saving ? "Creating…" : "Create ad"}
      </button>

      <h2 className="mt-8 font-semibold text-foreground">Inventory</h2>
      <table className="admin-table mt-2">
        <thead>
          <tr>
            <th>Ad</th>
            <th>Slot</th>
            <th>Window</th>
            <th>Status</th>
            <th>Impr.</th>
            <th>Clicks</th>
            <th>CTR</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ads.map((ad) => (
            <tr key={ad.id}>
              <td>
                <span className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- R2 URLs are not in next/image's remotePatterns */}
                  <img src={ad.imageUrl} alt="" className="h-8 w-8 rounded border border-border object-cover" />
                  <span>
                    {ad.name}
                    <span className="block text-xs text-muted">{ad.advertiserName}</span>
                  </span>
                </span>
              </td>
              <td className="text-xs">
                {ad.slot}
                {!(PLACED_AD_SLOTS as string[]).includes(ad.slot) && (
                  <span className="badge-danger mt-1 block">not rendered</span>
                )}
              </td>
              <td className="text-xs text-muted">
                {ad.startsAt ? new Date(ad.startsAt).toLocaleDateString() : "—"} →{" "}
                {ad.endsAt ? new Date(ad.endsAt).toLocaleDateString() : "—"}
              </td>
              <td>
                {/* Named per row — a column of bare "Status" selects gives a
                    screen reader no way to tell which ad it is standing in. */}
                <select
                  value={ad.status}
                  onChange={(e) => handleStatus(ad.id, e.target.value)}
                  aria-label={`Status for ${ad.name}`}
                  className="input w-auto py-1 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>{ad.impressions}</td>
              <td>{ad.clicks}</td>
              <td>{ad.impressions > 0 ? `${((ad.clicks / ad.impressions) * 100).toFixed(1)}%` : "—"}</td>
              <td>
                <button type="button" onClick={() => handleDelete(ad.id)} className="btn-danger btn-sm">
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {ads.length === 0 && (
            <tr>
              <td colSpan={8} className="text-muted">No ads yet — every slot is currently collapsed.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
