"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

/**
 * State-aware header CTA. Anonymous visitors (most homepage traffic) see a
 * clean "Get started" that routes to sign-up/onboarding — the growth lever for
 * a young marketplace. Signed-in users see the concrete "Post a listing" action
 * routed straight to the post flow. One button, two intents, decided by state.
 */
export function PrimaryCta() {
  const { data: session } = authClient.useSession();
  const t = useTranslations("nav");
  const signedIn = !!session;

  return (
    <Link
      href={signedIn ? "/post" : "/login"}
      className="inline-flex shrink-0 items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-contrast shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
    >
      {signedIn ? t("postListing") : t("getStarted")}
    </Link>
  );
}
