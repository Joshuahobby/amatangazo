import type { PreferredLanguage } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  digestMessage,
  listingPublishedMessage,
  referralCreditMessage,
  subscriptionActivatedMessage,
  translatorFor,
} from "@/lib/notification-messages";

import en from "../messages/en.json";
import fr from "../messages/fr.json";
import rw from "../messages/rw.json";

const LANGUAGES: PreferredLanguage[] = ["EN", "FR", "RW"];

function flatten(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key));
}

describe("locale catalogue parity", () => {
  // notification-messages.ts casts fr/rw to en's shape on the strength of this.
  it("keeps an identical key set across en, fr and rw", () => {
    const keys = { en: flatten(en).sort(), fr: flatten(fr).sort(), rw: flatten(rw).sort() };
    expect(keys.fr).toEqual(keys.en);
    expect(keys.rw).toEqual(keys.en);
  });
});

describe("notification templates", () => {
  it("interpolates the listing title and URL in every language", () => {
    for (const language of LANGUAGES) {
      const { subject, body } = listingPublishedMessage(
        "Senior Accountant",
        "https://amatangazo.com/listings/abc",
      )(translatorFor(language));

      expect(subject.length).toBeGreaterThan(0);
      expect(body).toContain("Senior Accountant");
      expect(body).toContain("https://amatangazo.com/listings/abc");
      // A missing key renders as the key path — catches a locale that forgot one.
      expect(body).not.toContain("notificationTemplates.");
    }
  });

  it("gives each notification its own subject rather than a generic one", () => {
    const t = translatorFor("EN");
    const subjects = [
      listingPublishedMessage("A", "u")(t).subject,
      subscriptionActivatedMessage("A", "u")(t).subject,
      referralCreditMessage(5000)(t).subject,
      digestMessage("JOB", [], 0, "https://x")(t).subject,
    ];
    expect(new Set(subjects).size).toBe(subjects.length);
    expect(subjects).not.toContain("Amatangazo update");
  });

  it("formats the referral amount for the locale instead of a raw number", () => {
    const enBody = referralCreditMessage(10000)(translatorFor("EN")).body;
    expect(enBody).toContain("RWF 10,000");

    // French groups with a space rather than a comma, and puts RWF after the
    // amount — so assert it was formatted at all, not a specific separator.
    const frBody = referralCreditMessage(10000)(translatorFor("FR")).body;
    expect(frBody).toContain("RWF");
    expect(frBody).not.toContain("10000");
  });

  it("uses the localised category label in the digest heading", () => {
    const enBody = digestMessage("TENDER", [{ id: "1", title: "Road works" }], 1, "https://x")(
      translatorFor("EN"),
    ).body;
    expect(enBody).toContain("Tenders");

    const frBody = digestMessage("TENDER", [{ id: "1", title: "Road works" }], 1, "https://x")(
      translatorFor("FR"),
    ).body;
    expect(frBody).toContain("Appels d'offres");
  });

  it("pluralises the digest heading on the total, not the shown count", () => {
    const one = digestMessage("JOB", [{ id: "1", title: "A" }], 1, "https://x")(translatorFor("EN")).body;
    expect(one).toContain("1 new listing matches");

    const many = digestMessage("JOB", [{ id: "1", title: "A" }], 4, "https://x")(translatorFor("EN")).body;
    expect(many).toContain("4 new listings match");
  });

  it("lists each listing with its URL and reports the overflow", () => {
    const listings = [
      { id: "a1", title: "Driver" },
      { id: "b2", title: "Welder" },
    ];
    const { body } = digestMessage("JOB", listings, 6, "https://amatangazo.com")(translatorFor("EN"));

    expect(body).toContain("- Driver\n  https://amatangazo.com/listings/a1");
    expect(body).toContain("- Welder\n  https://amatangazo.com/listings/b2");
    expect(body).toContain("And 4 more.");
  });

  it("omits the overflow line when everything is shown", () => {
    const listings = [{ id: "a1", title: "Driver" }];
    const { body } = digestMessage("JOB", listings, 1, "https://amatangazo.com")(translatorFor("EN"));
    expect(body).not.toContain("more.");
  });
});
