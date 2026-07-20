# Deployment

Amatangazo is deployed on **Vercel** with a **Neon** (or any PostgreSQL) database.

---

## Vercel deployment

### Prerequisites

1. Push code to GitHub
2. Connect repo to Vercel
3. Set the following environment variables in the Vercel dashboard:

The list below is derived from every `process.env` reference in `src/`. Names
must match exactly — a misspelled key is read as `undefined`, and most of these
degrade silently rather than failing the build.

**Core — the app does not work without these:**
```
DATABASE_URL=postgres://…            # src/lib/prisma.ts
BETTER_AUTH_SECRET=<generated>       # session signing
BETTER_AUTH_URL=https://your-domain.com
APP_BASE_URL=https://your-domain.com # referral + checkout links, sitemap.ts, robots.ts
NEXT_PUBLIC_BASE_URL=https://your-domain.com  # share URLs, notification links
```

**Authentication providers:**
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**Payment (PawaPay):**
```
PAWAPAY_API_TOKEN=                   # NOT PAWAPAY_API_KEY
PAWAPAY_ENV=sandbox|production
```

**Storage (Cloudflare R2):**
```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=amatangazo
R2_PUBLIC_URL_BASE=https://pub-xxxxx.r2.dev   # NOT R2_PUBLIC_URL
```

**Notifications:**
```
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

**AI (tender summaries + moderation flags):**
```
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=                     # read by ai-flagging.ts and tender-summary.ts
```

**Cron:** required — `vercel.json` schedules four daily jobs, and
`src/lib/cron.ts` rejects requests whose secret doesn't match.
```
CRON_SECRET=<shared-secret>
```

**Optional:**
```
SUPPORT_WHATSAPP=                    # support link in the site footer
DB_POOL_MAX=                         # per-instance pg pool size; defaults to 3 in production
```

> **Previously wrong in this file:** `PAWAPAY_API_KEY` / `PAWAPAY_API_SECRET` /
> `PAWAPAY_BILLER_ID` and `R2_PUBLIC_URL` are not read anywhere in the codebase;
> the real names are `PAWAPAY_API_TOKEN`, `PAWAPAY_ENV`, and `R2_PUBLIC_URL_BASE`.
> `APP_BASE_URL`, `NEXT_PUBLIC_BASE_URL`, `ANTHROPIC_MODEL`, and
> `SUPPORT_WHATSAPP` were missing entirely. Setting the old names produces a
> deployment that builds and serves pages, but with broken payments, broken
> image URLs, and absolute links pointing at `undefined`.

### Build settings

Vercel detects Next.js automatically. Ensure:

- **Framework preset:** Next.js
- **Root directory:** `./`
- **Build command:** `npx prisma generate && next build`
- **Output directory:** `.next`

### Deploy

Push to `master` — Vercel auto-deploys.

---

## Database schema

> **This project does not use Prisma Migrate.** There is no `prisma/migrations`
> directory and no `_prisma_migrations` table; every environment's schema was
> created with `prisma db push`. Do not run `prisma migrate deploy` (it finds no
> migrations and silently applies nothing) or `prisma migrate dev` (it detects
> drift and offers to **reset** the database — data loss).

### Supabase: use two different connection strings

Supabase exposes several connection strings and **the right one differs between
runtime and schema work**. Using one for both is the most common way to get
stuck here.

| Use | Which string | Port |
|-----|--------------|------|
| App running on Vercel | **Transaction pooler** (`…pooler.supabase.com`) | `6543` |
| `prisma db push`, `psql`, extensions | **Direct connection** or **Session pooler** | `5432` |

- **Runtime → transaction pooler.** Serverless functions open connections per
  instance; the pooler multiplexes them so a traffic spike doesn't exhaust the
  database's connection limit. Pair it with the small per-instance pool set in
  `src/lib/prisma.ts` (`DB_POOL_MAX`, default 3 in production).
- **DDL → direct/session connection.** Schema changes don't work reliably
  through a transaction-mode pooler — it doesn't hold a session across
  statements. Run `db push` against port `5432`, not `6543`.
- Supabase issues **IPv6-only direct connections** on newer projects. If
  `db push` fails to connect from a network without IPv6, use the *session*
  pooler (IPv4, port `5432`) instead of the direct string — it also supports DDL.

Set `DATABASE_URL` in Vercel to the **pooler** string. Keep the direct string
out of the deployment; use it ad hoc from your machine for schema work.

### First deployment

```bash
# Schema + extension go over the DIRECT connection (port 5432)
DATABASE_URL="postgres://…:5432/postgres" npx prisma db push
psql "postgres://…:5432/postgres" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

Then set `DATABASE_URL` in Vercel to the **pooler** string (port 6543) and deploy.

### Schema changes

Edit `prisma/schema.prisma`, then apply it to **every** environment:

```bash
npx prisma format
DATABASE_URL="postgres://..." npx prisma db push
npx prisma generate
```

**Push the schema before deploying code that reads the new columns.** The
generated client selects every field in the model, so a deploy that runs ahead
of its schema push fails at query time on the affected pages — not at build
time, and not on pages that don't touch the model.

`db push` prints the changes it intends to make; read that plan before
confirming. It refuses destructive changes unless you pass
`--accept-data-loss`, so treat that flag as a stop-and-think signal.

> **Trade-off:** `db push` keeps no version history, so there is no scripted
> rollback and no record of when a column appeared. That is tolerable pre-launch
> while the database is disposable. Once production holds real user data, adopt
> Prisma Migrate deliberately — baseline the existing schema as an initial
> migration (`prisma migrate diff --from-empty --to-schema-datamodel` into
> `migrations/0_init`, then `prisma migrate resolve --applied 0_init`) rather
> than letting `migrate dev` reset it.

---

## Cron jobs

Vercel Cron Jobs trigger the following endpoints daily:

| Endpoint                         | Schedule    | Description                |
| -------------------------------- | ----------- | -------------------------- |
| `/api/cron/listing-expiry`       | `0 3 * * *` | Expire 30-day-old listings |

Configure in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/listing-expiry",
      "schedule": "0 3 * * *"
    }
  ]
}
```

---

## Production checklist

- [ ] `prisma db push` run against this environment (before deploying the code) and pg_trgm enabled
- [ ] All env vars set in Vercel dashboard
- [ ] Custom domain configured
- [ ] SSL enabled (automatic with Vercel)
- [ ] Better-auth callback URL points to production domain
- [ ] Pawapay webhook URL configured to `https://your-domain.com/api/checkout/webhook`
- [ ] R2 bucket configured with public access
- [ ] Cron jobs set up
- [ ] `BETTER_AUTH_URL` matches the production domain
- [ ] Google OAuth redirect URIs include production domain
- [ ] Twilio webhook (if SMS verification used) configured
