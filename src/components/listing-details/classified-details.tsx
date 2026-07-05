import { getTranslations } from "next-intl/server";

import type { ListingWithDetails } from "@/lib/listings";

export async function ClassifiedDetailsSection({ listing }: { listing: ListingWithDetails }) {
  const details = listing.classifiedDetails;
  if (!details) return null;
  const t = await getTranslations("listing");

  return (
    <dl className="detail-grid">
      <dt>{t("subcategory")}</dt>
      <dd>{details.subcategory}</dd>
      {details.price && (
        <>
          <dt>{t("price")}</dt>
          <dd>{details.price.toLocaleString()} RWF</dd>
        </>
      )}
    </dl>
  );
}
