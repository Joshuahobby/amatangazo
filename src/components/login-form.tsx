"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

type Step = "enterEmail" | "enterCode";

export function LoginForm({ googleConfigured }: { googleConfigured: boolean }) {
  const router = useRouter();
  const t = useTranslations("auth");

  const [devEmail, setDevEmail] = useState("");
  const [devName, setDevName] = useState("");
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("enterEmail");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogleSignIn() {
    await authClient.signIn.social({ provider: "google", callbackURL: "/" });
  }

  async function handleSimulateGoogleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setGoogleSubmitting(true);
    setGoogleError(null);
    const res = await fetch("/api/dev/simulate-google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: devEmail, name: devName || undefined }),
    });
    setGoogleSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setGoogleError(data.error ?? "Simulated Google sign-in failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setSubmitting(false);
    if (sendError) {
      setError(sendError.message ?? t("couldNotSendCode"));
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      const dev = await fetch(`/api/dev/last-otp?email=${encodeURIComponent(email)}`).then((r) => r.json());
      setDevCode(dev.code);
    }
    setStep("enterCode");
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: verifyError } = await authClient.signIn.emailOtp({ email, otp: code });
    setSubmitting(false);
    if (verifyError) {
      setError(verifyError.message ?? t("invalidCode"));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 400, margin: "3rem auto", fontFamily: "sans-serif" }}>
      <h1>{t("title")}</h1>

      <section style={{ marginBottom: 24 }}>
        {googleConfigured ? (
          <button type="button" onClick={handleGoogleSignIn} style={{ width: "100%" }}>
            {t("signInWithGoogle")}
          </button>
        ) : (
          <form onSubmit={handleSimulateGoogleSignIn} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 13, color: "#666" }}>
              Google isn&apos;t configured yet (T0.6) — simulate a Google sign-in instead:
            </p>
            <input
              type="email"
              placeholder="you@example.com"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={devName}
              onChange={(e) => setDevName(e.target.value)}
            />
            {googleError && <p style={{ color: "red" }}>{googleError}</p>}
            <button type="submit" disabled={googleSubmitting}>
              Simulate Google sign-in
            </button>
          </form>
        )}
      </section>

      <hr />

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16 }}>{t("orUseEmail")}</h2>
        {step === "enterEmail" && (
          <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit" disabled={submitting}>
              {t("sendCode")}
            </button>
          </form>
        )}
        {step === "enterCode" && (
          <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {devCode && (
              <p style={{ fontSize: 13, color: "#666" }}>Dev mode — your code is {devCode}</p>
            )}
            <input
              type="text"
              placeholder={t("codePlaceholder")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit" disabled={submitting}>
              {t("verify")}
            </button>
          </form>
        )}
      </section>

      <p style={{ marginTop: 24, fontSize: 13 }}>
        <Link href="/login/phone">{t("usePhoneInstead")}</Link>
      </p>
    </main>
  );
}
