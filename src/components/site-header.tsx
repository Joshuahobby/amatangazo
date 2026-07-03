import Link from "next/link";

import { AuthStatus } from "@/components/auth-status";
import { LanguageSwitcher } from "@/components/language-switcher";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          Amatangazo
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <LanguageSwitcher />
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
