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
      <p className="text-sm text-muted">
        {t("saved")}{" "}
        <Link href="/saved-searches" className="link">
          {t("manageLink")}
        </Link>
      </p>
    );
  }
  if (state === "unauthenticated") {
    return (
      <p className="text-sm">
        <Link href="/login" className="link">
          {t("loginToSave")}
        </Link>
      </p>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <select
        value={channel}
        onChange={(e) => setChannel(e.target.value as (typeof channels)[number])}
        aria-label={t("channelLabel")}
        className="input w-auto py-1"
      >
        {channels.map((c) => (
          <option key={c} value={c}>
            {t(`channel${c}`)}
          </option>
        ))}
      </select>
      <button type="button" onClick={handleSave} disabled={state === "saving"} className="btn-outline btn-sm">
        {t("save")}
      </button>
      {state === "error" && <span className="text-danger">{t("error")}</span>}
    </span>
  );
}
