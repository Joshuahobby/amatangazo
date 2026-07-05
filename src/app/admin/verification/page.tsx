"use client";

import { useEffect, useState } from "react";

type QueueEntry = {
  id: string;
  name: string | null;
  contact: string | null;
  accountType: string;
  documentUrl: string | null;
  submittedAt: string | null;
  isSubscriber: boolean;
  totalPaid: number;
  slaBreached: boolean;
};

export default function AdminVerificationPage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [slaBreachedCount, setSlaBreachedCount] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/admin/verification")
      .then((r) => r.json())
      .then((data) => {
        setQueue(data.queue);
        setSlaBreachedCount(data.slaBreachedCount);
      });
  }, [reloadKey]);

  async function review(userId: string, decision: "VERIFIED" | "REJECTED") {
    const reason = decision === "REJECTED" ? window.prompt("Rejection reason:") : undefined;
    if (decision === "REJECTED" && !reason) return;
    await fetch(`/api/admin/verification/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason: reason ?? undefined }),
    });
    setReloadKey((k) => k + 1);
  }

  return (
    <div>
      <h1 className="page-title">Verification queue</h1>
      <p className="page-subtitle">
        Pending: <strong className="text-foreground">{queue.length}</strong>
        {slaBreachedCount > 0 && <span className="ml-3 text-red-600">⚠ {slaBreachedCount} past the 48h SLA</span>}
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {queue.map((entry) => (
          <li key={entry.id} className={`card ${entry.slaBreached ? "border-2 border-red-400" : ""}`}>
            <span className="font-semibold text-foreground">{entry.name ?? entry.contact}</span>
            <span className="text-muted"> · {entry.accountType}</span>
            {entry.isSubscriber && <span className="badge bg-cat-tender/15 text-cat-tender ml-2">Subscriber</span>}
            {entry.slaBreached && <span className="badge bg-red-100 text-red-800 ml-2">SLA breached</span>}
            <p className="mt-1 text-sm text-muted">
              {entry.contact} · paid RWF {entry.totalPaid.toLocaleString()} · submitted{" "}
              {entry.submittedAt ? new Date(entry.submittedAt).toLocaleString() : "?"}
            </p>
            {entry.documentUrl && (
              <p className="mt-1 text-sm">
                <a href={entry.documentUrl} target="_blank" rel="noopener noreferrer" className="link">
                  View document
                </a>
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => review(entry.id, "VERIFIED")} className="btn-primary btn-sm">
                Approve
              </button>
              <button type="button" onClick={() => review(entry.id, "REJECTED")} className="btn-danger btn-sm">
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
