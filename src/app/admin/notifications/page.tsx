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
      <h1 className="page-title">Notifications</h1>
      <p className="page-subtitle">
        Saved searches: <strong className="text-foreground">{savedSearchCount}</strong>
      </p>
      <button type="button" onClick={runDigest} disabled={running} className="btn-primary btn-sm mt-3">
        {running ? "Running digest..." : "Run digest now"}
      </button>
      {lastRun && (
        <p className="mt-2 text-sm text-muted">
          Checked {lastRun.searchesChecked} searches · {lastRun.searchesMatched} matched · {lastRun.notificationsSent}{" "}
          sent · {lastRun.notificationsFailed} failed
        </p>
      )}

      <h2 className="mt-6 text-sm font-semibold text-muted">Recent notifications</h2>
      <table className="admin-table mt-2">
        <thead>
          <tr>
            <th>Sent</th>
            <th>User</th>
            <th>Channel</th>
            <th>Listing</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.sentAt).toLocaleString()}</td>
              <td>{log.user.name ?? log.user.email ?? log.user.phoneNumber}</td>
              <td>{log.channel}</td>
              <td>{log.listing?.title?.slice(0, 50) ?? "—"}</td>
              <td className={log.status === "sent" ? "text-primary" : "text-danger"}>{log.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
