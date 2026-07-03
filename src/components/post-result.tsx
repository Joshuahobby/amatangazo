"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { ImageUpload } from "@/components/image-upload";
import type { listingCategories } from "@/lib/validations/listing";

const categoriesWithImages: (typeof listingCategories)[number][] = ["AUCTION", "CLASSIFIED"];

export function PostResult({
  listingId,
  category,
}: {
  listingId: string;
  category: (typeof listingCategories)[number];
}) {
  const t = useTranslations("post");
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginTop: 16 }}>
      <p>
        {t.rich("createdAsDraft", { b: (chunks) => <strong>{chunks}</strong> })}
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href={`/checkout/${listingId}`}>{t("continueToCheckout")}</Link>
        <Link href={`/listings/${listingId}`}>{t("previewListing")}</Link>
      </div>
      {categoriesWithImages.includes(category) && <ImageUpload listingId={listingId} />}
    </div>
  );
}
