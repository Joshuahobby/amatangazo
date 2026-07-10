import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { CreateListingInput } from "@/lib/validations/listing";

export const listingInclude = {
  jobDetails: true,
  tenderDetails: true,
  auctionDetails: true,
  classifiedDetails: true,
  images: { orderBy: { sortOrder: "asc" } },
  poster: {
    select: {
      id: true,
      name: true,
      businessName: true,
      verificationStatus: true,
      image: true,
      accountType: true,
    },
  },
} satisfies Prisma.ListingInclude;

export type ListingWithDetails = Prisma.ListingGetPayload<{ include: typeof listingInclude }>;

export function createListingWithDetails(posterId: string, input: CreateListingInput) {
  const { category, details, ...base } = input;

  const detailsRelationKey = {
    JOB: "jobDetails",
    TENDER: "tenderDetails",
    AUCTION: "auctionDetails",
    CLASSIFIED: "classifiedDetails",
  } as const;

  return prisma.listing.create({
    data: {
      ...base,
      category,
      posterId,
      [detailsRelationKey[category]]: { create: details },
    },
    include: listingInclude,
  });
}
