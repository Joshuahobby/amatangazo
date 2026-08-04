"use client";

import { useTranslations } from "next-intl";

import { StatusMessage } from "@/components/status-message";
import { describeApiError } from "@/lib/api-error";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProfileSettingsPage() {
  const t = useTranslations("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    fetch("/api/user").then(async (res) => {
      if (res.status === 401) return;
      const data = await res.json();
      const u = data.user;
      setName(u.name ?? "");
      setBusinessName(u.businessName ?? "");
      setEmail(u.email ?? "");
      setPhoneNumber(u.phoneNumber ?? "");
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, businessName, email, phoneNumber }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(describeApiError(data.error, t("saveFailed")));
      return;
    }
    setSaved(true);
  }

  if (loading) {
    return (
      <main className="page">
        <div className="skeleton h-8 w-48" />
        <div className="mt-6 flex flex-col gap-4">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <h1 className="page-title">{t("title")}</h1>
      <Link href="/dashboard" className="link text-sm">&larr; {t("backToDashboard")}</Link>

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-lg flex-col gap-4">
        <label className="field">
          {t("name")}
          <input
            name="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input font-normal"
          />
        </label>

        <label className="field">
          {t("businessName")}
          <input
            name="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="input font-normal"
            placeholder={t("businessNamePlaceholder")}
          />
        </label>

        <label className="field">
          {t("email")}
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input font-normal"
          />
        </label>

        <label className="field">
          {t("phoneNumber")}
          <input
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="input font-normal"
          />
        </label>

        <StatusMessage tone="error">{error}</StatusMessage>
        <StatusMessage tone="success">{saved ? t("saved") : null}</StatusMessage>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? t("saving") : t("save")}
        </button>
      </form>

      <div className="mt-8 border-t border-border pt-6">
        <h2 className="font-semibold text-foreground">{t("verificationTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("verificationDesc")}</p>
        <Link href="/verification" className="btn-outline btn-sm mt-3 inline-block">
          {t("verificationLink")}
        </Link>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <h2 className="font-semibold text-danger">{t("dangerZone")}</h2>
        <p className="mt-1 text-sm text-muted">{t("dangerZoneDesc")}</p>
        <button
          type="button"
          onClick={async () => {
            if (!confirm(t("deleteConfirm1"))) return;
            if (!confirm(t("deleteConfirm2"))) return;
            const res = await fetch("/api/account", { method: "DELETE" });
            if (res.ok) window.location.href = "/";
          }}
          className="btn-danger btn-sm mt-3"
        >
          {t("deleteAccount")}
        </button>
      </div>
    </main>
  );
}
