"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { BaseListingFields, initialBaseListingValue, type BaseListingValue } from "@/components/base-listing-fields";
import { PostResult } from "@/components/post-result";

type ClassifiedDetailsValue = {
  subcategory: string;
  price: string;
};

const initialDetails: ClassifiedDetailsValue = {
  subcategory: "",
  price: "",
};

export default function PostClassifiedPage() {
  const [base, setBase] = useState<BaseListingValue>(initialBaseListingValue);
  const [details, setDetails] = useState<ClassifiedDetailsValue>(initialDetails);
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
        category: "CLASSIFIED",
        ...base,
        details: {
          subcategory: details.subcategory,
          price: details.price || undefined,
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

  if (listingId) return <PostResult listingId={listingId} category="CLASSIFIED" />;

  return (
    <main className="page">
      <h1 className="page-title">{t("classifiedTitle")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <BaseListingFields value={base} onChange={setBase} />

        <label className="field">
          Subcategory
          <input
            name="subcategory"
            required
            value={details.subcategory}
            onChange={(e) => setDetails({ ...details, subcategory: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Price (RWF, optional)
          <input
            name="price"
            type="number"
            min={0}
            value={details.price}
            onChange={(e) => setDetails({ ...details, price: e.target.value })}
            className="input font-normal"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? t("posting") : t("submitClassified")}
        </button>
      </form>
    </main>
  );
}
