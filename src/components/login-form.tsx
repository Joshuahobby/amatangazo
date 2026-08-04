"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { StatusMessage } from "@/components/status-message";
import { authClient } from "@/lib/auth-client";
import { isDevEnvironment } from "@/lib/env";

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
  const codeRef = useRef<HTMLInputElement>(null);

  // Advancing to the code step swaps the form's contents but leaves focus on a
  // Send button that no longer exists. Move it to the field now being asked
  // for, so a keyboard or screen-reader user is told what changed and lands
  // where they need to type.
  useEffect(() => {
    if (step === "enterCode") codeRef.current?.focus();
  }, [step]);

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
      setGoogleError(data.error ?? "Test sign-in failed");
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
    <main className="page-sm">
      <h1 className="page-title text-center">{t("title")}</h1>

      <section className="mt-8">
        {googleConfigured ? (
          <button type="button" onClick={handleGoogleSignIn} className="btn-outline w-full">
            {t("signInWithGoogle")}
          </button>
        ) : (
          isDevEnvironment && (
            <form onSubmit={handleSimulateGoogleSignIn} className="flex flex-col gap-2">
              <p className="text-xs text-muted">
                Google sign-in isn&apos;t set up in this environment. Sign in as a test user instead:
              </p>
              {/* Dev-only block, so the copy stays English like the checkout
                  and boost sandbox blocks rather than earning locale keys. */}
              <label className="field">
                Email
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  required
                  className="input font-normal"
                />
              </label>
              <label className="field">
                Name (optional)
                <input
                  type="text"
                  autoComplete="name"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  className="input font-normal"
                />
              </label>
              <StatusMessage tone="error">{googleError}</StatusMessage>
              <button type="submit" disabled={googleSubmitting} className="btn-outline">
                Sign in as test user
              </button>
            </form>
          )
        )}
      </section>

      <div className="my-6 border-t border-border" />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">{t("orUseEmail")}</h2>
        {step === "enterEmail" && (
          <form onSubmit={handleSendCode} className="flex flex-col gap-2">
            <label className="field">
              {t("emailLabel")}
              <input
                type="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={error ? true : undefined}
                aria-describedby="login-email-error"
                className="input font-normal"
              />
            </label>
            <StatusMessage tone="error" id="login-email-error">{error}</StatusMessage>
            <button type="submit" disabled={submitting} className="btn-primary">
              {t("sendCode")}
            </button>
          </form>
        )}
        {step === "enterCode" && (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-2">
            {devCode && <p className="text-xs text-muted">Dev mode — your code is {devCode}</p>}
            <label className="field">
              {t("codeLabel")}
              <input
                ref={codeRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                placeholder={t("codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                aria-invalid={error ? true : undefined}
                aria-describedby="login-code-error"
                className="input font-normal"
              />
            </label>
            <StatusMessage tone="error" id="login-code-error">{error}</StatusMessage>
            <button type="submit" disabled={submitting} className="btn-primary">
              {t("verify")}
            </button>
          </form>
        )}
      </section>

      <p className="mt-6 text-center text-sm">
        <Link href="/login/phone" className="link">
          {t("usePhoneInstead")}
        </Link>
      </p>
    </main>
  );
}
