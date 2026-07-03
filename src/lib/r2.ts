import { S3Client } from "@aws-sdk/client-s3";

/**
 * T0.5 (Cloudflare R2 bucket + upload utility) hasn't run yet, so these env
 * vars won't be set until it does — this client just needs to exist and be
 * correctly wired for when they are.
 */
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "";
export const R2_PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL_BASE ?? "";

export function isR2Configured() {
  return Boolean(accountId && accessKeyId && secretAccessKey && R2_BUCKET_NAME && R2_PUBLIC_URL_BASE);
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: accessKeyId ?? "",
    secretAccessKey: secretAccessKey ?? "",
  },
});
