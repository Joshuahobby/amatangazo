import { getTranslations } from "next-intl/server";

/**
 * Prominent "how to reach the seller" CTA. Used by classified and auction detail
 * pages. Contact values are poster-provided (never the auth phone), so this
 * renders ungated. WhatsApp numbers are normalised to wa.me digit form.
 */
function toWhatsappDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Rwandan local "07…" → "2507…"; leave already-international numbers as-is.
  if (digits.startsWith("0")) return `250${digits.slice(1)}`;
  return digits;
}

export async function ContactSeller({
  title,
  phone,
  whatsapp,
  email,
  listingTitle,
}: {
  title: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  listingTitle: string;
}) {
  const t = await getTranslations("listing");
  if (!phone && !whatsapp && !email) return null;

  const waHref = whatsapp
    ? `https://wa.me/${toWhatsappDigits(whatsapp)}?text=${encodeURIComponent(t("contactMessage", { title: listingTitle }))}`
    : null;

  return (
    <section className="card my-4 border-primary/30 bg-primary/5">
      <p className="mb-3 font-semibold text-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {phone && (
          <a href={`tel:${phone}`} className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {t("callLabel")} {phone}
          </a>
        )}
        {waHref && (
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn-outline">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {t("whatsapp")}
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className="btn-outline">
            {t("email")}
          </a>
        )}
      </div>
    </section>
  );
}
