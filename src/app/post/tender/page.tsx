"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { BaseListingFields, initialBaseListingValue, type BaseListingValue } from "@/components/base-listing-fields";
import { PostResult } from "@/components/post-result";

type TenderDetailsValue = {
  sector: string;
  budgetMin: string;
  budgetMax: string;
  submissionDeadline: string;
  eligibilitySummary: string;
  requiredDocuments: string;
  documentUrl: string;
};

const initialDetails: TenderDetailsValue = {
  sector: "",
  budgetMin: "",
  budgetMax: "",
  submissionDeadline: "",
  eligibilitySummary: "",
  requiredDocuments: "",
  documentUrl: "",
};

export default function PostTenderPage() {
  const [base, setBase] = useState<BaseListingValue>(initialBaseListingValue);
  const [details, setDetails] = useState<TenderDetailsValue>(initialDetails);
  const [error, setError] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslations("post");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "TENDER",
        ...base,
        details: {
          sector: details.sector,
          budgetMin: details.budgetMin || undefined,
          budgetMax: details.budgetMax || undefined,
          submissionDeadline: details.submissionDeadline,
          eligibilitySummary: details.eligibilitySummary || undefined,
          requiredDocuments: details.requiredDocuments || undefined,
          documentUrl: details.documentUrl || undefined,
        },
      }),
    });

    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setError(JSON.stringify(data.error));
      return;
    }
    setListingId(data.listing.id);
  }

  if (listingId) return <PostResult listingId={listingId} category="TENDER" />;

  return (
    <main className="page">
      <h1 className="page-title">{t("tenderTitle")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <BaseListingFields value={base} onChange={setBase} />

        <label className="field">
          Sector
          <input
            name="sector"
            required
            value={details.sector}
            onChange={(e) => setDetails({ ...details, sector: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Budget min (RWF, optional)
          <input
            name="budgetMin"
            type="number"
            min={0}
            value={details.budgetMin}
            onChange={(e) => setDetails({ ...details, budgetMin: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Budget max (RWF, optional)
          <input
            name="budgetMax"
            type="number"
            min={0}
            value={details.budgetMax}
            onChange={(e) => setDetails({ ...details, budgetMax: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Submission deadline
          <input
            name="submissionDeadline"
            required
            type="date"
            value={details.submissionDeadline}
            onChange={(e) => setDetails({ ...details, submissionDeadline: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Eligibility summary (optional)
          <textarea
            name="eligibilitySummary"
            rows={3}
            value={details.eligibilitySummary}
            onChange={(e) => setDetails({ ...details, eligibilitySummary: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Required documents (optional)
          <textarea
            name="requiredDocuments"
            rows={3}
            value={details.requiredDocuments}
            onChange={(e) => setDetails({ ...details, requiredDocuments: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Tender document URL (optional — R2 upload lands in T1.9)
          <input
            name="documentUrl"
            type="url"
            value={details.documentUrl}
            onChange={(e) => setDetails({ ...details, documentUrl: e.target.value })}
            className="input font-normal"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? t("posting") : t("submitTender")}
        </button>
      </form>
    </main>
  );
}
