"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { StatusMessage } from "@/components/status-message";
import { describeApiError } from "@/lib/api-error";

type UploadedImage = { id: string; url: string };

export function ImageUpload({ listingId, initialImages = [] }: { listingId: string; initialImages?: UploadedImage[] }) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const t = useTranslations("post");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        // Validation failures answer with a Zod .flatten() object; rendering
        // one into JSX throws, so it has to be unwrapped to a string first.
        setError(describeApiError(presignData.error, t("uploadStartFailed")));
        return;
      }

      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        setError(t("uploadStorageFailed"));
        return;
      }

      const attachRes = await fetch(`/api/listings/${listingId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: presignData.publicUrl }),
      });
      const attachData = await attachRes.json();
      if (!attachRes.ok) {
        setError(describeApiError(attachData.error, t("uploadAttachFailed")));
        return;
      }

      setImages((prev) => [...prev, attachData.image]);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: string) {
    const res = await fetch(`/api/listings/${listingId}/images/${imageId}`, { method: "DELETE" });
    if (res.ok) setImages((prev) => prev.filter((image) => image.id !== imageId));
  }

  return (
    <div className="mt-4">
      <label className="field">
        {t("addPhoto")}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="text-sm font-normal text-muted"
        />
      </label>
      <StatusMessage tone="info" className="mt-1 text-sm text-muted">
        {uploading ? t("uploading") : null}
      </StatusMessage>
      <StatusMessage tone="error" className="mt-1 form-error">{error}</StatusMessage>
      {images.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- R2 URLs, not part of Next's image optimization domain list yet */}
              <img src={image.url} alt="" className="h-24 rounded-lg border border-border object-cover" />
              {/* Was a bare "×" at 20px: announced as "× button" with no idea
                  what it removed, and below the 24px minimum tap target. */}
              <button
                type="button"
                onClick={() => handleDelete(image.id)}
                aria-label={t("removePhoto")}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/70 text-xs text-white"
              >
                <span aria-hidden>×</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
