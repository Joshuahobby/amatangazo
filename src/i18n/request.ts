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
  };
});
