import { getTranslations } from "next-intl/server";
import Link from "next/link";

const CATEGORIES = [
  { key: "JOB", titleKey: "jobTitle", href: "/post/job", color: "var(--cat-job)" },
  { key: "TENDER", titleKey: "tenderTitle", href: "/post/tender", color: "var(--cat-tender)" },
  { key: "AUCTION", titleKey: "auctionTitle", href: "/post/auction", color: "var(--cat-auction)" },
  { key: "CLASSIFIED", titleKey: "classifiedTitle", href: "/post/classified", color: "var(--cat-classified)" },
] as const;

export default async function PostChooserPage() {
  const t = await getTranslations("post");

  return (
    <main className="page">
      <h1 className="page-title">{t("chooserTitle")}</h1>
      <p className="page-subtitle">{t("chooserSubtitle")}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <Link key={cat.key} href={cat.href} className="group card transition-shadow hover:shadow-md">
            <span className="inline-block h-2 w-10 rounded-full" style={{ backgroundColor: cat.color }} aria-hidden />
            <span className="mt-3 block font-semibold text-foreground group-hover:text-primary">
              {t(cat.titleKey)}
            </span>
            <span className="mt-1 block text-sm text-muted">{t(`choose${cat.key}Desc`)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
