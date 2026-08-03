"use client";

import { useTranslations } from "next-intl";

import { pawapayProviders, type PawaPayProvider } from "@/lib/pawapay";

/** Display metadata for the mobile-money providers. Brand names aren't translated. */
const PROVIDER_META: Record<PawaPayProvider, { label: string; color: string }> = {
  MTN_MOMO_RWA: { label: "MTN Mobile Money", color: "var(--pay-mtn)" },
  AIRTEL_RWA: { label: "Airtel Money", color: "var(--pay-airtel)" },
};

/**
 * Provider picker + payer phone number — the two inputs every PawaPay deposit
 * needs. Shared by the checkout page and the boost button so a paid boost asks
 * for payment exactly the way publishing does; both post to
 * `initiateBoostCheckout`/`initiateCheckout`, so they're the same flow.
 *
 * Labels come from the `checkout` namespace for that reason: a paid boost *is*
 * a checkout, and duplicating "Provider"/"Phone number" into a second namespace
 * would just be two strings to keep in sync.
 */
export function MobileMoneyFields({
  provider,
  onProviderChange,
  phoneNumber,
  onPhoneNumberChange,
}: {
  provider: PawaPayProvider;
  onProviderChange: (provider: PawaPayProvider) => void;
  phoneNumber: string;
  onPhoneNumberChange: (phoneNumber: string) => void;
}) {
  const t = useTranslations("checkout");

  return (
    <>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-foreground">{t("provider")}</legend>
        <div className="mt-1 flex gap-3">
          {pawapayProviders.map((p) => (
            <label
              key={p}
              className={`card flex flex-1 cursor-pointer items-center gap-2 ${provider === p ? "border-primary" : ""}`}
            >
              <input
                type="radio"
                name="provider"
                checked={provider === p}
                onChange={() => onProviderChange(p)}
                className="sr-only"
              />
              <span
                className="inline-block h-8 w-8 shrink-0 rounded-full"
                style={{ backgroundColor: PROVIDER_META[p].color }}
                aria-hidden
              />
              <span className="text-sm font-medium text-foreground">{PROVIDER_META[p].label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field mt-3">
        {t("phoneNumber")}
        <input
          value={phoneNumber}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          inputMode="numeric"
          placeholder="2507XXXXXXXX"
          className="input font-normal"
        />
      </label>
    </>
  );
}
