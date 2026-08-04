"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { useHydrated } from "@/hooks/use-hydrated";
import { authClient } from "@/lib/auth-client";

const CTA_CLASS =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-contrast shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98]";

// Set once this device has ever held a session, so a later signed-out visit can
// greet a returning user with "Log in" instead of a post prompt.
const RETURNING_KEY = "amz_returning";

// Nothing external mutates this during a page's life, so the subscribe callback
// is a no-op — the value only needs reading once per render.
const subscribeNoop = () => () => {};

function readReturning(): boolean {
  try {
    return localStorage.getItem(RETURNING_KEY) === "1";
  } catch {
    // localStorage blocked (private mode) — fall back to the new-visitor label.
    return false;
  }
}

// Server render can't see localStorage, so it assumes a new visitor; the client
// swaps in the real value on hydration.
const readReturningOnServer = () => false;

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
  // useSyncExternalStore rather than useState + useEffect: reading localStorage
  // into state inside an effect forces a second render pass on every mount and
  // is what the react-hooks "setState in an effect" rule flags. This reads the
  // value during render instead, with a server snapshot so hydration matches.
  const returning = useSyncExternalStore(subscribeNoop, readReturning, readReturningOnServer);
  // Same reason the label already needs a server snapshot: the href branched on
  // a session the server cannot see, so it mismatched on hydration too.
  const hydrated = useHydrated();
  const signedIn = hydrated && Boolean(session);

  // The write side stays in an effect — that's a genuine side effect, and only
  // the state update was the problem.
  useEffect(() => {
    if (!session) return;
    try {
      localStorage.setItem(RETURNING_KEY, "1");
    } catch {
      // localStorage blocked — next signed-out visit just sees the default label.
    }
  }, [session]);

  // Returning-but-signed-out is the one case where the header isn't about
  // posting; everyone else gets the post prompt, routed to /login when there's
  // no account yet (same convention as the mobile PostFab).
  const isLogin = !signedIn && returning;

  return (
    <Link href={signedIn ? "/post" : "/login"} className={CTA_CLASS}>
      {!isLogin && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      )}
      {isLogin ? tc("login") : t("postListing")}
    </Link>
  );
}
