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
      <main style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>
        <p>
          <Link href="/login">{t("loginFirst")}</Link>
        </p>
      </main>
    );
  }
  if (!info) return <main style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>...</main>;

  return (
    <main style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>{t("title")}</h1>

      {info.status === "VERIFIED" && <p style={{ color: "green", fontWeight: "bold" }}>✓ {t("statusVerified")}</p>}
      {info.status === "PENDING" && (
        <p style={{ color: "#996600" }}>
          {t("statusPending")}
          {info.submittedAt && ` (${new Date(info.submittedAt).toLocaleDateString()})`}
        </p>
      )}
      {info.status === "REJECTED" && <p style={{ color: "red" }}>{t("statusRejected")}</p>}
      {info.status === "UNVERIFIED" && <p>{t("statusUnverified")}</p>}

      {(info.status === "UNVERIFIED" || info.status === "REJECTED") && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <p style={{ fontSize: 13, color: "#666" }}>{t("instructions")}</p>
          {!r2Unavailable && (
            <label>
              {t("documentLabel")}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ display: "block" }}
              />
            </label>
          )}
          {(r2Unavailable || !file) && (
            <label>
              {t("documentUrlLabel")}
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://..."
                style={{ display: "block", width: "100%" }}
              />
            </label>
          )}
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button type="submit" disabled={submitting || (!file && !documentUrl)}>
            {submitting ? "..." : t("submit")}
          </button>
        </form>
      )}
    </main>
  );
}
