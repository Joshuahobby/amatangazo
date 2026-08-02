import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { VerifiedBadge } from "@/components/listing-badges";
import { listingInclude } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

function Avatar({ name, image }: { name: string; image?: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} className="h-20 w-20 rounded-full object-cover" />;
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "").toUpperCase();
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
      {initials || "?"}
    </div>
  );
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t, format] = await Promise.all([getTranslations("publicProfile"), getFormatter()]);
  const [user, listings] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        businessName: true,
        image: true,
        accountType: true,
        verificationStatus: true,
        createdAt: true,
        _count: { select: { listings: { where: { status: "LIVE" } } } },
      },
    }),
    prisma.listing.findMany({
      where: { posterId: id, status: "LIVE" },
      include: listingInclude,
      orderBy: { publishedAt: "desc" },
      take: 20,
    }),
  ]);

  if (!user) notFound();

  return (
    <main className="page">
      <div className="flex items-start gap-4">
        <Avatar name={user.businessName ?? user.name} image={user.image} />
        <div>
          <h1 className="page-title">{user.businessName ?? user.name}</h1>
          {user.businessName && <p className="text-muted">{user.name}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {user.verificationStatus === "VERIFIED" && <VerifiedBadge />}
            <span className="text-xs text-muted">
              {user.accountType === "BUSINESS" ? t("accountBUSINESS") : t("accountINDIVIDUAL")}
              {" · "}
              {t("memberSince", { date: format.dateTime(user.createdAt, { dateStyle: "medium" }) })}
              {" · "}
              {t("activeListings", { count: user._count.listings })}
            </span>
          </div>
        </div>
      </div>

      <div className="my-6 border-t border-border" />

      {listings.length === 0 ? (
        <p className="text-muted">{t("noListings")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing as unknown as ListingCardData} />
          ))}
        </div>
      )}
    </main>
  );
}
