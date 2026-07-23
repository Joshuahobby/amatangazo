"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Form from "next/form";
import Link from "next/link";

import { AuthStatus } from "@/components/auth-status";
import { DesktopNav, MobileNavItems } from "@/components/header-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PostFab } from "@/components/post-fab";
import { PrimaryCta } from "@/components/primary-cta";
import { UserMenu } from "@/components/user-menu";

const ICONS = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  browse: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  account: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
} as const;

function TabIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-primary">
          Amatangazo
        </Link>

        <DesktopNav />

        {/* Right cluster: language switcher on every breakpoint; account + the
            single primary CTA on desktop; a menu toggle on mobile (where Post
            lives in the bottom bar's emphasized FAB and account in the menu). */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <div className="hidden items-center gap-3 lg:flex">
            <UserMenu />
            <PrimaryCta />
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t("menuToggle")}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-border/50 active:scale-95 lg:hidden"
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
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-surface px-4 pb-6 pt-2 lg:hidden">
          <nav aria-label={t("main")} className="flex flex-col gap-1">
            <MobileNavItems onNavigate={() => setMobileOpen(false)} />
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
            <div className="mt-3">
              <AuthStatus />
            </div>
          </nav>
        </div>
      )}

      {/* Mobile bottom tab bar — thumb-zone navigation with an emphasized Post
          FAB in the centre as the primary action. */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface pb-safe lg:hidden"
        aria-label={t("main")}
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-2">
          <Link href="/" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted transition-colors hover:text-primary">
            <TabIcon d={ICONS.home} />
            {t("home")}
          </Link>
          <Link href="/listings" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted transition-colors hover:text-primary">
            <TabIcon d={ICONS.browse} />
            {t("browse")}
          </Link>
          <PostFab />
          <Link href="/notifications" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted transition-colors hover:text-primary">
            <TabIcon d={ICONS.bell} />
            {t("notifications")}
          </Link>
          <Link href="/dashboard" className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted transition-colors hover:text-primary">
            <TabIcon d={ICONS.account} />
            {t("account")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
