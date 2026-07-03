"use client";

import { useEffect, useState } from "react";

type LogEntry = {
  id: string;
  channel: string;
  status: string;
  sentAt: string;
  user: { name: string | null; email: string | null; phoneNumber: string | null };
  listing: { title: string } | null;
};

type DigestResult = {
  searchesChecked: number;
  searchesMatched: number;
  notificationsSent: number;
  notificationsFailed: number;
};

export default function AdminNotificationsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [savedSearchCount, setSavedSearchCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<DigestResult | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs);
        setSavedSearchCount(data.savedSearchCount);
      });
  }, [reloadKey]);

  async function runDigest() {
    setRunning(true);
    const data = await fetch("/api/admin/notifications/digest", { method: "POST" }).then((r) => r.json());
    setLastRun(data.result);
    setRunning(false);
    setReloadKey((k) => k + 1);
  }

  return (
    <div>
      <h1>Notifications</h1>
      <p>
        Saved searches: <strong>{savedSearchCount}</strong>
      </p>
      <button type="button" onClick={runDigest} disabled={running}>
        {running ? "Running digest..." : "Run digest now"}
      </button>
      {lastRun && (
        <p style={{ fontSize: 13, color: "#666" }}>
          Checked {lastRun.searchesChecked} searches · {lastRun.searchesMatched} matched · {lastRun.notificationsSent}{" "}
          sent · {lastRun.notificationsFailed} failed
        </p>
      )}

      <h2 style={{ marginTop: 24 }}>Recent notifications</h2>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th style={{ padding: 4 }}>Sent</th>
            <th style={{ padding: 4 }}>User</th>
            <th style={{ padding: 4 }}>Channel</th>
            <th style={{ padding: 4 }}>Listing</th>
            <th style={{ padding: 4 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 4 }}>{new Date(log.sentAt).toLocaleString()}</td>
              <td style={{ padding: 4 }}>{log.user.name ?? log.user.email ?? log.user.phoneNumber}</td>
              <td style={{ padding: 4 }}>{log.channel}</td>
              <td style={{ padding: 4 }}>{log.listing?.title?.slice(0, 50) ?? "—"}</td>
              <td style={{ padding: 4, color: log.status === "sent" ? "green" : "red" }}>{log.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
