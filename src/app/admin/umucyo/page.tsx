"use client";

import { useEffect, useState } from "react";

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
      <h1>Umucyo tender mirror</h1>
      <p style={{ color: "#666" }}>
        {mirroredCount} government tenders mirrored. Runs are rate-limited and logged below — a run that finds zero
        tenders is recorded as a failure, since that usually means the source markup changed.
      </p>

      <button type="button" onClick={handleRun} disabled={running} style={{ marginBottom: 12 }}>
        {running ? "Running..." : "Run scrape now"}
      </button>
      {message && <p>{message}</p>}

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>Run at</th>
            <th style={{ textAlign: "left", padding: 8 }}>Status</th>
            <th style={{ textAlign: "left", padding: 8 }}>Found</th>
            <th style={{ textAlign: "left", padding: 8 }}>Created</th>
            <th style={{ textAlign: "left", padding: 8 }}>Error</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td style={{ padding: 8 }}>{new Date(log.runAt).toLocaleString()}</td>
              <td style={{ padding: 8 }}>{log.status}</td>
              <td style={{ padding: 8 }}>{log.tendersFound}</td>
              <td style={{ padding: 8 }}>{log.tendersCreated}</td>
              <td style={{ padding: 8, maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis" }}>
                {log.errorMessage ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
