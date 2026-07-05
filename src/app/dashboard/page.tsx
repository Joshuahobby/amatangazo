"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardListing = {
  id: string;
  title: string;
  category: string;
  status: string;
  viewCount: number;
  applicationCount: number;
  isCurrentlyBoosted: boolean;
  publishedAt: string | null;
};

type Benchmarks = Record<string, { avgViews: number; avgApplications: number }>;

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [listings, setListings] = useState<DashboardListing[] | null>(null);
  const [benchmarks, setBenchmarks] = useState<Benchmarks>({});
  const [unauthenticated, setUnauthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard").then(async (res) => {
      if (res.status === 401) {
        setUnauthenticated(true);
        return;
      }
      const data = await res.json();
      setListings(data.listings);
      setBenchmarks(data.benchmarks);
    });
  }, []);

  if (unauthenticated) {
    return (
      <main className="page max-w-3xl">
        <p>
          <Link href="/login" className="link">
            {t("loginFirst")}
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="page max-w-3xl">
      <h1 className="page-title">{t("title")}</h1>
      {listings === null && <p className="mt-4 text-muted">...</p>}
      {listings?.length === 0 && <p className="mt-4 text-muted">{t("empty")}</p>}

      <ul className="mt-4 flex flex-col gap-3">
        {listings?.map((listing) => {
          const bench = benchmarks[listing.category];
          return (
            <li key={listing.id} className="card">
              <Link href={`/listings/${listing.id}`} className="font-semibold text-foreground hover:text-primary">
                {listing.title}
              </Link>
              <span className="ml-2 text-xs text-muted">
                {listing.category} · {listing.status}
                {listing.isCurrentlyBoosted && " · ★"}
              </span>
              <p className="mt-1.5 text-sm text-foreground">
                {t("views")}: <strong>{listing.viewCount}</strong>
                {bench && <span className="text-muted"> ({t("categoryAvg")}: {bench.avgViews})</span>}
                {" · "}
                {t("applications")}: <strong>{listing.applicationCount}</strong>
                {bench && <span className="text-muted"> ({t("categoryAvg")}: {bench.avgApplications})</span>}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
