"use client";

import { useTranslations } from "next-intl";

import { useFavorites } from "@/hooks/use-favorites";

export function SaveButton({ listingId }: { listingId: string }) {
  const { isFavorited, toggle } = useFavorites();
  const t = useTranslations("listing");
  const saved = isFavorited(listingId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(listingId);
      }}
      aria-label={saved ? t("removeFromSaved") : t("saveListing")}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        saved
          ? "bg-danger-surface text-danger"
          : "bg-white/80 text-muted hover:bg-white hover:text-foreground"
      }`}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
