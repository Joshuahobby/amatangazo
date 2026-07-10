"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Report = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  reporter: { name: string };
  listing: { id: string; title: string };
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("PENDING");

  const load = useCallback(() => {
    fetch(`/api/admin/reports?status=${filter}`)
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []));
  }, [filter]);

  useEffect(load, [load]);

  async function dismiss(id: string) {
    await fetch(`/api/admin/reports`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "DISMISSED" }),
    });
    load();
  }

  return (
    <div>
      <h1 className="page-title">User Reports</h1>

      <div className="mt-4 flex gap-2">
        {["PENDING", "DISMISSED", "ACTIONED"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={filter === f ? "btn-primary btn-sm" : "btn-outline btn-sm"}
          >
            {f}
          </button>
        ))}
      </div>

      {reports.length === 0 && <p className="mt-4 text-sm text-muted">No reports.</p>}

      <ul className="mt-4 flex flex-col gap-3">
        {reports.map((r) => (
          <li key={r.id} className="card">
            <div className="flex flex-wrap items-baseline gap-2">
              <Link href={`/listings/${r.listing.id}`} className="font-semibold text-foreground hover:text-primary">
                {r.listing.title}
              </Link>
              <span className="badge-neutral">{r.reason}</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Reported by {r.reporter.name} · {new Date(r.createdAt).toLocaleString()}
            </p>
            {r.description && <p className="mt-1 text-sm text-foreground">{r.description}</p>}
            {filter === "PENDING" && (
              <button type="button" onClick={() => dismiss(r.id)} className="btn-outline btn-sm mt-2">
                Dismiss
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
