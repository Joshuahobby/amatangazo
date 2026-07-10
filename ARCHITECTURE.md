# Architecture

## Overview

Amatangazo is a modern marketplace built on Next.js 16's App Router. The architecture follows a **server-first** approach — most rendering happens on the server, with client components used only where interactivity is required.

```
Browser ──► Next.js (Vercel) ──► PostgreSQL
                    │
                    ├──► Cloudflare R2 (images)
                    ├──► Pawapay API (payments)
                    ├──► Resend API (email)
                    ├──► Twilio API (SMS)
                    └──► Claude API (AI flagging)
```

---

## Routing

### Page routes (App Router)

| Route                          | Description                     |
| ------------------------------ | ------------------------------- |
| `/`                            | Landing page                    |
| `/listings`                    | Browse/search listings          |
| `/listings/[id]`               | Listing detail                  |
| `/listings/[id]/edit`          | Edit listing                    |
| `/post`                        | Category chooser                |
| `/post/job`                    | Create job listing              |
| `/post/tender`                 | Create tender listing           |
| `/post/classified`             | Create classified listing       |
| `/post/auction`                | Create auction listing          |
| `/checkout/[id]`               | Payment checkout                |
| `/dashboard`                   | User dashboard                  |
| `/dashboard/billing`           | Billing & subscription          |
| `/dashboard/applications`      | Job applications                |
| `/dashboard/profile`           | Profile settings                |
| `/notifications`               | Notification center             |
| `/users/[id]`                  | Public user profile             |
| `/login`                       | Login page                      |
| `/admin`                       | Admin dashboard                 |
| `/admin/reports`               | Reported listings               |
| `/admin/pricing`               | Pricing config                  |
| `/admin/moderation`            | Moderation queue                |
| `/admin/umucyo`                | Umucyo scraper control          |
| `/admin/verification`          | User verification               |
| `/admin/notifications`         | Send notifications              |
| `/admin/tender-summaries`      | Tender AI summaries              |
| `/admin/referrals`             | Referral management             |
| `/terms`                       | Terms of service                |
| `/privacy`                     | Privacy policy                  |
| `/referrals`                   | Referral program                |
| `/saved-searches`              | Saved search alerts             |
| `/verification`                | Identity verification           |

### API routes

| Endpoint                       | Methods     | Purpose                    |
| ------------------------------ | ----------- | -------------------------- |
| `/api/auth/*`                  | (better-auth) | Authentication           |
| `/api/listings`                | GET, POST   | List/create listings       |
| `/api/listings/[id]`           | GET, PATCH  | Read/update listing        |
| `/api/favorites`               | GET, POST, DELETE | Save/unsave listings |
| `/api/applications`            | GET, POST   | Job applications           |
| `/api/reports`                 | POST        | Report a listing           |
| `/api/admin/reports`           | GET, PATCH  | Manage reports             |
| `/api/dashboard`               | GET         | Dashboard data             |
| `/api/billing`                 | GET         | Billing history            |
| `/api/notifications`           | GET         | Notification center        |
| `/api/account`                 | DELETE      | Delete account             |
| `/api/user`                    | GET, PATCH  | User profile               |
| `/api/checkout`                | POST        | Initiate payment           |
| `/api/checkout/webhook`        | POST        | Pawapay webhook            |
| `/api/uploads`                 | POST        | Image upload (R2)          |
| `/api/cron/listing-expiry`     | POST        | Daily expiry cron          |
| `/api/referrals`               | GET         | Referral data              |
| `/api/saved-searches`          | GET, POST, DELETE | Saved search alerts   |

---

## Data model

### Core entities

```
User ──┬── Listing (polymorphic: JOB/TENDER/AUCTION/CLASSIFIED)
       │       ├── ListingImage (1-10 per listing)
       │       ├── JobDetails        (if JOB)
       │       ├── TenderDetails     (if TENDER)
       │       ├── AuctionDetails    (if AUCTION)
       │       ├── ClassifiedDetails (if CLASSIFIED)
       │       ├── Boost (promoted listings)
       │       └── Payment
       ├── Favorite (saved listings)
       ├── Subscription
       ├── Referral ─── ReferralCredit
       ├── NotificationLog
       └── Application (job applications)
```

### Supporting entities

- `ListingReport` — user-submitted flags (spam, inappropriate, scam, duplicate, other)
- `ModerationLog` — AI flagging + admin action trail
- `AiFlag` — automated moderation flags from Claude
- `PricingConfig` — per-category pricing tiers
- `SavedSearch` — user-subscribed search alerts
- `UmucyoScrapeLog` — scraper run history
- `account`, `session`, `verification` — better-auth tables

### Listing states

```
enum ListingStatus { DRAFT, PENDING_PAYMENT, LIVE, EXPIRED, REMOVED }
```

- Listings start as `DRAFT`, transition to `PENDING_PAYMENT` on publish, then `LIVE` on payment confirmation
- Auto-expire via daily cron job after 30 days
- Owners can remove live listings; admins can remove any listing

---

## Key flows

### Listing creation
1. User fills category-specific form (zod validation)
2. Images uploaded to R2 via presigned URLs
3. Listing created as `DRAFT`
4. On publish → `PENDING_PAYMENT`, checkout initiated
5. Pawapay webhook → `LIVE` + boost activation

### Search
- Uses raw SQL with `pg_trgm` for fuzzy text matching
- Category-specific filters (sector for JOB/TENDER, subcategory+price for CLASSIFIED)
- Sort options: relevance, newest, salary desc, deadline asc, price asc/desc

### Favorites
- `Favorite` model with `@@unique([listingId, userId])`
- `useFavorites` hook provides `isFaved`, `toggleFav`, `favCount`
- SaveButton component handles optimistic UI updates

### Notifications
- Created via `notifyUser()` on listing events (publish, application, report resolution)
- Stored in `NotificationLog` and displayed in the notification center
- Failed deliveries logged but don't block the main flow

---

## i18n

Three locale files in `messages/`:
- `en.json` — English (source of truth)
- `fr.json` — French
- `rw.json` — Kinyarwanda

Locale detection via `next-intl` (browser preference + cookie override).
All user-facing strings must go through translation keys — no hardcoded UI text.

---

## Security

- Authentication via better-auth (sessions, no JWTs for pages)
- API routes check `auth()` server-side for protected endpoints
- Input validation with zod on all POST/PATCH/PUT endpoints
- `serializeJsonLd()` escapes `</script>` to prevent stored XSS in structured data
- File uploads validated for type and size before R2 upload
- `pg_trgm` search uses parameterized queries (no SQL injection)
- Admin routes check `user.role === "ADMIN"`
