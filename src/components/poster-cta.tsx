import { getTranslations } from "next-intl/server";
import Link from "next/link";

/*
 * Closing beat of the homepage: the revenue-side pitch. The rest of the page
 * serves seekers/buyers; this band speaks to posters (sellers, employers,
 * tender issuers) with the concrete price anchor (RWF 10,000 → publish + 24h
 * featured) and the mobile-money rails they already trust. Flat accent-tinted
 * surface — no gradient/glass — so it reads as premium without fighting the
 * brand. Server component: static copy, no interactivity.
 */
export async function PosterCta() {
  const t = await getTranslations("home");

  return (
    <section className="mt-16 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start gap-5 rounded-2xl border border-accent/40 bg-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {t("posterTitle")}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("posterText")}</p>
        </div>
        <Link href="/post" className="btn-primary btn-lg w-full shrink-0 sm:w-auto">
          {t("posterCta")}
        </Link>
      </div>
    </section>
  );
}
