import { getTranslations } from "next-intl/server";
import Link from "next/link";

const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP?.replace(/[^\d]/g, "");

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-1">
            <p className="text-lg font-bold tracking-tight text-primary">Amatangazo</p>
            <p className="mt-2 max-w-xs text-sm text-muted">{t("tagline")}</p>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Coming soon</p>
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs text-muted">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  App Store
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs text-muted">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M3 3v18h18V3H3zm15 5h-2.42v3.33H13v3.33h-2.58V8H8V6h10v2z" />
                  </svg>
                  Google Play
                </div>
              </div>
            </div>
          </div>

          <nav aria-label={t("sectionPlatform")} className="text-sm">
            <p className="font-semibold text-foreground">{t("sectionPlatform")}</p>
            <ul className="mt-3 flex flex-col gap-2 text-muted">
              <li><Link href="/listings?category=JOB" className="hover:text-foreground">{t("platformJobs")}</Link></li>
              <li><Link href="/listings?category=TENDER" className="hover:text-foreground">{t("platformTenders")}</Link></li>
              <li><Link href="/listings?category=AUCTION" className="hover:text-foreground">{t("platformAuctions")}</Link></li>
              <li><Link href="/listings?category=CLASSIFIED" className="hover:text-foreground">{t("platformBusinesses")}</Link></li>
            </ul>
          </nav>

          <nav aria-label={t("sectionSupport")} className="text-sm">
            <p className="font-semibold text-foreground">{t("sectionSupport")}</p>
            <ul className="mt-3 flex flex-col gap-2 text-muted">
              <li><Link href="/listings" className="hover:text-foreground">{t("supportHelpCenter")}</Link></li>
              <li>{SUPPORT_WHATSAPP ? (
                <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{t("contactPrompt")}</a>
              ) : <span>{t("contactPrompt")}</span>}</li>
              <li><Link href="/saved-searches" className="hover:text-foreground">{t("supportFaqs")}</Link></li>
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

          <nav aria-label={t("sectionCompanyFull")} className="text-sm">
            <p className="font-semibold text-foreground">{t("sectionCompanyFull")}</p>
            <ul className="mt-3 flex flex-col gap-2 text-muted">
              <li><Link href="/" className="hover:text-foreground">{t("companyAbout")}</Link></li>
              <li><Link href="/post" className="hover:text-foreground">{t("companyAdvertise")}</Link></li>
              <li><Link href="/verification" className="hover:text-foreground">{t("companyCareers")}</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted sm:flex-row">
          <p>© {year} GetRwanda Ltd · Amatangazo · {t("rightsReserved")}</p>

          <div className="flex items-center gap-4" aria-label="Social media">
            <a href="#" aria-label="Twitter" className="text-muted transition-colors hover:text-primary">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn" className="text-muted transition-colors hover:text-primary">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a href="#" aria-label="Facebook" className="text-muted transition-colors hover:text-primary">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
