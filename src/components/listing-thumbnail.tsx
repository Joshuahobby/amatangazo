import { CategoryIcon, CATEGORY_COLOR_VAR } from "@/components/category-icon";

type ThumbnailData = {
  title: string;
  category: string;
  images: { url: string }[];
  poster: { name: string; businessName: string | null; image?: string | null } | null;
};

export function initialsFrom(label: string | null | undefined): string {
  if (!label) return "";
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getBusinessLabel(listing: ThumbnailData): string {
  return listing.poster?.businessName ?? listing.poster?.name ?? listing.title;
}

/**
 * Small square logo for listing rows — the company mark, not a hero image.
 *
 * Uses a raw <img> rather than next/image on purpose: creatives and listing
 * photos live on R2 and next.config.ts declares no images.remotePatterns, so
 * next/image would reject them. Matches ListingThumbnail's existing approach.
 */
export function ListingLogo({ listing }: { listing: ThumbnailData }) {
  const imageUrl = listing.images[0]?.url ?? listing.poster?.image ?? null;

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
      />
    );
  }

  const color = CATEGORY_COLOR_VAR[listing.category] ?? CATEGORY_COLOR_VAR.CLASSIFIED;
  const initials = initialsFrom(listing.poster?.businessName ?? listing.poster?.name);

  return (
    <div
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {initials || <CategoryIcon category={listing.category} className="h-6 w-6" />}
    </div>
  );
}

export function ListingThumbnail({ listing }: { listing: ThumbnailData }) {
  const imageUrl = listing.images[0]?.url ?? listing.poster?.image ?? null;

  if (imageUrl) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-border/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  const color = CATEGORY_COLOR_VAR[listing.category] ?? CATEGORY_COLOR_VAR.CLASSIFIED;
  const initials = initialsFrom(listing.poster?.businessName ?? listing.poster?.name);
  const businessLabel = getBusinessLabel(listing);
  const bgGradient = `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color} 60%, #000) 100%)`;

  return (
    <div
      aria-hidden
      className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden"
      style={{ background: bgGradient }}
    >
      {initials ? (
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/30 bg-white/25 text-2xl font-extrabold tracking-wide text-white shadow-lg">
            {initials}
          </div>
          <span className="max-w-[90%] truncate rounded-full bg-black/35 px-2.5 py-0.5 text-[10px] font-medium text-white/90">
            {businessLabel}
          </span>
        </div>
      ) : (
        <CategoryIcon category={listing.category} className="relative z-10 h-14 w-14 text-white/80" />
      )}
      <div className="pointer-events-none absolute -bottom-6 -right-4 text-white/10">
        <CategoryIcon category={listing.category} className="h-36 w-36" />
      </div>
    </div>
  );
}
