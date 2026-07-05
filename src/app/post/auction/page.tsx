"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { BaseListingFields, initialBaseListingValue, type BaseListingValue } from "@/components/base-listing-fields";
import { PostResult } from "@/components/post-result";

type AuctionDetailsValue = {
  startingPrice: string;
  currency: string;
  auctionDate: string;
  auctionLocation: string;
  registrationContactPhone: string;
  registrationContactWhatsapp: string;
  registrationContactEmail: string;
};

const initialDetails: AuctionDetailsValue = {
  startingPrice: "",
  currency: "RWF",
  auctionDate: "",
  auctionLocation: "",
  registrationContactPhone: "",
  registrationContactWhatsapp: "",
  registrationContactEmail: "",
};

export default function PostAuctionPage() {
  const [base, setBase] = useState<BaseListingValue>(initialBaseListingValue);
  const [details, setDetails] = useState<AuctionDetailsValue>(initialDetails);
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
        category: "AUCTION",
        ...base,
        details: {
          startingPrice: details.startingPrice || undefined,
          currency: details.currency,
          auctionDate: details.auctionDate,
          auctionLocation: details.auctionLocation,
          registrationContactPhone: details.registrationContactPhone || undefined,
          registrationContactWhatsapp: details.registrationContactWhatsapp || undefined,
          registrationContactEmail: details.registrationContactEmail || undefined,
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

  if (listingId) return <PostResult listingId={listingId} category="AUCTION" />;

  return (
    <main className="page">
      <h1 className="page-title">{t("auctionTitle")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <BaseListingFields value={base} onChange={setBase} />

        <label className="field">
          Starting price (optional)
          <input
            name="startingPrice"
            type="number"
            min={0}
            value={details.startingPrice}
            onChange={(e) => setDetails({ ...details, startingPrice: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Currency
          <input
            name="currency"
            value={details.currency}
            onChange={(e) => setDetails({ ...details, currency: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Auction date &amp; time (drives the countdown)
          <input
            name="auctionDate"
            required
            type="datetime-local"
            value={details.auctionDate}
            onChange={(e) => setDetails({ ...details, auctionDate: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Auction location
          <input
            name="auctionLocation"
            required
            value={details.auctionLocation}
            onChange={(e) => setDetails({ ...details, auctionLocation: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Registration contact phone (optional)
          <input
            name="registrationContactPhone"
            value={details.registrationContactPhone}
            onChange={(e) => setDetails({ ...details, registrationContactPhone: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Registration contact WhatsApp (optional)
          <input
            name="registrationContactWhatsapp"
            value={details.registrationContactWhatsapp}
            onChange={(e) => setDetails({ ...details, registrationContactWhatsapp: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          Registration contact email (optional)
          <input
            name="registrationContactEmail"
            type="email"
            value={details.registrationContactEmail}
            onChange={(e) => setDetails({ ...details, registrationContactEmail: e.target.value })}
            className="input font-normal"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? t("posting") : t("submitAuction")}
        </button>
      </form>
    </main>
  );
}
