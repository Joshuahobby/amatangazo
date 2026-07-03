-- Manual migration step (see docs/data-schema.md).
-- Prisma's schema format doesn't manage Postgres extensions, so this runs
-- separately: `npx prisma db execute --file prisma/manual-migrations/001_enable_pg_trgm.sql`
-- Run once against each environment's real database (after the initial
-- `prisma migrate dev`/`deploy` has created the Listing table).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS listing_title_trgm_idx ON "Listing" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS listing_description_trgm_idx ON "Listing" USING GIN (description gin_trgm_ops);
