"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

type VerificationInfo = {
  status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  submittedAt: string | null;
  reviewedAt: string | null;
};

export default function VerificationPage() {
  const t = useTranslations("verification");
  const tc = useTranslations("common");
  const [info, setInfo] = useState<VerificationInfo | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState("");
  const [r2Unavailable, setR2Unavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/verification").then(async (res) => {
      if (res.status === 401) {
        setUnauthenticated(true);
        return;
      }
      setInfo(await res.json());
    });
  }, [reloadKey]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    let url = documentUrl;
    if (file && !r2Unavailable) {
      const presign = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, purpose: "verification-doc" }),
      });
      if (presign.status === 503) {
        // R2 not configured (T0.5) — fall back to the URL field.
        setR2Unavailable(true);
        setSubmitting(false);
        return;
      }
      if (!presign.ok) {
        setError(t("uploadFailed"));
        setSubmitting(false);
        return;
      }
      const { uploadUrl, publicUrl } = await presign.json();
      const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) {
        setError(t("uploadFailed"));
        setSubmitting(false);
        return;
      }
      url = publicUrl;
    }

    const res = await fetch("/api/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentUrl: url }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : t("submitFailed"));
      return;
    }
    setReloadKey((k) => k + 1);
  }

  if (unauthenticated) {
    return (
      <main className="page-sm">
        <p>
          <Link href="/login" className="link">
            {t("loginFirst")}
          </Link>
        </p>
      </main>
    );
  }
  if (!info) return <main className="page-sm text-muted">{tc("loading")}</main>;

  return (
    <main className="page-sm">
      <h1 className="page-title">{t("title")}</h1>

      {info.status === "VERIFIED" && <p className="mt-4 font-bold text-primary">✓ {t("statusVerified")}</p>}
      {info.status === "PENDING" && (
        <p className="mt-4 text-accent-hover">
          {t("statusPending")}
          {info.submittedAt && ` (${new Date(info.submittedAt).toLocaleDateString()})`}
        </p>
      )}
      {info.status === "REJECTED" && <p className="mt-4 text-danger">{t("statusRejected")}</p>}
      {info.status === "UNVERIFIED" && <p className="mt-4 text-foreground">{t("statusUnverified")}</p>}

      {(info.status === "UNVERIFIED" || info.status === "REJECTED") && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <p className="text-xs text-muted">{t("instructions")}</p>
          {!r2Unavailable && (
            <label className="field">
              {t("documentLabel")}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm font-normal text-muted"
              />
            </label>
          )}
          {(r2Unavailable || !file) && (
            <label className="field">
              {t("documentUrlLabel")}
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://..."
                className="input font-normal"
              />
            </label>
          )}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting || (!file && !documentUrl)} className="btn-primary">
            {submitting ? t("submitting") : t("submit")}
          </button>
        </form>
      )}
    </main>
  );
}
