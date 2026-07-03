import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service — Amatangazo" };

/**
 * PLACEHOLDER — pending the Phase C legal review (legal:compliance-check +
 * counsel). Not legally binding copy. Structure is in place so the route,
 * footer link, and layout ship now; the wording is filled in before launch.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-6 rounded-lg border border-accent bg-accent/10 px-4 py-3 text-sm text-foreground">
        Draft — placeholder terms pending legal review. Not the final agreement.
      </div>
      <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
      <div className="mt-6 space-y-5 text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">1. About Amatangazo</h2>
          <p className="mt-1 text-muted">
            Amatangazo is a self-service marketplace operated by GetRwanda Ltd for publishing jobs, tenders,
            auction notices, and classified listings in Rwanda.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">2. Posting and payment</h2>
          <p className="mt-1 text-muted">
            Listings are published after payment via mobile money or under an active subscription. Pricing is shown
            at checkout. Refunds are handled case by case by our moderation team.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">3. Acceptable use</h2>
          <p className="mt-1 text-muted">
            Listings must be lawful and accurate. We may edit, reject, or remove content that is fraudulent,
            misleading, or otherwise in breach of these terms.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">4. Government tender notices</h2>
          <p className="mt-1 text-muted">
            Some tender listings are mirrored from public sources (e.g. Umucyo) with attribution and a link to the
            original notice. Always verify details against the official source.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">5. Contact</h2>
          <p className="mt-1 text-muted">Questions about these terms: info@amatangazo.com</p>
        </section>
      </div>
    </main>
  );
}
