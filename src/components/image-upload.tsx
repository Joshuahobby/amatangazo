"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

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
        setError(presignData.error ?? "Could not start upload");
        return;
      }

      const putRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        setError("Upload to storage failed");
        return;
      }

      const attachRes = await fetch(`/api/listings/${listingId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: presignData.publicUrl }),
      });
      const attachData = await attachRes.json();
      if (!attachRes.ok) {
        setError(attachData.error ?? "Could not attach image");
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
    <div style={{ marginTop: 16 }}>
      <label>
        {t("addPhoto")}
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ display: "block" }} />
      </label>
      {uploading && <p>Uploading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {images.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {images.map((image) => (
            <div key={image.id} style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- R2 URLs, not part of Next's image optimization domain list yet */}
              <img src={image.url} alt="" style={{ height: 100, borderRadius: 4 }} />
              <button type="button" onClick={() => handleDelete(image.id)} style={{ position: "absolute", top: 2, right: 2 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
