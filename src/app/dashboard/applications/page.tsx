"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

type ApplicationItem = {
  id: string;
  status: string;
  createdAt: string;
  message: string | null;
  listing: { id: string; title: string; category: string };
};

/** Application.status is a plain String in the schema, so an unrecognised value
 *  falls back to the raw code rather than throwing a missing-key error. */
const STATUS_KEYS = ["PENDING", "CONTACTED", "REJECTED"] as const;

function statusLabel(t: ReturnType<typeof useTranslations<"dashboard">>, status: string) {
  return (STATUS_KEYS as readonly string[]).includes(status)
    ? t(`applicationStatus${status as (typeof STATUS_KEYS)[number]}`)
    : status;
}

export default function ApplicationsPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const tb = useTranslations("browse");
  const format = useFormatter();
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
      <h1 className="page-title">{t("applicationsTitle")}</h1>
      <Link href="/dashboard" className="link text-sm">&larr; {t("backToDashboard")}</Link>

      {loading && <p className="mt-4 text-muted">{tc("loading")}</p>}

      {!loading && applications.length === 0 && (
        <div className="mt-12 text-center">
          <p className="font-semibold text-foreground">{t("applicationsEmpty")}</p>
          <p className="mt-1 text-sm text-muted">{t("applicationsEmptyHint")}</p>
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {applications.map((a) => (
          <li key={a.id} className="card">
            <Link href={`/listings/${a.listing.id}`} className="font-semibold text-foreground hover:text-primary">
              {a.listing.title}
            </Link>
            <span className="ml-2 inline-flex gap-1.5 align-middle">
              <span className="badge-neutral">{tb(`category${a.listing.category}`)}</span>
            </span>
            <p className="mt-1 text-xs text-muted">
              {t("appliedOn", { date: format.dateTime(new Date(a.createdAt), { dateStyle: "medium" }) })}
              {" · "}
              {statusLabel(t, a.status)}
            </p>
            {a.message && <p className="mt-1 text-sm text-foreground">{a.message}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
