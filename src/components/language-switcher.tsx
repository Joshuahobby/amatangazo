"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

// Endonyms — each language names itself, so a Kinyarwanda speaker sees
// "Ikinyarwanda", not a foreign label. `short` is the compact header glyph.
const LOCALES = [
  { code: "en", label: "English", short: "EN" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "rw", label: "Ikinyarwanda", short: "RW" },
] as const;

function setLocaleCookie(code: string) {
  document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Compact language control: a single globe + current-code button that opens a
 * menu of the three languages. Being one small control (not three inline pills)
 * lets it sit in the header on every breakpoint, phones included. Pass `up` in
 * the footer so the menu opens upward instead of off the bottom of the page.
 */
export function LanguageSwitcher({ up = false }: { up?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(code: string) {
    setLocaleCookie(code);
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      {/* min-h-10 matches the 40px menu toggle beside it — the control is small
          enough that padding alone left a 30px-tall tap target. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("language")} — ${current.label}`}
        className="flex min-h-10 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary active:scale-95"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {current.short}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-50 w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg ${up ? "bottom-full mb-1" : "mt-1"}`}
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={l.code === locale}
              onClick={() => switchTo(l.code)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5 ${
                l.code === locale ? "font-semibold text-primary" : "text-foreground"
              }`}
            >
              <span>{l.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted">{l.short}</span>
                {l.code === locale && (
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
