import type { ListingCategory, PreferredLanguage } from "@prisma/client";
import { createTranslator } from "next-intl";

import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import rw from "../../messages/rw.json";

/**
 * Outbound notification copy has to render *outside* a request: the saved-search
 * digest runs from cron and the publish notification fires from the PawaPay
 * webhook, so the request-scoped next-intl helpers — and the NEXT_LOCALE cookie
 * behind them — aren't available. createTranslator is synchronous and takes an
 * explicit locale, which is what those callers need.
 *
 * The locale comes from the recipient's `User.preferredLanguage`, never from a
 * cookie: whoever triggers a notification is usually not the person who reads
 * it (a cron job has no locale at all, and a webhook carries PawaPay's).
 */

type Messages = typeof en;

/**
 * The `as unknown as` casts are safe because all three catalogues carry an
 * identical key set — asserted in test/notification-templates.test.ts, which
 * fails if a key is ever added to one file and not the others.
 */
const MESSAGES: Record<PreferredLanguage, Messages> = {
  EN: en,
  FR: fr as unknown as Messages,
  RW: rw as unknown as Messages,
};

export type NotificationTranslator = ReturnType<typeof translatorFor>;

/** Content for one notification. `subject` is only used by the email channel. */
export type NotificationContent = { subject: string; body: string };

/** A notification that hasn't picked a language yet — resolved at send time. */
export type NotificationMessage = (t: NotificationTranslator) => NotificationContent;

export function translatorFor(language: PreferredLanguage) {
  return createTranslator({
    locale: language.toLowerCase(),
    messages: MESSAGES[language] ?? MESSAGES.EN,
    // Matches src/i18n/request.ts so a date in a notification reads the same as
    // the same date on the site.
    timeZone: "Africa/Kigali",
  });
}

const CATEGORY_LABEL_KEY = {
  JOB: "browse.categoryJOB",
  TENDER: "browse.categoryTENDER",
  AUCTION: "browse.categoryAUCTION",
  CLASSIFIED: "browse.categoryCLASSIFIED",
} as const satisfies Record<ListingCategory, string>;

/** Reuses the browse-page category labels rather than duplicating them. */
export function categoryLabel(t: NotificationTranslator, category: ListingCategory): string {
  return t(CATEGORY_LABEL_KEY[category]);
}

// ── The templates ────────────────────────────────────────────

export function listingPublishedMessage(listingTitle: string, listingUrl: string): NotificationMessage {
  return (t) => ({
    subject: t("notificationTemplates.listingLiveSubject"),
    body: t("notificationTemplates.listingLiveBody", { title: listingTitle, url: listingUrl }),
  });
}

export function subscriptionActivatedMessage(listingTitle: string, listingUrl: string): NotificationMessage {
  return (t) => ({
    subject: t("notificationTemplates.subscriptionActiveSubject"),
    body: t("notificationTemplates.subscriptionActiveBody", { title: listingTitle, url: listingUrl }),
  });
}

export function referralCreditMessage(amount: number): NotificationMessage {
  return (t) => ({
    subject: t("notificationTemplates.referralCreditSubject"),
    // `{amount, number}` in the catalogue formats per locale — "10,000" in
    // English, "10 000" in French — instead of a hardcoded toLocaleString().
    body: t("notificationTemplates.referralCreditBody", { amount }),
  });
}

export function digestMessage(
  category: ListingCategory,
  listings: { id: string; title: string }[],
  totalCount: number,
  baseUrl: string,
): NotificationMessage {
  return (t) => {
    const heading = t("notificationTemplates.digestHeading", {
      category: categoryLabel(t, category),
      count: totalCount,
    });
    const lines = listings.map((listing) => `- ${listing.title}\n  ${baseUrl}/listings/${listing.id}`);
    const remaining = totalCount - listings.length;
    const more = remaining > 0 ? `\n${t("notificationTemplates.digestMore", { count: remaining })}` : "";

    return {
      subject: t("notificationTemplates.digestSubject"),
      body: `${heading}\n${lines.join("\n")}${more}`,
    };
  };
}
