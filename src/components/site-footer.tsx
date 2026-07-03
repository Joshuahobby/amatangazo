import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} GetRwanda Ltd · Amatangazo</p>
        <nav className="flex gap-4">
          <Link href="/listings" className="hover:text-foreground">
            {t("browse")}
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            {t("terms")}
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            {t("privacy")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
