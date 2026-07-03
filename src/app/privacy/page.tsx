import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — Amatangazo" };

/**
 * PLACEHOLDER — pending the Phase C legal review against Rwanda's data
 * protection law (Law No. 058/2021) via legal:compliance-check + counsel.
 * Not legally binding copy; ships now so the route and footer link exist.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 rounded-lg border border-accent bg-accent/10 px-4 py-3 text-sm text-foreground">
        Draft — placeholder policy pending a data-protection review (Rwanda Law No. 058/2021).
      </div>
      <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
      <div className="mt-6 space-y-5 text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">What we collect</h2>
          <p className="mt-1 text-muted">
            Account details you provide (name, phone number, email, business name), the listings you post, and
            payment references needed to process mobile-money transactions.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">How we use it</h2>
          <p className="mt-1 text-muted">
            To publish your listings, process payments, send the notifications you opt into (SMS/WhatsApp/email
            alerts for saved searches), verify businesses, and prevent fraud and abuse.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Sharing</h2>
          <p className="mt-1 text-muted">
            We share data only with service providers needed to run the platform (payments, messaging, hosting).
            We do not sell your personal data.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Your rights</h2>
          <p className="mt-1 text-muted">
            You may request access to, correction of, or deletion of your personal data. Contact
            privacy@amatangazo.com.
          </p>
        </section>
      </div>
    </main>
  );
}
