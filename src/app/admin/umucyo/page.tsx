"use client";

import { useEffect, useState } from "react";

import { StatusMessage } from "@/components/status-message";

type ScrapeLog = {
  id: string;
  runAt: string;
  status: "SUCCESS" | "PARTIAL_FAILURE" | "FAILURE";
  tendersFound: number;
  tendersCreated: number;
  errorMessage: string | null;
};

export default function AdminUmucyoPage() {
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [mirroredCount, setMirroredCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/umucyo")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs ?? []);
        setMirroredCount(data.mirroredCount ?? 0);
      });
  }

  useEffect(load, []);

  async function handleRun() {
    setRunning(true);
    setMessage("Scraping umucyo.gov.rw — rate-limited, this takes a minute...");
    const res = await fetch("/api/admin/umucyo/scrape", { method: "POST" });
    const data = await res.json();
    setRunning(false);
    setMessage(
      res.ok
        ? `${data.status}: found ${data.tendersFound}, created ${data.tendersCreated}${data.errorMessage ? ` — ${data.errorMessage}` : ""}`
        : `Failed: ${data.error ?? "unknown error"}`,
    );
    load();
  }

  return (
    <div>
      <h1 className="page-title">Umucyo tender mirror</h1>
      <p className="page-subtitle">
        {mirroredCount} government tenders mirrored. Runs are rate-limited and logged below — a run that finds zero
        tenders is recorded as a failure, since that usually means the source markup changed.
      </p>

      <button type="button" onClick={handleRun} disabled={running} className="btn-primary btn-sm mt-4">
        {running ? "Running..." : "Run scrape now"}
      </button>
      <StatusMessage tone="info" className="mt-2 text-sm text-muted">{message}</StatusMessage>

      <table className="admin-table mt-4">
        <thead>
          <tr>
            <th>Run at</th>
            <th>Status</th>
            <th>Found</th>
            <th>Created</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.runAt).toLocaleString()}</td>
              <td>{log.status}</td>
              <td>{log.tendersFound}</td>
              <td>{log.tendersCreated}</td>
              <td className="max-w-xs truncate">{log.errorMessage ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
