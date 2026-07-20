"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { BaseListingFields, initialBaseListingValue, type BaseListingValue } from "@/components/base-listing-fields";
import { formatListingFormErrors } from "@/lib/listing-form-error";
import { PostResult } from "@/components/post-result";

type ClassifiedDetailsValue = {
  subcategory: string;
  price: string;
  contactPhone: string;
  contactWhatsapp: string;
};

const initialDetails: ClassifiedDetailsValue = {
  subcategory: "",
  price: "",
  contactPhone: "",
  contactWhatsapp: "",
};

export default function PostClassifiedPage() {
  const [base, setBase] = useState<BaseListingValue>(initialBaseListingValue);
  const [details, setDetails] = useState<ClassifiedDetailsValue>(initialDetails);
  const [errors, setErrors] = useState<string[]>([]);
  const [listingId, setListingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslations("post");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "CLASSIFIED",
        ...base,
        details: {
          subcategory: details.subcategory,
          price: details.price || undefined,
          contactPhone: details.contactPhone || undefined,
          contactWhatsapp: details.contactWhatsapp || undefined,
        },
      }),
    });

    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setErrors(formatListingFormErrors(data, t));
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
          {t("fieldSubcategory")}
          <input
            name="subcategory"
            required
            value={details.subcategory}
            onChange={(e) => setDetails({ ...details, subcategory: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          {t("fieldPrice")}
          <input
            name="price"
            type="number"
            min={0}
            value={details.price}
            onChange={(e) => setDetails({ ...details, price: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          {t("fieldContactPhone")}
          <input
            name="contactPhone"
            type="tel"
            inputMode="tel"
            value={details.contactPhone}
            onChange={(e) => setDetails({ ...details, contactPhone: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          {t("fieldContactWhatsapp")}
          <input
            name="contactWhatsapp"
            type="tel"
            inputMode="tel"
            value={details.contactWhatsapp}
            onChange={(e) => setDetails({ ...details, contactWhatsapp: e.target.value })}
            className="input font-normal"
          />
        </label>

        {errors.length > 0 && (
          <ul className="list-disc pl-4 form-error">
            {errors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        )}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? t("posting") : t("submitClassified")}
        </button>
      </form>
    </main>
  );
}
