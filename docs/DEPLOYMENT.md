# Deployment

Amatangazo is deployed on **Vercel** with a **Neon** (or any PostgreSQL) database.

---

## Vercel deployment

### Prerequisites

1. Push code to GitHub
2. Connect repo to Vercel
3. Set the following environment variables in the Vercel dashboard:

**Required:**
```
DATABASE_URL=postgres://…
BETTER_AUTH_SECRET=<generated-secret>
BETTER_AUTH_URL=https://your-domain.com
```

**Authentication providers:**
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**Payment (Pawapay):**
```
PAWAPAY_API_KEY=
PAWAPAY_API_SECRET=
PAWAPAY_BILLER_ID=
```

**Storage (Cloudflare R2):**
```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=amatangazo
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

**Notifications:**
```
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

**AI moderation:**
```
ANTHROPIC_API_KEY=
```

**Cron:**
```
CRON_SECRET=<shared-secret>
```

### Build settings

Vercel detects Next.js automatically. Ensure:

- **Framework preset:** Next.js
- **Root directory:** `./`
- **Build command:** `npx prisma generate && next build`
- **Output directory:** `.next`

### Deploy

Push to `master` — Vercel auto-deploys.

---

## Database migrations

### First deployment

```bash
# Connect to production DB and push schema
DATABASE_URL="postgres://..." npx prisma db push

# Enable pg_trgm
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

### Schema changes

```bash
# Generate migration files
npx prisma migrate dev --name describe-change

# Apply to production
npx prisma migrate deploy
```

> **Note:** Prisma Migrate is used for schema versioning. In CI, run `npx prisma migrate deploy` as part of the deploy pipeline.

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

- [ ] Database migrated and pg_trgm enabled
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
