import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BoostButton } from "@/components/boost-button";
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

  const jsonLd = buildListingJsonLd(listing);
  const t = await getTranslations("listing");
  const tc = await getTranslations("common");

  return (
    <main className="page max-w-3xl">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />}
      <div className="flex flex-wrap gap-2">
        <span className="badge-neutral">{listing.category}</span>
        {listing.isCurrentlyBoosted && <span className="badge-featured">{tc("featured")}</span>}
        {listing.status !== "LIVE" && (
          <span className="badge bg-red-100 text-red-800">
            {listing.status} {t("onlyVisibleToYou")}
          </span>
        )}
      </div>

      <h1 className="page-title mt-3">{listing.title}</h1>
      <p className="page-subtitle">{listing.location}</p>

      {listing.images.length > 0 && (
        <div className="my-4 flex gap-2 overflow-x-auto">
          {listing.images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element -- R2 URLs, not part of Next's image optimization domain list yet
            <img
              key={image.id}
              src={image.url}
              alt={listing.title}
              className="h-40 shrink-0 rounded-lg border border-border object-cover"
            />
          ))}
        </div>
      )}

      <p className="mt-4 whitespace-pre-wrap text-foreground">{listing.description}</p>

      <div className="my-6 border-t border-border" />

      {listing.category === "JOB" && <JobDetailsSection listing={listing} />}
      {listing.category === "TENDER" && <TenderDetailsSection listing={listing} />}
      {listing.category === "AUCTION" && <AuctionDetailsSection listing={listing} />}
      {listing.category === "CLASSIFIED" && <ClassifiedDetailsSection listing={listing} />}

      {isOwner && listing.status === "LIVE" && <BoostButton listingId={listing.id} />}

      <div className="my-6 border-t border-border" />

      <p className="text-sm text-foreground">
        {t("postedBy")} <strong>{listing.poster.businessName ?? listing.poster.name}</strong>
        {listing.poster.verificationStatus === "VERIFIED" && (
          <span className="ml-1 text-primary">✓ {t("verified")}</span>
        )}
      </p>
    </main>
  );
}
