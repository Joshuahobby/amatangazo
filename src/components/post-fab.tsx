"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

/**
 * Emphasized center action of the mobile bottom tab bar. Routed by state to
 * match the header CTA: signed-out taps go to /login (you need an account to
 * post), signed-in taps go straight to the post flow.
 */
export function PostFab() {
  const { data: session } = authClient.useSession();
  const t = useTranslations("nav");

  return (
    <Link
      href={session ? "/post" : "/login"}
      className="flex flex-1 flex-col items-center gap-1 pt-1 text-[11px] font-semibold text-primary"
    >
      <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-contrast shadow-md ring-4 ring-surface transition-transform active:scale-95">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </span>
      {t("post")}
    </Link>
  );
}
