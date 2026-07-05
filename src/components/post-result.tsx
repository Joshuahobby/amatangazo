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
    <div className="card mt-4">
      <p className="text-sm text-foreground">
        {t.rich("createdAsDraft", { b: (chunks) => <strong>{chunks}</strong> })}
      </p>
      <div className="mt-3 flex gap-3">
        <Link href={`/checkout/${listingId}`} className="btn-primary btn-sm">
          {t("continueToCheckout")}
        </Link>
        <Link href={`/listings/${listingId}`} className="btn-outline btn-sm">
          {t("previewListing")}
        </Link>
      </div>
      {categoriesWithImages.includes(category) && <ImageUpload listingId={listingId} />}
    </div>
  );
}
