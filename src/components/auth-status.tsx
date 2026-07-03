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
      <span style={{ fontFamily: "sans-serif", fontSize: 13 }}>
        <Link href="/login">{t("login")}</Link>
      </span>
    );
  }

  return (
    <span style={{ fontFamily: "sans-serif", fontSize: 13 }}>
      <Link href="/dashboard" style={{ marginRight: 8 }}>{t("dashboard")}</Link>
      {session.user.name || session.user.email}{" "}
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          router.push("/login");
          router.refresh();
        }}
      >
        {t("signOut")}
      </button>
    </span>
  );
}
