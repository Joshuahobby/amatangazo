import type { PreferredLanguage } from "@prisma/client";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

/**
 * Which language to write to someone in.
 *
 * Ordinary notifications can just read `User.preferredLanguage`, because the
 * recipient always exists by then. OTP can't: the whole point of a signup OTP
 * is that there is no user row yet. So this resolves in three steps.
 *
 *   1. An existing user's stored preference — an explicit choice, so it wins.
 *   2. The NEXT_LOCALE cookie — set by the language switcher, and the language
 *      the person is looking at the site in *right now*. Correct for signup.
 *   3. English.
 *
 * Step 2 is only reachable inside a request. That holds for OTP (it is sent
 * from the auth route handler) but not for cron or webhooks, where cookies()
 * throws and step 3 applies — which is why the digest passes a language in
 * directly rather than calling this.
 */

/** Mirrors the locales in src/i18n/request.ts, mapped to the Prisma enum. */
const COOKIE_TO_LANGUAGE: Record<string, PreferredLanguage> = {
  en: "EN",
  fr: "FR",
  rw: "RW",
};

async function languageFromCookie(): Promise<PreferredLanguage> {
  try {
    const store = await cookies();
    return COOKIE_TO_LANGUAGE[store.get("NEXT_LOCALE")?.value ?? ""] ?? "EN";
  } catch {
    // cookies() throws outside a request scope. Nothing to read, so English.
    return "EN";
  }
}

export async function languageForEmail(email: string): Promise<PreferredLanguage> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { preferredLanguage: true },
  });
  return user?.preferredLanguage ?? (await languageFromCookie());
}

export async function languageForPhone(phoneNumber: string): Promise<PreferredLanguage> {
  const user = await prisma.user.findUnique({
    where: { phoneNumber },
    select: { preferredLanguage: true },
  });
  return user?.preferredLanguage ?? (await languageFromCookie());
}
