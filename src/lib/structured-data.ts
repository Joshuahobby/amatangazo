import type { ListingWithDetails } from "@/lib/listings";

const SITE_NAME = "Amatangazo";

function organizationName(listing: ListingWithDetails) {
  return listing.poster.businessName ?? listing.poster.name;
}

/**
 * There's no canonical Schema.org type for a public tender/RFP notice, so
 * TENDER falls back to a generic WebPage node rather than forcing a type
 * (e.g. Offer) that doesn't actually fit and could trip structured-data
 * validation. JOB/AUCTION/CLASSIFIED map onto real Google rich-result types.
 */
export function buildListingJsonLd(listing: ListingWithDetails): Record<string, unknown> | null {
  switch (listing.category) {
    case "JOB": {
      const details = listing.jobDetails;
      if (!details) return null;
      return {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: listing.title,
        description: listing.description,
        datePosted: (listing.publishedAt ?? listing.createdAt).toISOString(),
        validThrough: details.applicationDeadline.toISOString(),
        employmentType: details.experienceLevel === "INTERNSHIP" ? "INTERN" : undefined,
        hiringOrganization: {
          "@type": "Organization",
          name: organizationName(listing),
        },
        jobLocation: {
          "@type": "Place",
          address: { "@type": "PostalAddress", addressLocality: listing.location, addressCountry: "RW" },
        },
        ...(details.salaryRangeMin || details.salaryRangeMax
          ? {
              baseSalary: {
                "@type": "MonetaryAmount",
                currency: "RWF",
                value: {
                  "@type": "QuantitativeValue",
                  minValue: details.salaryRangeMin ?? undefined,
                  maxValue: details.salaryRangeMax ?? undefined,
                  unitText: "MONTH",
                },
              },
            }
          : {}),
      };
    }
    case "AUCTION": {
      const details = listing.auctionDetails;
      if (!details) return null;
      return {
        "@context": "https://schema.org",
        "@type": "Event",
        name: listing.title,
        description: listing.description,
        startDate: details.auctionDate.toISOString(),
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: details.auctionLocation,
          address: listing.location,
        },
        organizer: {
          "@type": "Organization",
          name: organizationName(listing),
        },
        ...(details.startingPrice
          ? {
              offers: {
                "@type": "Offer",
                price: details.startingPrice,
                priceCurrency: details.currency,
                availability: "https://schema.org/InStock",
              },
            }
          : {}),
      };
    }
    case "CLASSIFIED": {
      const details = listing.classifiedDetails;
      if (!details) return null;
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: listing.title,
        description: listing.description,
        category: details.subcategory,
        ...(details.price
          ? {
              offers: {
                "@type": "Offer",
                price: details.price,
                priceCurrency: "RWF",
                availability: "https://schema.org/InStock",
                seller: { "@type": "Organization", name: organizationName(listing) },
              },
            }
          : {}),
      };
    }
    case "TENDER": {
      const details = listing.tenderDetails;
      if (!details) return null;
      return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: listing.title,
        description: listing.description,
        datePublished: (listing.publishedAt ?? listing.createdAt).toISOString(),
        isPartOf: { "@type": "WebSite", name: SITE_NAME },
      };
    }
    default:
      return null;
  }
}
