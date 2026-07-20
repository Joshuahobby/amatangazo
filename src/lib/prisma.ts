import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Pool sizing matters on serverless. Each warm Vercel instance keeps its own
 * pg Pool, and node-postgres defaults to max: 10 — so N concurrent instances
 * hold up to 10N connections, which exhausts a Supabase/Neon connection limit
 * long before traffic justifies it. Keep the per-instance pool small and let
 * the provider's transaction pooler do the multiplexing.
 *
 * Locally there's one process and no pooler, so the default is fine.
 * Override with DB_POOL_MAX if the pooler tier changes.
 */
const poolMax = Number(process.env.DB_POOL_MAX) || (process.env.NODE_ENV === "production" ? 3 : 10);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: poolMax,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
