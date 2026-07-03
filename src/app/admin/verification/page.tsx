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
      <h1>Verification queue</h1>
      <p>
        Pending: <strong>{queue.length}</strong>
        {slaBreachedCount > 0 && (
          <span style={{ color: "red", marginLeft: 12 }}>⚠ {slaBreachedCount} past the 48h SLA</span>
        )}
      </p>

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {queue.map((entry) => (
          <li
            key={entry.id}
            style={{
              border: entry.slaBreached ? "2px solid #d33" : "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <strong>{entry.name ?? entry.contact}</strong> · {entry.accountType}
            {entry.isSubscriber && (
              <span style={{ marginLeft: 8, background: "#e6f0ff", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
                Subscriber
              </span>
            )}
            {entry.slaBreached && (
              <span style={{ marginLeft: 8, background: "#fdd", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
                SLA breached
              </span>
            )}
            <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>
              {entry.contact} · paid RWF {entry.totalPaid.toLocaleString()} · submitted{" "}
              {entry.submittedAt ? new Date(entry.submittedAt).toLocaleString() : "?"}
            </p>
            {entry.documentUrl && (
              <p style={{ margin: "4px 0", fontSize: 13 }}>
                <a href={entry.documentUrl} target="_blank" rel="noopener noreferrer">
                  View document
                </a>
              </p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" onClick={() => review(entry.id, "VERIFIED")}>
                Approve
              </button>
              <button type="button" onClick={() => review(entry.id, "REJECTED")}>
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
