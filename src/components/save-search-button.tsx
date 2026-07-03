"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import type { SavedSearchFilters } from "@/lib/notifications";

const channels = ["WHATSAPP", "SMS", "EMAIL"] as const;

export function SaveSearchButton({ category, filters }: { category: string; filters: SavedSearchFilters }) {
  const t = useTranslations("savedSearches");
  const [channel, setChannel] = useState<(typeof channels)[number]>("WHATSAPP");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "unauthenticated" | "error">("idle");

  async function handleSave() {
    setState("saving");
    const cleaned = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const res = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, channel, filters: cleaned }),
    });
    if (res.status === 401) {
      setState("unauthenticated");
      return;
    }
    setState(res.ok ? "saved" : "error");
  }

  if (state === "saved") {
    return (
      <p style={{ fontSize: 13 }}>
        {t("saved")} <Link href="/saved-searches">{t("manageLink")}</Link>
      </p>
    );
  }
  if (state === "unauthenticated") {
    return (
      <p style={{ fontSize: 13 }}>
        <Link href="/login">{t("loginToSave")}</Link>
      </p>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", fontSize: 13 }}>
      <select value={channel} onChange={(e) => setChannel(e.target.value as (typeof channels)[number])}>
        {channels.map((c) => (
          <option key={c} value={c}>
            {t(`channel${c}`)}
          </option>
        ))}
      </select>
      <button type="button" onClick={handleSave} disabled={state === "saving"}>
        {t("save")}
      </button>
      {state === "error" && <span style={{ color: "red" }}>{t("error")}</span>}
    </span>
  );
}
