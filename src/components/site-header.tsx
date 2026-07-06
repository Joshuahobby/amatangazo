import { getTranslations } from "next-intl/server";
import Form from "next/form";
import Link from "next/link";

import { AuthStatus } from "@/components/auth-status";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          Amatangazo
        </Link>
        {/* order-last wraps the nav onto its own full-width row on small screens. */}
        <nav
          aria-label={t("main")}
          className="order-last flex w-full items-center gap-4 text-sm sm:order-none sm:w-auto sm:flex-1"
        >
          <Link href="/listings" className="font-medium text-foreground hover:text-primary">
            {t("browse")}
          </Link>
          <Link href="/post" className="font-medium text-foreground hover:text-primary">
            {t("post")}
          </Link>
          <Form action="/listings" role="search" className="ml-auto min-w-0 flex-1 sm:max-w-56">
            <input
              type="search"
              name="q"
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="input"
            />
          </Form>
        </nav>
        <span className="ml-auto flex items-center gap-4 text-sm">
          <LanguageSwitcher />
          <AuthStatus />
        </span>
      </div>
    </header>
  );
}
