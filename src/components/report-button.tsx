"use client";

import { useState } from "react";

const REASONS = ["spam", "inappropriate", "scam", "duplicate", "other"] as const;

export function ReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, reason, description: description || undefined }),
    });
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to submit report");
    }
  }

  if (done) return <p className="text-xs text-primary">Report submitted. Thank you.</p>;

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="btn-outline btn-sm text-xs">
        Report
      </button>
      {open && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-border bg-surface p-3 shadow-xl"
        >
          <p className="mb-2 text-xs font-medium text-foreground">Why are you reporting this?</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="input mb-2 text-xs"
          >
            <option value="">Select a reason...</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details (optional)"
            rows={3}
            className="input mb-2 text-xs"
          />
          {error && <p className="mb-2 text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-danger btn-sm flex-1">Submit</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-outline btn-sm">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
