"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

/**
 * Adaptive account control for the desktop header.
 *   - Signed out → a clear "Log in" text link. An icon alone is mystery-meat
 *     for first-time visitors, and sign-in discoverability drives sign-ups.
 *   - Signed in  → an initials avatar that opens a menu (Dashboard,
 *     Notifications, Sign out). This is also the container that scales as the
 *     product grows — saved searches, subscriptions, messaging live here.
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

  // Avoid flashing the signed-out label before the session resolves.
  if (isPending) return null;

  if (!session) {
    return (
      <Link
        href="/login"
        className="rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
      >
        {t("login")}
      </Link>
    );
  }

  const name = session.user?.name?.trim();
  const initials = name
    ? name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : (session.user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={name || t("dashboard")}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary transition-colors hover:bg-primary/15 active:scale-95"
      >
        {initials}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
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
        </div>
      )}
    </div>
  );
}
