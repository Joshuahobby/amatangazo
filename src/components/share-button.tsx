"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export function ShareButton() {
  const t = useTranslations("listing");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(window.location.href)
          .then(() => {
            // Swapped label rather than a toast — the same transient-state
            // convention the submit buttons use.
            setCopied(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {});
      }}
      className="btn-outline btn-sm"
    >
      {copied ? t("linkCopied") : t("copyLink")}
    </button>
  );
}
