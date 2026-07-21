"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Form from "next/form";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { AuthStatus } from "@/components/auth-status";
import { LanguageSwitcher } from "@/components/language-switcher";

// Primary nav is Home + the four listing categories. "Businesses" was dropped:
// it pointed at /verification (a conversion flow, not a browse category), which
// now lives in the footer — keeping the top nav to real, browseable categories.
const NAV_LINKS = [
  { href: "/", key: "home" },
  { href: "/listings?category=JOB", key: "jobs" },
  { href: "/listings?category=TENDER", key: "tenders" },
  { href: "/listings?category=AUCTION", key: "auctions" },
  { href: "/listings?category=CLASSIFIED", key: "classifieds" },
] as const;

const BELL_ICON =
  "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";

export function SiteHeader() {
  const t = useTranslations("nav");
  const [mobileOpen, setMobileOpen] = useState(false);
  // Notifications are a signed-in affordance; the bell is hidden for anonymous
  // visitors (who have nothing to see there) rather than bouncing them to login.
  const { data: session } = authClient.useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-primary">
          Amatangazo
        </Link>

        <nav aria-label={t("main")} className="hidden items-center gap-1 lg:flex lg:flex-1 lg:justify-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          {session && (
            <Link
              href="/notifications"
              aria-label={t("notifications")}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/5 hover:text-primary"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={BELL_ICON} />
              </svg>
            </Link>
          )}
          <AuthStatus />
        </div>

        <Link
          href="/post"
          className="ml-auto shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-contrast shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98] lg:ml-0"
        >
          {t("postListing")}
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={t("menuToggle")}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-border/50 active:scale-95 lg:hidden"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-surface px-4 pb-6 pt-2 lg:hidden">
          <nav aria-label={t("main")} className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 hover:text-primary"
              >
                {t(link.key)}
              </Link>
            ))}
            <hr className="my-2 border-border" />
            <Form action="/listings" role="search">
              <input
                type="search"
                name="q"
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className="input"
              />
            </Form>
            <div className="mt-3 flex items-center justify-between gap-3">
              <LanguageSwitcher />
              <AuthStatus />
            </div>
          </nav>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-surface px-2 pb-safe lg:hidden" aria-label={t("main")}>
        <Link href="/" className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs text-muted hover:text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {t("home")}
        </Link>
        <Link href="/listings" className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs text-muted hover:text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {t("browse")}
        </Link>
        <Link href="/post" className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs text-muted hover:text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("post")}
        </Link>
        <Link href="/notifications" className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs text-muted hover:text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={BELL_ICON} />
          </svg>
          {t("notifications")}
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs text-muted hover:text-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {t("dashboard")}
        </Link>
      </nav>
    </header>
  );
}
