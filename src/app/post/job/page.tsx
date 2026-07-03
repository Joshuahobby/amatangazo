"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { BaseListingFields, initialBaseListingValue, type BaseListingValue } from "@/components/base-listing-fields";
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
      setError(JSON.stringify(data.error));
      return;
    }
    setListingId(data.listing.id);
  }

  if (listingId) return <PostResult listingId={listingId} category="JOB" />;

  return (
    <main style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>{t("jobTitle")}</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <BaseListingFields value={base} onChange={setBase} />

        <label>
          Sector
          <input
            name="sector"
            required
            value={details.sector}
            onChange={(e) => setDetails({ ...details, sector: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Experience level
          <select
            name="experienceLevel"
            value={details.experienceLevel}
            onChange={(e) =>
              setDetails({ ...details, experienceLevel: e.target.value as JobDetailsValue["experienceLevel"] })
            }
            style={{ display: "block", width: "100%" }}
          >
            {experienceLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label>
          Application deadline
          <input
            name="applicationDeadline"
            required
            type="date"
            value={details.applicationDeadline}
            onChange={(e) => setDetails({ ...details, applicationDeadline: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Application method
          <select
            name="applicationMethod"
            value={details.applicationMethod}
            onChange={(e) =>
              setDetails({ ...details, applicationMethod: e.target.value as JobDetailsValue["applicationMethod"] })
            }
            style={{ display: "block", width: "100%" }}
          >
            {applicationMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>

        {details.applicationMethod === "EXTERNAL_URL" && (
          <label>
            Application URL
            <input
              name="applicationUrl"
              required
              type="url"
              value={details.applicationUrl}
              onChange={(e) => setDetails({ ...details, applicationUrl: e.target.value })}
              style={{ display: "block", width: "100%" }}
            />
          </label>
        )}

        {details.applicationMethod === "EMAIL" && (
          <label>
            Application email
            <input
              name="applicationEmail"
              required
              type="email"
              value={details.applicationEmail}
              onChange={(e) => setDetails({ ...details, applicationEmail: e.target.value })}
              style={{ display: "block", width: "100%" }}
            />
          </label>
        )}

        <label>
          Salary range min (RWF, optional)
          <input
            name="salaryRangeMin"
            type="number"
            min={0}
            value={details.salaryRangeMin}
            onChange={(e) => setDetails({ ...details, salaryRangeMin: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        <label>
          Salary range max (RWF, optional)
          <input
            name="salaryRangeMax"
            type="number"
            min={0}
            value={details.salaryRangeMax}
            onChange={(e) => setDetails({ ...details, salaryRangeMax: e.target.value })}
            style={{ display: "block", width: "100%" }}
          />
        </label>

        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? t("posting") : t("submitJob")}
        </button>
      </form>
    </main>
  );
}
