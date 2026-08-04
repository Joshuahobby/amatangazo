import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getNow, getTranslations } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Amatangazo — jobs, tenders, auctions & classifieds in Rwanda",
  description: "Rwanda's self-service marketplace for jobs, tenders, auctions and classifieds.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const t = await getTranslations("nav");
  // Pass a single reference time to client components so relativeTime() on
  // listing cards is stable across SSR/hydration (otherwise next-intl warns
  // ENVIRONMENT_FALLBACK and re-derives `now` on every card).
  const now = await getNow();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider now={now}>
          {/* First tab stop on every page. The header carries the nav, the
              language switcher and — on mobile — a five-item bottom bar, so
              without this a keyboard or switch user tabbed through the same
              dozen controls before reaching the page they asked for.
              z-60 clears the sticky header's z-50 once it is revealed. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-contrast"
          >
            {t("skipToContent")}
          </a>
          <SiteHeader />
          {/* tabIndex={-1} so the skip link actually moves focus here rather
              than only scrolling — a plain <div> is not a focus target. Pages
              render their own <main> inside this wrapper. */}
          <div id="main" tabIndex={-1} className="flex-1 pb-20 lg:pb-0">
            {children}
          </div>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
