"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { BaseListingFields, initialBaseListingValue, type BaseListingValue } from "@/components/base-listing-fields";
import { formatListingFormErrors } from "@/lib/listing-form-error";
import { PostResult } from "@/components/post-result";
import { applicationMethods, experienceLevels } from "@/lib/validations/listing";

type JobDetailsValue = {
  sector: string;
  experienceLevel: (typeof experienceLevels)[number];
  applicationDeadline: string;
  applicationMethod: (typeof applicationMethods)[number];
  applicationUrl: string;
  applicationEmail: string;
  salaryRangeMin: string;
  salaryRangeMax: string;
};

const initialDetails: JobDetailsValue = {
  sector: "",
  experienceLevel: "NOT_SPECIFIED",
  applicationDeadline: "",
  applicationMethod: "PLATFORM",
  applicationUrl: "",
  applicationEmail: "",
  salaryRangeMin: "",
  salaryRangeMax: "",
};

export default function PostJobPage() {
  const [base, setBase] = useState<BaseListingValue>(initialBaseListingValue);
  const [details, setDetails] = useState<JobDetailsValue>(initialDetails);
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
        category: "JOB",
        ...base,
        details: {
          sector: details.sector,
          experienceLevel: details.experienceLevel,
          applicationDeadline: details.applicationDeadline,
          applicationMethod: details.applicationMethod,
          applicationUrl: details.applicationUrl || undefined,
          applicationEmail: details.applicationEmail || undefined,
          salaryRangeMin: details.salaryRangeMin || undefined,
          salaryRangeMax: details.salaryRangeMax || undefined,
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

  if (listingId) return <PostResult listingId={listingId} category="JOB" />;

  return (
    <main className="page">
      <h1 className="page-title">{t("jobTitle")}</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <BaseListingFields value={base} onChange={setBase} />

        <label className="field">
          {t("fieldSector")}
          <input
            name="sector"
            required
            value={details.sector}
            onChange={(e) => setDetails({ ...details, sector: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          {t("fieldExperienceLevel")}
          <select
            name="experienceLevel"
            value={details.experienceLevel}
            onChange={(e) =>
              setDetails({ ...details, experienceLevel: e.target.value as JobDetailsValue["experienceLevel"] })
            }
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
            value={details.applicationDeadline}
            onChange={(e) => setDetails({ ...details, applicationDeadline: e.target.value })}
            className="input font-normal"
          />
        </label>

        <label className="field">
          {t("fieldApplicationMethod")}
          <select
            name="applicationMethod"
            value={details.applicationMethod}
            onChange={(e) =>
              setDetails({ ...details, applicationMethod: e.target.value as JobDetailsValue["applicationMethod"] })
            }
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
              required
              type="url"
              value={details.applicationUrl}
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
              required
              type="email"
              value={details.applicationEmail}
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
            value={details.salaryRangeMin}
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
            value={details.salaryRangeMax}
            onChange={(e) => setDetails({ ...details, salaryRangeMax: e.target.value })}
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
          {submitting ? t("posting") : t("submitJob")}
        </button>
      </form>
    </main>
  );
}
