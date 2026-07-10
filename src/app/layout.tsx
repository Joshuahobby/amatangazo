import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getNow } from "next-intl/server";
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
          <SiteHeader />
          <div className="flex-1 pb-20 lg:pb-0">{children}</div>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
