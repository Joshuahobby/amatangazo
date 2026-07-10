"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    title: "Find",
    description: "Browse jobs, tenders, auctions or classifieds that match your needs.",
  },
  {
    number: "02",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Apply or Bid",
    description: "Submit your application or place your bid directly through the platform.",
  },
  {
    number: "03",
    icon: "M5 13l4 4L19 7",
    title: "Get Hired or Win",
    description: "Connect with employers or sellers and complete the deal.",
  },
] as const;

export function HowItWorks() {

  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          How It Works
        </h2>
        <p className="mt-2 text-sm text-muted">
          Find opportunities, apply or bid, and succeed — in three simple steps.
        </p>
      </div>

      <div className="relative grid gap-8 sm:grid-cols-3">
        {/* Connecting line */}
        <div className="absolute left-[20%] right-[20%] top-12 hidden h-px border-t-2 border-dashed border-border sm:block" aria-hidden />

        {STEPS.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="relative flex flex-col items-center text-center"
          >
            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.icon} />
              </svg>
              <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-contrast shadow-sm">
                {step.number}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
