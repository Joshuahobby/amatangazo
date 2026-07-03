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
      <main style={{ maxWidth: 700, margin: "2rem auto", fontFamily: "sans-serif" }}>
        <p>
          <Link href="/login">{t("loginFirst")}</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 700, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>{t("title")}</h1>
      {listings === null && <p>...</p>}
      {listings?.length === 0 && <p>{t("empty")}</p>}

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {listings?.map((listing) => {
          const bench = benchmarks[listing.category];
          return (
            <li key={listing.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <Link href={`/listings/${listing.id}`} style={{ fontWeight: "bold" }}>
                {listing.title}
              </Link>
              <span style={{ marginLeft: 8, fontSize: 12, color: "#666" }}>
                {listing.category} · {listing.status}
                {listing.isCurrentlyBoosted && " · ★"}
              </span>
              <p style={{ margin: "6px 0 0", fontSize: 14 }}>
                {t("views")}: <strong>{listing.viewCount}</strong>
                {bench && (
                  <span style={{ color: "#666" }}>
                    {" "}
                    ({t("categoryAvg")}: {bench.avgViews})
                  </span>
                )}
                {" · "}
                {t("applications")}: <strong>{listing.applicationCount}</strong>
                {bench && (
                  <span style={{ color: "#666" }}>
                    {" "}
                    ({t("categoryAvg")}: {bench.avgApplications})
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
