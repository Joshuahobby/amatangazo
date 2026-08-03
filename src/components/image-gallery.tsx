"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

export function ImageGallery({ images, alt }: { images: { url: string }[]; alt: string }) {
  const t = useTranslations("listing");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  const current = images[index];

  return (
    <>
      <div className="my-4 flex gap-2 overflow-x-auto">
        {images.map((img, i) => (
          <button
            key={img.url}
            type="button"
            onClick={() => { setIndex(i); setOpen(true); }}
            className="shrink-0 overflow-hidden rounded-xl border border-border shadow-sm transition-opacity hover:opacity-90"
          >
            <Image src={img.url} alt={`${alt} ${i + 1}`} width={256} height={192} className="h-48 w-64 object-cover" />
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("galleryLabel")}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
            aria-label={tc("close")}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIndex((i) => (i === 0 ? images.length - 1 : i - 1)); }}
                className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                aria-label={t("galleryPrevious")}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIndex((i) => (i === images.length - 1 ? 0 : i + 1)); }}
                className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                aria-label={t("galleryNext")}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <Image
            src={current.url}
            alt={`${alt} ${index + 1}`}
            width={1200}
            height={900}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-4 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                  className={`h-2 w-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"}`}
                  aria-label={t("galleryGoTo", { number: i + 1 })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
