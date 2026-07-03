import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/lib/auth";
import { isR2Configured, r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL_BASE } from "@/lib/r2";

const presignRequestSchema = z
  .object({
    filename: z.string().trim().min(1),
    contentType: z.string().trim(),
    purpose: z.enum(["listing-image", "verification-doc"]).default("listing-image"),
  })
  .refine(
    (data) =>
      data.purpose === "verification-doc"
        ? /^(image\/|application\/pdf$)/.test(data.contentType)
        : /^image\//.test(data.contentType),
    { message: "Unsupported content type for this purpose" },
  );

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Image uploads aren't configured yet (T0.5: Cloudflare R2 bucket + upload utility)" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = presignRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { filename, contentType, purpose } = parsed.data;
  const extension = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const prefix = purpose === "verification-doc" ? "verification" : "listings";
  const objectKey = `${prefix}/${userId}/${randomUUID()}${extension}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

  return NextResponse.json({
    uploadUrl,
    publicUrl: `${R2_PUBLIC_URL_BASE}/${objectKey}`,
  });
}
