"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function AuthStatus() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const t = useTranslations("common");

  if (isPending) return null;

  if (!session) {
    return (
      <Link href="/login" className="link">
        {t("login")}
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <Link href="/dashboard" className="link">
        {t("dashboard")}
      </Link>
      <span className="text-muted">{session.user.name || session.user.email}</span>
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          router.push("/login");
          router.refresh();
        }}
        className="btn-outline btn-sm"
      >
        {t("signOut")}
      </button>
    </span>
  );
}
