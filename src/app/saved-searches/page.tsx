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
      <main style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
        <p>
          <Link href="/login">{t("loginToSave")}</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>{t("title")}</h1>
      {searches === null && <p>...</p>}
      {searches?.length === 0 && <p>{t("empty")}</p>}
      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {searches?.map((search) => (
          <li key={search.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <strong>{search.category}</strong> · {search.channel}
            <p style={{ margin: "4px 0", color: "#666", fontSize: 13 }}>
              {Object.entries(search.filters)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ") || t("noFilters")}
            </p>
            <button type="button" onClick={() => handleDelete(search.id)} style={{ fontSize: 12 }}>
              {t("delete")}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
