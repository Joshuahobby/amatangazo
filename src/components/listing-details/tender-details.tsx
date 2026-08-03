import { getFormatter, getTranslations } from "next-intl/server";

import type { ListingWithDetails } from "@/lib/listings";

export async function TenderDetailsSection({ listing }: { listing: ListingWithDetails }) {
  const details = listing.tenderDetails;
  if (!details) return null;
  const t = await getTranslations("listing");
  const format = await getFormatter();

  return (
    <>
      {listing.source === "GOVERNMENT_MIRROR" && (
        <p className="mb-4 rounded-lg bg-cat-tender/10 px-3 py-2 text-sm text-foreground">
          {t("governmentSource")}
          {listing.sourceUrl && (
            <>
              {" — "}
              <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer" className="link">
                {t("viewOriginalNotice")}
              </a>
            </>
          )}
        </p>
      )}
      {details.aiSummaryGeneratedAt && (
        <section className="card mb-4 border-primary/30 bg-primary/5">
          <p className="mb-2 font-semibold text-foreground">{t("aiSummaryTitle")}</p>
          <dl className="detail-grid">
            <dt>{t("submissionDeadline")}</dt>
            <dd>{details.aiSummaryDeadline}</dd>
            <dt>{t("budgetBand")}</dt>
            <dd>{details.aiSummaryBudget}</dd>
            <dt>{t("eligibility")}</dt>
            <dd>{details.aiSummaryEligibility}</dd>
            <dt>{t("requiredDocuments")}</dt>
            <dd>{details.aiSummaryDocuments}</dd>
          </dl>
          <p className="mt-2 text-xs text-muted">{t("aiSummaryDisclaimer")}</p>
        </section>
      )}
      <dl className="detail-grid">
        <dt>{t("sector")}</dt>
        <dd>{details.sector}</dd>
        {(details.budgetMin || details.budgetMax) && (
          <>
            <dt>{t("budgetBand")}</dt>
            <dd>
              {details.budgetMin != null ? format.number(details.budgetMin) : "?"} –{" "}
              {details.budgetMax != null ? format.number(details.budgetMax) : "?"} RWF
            </dd>
          </>
        )}
        <dt>{t("submissionDeadline")}</dt>
        <dd>{format.dateTime(details.submissionDeadline, { dateStyle: "medium" })}</dd>
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
              <a href={details.documentUrl} target="_blank" rel="noopener noreferrer" className="link">
                {t("download")}
              </a>
            </dd>
          </>
        )}
      </dl>
    </>
  );
}
