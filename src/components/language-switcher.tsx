"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

const locales = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "rw", label: "RW" },
];

function setLocaleCookie(code: string) {
  document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function switchTo(code: string) {
    setLocaleCookie(code);
    router.refresh();
  }

  return (
    <span className="flex items-center gap-1 text-xs">
      {locales.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          className={`rounded px-2.5 py-1 transition-colors ${
            locale === code ? "bg-primary text-primary-contrast font-semibold" : "text-muted hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </span>
  );
}
