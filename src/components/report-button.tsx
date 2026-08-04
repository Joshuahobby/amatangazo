"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { StatusMessage } from "@/components/status-message";

/**
 * `value` goes to the API, `labelKey` to the reader. Kept as pairs because the
 * API's reason vocabulary is lowercase and fixed, while the label is
 * translated — deriving one from the other would couple them.
 */
const REASONS = [
  { value: "spam", labelKey: "reportReasonSpam" },
  { value: "inappropriate", labelKey: "reportReasonInappropriate" },
  { value: "scam", labelKey: "reportReasonScam" },
  { value: "duplicate", labelKey: "reportReasonDuplicate" },
  { value: "other", labelKey: "reportReasonOther" },
] as const;

export function ReportButton({ listingId }: { listingId: string }) {
  const t = useTranslations("listing");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, reason, description: description || undefined }),
    });
    if (res.ok) {
      setDone(true);
    } else {
      // The API's own error text is English and internal, so it can't be shown
      // to a reader on fr/rw — this states what failed in their language.
      setError(t("reportFailed"));
    }
  }

  if (done)
    return (
      <StatusMessage tone="success" className="text-xs text-primary">
        {t("reportSubmitted")}
      </StatusMessage>
    );

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="btn-outline btn-sm text-xs">
        {t("report")}
      </button>
      {open && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-border bg-surface p-3 shadow-xl"
        >
          <p className="mb-2 text-xs font-medium text-foreground">{t("reportTitle")}</p>
          {/* aria-label rather than a visible <label>: this popover is 16rem
              wide with its own heading above, and both controls already show
              their purpose (the empty option, the placeholder). What was
              missing was only the programmatic name. */}
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            aria-label={t("reportSelectReason")}
            className="input mb-2 text-xs"
          >
            <option value="">{t("reportSelectReason")}</option>
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>{t(r.labelKey)}</option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("reportDetailsPlaceholder")}
            aria-label={t("reportDetailsPlaceholder")}
            rows={3}
            className="input mb-2 text-xs"
          />
          <StatusMessage tone="error" className="mb-2 text-xs text-danger">{error}</StatusMessage>
          <div className="flex gap-2">
            <button type="submit" className="btn-danger btn-sm flex-1">{tc("submit")}</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-outline btn-sm">{tc("cancel")}</button>
          </div>
        </form>
      )}
    </div>
  );
}
