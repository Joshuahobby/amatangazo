import { Prisma } from "@prisma/client";

import { listingInclude, type ListingWithDetails } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import type { ListingSearchQuery } from "@/lib/validations/search";

function getSortExpr(sort: string | undefined, rankExpr: Prisma.Sql, category: string | undefined): Prisma.Sql {
  switch (sort) {
    case "newest":
      return Prisma.sql`l."createdAt"`;
    case "salary_desc":
      if (category === "JOB") return Prisma.sql`jd."salaryRangeMax" DESC NULLS LAST`;
      return Prisma.sql`l."createdAt"`;
    case "deadline_asc":
      if (category === "TENDER") return Prisma.sql`td."submissionDeadline" ASC NULLS LAST`;
      return Prisma.sql`l."createdAt"`;
    case "price_asc":
      if (category === "CLASSIFIED") return Prisma.sql`cd.price ASC NULLS LAST`;
      return Prisma.sql`l."createdAt"`;
    case "price_desc":
      if (category === "CLASSIFIED") return Prisma.sql`cd.price DESC NULLS LAST`;
      return Prisma.sql`l."createdAt"`;
    default:
      return rankExpr;
  }
}

/**
 * Real Postgres FTS (to_tsvector/plainto_tsquery) ranked search, with pg_trgm
 * similarity as a fuzzy/typo-tolerant fallback signal — matches the PRD's
 * "Postgres full-text + trigram" search stack (Meilisearch is the documented
 * upgrade path if this becomes a bottleneck, not something to build now).
 */
export async function searchListings(query: ListingSearchQuery): Promise<{
  listings: ListingWithDetails[];
  total: number;
}> {
  const { q, category, location, sector, experienceLevel, subcategory, budgetMin, budgetMax, sort, page, limit } = query;

  const conditions: Prisma.Sql[] = [Prisma.sql`l.status = 'LIVE'`];

  if (category) conditions.push(Prisma.sql`l.category = ${category}::"ListingCategory"`);
  if (location) conditions.push(Prisma.sql`l.location ILIKE ${`%${location}%`}`);

  let joinClause = Prisma.empty;
  if (category === "JOB") {
    joinClause = Prisma.sql`JOIN "JobDetails" jd ON jd."listingId" = l.id`;
    if (sector) conditions.push(Prisma.sql`jd.sector ILIKE ${`%${sector}%`}`);
    if (experienceLevel) conditions.push(Prisma.sql`jd."experienceLevel" = ${experienceLevel}::"ExperienceLevel"`);
  } else if (category === "TENDER") {
    joinClause = Prisma.sql`JOIN "TenderDetails" td ON td."listingId" = l.id`;
    if (sector) conditions.push(Prisma.sql`td.sector ILIKE ${`%${sector}%`}`);
    if (budgetMin !== undefined) conditions.push(Prisma.sql`(td."budgetMax" IS NULL OR td."budgetMax" >= ${budgetMin})`);
    if (budgetMax !== undefined) conditions.push(Prisma.sql`(td."budgetMin" IS NULL OR td."budgetMin" <= ${budgetMax})`);
  } else if (category === "CLASSIFIED") {
    joinClause = Prisma.sql`JOIN "ClassifiedDetails" cd ON cd."listingId" = l.id`;
    if (subcategory) conditions.push(Prisma.sql`cd.subcategory ILIKE ${`%${subcategory}%`}`);
  }

  let rankExpr = Prisma.sql`0::float`;
  if (q) {
    rankExpr = Prisma.sql`
      ts_rank(to_tsvector('english', l.title || ' ' || l.description), plainto_tsquery('english', ${q}))
      + GREATEST(similarity(l.title, ${q}), similarity(l.description, ${q})) * 0.5
    `;
    conditions.push(Prisma.sql`(
      to_tsvector('english', l.title || ' ' || l.description) @@ plainto_tsquery('english', ${q})
      OR similarity(l.title, ${q}) > 0.1
      OR similarity(l.description, ${q}) > 0.06
    )`);
  }

  const whereClause = Prisma.join(conditions, " AND ");

  const rows = await prisma.$queryRaw<{ id: string; total: bigint }[]>(Prisma.sql`
    SELECT l.id, COUNT(*) OVER() AS total
    FROM "Listing" l
    ${joinClause}
    WHERE ${whereClause}
    ORDER BY ${getSortExpr(sort, rankExpr, category)} DESC, l."createdAt" DESC
    LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `);

  if (rows.length === 0) return { listings: [], total: 0 };

  const ids = rows.map((row) => row.id);
  const records = await prisma.listing.findMany({ where: { id: { in: ids } }, include: listingInclude });
  const byId = new Map(records.map((record) => [record.id, record]));

  return {
    listings: ids.map((id) => byId.get(id)).filter((listing): listing is ListingWithDetails => Boolean(listing)),
    total: Number(rows[0].total),
  };
}
