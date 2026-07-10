"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const TESTIMONIALS = [
  { key: "Employer", initials: "JH", color: "bg-cat-job" },
  { key: "Recruiter", initials: "AU", color: "bg-cat-tender" },
  { key: "Seeker", initials: "DM", color: "bg-cat-auction" },
] as const;

function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} stars`}>
      {Array.from({ length: rating }).map((_, i) => (
        <svg key={i} className="h-3.5 w-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export function Testimonials() {
  const t = useTranslations("home");

  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("testimonialsTitle")}
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {TESTIMONIALS.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
              <StarRating />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
                &ldquo;{t(`testimonial${item.key}Text`)}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${item.color}`}
                  aria-hidden
                >
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t(`testimonial${item.key}Name`)}</p>
                  <p className="text-xs text-muted">{t(`testimonial${item.key}Role`)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
