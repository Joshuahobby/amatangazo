"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BaseListingFields, initialBaseListingValue, type BaseListingValue } from "@/components/base-listing-fields";
import { formatListingFormErrors } from "@/lib/listing-form-error";
import { applicationMethods, experienceLevels } from "@/lib/validations/listing";

type ListingData = {
  id: string;
  title: string;
  description: string;
  location: string;
  language: string;
  category: string;
  status: string;
  posterId: string;
  jobDetails: Record<string, unknown> | null;
  tenderDetails: Record<string, unknown> | null;
  auctionDetails: Record<string, unknown> | null;
  classifiedDetails: Record<string, unknown> | null;
};

function datePart(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.split("T")[0] ?? "";
}

function datetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("post");
  const tc = useTranslations("common");

  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [base, setBase] = useState<BaseListingValue>(initialBaseListingValue);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}`).then(async (res) => {
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (res.status === 401) { setNotFound(true); setLoading(false); return; }
      const data = await res.json();
      const l = data.listing as ListingData;
      setListing(l);
      setBase({
        title: l.title,
        description: l.description,
        location: l.location,
        language: l.language as BaseListingValue["language"],
      });
      const det = l.jobDetails ?? l.tenderDetails ?? l.auctionDetails ?? l.classifiedDetails ?? {};
      setDetails(
        Object.fromEntries(
          Object.entries(det as Record<string, unknown>).map(([k, v]) => [
            k,
            v instanceof Date ? v.toISOString() : String(v ?? ""),
          ]),
        ),
      );
      setLoading(false);
    }).catch(() => {
      // Nothing here cleared `loading`, so a dropped connection left the page
      // showing its skeletons forever with no way forward.
      setNotFound(true);
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);

    const body: Record<string, unknown> = { ...base };
    if (listing) {
      const isJob = listing.category === "JOB";
      const isTender = listing.category === "TENDER";
      const isAuction = listing.category === "AUCTION";

      const d: Record<string, unknown> = {};
      if (isJob) {
        d.sector = details.sector;
        d.experienceLevel = details.experienceLevel;
        d.applicationDeadline = details.applicationDeadline;
        d.applicationMethod = details.applicationMethod;
        if (details.applicationUrl) d.applicationUrl = details.applicationUrl;
        if (details.applicationEmail) d.applicationEmail = details.applicationEmail;
        if (details.salaryRangeMin) d.salaryRangeMin = Number(details.salaryRangeMin);
        if (details.salaryRangeMax) d.salaryRangeMax = Number(details.salaryRangeMax);
      } else if (isTender) {
        d.sector = details.sector;
        if (details.budgetMin) d.budgetMin = Number(details.budgetMin);
        if (details.budgetMax) d.budgetMax = Number(details.budgetMax);
        d.submissionDeadline = details.submissionDeadline;
        if (details.eligibilitySummary) d.eligibilitySummary = details.eligibilitySummary;
        if (details.requiredDocuments) d.requiredDocuments = details.requiredDocuments;
        if (details.documentUrl) d.documentUrl = details.documentUrl;
      } else if (isAuction) {
        if (details.startingPrice) d.startingPrice = Number(details.startingPrice);
        d.currency = details.currency;
        d.auctionDate = details.auctionDate;
        d.auctionLocation = details.auctionLocation;
        if (details.registrationContactPhone) d.registrationContactPhone = details.registrationContactPhone;
        if (details.registrationContactWhatsapp) d.registrationContactWhatsapp = details.registrationContactWhatsapp;
        if (details.registrationContactEmail) d.registrationContactEmail = details.registrationContactEmail;
      } else {
        d.subcategory = details.subcategory;
        if (details.price) d.price = Number(details.price);
      }
      body.details = d;
    }

    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);
    if (!res.ok) {
      // Not every rejection is a validation failure — a 502 answers with HTML,
      // and parsing it unguarded threw instead of showing the poster anything.
      const data = await res.json().catch(() => ({}));
      setErrors(formatListingFormErrors(data, t));
      return;
    }

    router.push(`/listings/${id}`);
  }

  if (loading) {
    return (
      <main className="page">
        <div className="skeleton h-8 w-48" />
        <div className="mt-6 flex flex-col gap-4">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-32" />
        </div>
      </main>
    );
  }

  if (notFound || !listing) {
    return (
      <main className="page">
        <p className="text-muted">{tc("notFound")}</p>
      </main>
    );
  }

  const isJob = listing.category === "JOB";
  const isTender = listing.category === "TENDER";
  const isAuction = listing.category === "AUCTION";

  return (
    <main className="page">
      <h1 className="page-title">{t("editTitle")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <BaseListingFields value={base} onChange={setBase} />

        {isJob && (
          <>
            <label className="field">
              {t("fieldSector")}
              <input
                name="sector"
                required
                value={details.sector ?? ""}
                onChange={(e) => setDetails({ ...details, sector: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldExperienceLevel")}
              <select
                name="experienceLevel"
                value={details.experienceLevel ?? "NOT_SPECIFIED"}
                onChange={(e) => setDetails({ ...details, experienceLevel: e.target.value })}
                className="input font-normal"
              >
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {t(`experienceLevel${level}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              {t("fieldApplicationDeadline")}
              <input
                name="applicationDeadline"
                required
                type="date"
                value={datePart(details.applicationDeadline)}
                onChange={(e) => setDetails({ ...details, applicationDeadline: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldApplicationMethod")}
              <select
                name="applicationMethod"
                value={details.applicationMethod ?? "PLATFORM"}
                onChange={(e) => setDetails({ ...details, applicationMethod: e.target.value })}
                className="input font-normal"
              >
                {applicationMethods.map((method) => (
                  <option key={method} value={method}>
                    {t(`applicationMethod${method}`)}
                  </option>
                ))}
              </select>
            </label>

            {details.applicationMethod === "EXTERNAL_URL" && (
              <label className="field">
                {t("fieldApplicationUrl")}
                <input
                  name="applicationUrl"
                  type="url"
                  value={details.applicationUrl ?? ""}
                  onChange={(e) => setDetails({ ...details, applicationUrl: e.target.value })}
                  className="input font-normal"
                />
              </label>
            )}

            {details.applicationMethod === "EMAIL" && (
              <label className="field">
                {t("fieldApplicationEmail")}
                <input
                  name="applicationEmail"
                  type="email"
                  value={details.applicationEmail ?? ""}
                  onChange={(e) => setDetails({ ...details, applicationEmail: e.target.value })}
                  className="input font-normal"
                />
              </label>
            )}

            <label className="field">
              {t("fieldSalaryRangeMin")}
              <input
                name="salaryRangeMin"
                type="number"
                min={0}
                value={details.salaryRangeMin ?? ""}
                onChange={(e) => setDetails({ ...details, salaryRangeMin: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldSalaryRangeMax")}
              <input
                name="salaryRangeMax"
                type="number"
                min={0}
                value={details.salaryRangeMax ?? ""}
                onChange={(e) => setDetails({ ...details, salaryRangeMax: e.target.value })}
                className="input font-normal"
              />
            </label>
          </>
        )}

        {isTender && (
          <>
            <label className="field">
              {t("fieldSector")}
              <input
                name="sector"
                required
                value={details.sector ?? ""}
                onChange={(e) => setDetails({ ...details, sector: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldBudgetMin")}
              <input
                name="budgetMin"
                type="number"
                min={0}
                value={details.budgetMin ?? ""}
                onChange={(e) => setDetails({ ...details, budgetMin: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldBudgetMax")}
              <input
                name="budgetMax"
                type="number"
                min={0}
                value={details.budgetMax ?? ""}
                onChange={(e) => setDetails({ ...details, budgetMax: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldSubmissionDeadline")}
              <input
                name="submissionDeadline"
                required
                type="date"
                value={datePart(details.submissionDeadline)}
                onChange={(e) => setDetails({ ...details, submissionDeadline: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldEligibilitySummary")}
              <textarea
                name="eligibilitySummary"
                rows={3}
                value={details.eligibilitySummary ?? ""}
                onChange={(e) => setDetails({ ...details, eligibilitySummary: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldRequiredDocuments")}
              <textarea
                name="requiredDocuments"
                rows={3}
                value={details.requiredDocuments ?? ""}
                onChange={(e) => setDetails({ ...details, requiredDocuments: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldDocumentUrl")}
              <input
                name="documentUrl"
                type="url"
                value={details.documentUrl ?? ""}
                onChange={(e) => setDetails({ ...details, documentUrl: e.target.value })}
                className="input font-normal"
              />
            </label>
          </>
        )}

        {isAuction && (
          <>
            <label className="field">
              {t("fieldStartingPrice")}
              <input
                name="startingPrice"
                type="number"
                min={0}
                value={details.startingPrice ?? ""}
                onChange={(e) => setDetails({ ...details, startingPrice: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldCurrency")}
              <input
                name="currency"
                value={details.currency ?? "RWF"}
                onChange={(e) => setDetails({ ...details, currency: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldAuctionDate")}
              <input
                name="auctionDate"
                required
                type="datetime-local"
                value={datetimeLocal(details.auctionDate)}
                onChange={(e) => setDetails({ ...details, auctionDate: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldAuctionLocation")}
              <input
                name="auctionLocation"
                required
                value={details.auctionLocation ?? ""}
                onChange={(e) => setDetails({ ...details, auctionLocation: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldRegistrationContactPhone")}
              <input
                name="registrationContactPhone"
                value={details.registrationContactPhone ?? ""}
                onChange={(e) => setDetails({ ...details, registrationContactPhone: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldRegistrationContactWhatsapp")}
              <input
                name="registrationContactWhatsapp"
                value={details.registrationContactWhatsapp ?? ""}
                onChange={(e) => setDetails({ ...details, registrationContactWhatsapp: e.target.value })}
                className="input font-normal"
              />
            </label>

            <label className="field">
              {t("fieldRegistrationContactEmail")}
              <input
                name="registrationContactEmail"
                type="email"
                value={details.registrationContactEmail ?? ""}
                onChange={(e) => setDetails({ ...details, registrationContactEmail: e.target.value })}
                className="input font-normal"
              />
            </label>
          </>
        )}

        {!isJob && !isTender && !isAuction && (
          <>
            <label className="field">
              {t("fieldSubcategory")}
              <input
                name="subcategory"
                required
                value={details.subcategory ?? ""}
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
                value={details.price ?? ""}
                onChange={(e) => setDetails({ ...details, price: e.target.value })}
                className="input font-normal"
              />
            </label>
          </>
        )}

        {errors.length > 0 && (
          <ul className="list-disc pl-4 form-error">
            {errors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? t("saving") : t("saveChanges")}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/listings/${id}`)}
            className="btn-outline"
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </main>
  );
}
