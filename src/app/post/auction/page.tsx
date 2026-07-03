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
    <main style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>{t("auctionTitle")}</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <BaseListingFields value={base} onChange={setBase} />

        <label>
          Starting price (optional)
          <input
            name="startingPrice"
            type="number"
            min={0}
            value={details.startingPrice}
            onChange={(e) => setDetails({ ...details, startingPrice: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Currency
          <input
            name="currency"
            value={details.currency}
            onChange={(e) => setDetails({ ...details, currency: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Auction date &amp; time (drives the countdown)
          <input
            name="auctionDate"
            required
            type="datetime-local"
            value={details.auctionDate}
            onChange={(e) => setDetails({ ...details, auctionDate: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Auction location
          <input
            name="auctionLocation"
            required
            value={details.auctionLocation}
            onChange={(e) => setDetails({ ...details, auctionLocation: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Registration contact phone (optional)
          <input
            name="registrationContactPhone"
            value={details.registrationContactPhone}
            onChange={(e) => setDetails({ ...details, registrationContactPhone: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Registration contact WhatsApp (optional)
          <input
            name="registrationContactWhatsapp"
            value={details.registrationContactWhatsapp}
            onChange={(e) => setDetails({ ...details, registrationContactWhatsapp: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Registration contact email (optional)
          <input
            name="registrationContactEmail"
            type="email"
            value={details.registrationContactEmail}
            onChange={(e) => setDetails({ ...details, registrationContactEmail: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? t("posting") : t("submitAuction")}
        </button>
      </form>
    </main>
  );
}
