import { useTranslations } from "next-intl";

/*
 * Shared listing badges — the one place category/featured/verified/status
 * chips are composed, so every surface renders (and translates) them the
 * same way. Safe in both server and client components.
 */

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  JOB: "badge-cat-job",
  TENDER: "badge-cat-tender",
  AUCTION: "badge-cat-auction",
  CLASSIFIED: "badge-cat-classified",
};

export function CategoryBadge({ category }: { category: string }) {
  const t = useTranslations("browse");
  return <span className={CATEGORY_BADGE_CLASSES[category] ?? "badge-neutral"}>{t(`category${category}`)}</span>;
}

export function FeaturedBadge() {
  const t = useTranslations("common");
  return <span className="badge-featured">★ {t("featured")}</span>;
}

export function VerifiedBadge() {
  const t = useTranslations("listing");
  return <span className="badge-verified">✓ {t("verified")}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("common");
  return <span className={status === "LIVE" ? "badge-status" : "badge-danger"}>{t(`status${status}`)}</span>;
}
