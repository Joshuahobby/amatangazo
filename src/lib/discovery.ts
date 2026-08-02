import type { Prisma } from "@prisma/client";

import { listingInclude, type ListingWithDetails } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import type { DiscoveryCategory } from "@/lib/validations/listing";

/**
 * Rows in a discovery strip. Short on purpose: the strip sits above the full
 * result list, so anything longer pushes the results the visitor asked for off
 * the screen.
 */
export const DISCOVERY_LIMIT = 5;

/**
 * The three feeds the landing page used to carry — high-paying jobs, urgent
 * tenders, auctions ending soon — re-homed on the category each one belongs to
 * (`/listings?category=…`). The landing page dropped them because it had grown
 * to nine sections; the content itself is still worth surfacing, just not all
 * of it on one page.
 *
 * Split from the query below so the ordering rules are unit-testable without a
 * database, the way `buildSearchWhere` is.
 */
export function discoveryQuery(category: DiscoveryCategory, now: Date): {
  where: Prisma.ListingWhereInput;
  orderBy: Prisma.ListingOrderByWithRelationInput;
} {
  // Every feed drops listings whose date has already passed: an "urgent tender"
  // that closed last week is stale inventory, not discovery.
  switch (category) {
    case "JOB":
      return {
        where: {
          status: "LIVE",
          category: "JOB",
          // No stated ceiling means no claim about the pay, so it can't lead a
          // feed that is entirely a claim about the pay.
          jobDetails: { is: { salaryRangeMax: { not: null }, applicationDeadline: { gte: now } } },
        },
        orderBy: { jobDetails: { salaryRangeMax: "desc" } },
      };
    case "TENDER":
      return {
        where: {
          status: "LIVE",
          category: "TENDER",
          tenderDetails: { is: { submissionDeadline: { gte: now } } },
        },
        orderBy: { tenderDetails: { submissionDeadline: "asc" } },
      };
    case "AUCTION":
      return {
        where: {
          status: "LIVE",
          category: "AUCTION",
          auctionDetails: { is: { auctionDate: { gte: now } } },
        },
        orderBy: { auctionDetails: { auctionDate: "asc" } },
      };
  }
}

export function getDiscoveryFeed(
  category: DiscoveryCategory,
  now = new Date(),
): Promise<ListingWithDetails[]> {
  return prisma.listing.findMany({
    ...discoveryQuery(category, now),
    take: DISCOVERY_LIMIT,
    include: listingInclude,
  });
}
