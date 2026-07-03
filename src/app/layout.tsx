import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthStatus } from "@/components/auth-status";
import { LanguageSwitcher } from "@/components/language-switcher";

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

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, padding: 8 }}>
            <LanguageSwitcher />
            <AuthStatus />
          </div>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
