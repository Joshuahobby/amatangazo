import { getTranslations } from "next-intl/server";

import type { ListingWithDetails } from "@/lib/listings";

export async function TenderDetailsSection({ listing }: { listing: ListingWithDetails }) {
  const details = listing.tenderDetails;
  if (!details) return null;
  const t = await getTranslations("listing");

  return (
    <>
      {listing.source === "GOVERNMENT_MIRROR" && (
        <p style={{ background: "#eef", padding: 8, borderRadius: 4 }}>
          {t("governmentSource")}
          {listing.sourceUrl && (
            <>
              {" — "}
              <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer">
                {t("viewOriginalNotice")}
              </a>
            </>
          )}
        </p>
      )}
      {details.aiSummaryGeneratedAt && (
        <section style={{ background: "#f6f9f6", border: "1px solid #cde3cd", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>{t("aiSummaryTitle")}</p>
          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px", margin: 0, fontSize: 14 }}>
            <dt>{t("submissionDeadline")}</dt>
            <dd>{details.aiSummaryDeadline}</dd>
            <dt>{t("budgetBand")}</dt>
            <dd>{details.aiSummaryBudget}</dd>
            <dt>{t("eligibility")}</dt>
            <dd>{details.aiSummaryEligibility}</dd>
            <dt>{t("requiredDocuments")}</dt>
            <dd>{details.aiSummaryDocuments}</dd>
          </dl>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#666" }}>{t("aiSummaryDisclaimer")}</p>
        </section>
      )}
      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px" }}>
        <dt>{t("sector")}</dt>
        <dd>{details.sector}</dd>
        {(details.budgetMin || details.budgetMax) && (
          <>
            <dt>{t("budgetBand")}</dt>
            <dd>
              {details.budgetMin?.toLocaleString() ?? "?"} – {details.budgetMax?.toLocaleString() ?? "?"} RWF
            </dd>
          </>
        )}
        <dt>{t("submissionDeadline")}</dt>
        <dd>{details.submissionDeadline.toLocaleDateString()}</dd>
        {details.eligibilitySummary && (
          <>
            <dt>{t("eligibility")}</dt>
            <dd>{details.eligibilitySummary}</dd>
          </>
        )}
        {details.requiredDocuments && (
          <>
            <dt>{t("requiredDocuments")}</dt>
            <dd>{details.requiredDocuments}</dd>
          </>
        )}
        {details.documentUrl && (
          <>
            <dt>{t("tenderDocument")}</dt>
            <dd>
              <a href={details.documentUrl} target="_blank" rel="noopener noreferrer">
                {t("download")}
              </a>
            </dd>
          </>
        )}
      </dl>
    </>
  );
}
