"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

const CTA_CLASS =
  "inline-flex shrink-0 items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-contrast shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98]";

// Set once this device has ever held a session, so a later signed-out visit can
// greet a returning user with "Log in" instead of "Get started".
const RETURNING_KEY = "amz_returning";

/**
 * State-aware header CTA.
 *   - Signed in → "Post a listing" → /post (the concrete action).
 *   - Signed out, brand-new device → "Get started" → /login (onboarding).
 *   - Signed out, returning device → "Log in" → /login (familiar wording).
 * All signed-out paths hit the one unified login page; only the label differs.
 */
export function PrimaryCta() {
  const { data: session } = authClient.useSession();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    try {
      if (session) {
        localStorage.setItem(RETURNING_KEY, "1");
      } else {
        setReturning(localStorage.getItem(RETURNING_KEY) === "1");
      }
    } catch {
      // localStorage blocked (private mode) — fall back to the new-visitor
      // label, the safe default.
    }
  }, [session]);

  if (session) {
    return (
      <Link href="/post" className={CTA_CLASS}>
        {t("postListing")}
      </Link>
    );
  }

  return (
    <Link href="/login" className={CTA_CLASS}>
      {returning ? tc("login") : t("getStarted")}
    </Link>
  );
}
