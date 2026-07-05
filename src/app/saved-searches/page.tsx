"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

type SavedSearch = {
  id: string;
  category: string;
  channel: string;
  filters: Record<string, string>;
  createdAt: string;
  lastNotifiedAt: string | null;
};

export default function SavedSearchesPage() {
  const t = useTranslations("savedSearches");
  const [searches, setSearches] = useState<SavedSearch[] | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/saved-searches").then(async (res) => {
      if (res.status === 401) {
        setUnauthenticated(true);
        return;
      }
      const data = await res.json();
      setSearches(data.savedSearches);
    });
  }, [reloadKey]);

  async function handleDelete(id: string) {
    await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
    setReloadKey((k) => k + 1);
  }

  if (unauthenticated) {
    return (
      <main className="page max-w-xl">
        <p>
          <Link href="/login" className="link">
            {t("loginToSave")}
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="page max-w-xl">
      <h1 className="page-title">{t("title")}</h1>
      {searches === null && <p className="mt-4 text-muted">...</p>}
      {searches?.length === 0 && <p className="mt-4 text-muted">{t("empty")}</p>}
      <ul className="mt-4 flex flex-col gap-3">
        {searches?.map((search) => (
          <li key={search.id} className="card">
            <span className="font-semibold text-foreground">{search.category}</span>
            <span className="text-muted"> · {search.channel}</span>
            <p className="mt-1 text-sm text-muted">
              {Object.entries(search.filters)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ") || t("noFilters")}
            </p>
            <button type="button" onClick={() => handleDelete(search.id)} className="btn-danger btn-sm mt-2">
              {t("delete")}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
