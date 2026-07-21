import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";

const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP?.replace(/[^\d]/g, "");

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Brand spans two columns so the four link columns fill the rest of the
            six-column grid evenly (no dead column on the right). */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-2">
            <p className="text-lg font-bold tracking-tight text-primary">Amatangazo</p>
            <p className="mt-2 max-w-xs text-sm text-muted">{t("tagline")}</p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs text-muted">
              <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
              </svg>
              {t("noAppNeeded")}
            </div>
          </div>

          <nav aria-label={t("sectionPlatform")} className="text-sm">
            <p className="font-semibold text-foreground">{t("sectionPlatform")}</p>
            <ul className="mt-3 flex flex-col gap-2 text-muted">
              <li><Link href="/listings?category=JOB" className="hover:text-foreground">{t("platformJobs")}</Link></li>
              <li><Link href="/listings?category=TENDER" className="hover:text-foreground">{t("platformTenders")}</Link></li>
              <li><Link href="/listings?category=AUCTION" className="hover:text-foreground">{t("platformAuctions")}</Link></li>
              <li><Link href="/listings?category=CLASSIFIED" className="hover:text-foreground">{t("platformClassifieds")}</Link></li>
            </ul>
          </nav>

          <nav aria-label={t("sectionCompanyFull")} className="text-sm">
            <p className="font-semibold text-foreground">{t("sectionCompanyFull")}</p>
            <ul className="mt-3 flex flex-col gap-2 text-muted">
              <li><Link href="/post" className="hover:text-foreground">{t("companyAdvertise")}</Link></li>
              <li><Link href="/verification" className="hover:text-foreground">{t("verification")}</Link></li>
              <li><Link href="/referrals" className="hover:text-foreground">{t("referrals")}</Link></li>
            </ul>
          </nav>

          <nav aria-label={t("sectionSupport")} className="text-sm">
            <p className="font-semibold text-foreground">{t("sectionSupport")}</p>
            <ul className="mt-3 flex flex-col gap-2 text-muted">
              <li><Link href="/listings" className="hover:text-foreground">{t("browse")}</Link></li>
              <li>{SUPPORT_WHATSAPP ? (
                <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{t("contactPrompt")}</a>
              ) : <span>{t("contactPrompt")}</span>}</li>
            </ul>
          </nav>

          <nav aria-label={t("sectionLegal")} className="text-sm">
            <p className="font-semibold text-foreground">{t("sectionLegal")}</p>
            <ul className="mt-3 flex flex-col gap-2 text-muted">
              <li><Link href="/privacy" className="hover:text-foreground">{t("legalPrivacy")}</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">{t("legalTerms")}</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">{t("legalCookies")}</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted sm:flex-row">
          <p>© {year} GetRwanda Ltd · Amatangazo · {t("rightsReserved")}</p>
          <LanguageSwitcher up />
        </div>
      </div>
    </footer>
  );
}
