import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BoostButton } from "@/components/boost-button";
import { CategoryBadge, FeaturedBadge, VerifiedBadge } from "@/components/listing-badges";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { ApplyButton } from "@/components/apply-button";
import { ImageGallery } from "@/components/image-gallery";
import { ReportButton } from "@/components/report-button";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { AuctionDetailsSection } from "@/components/listing-details/auction-details";
import { ClassifiedDetailsSection } from "@/components/listing-details/classified-details";
import { JobDetailsSection } from "@/components/listing-details/job-details";
import { TenderDetailsSection } from "@/components/listing-details/tender-details";
import { getCurrentUserId } from "@/lib/auth";
import { listingInclude } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { buildListingJsonLd, serializeJsonLd } from "@/lib/structured-data";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, include: listingInclude });

  if (!listing) notFound();

  const userId = await getCurrentUserId();
  if (listing.status !== "LIVE" && userId !== listing.posterId) notFound();
  const isOwner = userId === listing.posterId;

  // T10.1 — count reads by non-owners; fire-and-forget so it never delays render.
  if (listing.status === "LIVE" && !isOwner) {
    void prisma.listing
      .update({ where: { id }, data: { viewCount: { increment: 1 } } })
      .catch((error) => console.error(`View count increment failed for ${id}`, error));
  }

  // Related listings: same category, exclude current, limit 4
  const related = await prisma.listing.findMany({
    where: {
      status: "LIVE",
      category: listing.category,
      id: { not: listing.id },
    },
    orderBy: { publishedAt: "desc" },
    take: 4,
    include: listingInclude,
  });

  const jsonLd = buildListingJsonLd(listing);
  const t = await getTranslations("listing");
  const tc = await getTranslations("common");

  return (
    <main className="page">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />}

      <div className="flex flex-wrap gap-2">
        <CategoryBadge category={listing.category} />
        {listing.isCurrentlyBoosted && <FeaturedBadge />}
        {listing.status !== "LIVE" && (
          <span className="badge-danger">
            {tc(`status${listing.status}`)} {t("onlyVisibleToYou")}
          </span>
        )}
      </div>

      <h1 className="page-title mt-3">{listing.title}</h1>

      {/* Actions bar */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {listing.location}
        </span>
        {listing.poster && (
          <span className="flex items-center gap-1.5 text-muted">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {listing.poster.businessName ?? listing.poster.name}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <SaveButton listingId={listing.id} />
          <ShareButton />
          {!isOwner && listing.poster && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check this listing: ${listing.title} - ${process.env.NEXT_PUBLIC_BASE_URL ?? "https://amatangazo.com"}/listings/${listing.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline btn-sm"
            >
              Share on WhatsApp
            </a>
          )}
        </div>
      </div>

      <ImageGallery images={listing.images} alt={listing.title} />

      {/* Map placeholder */}
      {listing.location && (
        <div className="my-4 flex items-center gap-3 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-4 text-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-foreground">{listing.location}</p>
            <p className="text-xs text-muted">Map view coming soon</p>
          </div>
        </div>
      )}

      <p className="mt-4 whitespace-pre-wrap text-foreground">{listing.description}</p>

      <div className="my-6 border-t border-border" />

      {listing.category === "JOB" && <JobDetailsSection listing={listing} />}
      {listing.category === "TENDER" && <TenderDetailsSection listing={listing} />}
      {listing.category === "AUCTION" && <AuctionDetailsSection listing={listing} />}
      {listing.category === "CLASSIFIED" && <ClassifiedDetailsSection listing={listing} />}

      {isOwner && listing.status === "LIVE" && <BoostButton listingId={listing.id} />}

      {!isOwner && listing.status === "LIVE" && (
        <div className="my-4 flex flex-wrap gap-2">
          {listing.category === "JOB" && <ApplyButton listingId={listing.id} />}
          <ReportButton listingId={listing.id} />
        </div>
      )}

      <div className="my-6 border-t border-border" />

      <p className="flex flex-wrap items-center gap-1.5 text-sm text-foreground">
        {t("postedBy")}{" "}
        <Link href={`/users/${listing.poster.id}`} className="font-semibold hover:text-primary">
          {listing.poster.businessName ?? listing.poster.name}
        </Link>
        {listing.poster.verificationStatus === "VERIFIED" && <VerifiedBadge />}
      </p>

      {/* Related listings */}
      {related.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Similar Listings</h2>
            <Link href={`/listings?category=${listing.category}`} className="text-sm font-semibold text-primary hover:underline">
              See all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((item) => (
              <ListingCard key={item.id} listing={item as unknown as ListingCardData} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
