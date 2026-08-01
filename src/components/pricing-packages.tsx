import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import { getPricing } from "@/lib/checkout";

/**
 * Publishes the real rates from PricingConfig rather than hardcoded figures,
 * so a change in /admin/pricing is reflected here immediately and the landing
 * page can never quote a price checkout won't honour.
 */
export async function PricingPackages() {
  const t = await getTranslations("home");
  const format = await getFormatter();
  const pricing = await getPricing();

  const rwf = (amount: number) => `${format.number(amount)} RWF`;

  const packages = [
    {
      key: "basic",
      name: t("packageBasicName"),
      note: t("packageBasicNote"),
      price: rwf(pricing.payPerBoost),
      href: "/post",
      cta: t("packageBasicCta"),
      variant: "btn-outline",
      highlight: false,
    },
    {
      key: "annual",
      name: t("packageAnnualName"),
      note: t("packageAnnualNote"),
      price: rwf(pricing.annualSubscription),
      href: "/post",
      cta: t("packageAnnualCta"),
      variant: "btn-primary",
      highlight: true,
    },
    {
      key: "boost",
      name: t("packageBoostName"),
      note: t("packageBoostNote"),
      price: rwf(pricing.subscriberBoostDiscount),
      href: "/dashboard",
      cta: t("packageBoostCta"),
      variant: "btn-accent",
      highlight: false,
    },
  ];

  return (
    <section aria-labelledby="pricing-heading" className="mt-16">
      <div className="text-center">
        <h2 id="pricing-heading" className="text-2xl font-bold tracking-tight text-foreground">
          {t("pricingTitle")}
        </h2>
        <p className="page-subtitle">{t("pricingSubtitle")}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {packages.map((pkg) => (
          <div
            key={pkg.key}
            className={`card flex flex-col text-center ${pkg.highlight ? "border-primary" : ""}`}
          >
            <h3 className="font-bold text-foreground">{pkg.name}</h3>
            <p className="mt-1 text-xs text-muted">{pkg.note}</p>
            <p className="mt-3 text-2xl font-bold text-primary">{pkg.price}</p>
            <Link href={pkg.href} className={`${pkg.variant} mt-4 w-full`}>
              {pkg.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
