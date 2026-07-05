"use client";

import { useEffect, useState } from "react";

export default function AdminTenderSummariesPage() {
  const [missing, setMissing] = useState<number | null>(null);
  const [done, setDone] = useState(0);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<{ processed: number; remaining: number } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/admin/tender-summaries")
      .then((r) => r.json())
      .then((data) => {
        setMissing(data.missing);
        setDone(data.done);
      });
  }, [reloadKey]);

  async function runBatch() {
    setRunning(true);
    const data = await fetch("/api/admin/tender-summaries", { method: "POST" }).then((r) => r.json());
    setLastRun(data.result);
    setRunning(false);
    setReloadKey((k) => k + 1);
  }

  return (
    <div>
      <h1 className="page-title">AI Tender Summaries</h1>
      <p className="page-subtitle">
        Summarized: <strong className="text-foreground">{done}</strong> · Missing:{" "}
        <strong className="text-foreground">{missing ?? "..."}</strong>
      </p>
      <button type="button" onClick={runBatch} disabled={running || missing === 0} className="btn-primary btn-sm mt-3">
        {running ? "Summarizing..." : "Summarize next 10"}
      </button>
      {lastRun && (
        <p className="mt-2 text-sm text-muted">
          Processed {lastRun.processed} · {lastRun.remaining} remaining
        </p>
      )}
    </div>
  );
}
