"use client";

import { useState } from "react";

export function ApplyButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, message: message || undefined }),
    });
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to apply");
    }
  }

  if (done) return <p className="text-sm text-primary font-medium">Application submitted!</p>;

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="btn-primary btn-sm">
        Apply now
      </button>
      {open && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-border bg-surface p-3 shadow-xl"
        >
          <p className="mb-2 text-xs font-medium text-foreground">Send your application</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Brief message or cover note (optional)"
            rows={3}
            className="input mb-2 text-xs"
          />
          {error && <p className="mb-2 text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary btn-sm flex-1">Send</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-outline btn-sm">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
