"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ApplicationItem = {
  id: string;
  status: string;
  createdAt: string;
  message: string | null;
  listing: { id: string; title: string; category: string };
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applications").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications ?? []);
      }
      setLoading(false);
    });
  }, []);

  return (
    <main className="page">
      <h1 className="page-title">My Applications</h1>
      <Link href="/dashboard" className="link text-sm">&larr; Back to dashboard</Link>

      {loading && <p className="mt-4 text-muted">Loading...</p>}

      {!loading && applications.length === 0 && (
        <div className="mt-12 text-center">
          <p className="font-semibold text-foreground">No applications yet</p>
          <p className="mt-1 text-sm text-muted">Apply to jobs you&apos;re interested in.</p>
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {applications.map((a) => (
          <li key={a.id} className="card">
            <Link href={`/listings/${a.listing.id}`} className="font-semibold text-foreground hover:text-primary">
              {a.listing.title}
            </Link>
            <span className="ml-2 inline-flex gap-1.5 align-middle">
              <span className="badge-neutral">{a.listing.category}</span>
            </span>
            <p className="mt-1 text-xs text-muted">
              Applied {new Date(a.createdAt).toLocaleDateString()} · {a.status}
            </p>
            {a.message && <p className="mt-1 text-sm text-foreground">{a.message}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
