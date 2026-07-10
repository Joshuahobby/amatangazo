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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-hover to-primary/80 px-6 py-12 text-center shadow-xl sm:px-12 sm:py-16"
      >
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent/10 blur-3xl" />

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
              className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 backdrop-blur-sm transition-all focus:border-white/40 focus:bg-white/15 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-contrast shadow-lg transition-all hover:bg-accent-hover hover:shadow-xl"
            >
              {t("newsletterSubscribe")}
            </button>
          </form>
        </div>
      </motion.div>
    </section>
  );
}
