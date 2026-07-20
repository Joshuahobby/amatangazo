"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export function Newsletter() {
  const t = useTranslations("home");

  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center sm:px-12 sm:py-16"
      >
        <div className="relative z-10">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("newsletterTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80 sm:text-base">
            {t("newsletterDescription")}
          </p>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder={t("newsletterEmailPlaceholder")}
              aria-label={t("newsletterEmailPlaceholder")}
              className="min-w-0 flex-1 rounded-lg border border-white/30 bg-white/15 px-4 py-3 text-sm text-white placeholder:text-white/70 transition-colors focus:border-white/60 focus:bg-white/20"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
            >
              {t("newsletterSubscribe")}
            </button>
          </form>
        </div>
      </motion.div>
    </section>
  );
}
