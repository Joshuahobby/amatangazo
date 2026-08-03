import { getFormatter, getTranslations } from "next-intl/server";

import { AuctionCountdown } from "@/components/auction-countdown";
import type { ListingWithDetails } from "@/lib/listings";

export async function AuctionDetailsSection({ listing }: { listing: ListingWithDetails }) {
  const details = listing.auctionDetails;
  if (!details) return null;
  const t = await getTranslations("listing");
  const format = await getFormatter();

  return (
    <>
      <AuctionCountdown auctionDate={details.auctionDate.toISOString()} />
      <dl className="detail-grid mt-3">
        <dt>{t("auctionDate")}</dt>
        <dd>{format.dateTime(details.auctionDate, { dateStyle: "medium", timeStyle: "short" })}</dd>
        <dt>{t("auctionLocation")}</dt>
        <dd>{details.auctionLocation}</dd>
        {details.startingPrice && (
          <>
            <dt>{t("startingPrice")}</dt>
            <dd>
              {format.number(details.startingPrice)} {details.currency}
            </dd>
          </>
        )}
        {/* Registration contact rows intentionally omitted — the ContactSeller
            CTA on the detail page surfaces them prominently instead (P1.1). */}
      </dl>
    </>
  );
}
