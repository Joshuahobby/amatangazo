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
    <span style={{ display: "inline-flex", gap: 4 }}>
      {locales.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          style={{ fontWeight: locale === code ? "bold" : "normal", fontSize: 12 }}
        >
          {label}
        </button>
      ))}
    </span>
  );
}
