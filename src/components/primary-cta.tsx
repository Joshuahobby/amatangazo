"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

const CTA_CLASS =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-contrast shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98]";

// Set once this device has ever held a session, so a later signed-out visit can
// greet a returning user with "Log in" instead of a post prompt.
const RETURNING_KEY = "amz_returning";

/**
 * The header's single CTA.
 *   - Signed in → "Post a listing" → /post.
 *   - Signed out, brand-new device → "Post a listing" → /login.
 *   - Signed out, returning device → "Log in" → /login.
 *
 * One button, never two: a second signed-out CTA would point at /login as well,
 * so it would differ only in wording. Posting leads because it names what the
 * product is for and is the action that earns — "get started" says nothing.
 * Returning devices get "Log in" instead, which is the only case where someone
 * wants the header for a reason other than posting.
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

  // Returning-but-signed-out is the one case where the header isn't about
  // posting; everyone else gets the post prompt, routed to /login when there's
  // no account yet (same convention as the mobile PostFab).
  const isLogin = !session && returning;

  return (
    <Link href={session ? "/post" : "/login"} className={CTA_CLASS}>
      {!isLogin && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      )}
      {isLogin ? tc("login") : t("postListing")}
    </Link>
  );
}
