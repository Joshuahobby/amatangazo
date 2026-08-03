"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CategoryBadge, FeaturedBadge, StatusBadge } from "@/components/listing-badges";
import { SaveButton } from "@/components/save-button";

const STATUS_TABS = ["ALL", "LIVE", "DRAFT", "EXPIRED", "REMOVED", "SAVED"] as const;

type DashboardListing = {
  id: string;
  title: string;
  category: string;
  status: string;
  viewCount: number;
  applicationCount: number;
  isCurrentlyBoosted: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  favoritedAt?: string;
};

type Benchmarks = Record<string, { avgViews: number; avgApplications: number }>;

const PAGE_SIZE = 20;

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const format = useFormatter();
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmarks>({});
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [allLoaded, setAllLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (statusTab === "SAVED") {
      fetch("/api/favorites").then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) { setUnauthenticated(true); return; }
        const data = await res.json();
        setListings(data.favorites ?? []);
        setAllLoaded(true);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }

    const params = new URLSearchParams();
    if (statusTab !== "ALL") params.set("status", statusTab);
    params.set("limit", String(PAGE_SIZE));

    fetch(`/api/dashboard?${params.toString()}`).then(async (res) => {
      if (cancelled) return;
      if (res.status === 401) { setUnauthenticated(true); return; }
      const data = await res.json();
      setListings(data.listings);
      setBenchmarks(data.benchmarks);
      setAllLoaded(data.listings.length < PAGE_SIZE);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [statusTab]);

  const loadMore = async () => {
    const params = new URLSearchParams();
    if (statusTab !== "ALL") params.set("status", statusTab);
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(listings.length));
    const res = await fetch(`/api/dashboard?${params.toString()}`);
    if (res.status === 401) { setUnauthenticated(true); return; }
    const data = await res.json();
    setListings((prev) => [...prev, ...data.listings]);
    setAllLoaded(data.listings.length < PAGE_SIZE);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this listing?")) return;
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REMOVED" }),
    });
    if (res.ok) {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
  };

  if (unauthenticated) {
    return (
      <main className="page">
        <p>
          <Link href="/login" className="link">{t("loginFirst")}</Link>
        </p>
      </main>
    );
  }

  const isSavedTab = statusTab === "SAVED";

  return (
    <main className="page">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/applications" className="btn-outline btn-sm">{t("navApplications")}</Link>
          <Link href="/dashboard/billing" className="btn-outline btn-sm">{t("navBilling")}</Link>
          <Link href="/dashboard/profile" className="btn-outline btn-sm">{t("navSettings")}</Link>
          {!isSavedTab && <Link href="/post" className="btn-primary btn-sm">+ {t("newListing")}</Link>}
        </div>
      </div>

      <div className="mt-4 flex gap-1 border-b border-border pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusTab(tab)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusTab === tab
                ? "bg-primary text-primary-contrast"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab === "ALL" ? t("tabAll") : tab === "SAVED" ? t("tabSaved") : tc(`status${tab}`)}
          </button>
        ))}
      </div>

      {loading && <p className="mt-4 text-muted">{tc("loading")}</p>}

      {!loading && listings.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-muted">{isSavedTab ? t("savedEmpty") : t("empty")}</p>
          {!isSavedTab && <Link href="/post" className="btn-primary mt-4 inline-block">+ {t("newListing")}</Link>}
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {listings.map((listing) => {
          const bench = benchmarks[listing.category];
          return (
            <li key={listing.id} className="card flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Link href={`/listings/${listing.id}`} className="font-semibold text-foreground hover:text-primary">
                  {listing.title}
                </Link>
                <span className="ml-2 inline-flex flex-wrap items-center gap-1.5 align-middle">
                  <CategoryBadge category={listing.category} />
                  {!isSavedTab && <StatusBadge status={listing.status} />}
                  {listing.isCurrentlyBoosted && <FeaturedBadge />}
                </span>
                {isSavedTab && listing.favoritedAt && (
                  <p className="mt-1 text-xs text-muted">{t("savedOn", { date: format.dateTime(new Date(listing.favoritedAt), { dateStyle: "medium" }) })}</p>
                )}
                {!isSavedTab && (
                  <p className="mt-1.5 text-sm text-foreground">
                    {t("views")}: <strong>{listing.viewCount}</strong>
                    {bench && <span className="text-muted"> ({t("categoryAvg")}: {bench.avgViews})</span>}
                    {" · "}
                    {t("applications")}: <strong>{listing.applicationCount}</strong>
                    {bench && <span className="text-muted"> ({t("categoryAvg")}: {bench.avgApplications})</span>}
                  </p>
                )}
                {listing.status === "LIVE" && listing.expiresAt && (
                  <p className="mt-1 text-xs text-muted">
                    {t("expiresOn", { date: format.dateTime(new Date(listing.expiresAt), { dateStyle: "medium" }) })}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {isSavedTab ? (
                  <SaveButton listingId={listing.id} />
                ) : listing.status === "EXPIRED" ? (
                  <Link
                    href={`/checkout/${listing.id}`}
                    className="btn-primary btn-sm"
                  >
                    {t("renew")}
                  </Link>
                ) : (
                  <>
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border/50 hover:text-foreground"
                      aria-label={tc("edit")}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(listing.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-surface hover:text-danger"
                      aria-label={tc("remove")}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {!allLoaded && !loading && !isSavedTab && listings.length > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="btn-outline btn-lg"
          >
            {t("loadMore")}
          </button>
        </div>
      )}
    </main>
  );
}
