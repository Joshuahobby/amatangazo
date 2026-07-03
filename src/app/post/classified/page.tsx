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
    <main style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>{t("classifiedTitle")}</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <BaseListingFields value={base} onChange={setBase} />

        <label>
          Subcategory
          <input
            name="subcategory"
            required
            value={details.subcategory}
            onChange={(e) => setDetails({ ...details, subcategory: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Price (RWF, optional)
          <input
            name="price"
            type="number"
            min={0}
            value={details.price}
            onChange={(e) => setDetails({ ...details, price: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? t("posting") : t("submitClassified")}
        </button>
      </form>
    </main>
  );
}
