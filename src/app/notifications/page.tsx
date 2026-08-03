"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  channel: string;
  status: string;
  sentAt: string;
  listing: { id: string; title: string } | null;
  savedSearch: { id: string; category: string } | null;
};

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const format = useFormatter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
      setLoading(false);
    });
  }, []);

  return (
    <main className="page">
      <h1 className="page-title">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      {loading && <p className="mt-4 text-muted">{t("loading")}</p>}

      {!loading && notifications.length === 0 && (
        <div className="mt-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-border/40 text-muted">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="mt-4 font-semibold text-foreground">{t("empty")}</p>
          <p className="mt-1 text-sm text-muted">{t("emptyDesc")}</p>
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {notifications.map((n) => (
          <li key={n.id} className={`card flex items-start gap-3 p-3 ${n.status === "failed" ? "opacity-60" : ""}`}>
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.status === "sent" ? "bg-primary/10 text-primary" : "bg-danger-surface text-danger"}`}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                {n.status === "sent" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                )}
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                {n.status === "failed" ? t("failed") : t("sent")}
                {" via "}
                <span className="font-medium">{n.channel}</span>
                {n.listing && (
                  <>
                    {" — "}
                    <Link href={`/listings/${n.listing.id}`} className="link font-medium">
                      {n.listing.title}
                    </Link>
                  </>
                )}
                {n.savedSearch && (
                  <>
                    {" "}
                    <span className="text-xs text-muted">
                      ({n.savedSearch.category} search)
                    </span>
                  </>
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {format.dateTime(new Date(n.sentAt), { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
