"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

type Step = "enterPhone" | "enterCode";

export default function PhoneLoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [step, setStep] = useState<Step>("enterPhone");
  const [phoneNumber, setPhoneNumber] = useState("2507");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: sendError } = await authClient.phoneNumber.sendOtp({ phoneNumber });
    setSubmitting(false);
    if (sendError) {
      setError(sendError.message ?? t("couldNotSendCode"));
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      const dev = await fetch(`/api/dev/last-otp?phoneNumber=${encodeURIComponent(phoneNumber)}`).then((r) =>
        r.json(),
      );
      setDevCode(dev.code);
    }
    setStep("enterCode");
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: verifyError } = await authClient.phoneNumber.verify({ phoneNumber, code });
    setSubmitting(false);
    if (verifyError) {
      setError(verifyError.message ?? t("invalidCode"));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="page-sm">
      <h1 className="page-title text-center">{t("phoneTitle")}</h1>

      {step === "enterPhone" && (
        <form onSubmit={handleSendCode} className="mt-8 flex flex-col gap-2">
          <input
            type="tel"
            placeholder="2507XXXXXXXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="input"
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary">
            {t("sendCode")}
          </button>
        </form>
      )}
      {step === "enterCode" && (
        <form onSubmit={handleVerifyCode} className="mt-8 flex flex-col gap-2">
          {devCode && <p className="text-xs text-muted">Dev mode — your code is {devCode}</p>}
          <input
            type="text"
            placeholder={t("codePlaceholder")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="input"
          />
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary">
            {t("verify")}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="link">
          {t("backToLogin")}
        </Link>
      </p>
    </main>
  );
}
