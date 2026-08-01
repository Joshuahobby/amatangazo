# Amatangazo

**Rwanda's marketplace platform** — post and discover jobs, tenders, auctions, and classifieds.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?logo=next.js)]()
[![React](https://img.shields.io/badge/React-19.2.4-61dafb?logo=react)]()
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2d3748?logo=prisma)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)]()

---

## Features

- **Four categories** — Jobs, Tenders, Auctions, Classifieds
- **Multi-language** — English, French, Kinyarwanda (next-intl)
- **Full listing lifecycle** — draft, publish with payment, live, expire, renew
- **Search & browse** — keyword, location, category filters, sort options
- **Save favorites** — bookmark listings and track them from the dashboard
- **Apply to jobs** — one-click applications with dashboard tracking
- **Report listings** — spam, inappropriate, scam, duplicate, other
- **User profiles** — public profiles with active listings grid
- **Dashboard** — manage listings, billing, applications, profile settings
- **Subscription & boosts** — monthly plans with listing and boost allotments
- **Referral credits** — earn free listings by referring users
- **Payment** — Pawapay integration (mobile money)
- **Notifications** — in-app notification center
- **Admin panel** — reports, moderation, pricing, verification, notifications
- **Umucyo scraper** — automated tender import from umucyo.gov.rw
- **AI flagging** — automated moderation with Claude API
- **Mobile-first** — responsive design with bottom navigation bar

---

## Tech stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Framework    | Next.js 16.2.10 (App Router)                        |
| UI           | React 19.2.4, Tailwind CSS v4, framer-motion        |
| Language     | TypeScript 5                                        |
| Database     | PostgreSQL 16 via Prisma 7.8.0                      |
| Auth         | better-auth (email + phone + Google OAuth)          |
| i18n         | next-intl (en, fr, rw)                              |
| Validation   | zod 4                                               |
| Payments     | Pawapay API (mobile money)                          |
| File storage | Cloudflare R2 (S3-compatible)                       |
| Email        | Resend                                              |
| SMS          | Twilio                                              |
| AI           | Anthropic Claude (listing moderation)               |
| Hosting      | Vercel                                              |

---

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- npm

### Setup

```bash
# 1. Clone and install
git clone https://github.com/Joshuahobby/amatangazo.git
cd amatangazo
npm install

# 2. Set environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, auth secrets, API keys, etc.

# 3. Start PostgreSQL and create the database
createdb amatangazo

# 4. Push the schema and generate the client
npx prisma db push
npx prisma generate

# 5. Enable pg_trgm for search
psql -d amatangazo -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# 6. Start the dev server
npm run dev
```

### Environment variables

Key variables in `.env`:

| Variable              | Description                           |
| --------------------- | ------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string          |
| `BETTER_AUTH_SECRET`  | Auth encryption secret                |
| `BETTER_AUTH_URL`     | Auth callback URL                     |
| `GOOGLE_CLIENT_ID`    | Google OAuth client ID                |
| `GOOGLE_CLIENT_SECRET`| Google OAuth client secret            |
| `RESEND_API_KEY`      | Resend email API key                  |
| `TWILIO_ACCOUNT_SID`  | Twilio account SID                    |
| `TWILIO_AUTH_TOKEN`   | Twilio auth token                     |
| `TWILIO_FROM_NUMBER`  | SMS sender number                     |
| `R2_*`                | Cloudflare R2 credentials             |
| `PAWAPAY_*`           | Pawapay payment gateway credentials   |
| `ANTHROPIC_API_KEY`   | Claude API key for AI flagging        |

---

## Scripts

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `npm run dev`         | Start Next.js dev server           |
| `npm run build`       | Production build                   |
| `npm run start`       | Start production server            |
| `npm run lint`        | Run ESLint                         |
| `npm test`            | Run Vitest test suite              |
| `npm run db:studio`   | Open Prisma Studio                 |
| `npm run db:push`     | Sync `schema.prisma` to the database |

> **Schema changes use `db:push`, not Prisma Migrate.** This repo has no
> `prisma/migrations` directory, so `npm run db:migrate` (`prisma migrate dev`)
> sees drift and offers to reset your database. See
> [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#database-schema).

---

## Documentation

| Doc | What's in it |
| --- | ------------ |
| [docs/API.md](docs/API.md) | Every `/api` route — auth, request/response shapes, error codes |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data flow, key decisions |
| [docs/data-schema.md](docs/data-schema.md) | Database models and relations |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel + Supabase deployment and schema sync |
| [docs/design-system.md](docs/design-system.md) | Design tokens, components, brand |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Workflow, conventions, PR process |

---

## Project structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── admin/            # Admin panel (reports, pricing, moderation, etc.)
│   ├── api/              # API routes
│   │   ├── account/      # Account deletion
│   │   ├── admin/        # Admin API endpoints
│   │   ├── applications/ # Job applications
│   │   ├── billing/      # Billing history
│   │   ├── cron/         # Cron job endpoints (listing expiry)
│   │   ├── dashboard/    # Dashboard data
│   │   ├── favorites/    # Save/unsave listings
│   │   ├── notifications/# Notification center
│   │   ├── reports/      # Listing reports
│   │   └── user/         # User profile
│   ├── checkout/         # Payment checkout
│   ├── dashboard/        # User dashboard
│   ├── listings/         # Browse and detail pages
│   ├── login/            # Authentication pages
│   ├── notifications/    # Notification center page
│   ├── post/             # Listing creation (job, tender, auction, classified)
│   ├── users/            # Public user profiles
│   ├── globals.css       # Global styles + design tokens
│   └── layout.tsx        # Root layout
├── components/           # Reusable React components
├── hooks/                # Custom React hooks (useFavorites)
├── i18n/                 # i18n request config
└── lib/                  # Business logic, utilities, server code
    └── validations/      # Zod schemas
prisma/
├── schema.prisma         # Database schema
├── seed.ts               # Seed script
└── manual-migrations/    # Manual SQL migrations (pg_trgm)
messages/
├── en.json               # English translations
├── fr.json               # French translations
└── rw.json               # Kinyarwanda translations
test/                     # Vitest tests
```

---

## Listing lifecycle

```
DRAFT ──► PENDING_PAYMENT ──► LIVE ──► EXPIRED
  ▲                            │
  └──── (edit & re-publish)    └──── REMOVED (by owner or admin)
```

- Listings auto-expire after 30 days
- Expired listings can be renewed from the dashboard
- Draft listings are editable via `/listings/[id]/edit`
- Live listings can be removed by the owner or flagged by users

---

## License

Private — all rights reserved.
