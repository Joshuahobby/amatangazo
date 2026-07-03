import { getTranslations } from "next-intl/server";

import { AuctionCountdown } from "@/components/auction-countdown";
import type { ListingWithDetails } from "@/lib/listings";

export async function AuctionDetailsSection({ listing }: { listing: ListingWithDetails }) {
  const details = listing.auctionDetails;
  if (!details) return null;
  const t = await getTranslations("listing");

  return (
    <>
      <AuctionCountdown auctionDate={details.auctionDate.toISOString()} />
      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px", marginTop: 12 }}>
        <dt>{t("auctionDate")}</dt>
        <dd>{details.auctionDate.toLocaleString()}</dd>
        <dt>{t("auctionLocation")}</dt>
        <dd>{details.auctionLocation}</dd>
        {details.startingPrice && (
          <>
            <dt>{t("startingPrice")}</dt>
            <dd>
              {details.startingPrice.toLocaleString()} {details.currency}
            </dd>
          </>
        )}
        {details.registrationContactPhone && (
          <>
            <dt>{t("registrationPhone")}</dt>
            <dd>
              <a href={`tel:${details.registrationContactPhone}`}>{details.registrationContactPhone}</a>
            </dd>
          </>
        )}
        {details.registrationContactWhatsapp && (
          <>
            <dt>{t("whatsapp")}</dt>
            <dd>{details.registrationContactWhatsapp}</dd>
          </>
        )}
        {details.registrationContactEmail && (
          <>
            <dt>{t("email")}</dt>
            <dd>
              <a href={`mailto:${details.registrationContactEmail}`}>{details.registrationContactEmail}</a>
            </dd>
          </>
        )}
      </dl>
    </>
  );
}
