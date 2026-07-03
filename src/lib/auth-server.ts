import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, phoneNumber } from "better-auth/plugins";

import { sendOtpEmail } from "@/lib/email";
import { isGoogleConfigured } from "@/lib/google-auth";
import { prisma } from "@/lib/prisma";
import { linkReferralOnSignup } from "@/lib/referrals";
import { sendOtpSms } from "@/lib/sms";
import { REFERRAL_COOKIE } from "@/proxy";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  advanced: {
    database: { generateId: "uuid" },
  },

  user: {
    modelName: "User",
    additionalFields: {
      businessName: { type: "string", required: false, input: false },
      accountType: { type: "string", required: false, input: false, defaultValue: "INDIVIDUAL" },
      isAdmin: { type: "boolean", required: false, input: false, defaultValue: false },
      preferredLanguage: { type: "string", required: false, input: false, defaultValue: "EN" },
    },
  },

  databaseHooks: {
    user: {
      create: {
        async after(user, context) {
          const referralCode = context?.getCookie(REFERRAL_COOKIE);
          if (referralCode) await linkReferralOnSignup(user.id, referralCode);
        },
      },
    },
  },

  // Registering the Google provider unconditionally with empty credentials
  // would make Better Auth attempt (and fail) a real OAuth redirect. Only
  // wire it up once real credentials exist (Epic 7/T0.6) — until then the
  // UI falls back to /api/dev/simulate-google-login.
  socialProviders: isGoogleConfigured()
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOtpEmail(email, otp, type);
      },
    }),
    phoneNumber({
      async sendOTP({ phoneNumber, code }) {
        await sendOtpSms(phoneNumber, code);
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => `${phoneNumber.replace(/[^\d]/g, "")}@phone.amatangazo.local`,
      },
    }),
  ],
});
