import { getTranslations } from "next-intl/server";

import { ApplyLink } from "@/components/apply-link";
import type { ListingWithDetails } from "@/lib/listings";

export async function JobDetailsSection({ listing }: { listing: ListingWithDetails }) {
  const details = listing.jobDetails;
  if (!details) return null;
  const t = await getTranslations("listing");

  return (
    <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px" }}>
      <dt>{t("sector")}</dt>
      <dd>{details.sector}</dd>
      <dt>{t("experienceLevel")}</dt>
      <dd>{details.experienceLevel}</dd>
      <dt>{t("applicationDeadline")}</dt>
      <dd>{details.applicationDeadline.toLocaleDateString()}</dd>
      {(details.salaryRangeMin || details.salaryRangeMax) && (
        <>
          <dt>{t("salaryRange")}</dt>
          <dd>
            {details.salaryRangeMin?.toLocaleString() ?? "?"} – {details.salaryRangeMax?.toLocaleString() ?? "?"} RWF
          </dd>
        </>
      )}
      <dt>{t("howToApply")}</dt>
      <dd>
        {details.applicationMethod === "PLATFORM" && t("applyOnPlatform")}
        {details.applicationMethod === "EXTERNAL_URL" && details.applicationUrl && (
          <ApplyLink listingId={listing.id} href={details.applicationUrl} label={details.applicationUrl} />
        )}
        {details.applicationMethod === "EMAIL" && details.applicationEmail && (
          <ApplyLink
            listingId={listing.id}
            href={`mailto:${details.applicationEmail}`}
            label={details.applicationEmail}
          />
        )}
      </dd>
    </dl>
  );
}
