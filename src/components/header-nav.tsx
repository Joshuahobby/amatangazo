"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/listings?category=JOB", key: "jobs", category: "JOB" },
  { href: "/listings?category=TENDER", key: "tenders", category: "TENDER" },
  { href: "/listings?category=AUCTION", key: "auctions", category: "AUCTION" },
  { href: "/listings?category=CLASSIFIED", key: "classifieds", category: "CLASSIFIED" },
] as const;

// Category lives in the query string (/listings?category=JOB), so the active
// item needs useSearchParams. It's read inside a Suspense boundary (below) so a
// statically-rendered page never has to deopt to client rendering because of it.
function useActiveCategory() {
  const pathname = usePathname();
  const params = useSearchParams();
  return pathname === "/listings" ? params.get("category") : null;
}

/* ---------- Desktop ---------- */

function DesktopItems({ active }: { active: string | null }) {
  const t = useTranslations("nav");
  return (
    <>
      {NAV_LINKS.map((link) => {
        const isActive = active === link.category;
        return (
          <Link
            key={link.key}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? "text-primary" : "text-foreground hover:bg-primary/5 hover:text-primary"
            }`}
          >
            {t(link.key)}
            {isActive && (
              <span className="absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-primary" aria-hidden />
            )}
          </Link>
        );
      })}
    </>
  );
}

function DesktopItemsLive() {
  return <DesktopItems active={useActiveCategory()} />;
}

export function DesktopNav() {
  const t = useTranslations("nav");
  return (
    <nav aria-label={t("main")} className="hidden items-center gap-1 lg:flex lg:flex-1 lg:justify-center">
      <Suspense fallback={<DesktopItems active={null} />}>
        <DesktopItemsLive />
      </Suspense>
    </nav>
  );
}

/* ---------- Mobile (inside the hamburger menu) ---------- */

function MobileItems({ active, onNavigate }: { active: string | null; onNavigate: () => void }) {
  const t = useTranslations("nav");
  return (
    <>
      {NAV_LINKS.map((link) => {
        const isActive = active === link.category;
        return (
          <Link
            key={link.key}
            href={link.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-primary/5 hover:text-primary"
            }`}
          >
            {t(link.key)}
          </Link>
        );
      })}
    </>
  );
}

function MobileItemsLive({ onNavigate }: { onNavigate: () => void }) {
  return <MobileItems active={useActiveCategory()} onNavigate={onNavigate} />;
}

export function MobileNavItems({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Suspense fallback={<MobileItems active={null} onNavigate={onNavigate} />}>
      <MobileItemsLive onNavigate={onNavigate} />
    </Suspense>
  );
}
