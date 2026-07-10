import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const supportedLocales = ["en", "fr", "rw"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

/**
 * P0-5 multilingual UI (EN/FR/RW). Cookie-based locale — no URL prefix
 * routing, so every existing path keeps working and the locale is a plain
 * user preference, matching how User.preferredLanguage already models it.
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("NEXT_LOCALE")?.value;
  const locale = supportedLocales.includes(cookieLocale as SupportedLocale) ? cookieLocale! : "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Dates/relative times render in Rwanda's timezone on both server and
    // client, so listing cards don't drift across the SSR/hydration boundary.
    timeZone: "Africa/Kigali",
    // Single reference time per request so relativeTime() ("3 days ago") is
    // stable across SSR + hydration and doesn't emit the ENVIRONMENT_FALLBACK
    // warning on every listing card.
    now: new Date(),
  };
});
