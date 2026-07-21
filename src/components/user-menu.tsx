"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

/**
 * Account control for the desktop header. A single person-icon (or initials)
 * button opens a menu, so auth lives in one place instead of a loose "Log in"
 * link competing with the "Post a listing" CTA:
 *   - signed out → "Log in"
 *   - signed in  → name/email, Dashboard, Notifications, Sign out
 * Folding notifications in here also lets the header drop the standalone bell.
 */
export function UserMenu() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const t = useTranslations("common");
  const tn = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Don't flash the signed-out state before the session resolves.
  if (isPending) return null;

  const name = session?.user?.name?.trim();
  const initials = name
    ? name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={session ? name || t("dashboard") : t("login")}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:text-primary active:scale-95"
      >
        {initials ? (
          <span className="text-xs font-bold text-primary">{initials}</span>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
          {session ? (
            <>
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm font-semibold text-foreground">{name || session.user.email}</p>
                {name && session.user.email && <p className="truncate text-xs text-muted">{session.user.email}</p>}
              </div>
              <Link
                role="menuitem"
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/5"
              >
                {t("dashboard")}
              </Link>
              <Link
                role="menuitem"
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/5"
              >
                {tn("notifications")}
              </Link>
              <button
                role="menuitem"
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await authClient.signOut();
                  router.push("/login");
                  router.refresh();
                }}
                className="block w-full border-t border-border px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger-surface"
              >
                {t("signOut")}
              </button>
            </>
          ) : (
            <Link
              role="menuitem"
              href="/login"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
            >
              {t("login")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
