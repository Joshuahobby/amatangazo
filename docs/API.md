# API Reference

All routes live under `/api`. Every handler is a Next.js App Router route
(`src/app/api/**/route.ts`).

- [Conventions](#conventions) — auth, errors, pagination. **Read this first.**
- [Listings](#listings) · [Search](#search) · [Images & uploads](#images--uploads)
- [Checkout & publishing](#checkout--publishing) · [Boosts](#boosts) · [Webhooks](#webhooks)
- [Billing & referrals](#billing--referrals)
- [Favorites](#favorites) · [Applications](#applications) · [Reports](#reports) · [Saved searches](#saved-searches) · [Notifications](#notifications)
- [Dashboard](#dashboard) · [User & account](#user--account) · [Verification](#verification)
- [Ads](#ads) · [Admin](#admin) · [Cron](#cron) · [Dev-only](#dev-only)

---

## Conventions

### Authentication

Session auth via [better-auth](https://better-auth.com), read server-side through
`getCurrentUserId()` / `getCurrentUser()` (`src/lib/auth.ts`). The session cookie is
set by `/api/auth/*` — there are no API keys or bearer tokens for user routes.

Unauthenticated requests to a protected route get:

```json
{ "error": "Not authenticated" }
```

with status `401`.

Three routes are deliberately public: `GET /api/listings`, `GET /api/listings/[id]`,
and `GET /api/listings/search`. `POST /api/listings/[id]/track` is also unauthenticated
by design (view/apply-intent counting).

### Authorization

| Guard | Used by | Failure response |
| ----- | ------- | ---------------- |
| Owner check | Listing mutations | `403 {"error":"Forbidden"}` |
| `requireAdmin()` | All `/api/admin/*` | **`404`** — see below |
| `isAuthorizedCron()` | `/api/cron/*` | `401 {"error":"Unauthorized"}` |

> **Admin routes return 404, not 403.** `requireAdmin()` (`src/lib/admin.ts`) calls
> Next.js `notFound()`, so a non-admin hitting an admin endpoint gets the 404 page
> rather than a JSON 403. This is intentional (it doesn't leak which admin routes
> exist), but it means you can't distinguish "not an admin" from "route doesn't
> exist" client-side.

Non-`LIVE` listings behave the same way: `GET /api/listings/[id]` returns `404` to
anyone who isn't the poster, rather than `403`.

### Error shapes

Validation failures return `400`, but in **two different shapes** depending on the route:

```jsonc
// Most routes — zod .flatten()
{ "error": { "formErrors": [], "fieldErrors": { "title": ["Too small"] } } }

// POST /api/listings only — raw issues
{ "error": { "issues": [{ "code": "too_small", "path": ["title"], "message": "…" }] } }
```

Business-rule failures (redeem a spent credit, boost without allotment) return `400`
with a plain string message thrown from the lib layer:

```json
{ "error": "No boost allotment remaining" }
```

### Pagination

List endpoints take `page` (1-based, default `1`) and `limit` (default `20`, **max 50**)
and respond with:

```json
{ "listings": [], "total": 142, "page": 1, "limit": 20 }
```

There is no `totalPages` field — compute it as `Math.ceil(total / limit)`.

`GET /api/dashboard` is the exception: it uses `limit`/`offset` (max `limit` 100)
and returns no total.

### Listing payload

Anything returning a listing includes the `listingInclude` relation set
(`src/lib/listings.ts`): all four `*Details` relations (only one is non-null, per
`category`), `images` sorted by `sortOrder`, and a trimmed `poster`
(`id`, `name`, `businessName`, `verificationStatus`, `image`, `accountType`).

---

## Listings

### `GET /api/listings`

Browse listings. Public.

| Param | Type | Default | Notes |
| ----- | ---- | ------- | ----- |
| `category` | `JOB` \| `TENDER` \| `AUCTION` \| `CLASSIFIED` | — | |
| `page` | number | `1` | |
| `limit` | number | `20` | max 50 |
| `mine` | `"true"` | — | Return the caller's own listings in **any** status; requires auth (`401` otherwise) |
| `status` | string | — | **Accepted by the schema but ignored by the handler.** Filter client-side, or use `mine=true` |

Without `mine=true`, results are hard-filtered to `status: "LIVE"`. Ordering is
boosted-first, then newest (`isCurrentlyBoosted desc, createdAt desc`).

This endpoint has **no keyword/location/sort support** — use
[`GET /api/listings/search`](#search) for that.

### `POST /api/listings`

Create a listing. Returns `201 { listing }`. The listing starts as `DRAFT`;
publishing happens through [checkout](#checkout--publishing).

Body is a discriminated union on `category` (`createListingSchema`,
`src/lib/validations/listing.ts`):

```json
{
  "category": "JOB",
  "title": "Software Engineer",
  "description": "Full description, min 10 chars",
  "location": "Kigali",
  "language": "EN",
  "details": { }
}
```

`title` 3–200 chars, `description` ≥10, `location` ≥1, `language` one of `EN`/`FR`/`RW`
(default `EN`). Contact fields and images are **not** accepted here — contacts live
inside category `details`, images are attached via
[`POST /api/listings/[id]/images`](#images--uploads).

`details` by category:

| Category | Required | Optional |
| -------- | -------- | -------- |
| `JOB` | `sector`, `applicationDeadline` | `experienceLevel` (`INTERNSHIP`/`ENTRY`/`MID`/`SENIOR`/`NOT_SPECIFIED`, default `NOT_SPECIFIED`), `applicationMethod` (`PLATFORM`/`EXTERNAL_URL`/`EMAIL`, default `PLATFORM`), `applicationUrl`, `applicationEmail`, `salaryRangeMin`, `salaryRangeMax` |
| `TENDER` | `sector`, `submissionDeadline` | `budgetMin`, `budgetMax`, `eligibilitySummary`, `requiredDocuments`, `documentUrl` |
| `AUCTION` | `auctionDate`, `auctionLocation` | `startingPrice`, `currency` (default `RWF`), `registrationContactPhone`, `registrationContactWhatsapp`, `registrationContactEmail` |
| `CLASSIFIED` | `subcategory` | `price`, `contactPhone`, `contactWhatsapp` (each ≤30 chars) |

Conditional rules on `JOB`: `applicationUrl` is required when `applicationMethod` is
`EXTERNAL_URL`; `applicationEmail` is required when it's `EMAIL`.

Two background jobs fire after creation and never block the response: AI moderation
flagging (`runAiFlagging`) on every listing, and `generateTenderSummary` for tenders.

### `GET /api/listings/[id]`

Single listing with relations. Returns `404` if missing — **and also `404` if the
listing isn't `LIVE` and the caller isn't the poster.**

### `PATCH /api/listings/[id]`

Update a listing. Poster only (`403` otherwise). Body is `updateListingSchema` —
any subset of `title`, `description`, `location`, `language`, `details`.

`details` is merged into whichever detail relation matches the listing's existing
category; you cannot change `category` after creation.

> No status restriction is enforced — a `LIVE` listing can be edited through this
> route, not just a `DRAFT` one.

### `DELETE /api/listings/[id]`

Soft-delete. Poster only. Sets `status: "REMOVED"` and returns the updated listing;
no rows are deleted.

### `POST /api/listings/[id]/track`

Records apply-link click intent — increments `applicationCount`. Unauthenticated.
Only affects `LIVE` listings; returns `404` otherwise. Response `{ "ok": true }`.

---

## Search

### `GET /api/listings/search`

Full-text and faceted search (`src/lib/search.ts`, backed by `pg_trgm`). Public.

| Param | Type | Notes |
| ----- | ---- | ----- |
| `q` | string | Keyword |
| `category` | enum | `JOB`, `TENDER`, `AUCTION`, `CLASSIFIED` |
| `location` | string | |
| `sector` | string | JOB / TENDER |
| `experienceLevel` | enum | `INTERNSHIP`, `ENTRY`, `MID`, `SENIOR`, `NOT_SPECIFIED` |
| `subcategory` | string | CLASSIFIED |
| `budgetMin` / `budgetMax` | number | |
| `sort` | enum | `relevance`, `newest`, `salary_desc`, `deadline_asc`, `price_asc`, `price_desc` |
| `page` / `limit` | number | `1` / `20` (max 50) |

Returns `{ listings, total, page, limit }`.

---

## Images & uploads

Uploads are direct-to-R2: presign, `PUT` the file yourself, then attach the returned
public URL to the listing.

### `POST /api/uploads/presign`

```json
{ "filename": "photo.jpg", "contentType": "image/jpeg", "purpose": "listing-image" }
```

`purpose` is `listing-image` (default), `verification-doc`, or `ad-creative`. Content-type is
gated per purpose: `image/*` for listing images and ad creatives; `image/*` or `application/pdf`
for verification documents. The purpose also picks the key prefix — `listings/`, `verification/`,
or `ads/`.

```json
{ "uploadUrl": "https://…signed…", "publicUrl": "https://cdn…/listings/<userId>/<uuid>.jpg" }
```

The signed URL **expires in 300 seconds**. Returns `503` when R2 env vars are absent.

### `POST /api/listings/[id]/images`

Attach an uploaded image. Poster only. Body `{ "url": "https://…" }`. Returns
`201 { image }`; `sortOrder` is assigned automatically as last+1.

### `DELETE /api/listings/[id]/images/[imageId]`

Poster only. `404` if the image doesn't belong to that listing.

---

## Checkout & publishing

A `DRAFT` becomes `LIVE` one of three ways: mobile-money payment, a subscription
allotment, or a referral credit.

### `GET /api/checkout/[listingId]`

Context for rendering the checkout screen. Poster only (`404` otherwise).

```json
{
  "listingStatus": "DRAFT",
  "pricing": { "payPerBoost": 10000, "annualSubscription": 300000, "subscriberBoostDiscount": 8000 },
  "hasActiveSubscription": false,
  "availableCredits": [{ "id": "…", "amount": 10000 }]
}
```

Prices are in RWF and come from `PricingConfig`, falling back to the defaults above.

### `POST /api/checkout/[listingId]`

Initiate a PawaPay mobile-money deposit. Returns `201 { payment }`.

```json
{ "tier": "PAY_PER_BOOST", "phoneNumber": "250781234567", "provider": "MTN_MOMO_RWA" }
```

- `tier` — `PAY_PER_BOOST` or `ANNUAL_SUBSCRIPTION`
- `phoneNumber` — must match `^2507\d{8}$` (no `+`, no spaces)
- `provider` — `MTN_MOMO_RWA` or `AIRTEL_RWA`

The listing only goes `LIVE` once the [webhook](#webhooks) confirms the deposit.

### `GET /api/checkout/[listingId]/status`

Poll after initiating. Poster only.

```json
{ "listingStatus": "PENDING_PAYMENT", "latestPayment": { "id": "…", "status": "PENDING" } }
```

### `POST /api/checkout/[listingId]/free-publish`

Publish using a subscription's included listing allotment. No body. `400` with a
message if there's no active subscription or the allotment is spent.

### `POST /api/checkout/[listingId]/redeem-credit`

Publish using a referral credit. Body `{ "creditId": "…" }`.

---

## Boosts

Same three payment paths as publishing, applied to an already-live listing.

### `GET /api/listings/[id]/boost`

Poster only.

```json
{
  "quote": { "kind": "STANDARD", "price": 10000 },
  "isCurrentlyBoosted": false,
  "boostExpiresAt": null,
  "latestBoostPayment": { "id": "…", "status": "COMPLETED" },
  "availableCredits": [{ "id": "…", "amount": 10000 }]
}
```

`quote` is a discriminated union on `kind` — branch on it rather than reading `price`
unconditionally:

| `kind` | When | `price` |
| ------ | ---- | ------- |
| `STANDARD` | No active subscription | `pricing.payPerBoost` |
| `FROM_ALLOTMENT` | Subscription with boosts left | **absent** — use [`/boost/redeem`](#post-apilistingsidboostredeem) |
| `SUBSCRIBER_DISCOUNT` | Subscription, allotment spent | `pricing.subscriberBoostDiscount` |

### `POST /api/listings/[id]/boost`

Body is the checkout schema **without** `tier` — just `phoneNumber` and `provider`.
Returns `201 { payment }`.

### `POST /api/listings/[id]/boost/redeem`

Use a subscription's monthly boost allotment. No body.

### `POST /api/listings/[id]/boost/redeem-credit`

Body `{ "creditId": "…" }`.

---

## Webhooks

### `POST /api/webhooks/pawapay`

PawaPay deposit callback. Verified via `verifyPawaPayWebhook()` before any state
change; an invalid signature returns `401` and is logged. Requires **Signed callbacks**
enabled in the PawaPay dashboard plus `PAWAPAY_API_TOKEN`.

Acts on `status`: `COMPLETED` → `handleDepositCompleted`, `FAILED` →
`handleDepositFailed`. Anything else is acknowledged and ignored. Handler errors
return `500` so PawaPay retries. Response `{ "received": true }`.

Payload is read from `body.data` if present, otherwise the body itself.

> Untested against a live PawaPay account. For local state-machine testing use
> [`/api/dev/pawapay-webhook`](#dev-only), which calls the same handlers without
> signature verification.

---

## Billing & referrals

### `GET /api/billing`

Last 20 payments, subscription state, and unspent credits.

```json
{
  "payments": [{ "id": "…", "amount": 10000, "listing": { "id": "…", "title": "…" } }],
  "subscription": {
    "id": "…", "status": "ACTIVE", "startedAt": "…", "expiresAt": "…",
    "boostsIncludedPerMonth": 4, "boostAllotmentRemaining": 3, "boostAllotmentTotal": 4
  },
  "availableCredits": [{ "id": "…", "amount": 10000, "expiresAt": "…" }]
}
```

`subscription` is `null` without an active plan. Boost allotment is counted from the
1st of the current calendar month.

### `GET /api/referrals/me`

```json
{
  "referralCode": "ABC123",
  "referralLink": "https://…/?ref=ABC123",
  "referralCount": 5,
  "convertedCount": 2,
  "availableCredits": [],
  "availableCreditTotal": 20000,
  "referrals": []
}
```

Credits expire 90 days after issue (swept by [`/api/cron/credit-expiry`](#cron)).

---

## Favorites

### `GET /api/favorites`

Full saved listings (not just IDs), newest-saved first, each with an added
`favoritedAt`.

### `POST /api/favorites`

Body `{ "listingId": "…" }`. Idempotent — re-saving returns `200` with the existing
favorite instead of erroring. New saves return `201`.

### `DELETE /api/favorites`

Body `{ "listingId": "…" }`. Idempotent; returns `{ "success": true }` either way.

---

## Applications

### `GET /api/applications`

The caller's 50 most recent applications, each with a trimmed `listing`
(`id`, `title`, `category`, `posterId`).

### `POST /api/applications`

```json
{ "listingId": "…", "message": "optional cover note" }
```

Returns `201 { application }`, or `409 {"error":"Already applied"}` on a duplicate.
Also increments the listing's `applicationCount`.

---

## Reports

### `POST /api/reports`

```json
{ "listingId": "…", "reason": "spam", "description": "optional" }
```

Returns `201 { report }`. `listingId` and `reason` are required; the route does not
constrain `reason` to a fixed set — the UI offers `spam`, `inappropriate`, `scam`,
`duplicate`, `other`.

---

## Saved searches

Drive the notification digest — each saved search is matched against new listings and
delivered on the user's chosen channel.

### `GET /api/saved-searches`

The caller's saved searches, newest first.

### `POST /api/saved-searches`

```json
{
  "category": "JOB",
  "channel": "SMS",
  "filters": { "keyword": "engineer", "location": "Kigali", "sector": "ICT", "experienceLevel": "MID" }
}
```

`channel` is `SMS`, `WHATSAPP`, or `EMAIL`. All `filters` keys are optional
(`keyword`/`location`/`sector` ≤200 chars, `experienceLevel` ≤50); `filters` itself
defaults to `{}`. Returns `201 { savedSearch }`.

### `DELETE /api/saved-searches/[id]`

Scoped to the caller — someone else's ID returns `404`. Response `{ "ok": true }`.

---

## Notifications

### `GET /api/notifications`

The caller's 50 most recent notifications (`sentAt` desc), each with the related
`listing` (`id`, `title`) and `savedSearch` (`id`, `category`) where applicable.

---

## Dashboard

### `GET /api/dashboard`

The caller's listings plus category benchmarks.

| Param | Type | Default | Notes |
| ----- | ---- | ------- | ----- |
| `status` | enum | — | `LIVE`, `DRAFT`, `EXPIRED`, `REMOVED`, `PENDING_PAYMENT`, `REJECTED`. Invalid values are ignored, not rejected |
| `limit` | number | `20` | max 100 |
| `offset` | number | `0` | |

```json
{
  "listings": [{ "id": "…", "title": "…", "viewCount": 42, "applicationCount": 3, "isCurrentlyBoosted": false }],
  "benchmarks": { "JOB": { "avgViews": 120, "avgApplications": 8 } }
}
```

`benchmarks` averages across all `LIVE` listings platform-wide, for "how does mine
compare" context.

---

## User & account

### `GET /api/user`

Current user profile: `id`, `name`, `businessName`, `email`, `phoneNumber`, `image`,
`accountType`, `verificationStatus`, `preferredLanguage`, `createdAt`.

### `PATCH /api/user`

Accepts `name`, `businessName`, `email`, `phoneNumber` only. Fields of the wrong type
are silently dropped; if nothing valid remains you get
`400 {"error":"No valid fields to update"}`.

> Avatar, bio, and location are **not** editable here despite appearing in some UI —
> `image` is returned but never written by this route.

### `DELETE /api/account`

Hard-deletes the current user and cascades to their data. **No confirmation body is
required** — the call itself is the confirmation. Returns `{ "success": true }`.

### `/api/auth/[...all]`

better-auth's catch-all handler (`GET`/`POST`) — sign-in, sign-up, OTP, OAuth
callbacks, sign-out. Shapes are better-auth's; see its docs rather than this file.

---

## Verification

### `GET /api/verification`

```json
{ "status": "PENDING", "submittedAt": "…", "reviewedAt": null }
```

### `POST /api/verification`

Body `{ "documentUrl": "https://…" }` (≤1000 chars) — upload via
[presign](#images--uploads) with `purpose: "verification-doc"` first.

Returns `201 { verificationStatus, verificationSubmittedAt }`, or `409` if the user is
already `VERIFIED` or `PENDING`. Re-submission is only allowed after a rejection.

---

## Ads

Display advertising. Both routes are public — they're hit by the rendered ad itself.

### `GET /api/ads/[id]/click`

Increments `clicks` and `302`s to the ad's `targetUrl`. Rendered ads link here rather than
directly to the advertiser, so the count can't be lost to a page unload. `404` for an unknown id.

### `POST /api/ads/[id]/impression`

Increments `impressions`. Called via `navigator.sendBeacon` from
`src/components/ad-impression.tsx` when the creative first enters the viewport — so the number is
viewability-based, one per page view, not a render count.

> Neither route is authenticated or rate-limited, so both counters are inflatable by anyone who
> can read the ad's id. Adequate for reporting to advertisers on trust; don't bill directly off
> these numbers without adding at least IP-based deduplication.

---

## Admin

All require an admin session; non-admins get **`404`** (see [Authorization](#authorization)).

### Ads

**`GET /api/admin/ads`** — all ads, grouped by slot then newest first.

**`POST /api/admin/ads`** — create. Returns `201 { ad }`.

```json
{
  "name": "Cyamunara Q3",
  "advertiserName": "Cyamunara Rwanda Ltd",
  "slot": "SIDEBAR_TOP",
  "imageUrl": "https://…",
  "targetUrl": "https://…",
  "altText": "Cyamunara Rwanda — auction and valuation services",
  "status": "ACTIVE",
  "startsAt": "2026-08-01",
  "endsAt": "2026-08-31",
  "weight": 1
}
```

`slot` is one of `SIDEBAR_TOP`, `SIDEBAR_MID`, `SIDEBAR_BOTTOM`, `FEED_INLINE`,
`HEADER_LEADERBOARD`. `status` is `DRAFT` (default), `ACTIVE`, or `PAUSED`. `startsAt`/`endsAt`
are both nullable — null start means live immediately, null end means until paused. `weight`
controls the share of impressions when a slot has more than one eligible ad.

**`PATCH /api/admin/ads`** — partial update; body is any subset of the above plus `id`.

**`DELETE /api/admin/ads`** — body `{ "id": "…" }`.

An ad renders only when it is `ACTIVE` **and** the current time is inside its window. When no ad
qualifies for a slot, the slot renders nothing at all.

### Moderation

**`GET /api/admin/moderation`** — queue. `?filter=all|flagged|pending` (default `all`;
unrecognized values fall back to `all`).

**`POST /api/admin/moderation/[listingId]`** — act on a listing. Body is a discriminated
union on `action`:

| Action | Reason | Extra |
| ------ | ------ | ----- |
| `APPROVE` | optional | — |
| `REJECT` | **required**, non-empty | — |
| `REFUND` | **required**, non-empty | — |
| `EDIT` | optional | `edits`: at least one of `title` (3–200), `description` (≥10), `location` (≥1) |

```json
{ "action": "REJECT", "reason": "Duplicate of #123" }
```

Any action also marks the listing's outstanding AI flags reviewed.

### Reports

**`GET /api/admin/reports`** — `?status=` (default `PENDING`), 50 most recent, with
reporter name and listing title.

**`PATCH /api/admin/reports`** — body `{ "id": "…", "status": "DISMISSED" }`. Stamps
`reviewedAt` and `reviewedBy`. There is no `adminNotes` field.

### Verification

**`GET /api/admin/verification`** — queue sorted subscribers-first, then by total paid,
then oldest submission. Returns `{ queue, slaBreachedCount }`; each entry carries an
`slaBreached` flag.

**`POST /api/admin/verification/[userId]`** — body
`{ "decision": "VERIFIED" | "REJECTED", "reason": "optional ≤1000 chars" }`.

### Pricing

**`GET /api/admin/pricing`** — all `PricingConfig` rows.

**`PATCH /api/admin/pricing`** — upsert one row:

```json
{ "tier": "PAY_PER_BOOST", "category": null, "price": 12000 }
```

`tier` is `PAY_PER_BOOST`, `ANNUAL_SUBSCRIPTION`, or `SUBSCRIBER_BOOST_DISCOUNT`.
`category` is a listing category or `null` for the global default. `price` is a
positive integer in RWF. The acting admin is recorded on the row.

### Notifications

**`GET /api/admin/notifications`** — last 50 notification logs with recipient contact
details, plus total `savedSearchCount`.

**`POST /api/admin/notifications/digest`** — run the digest now. Same work as
[`/api/cron/digest`](#cron); kept as a manual trigger.

### Umucyo mirror

**`GET /api/admin/umucyo`** — last 30 scrape logs plus the count of listings with
`source: "GOVERNMENT_MIRROR"`.

**`POST /api/admin/umucyo/scrape`** — run the scrape now.

### Tender summaries

**`GET /api/admin/tender-summaries`** — `{ missing, done }` counts of AI-generated
tender summaries.

**`POST /api/admin/tender-summaries`** — generate up to **10** missing summaries per call.

### Referrals

**`GET /api/admin/referrals`** — program stats: `totalReferrals`, `statusCounts`,
`creditsIssuedCount`, `creditsIssuedTotal`, and the 50 most recent referrals with both
parties' contact details.

---

## Cron

Scheduled in [`vercel.json`](../vercel.json). All are `GET`.

| Route | Schedule (UTC) | Does |
| ----- | -------------- | ---- |
| `/api/cron/credit-expiry` | `30 2 * * *` | Flips referral credits past 90 days to `EXPIRED` |
| `/api/cron/listing-expiry` | `0 3 * * *` | `LIVE` → `EXPIRED` past `expiresAt`; clears boost flags |
| `/api/cron/umucyo-scrape` | `0 5 * * *` | Mirrors umucyo.gov.rw tenders (2 pages) |
| `/api/cron/digest` | `0 7 * * *` | Sends saved-search digests |

Auth is `Authorization: Bearer $CRON_SECRET`, checked by `isAuthorizedCron()`
(`src/lib/cron.ts`), which **fails closed** — if `CRON_SECRET` is unset, every request
is rejected. Use the admin panel's manual triggers in development.

`digest` and `umucyo-scrape` set `maxDuration = 300`.

> **`/api/cron/listing-expiry` does not check `isAuthorizedCron()`.** It is the one
> cron route that is publicly callable. The impact is bounded — it only expires
> listings that are already past `expiresAt`, so calling it early does nothing — but
> it's inconsistent with the other three and worth closing.

---

## Dev-only

Every route below returns `404` when `NODE_ENV === "production"`. They exist because
PawaPay and Google OAuth have no usable sandbox credentials yet, and each is marked
with a `TODO` naming the ticket that removes it.

| Route | Method | Purpose |
| ----- | ------ | ------- |
| `/api/dev/last-otp` | `GET` | Read back a dev-mode OTP by `?phoneNumber=` or `?email=` |
| `/api/dev/outbox` | `GET` | Inspect SMS/WhatsApp/email captured with no vendor configured |
| `/api/dev/pawapay-webhook` | `POST` | `{ paymentId, outcome }` — drives the real deposit handlers, skipping signature verification |
| `/api/dev/simulate-checkout/[listingId]` | `POST` | `{ tier }` — the checkout DB writes without calling PawaPay |
| `/api/dev/simulate-boost/[id]` | `POST` | Same, for re-boost |
| `/api/dev/simulate-google-login` | `POST` | Real better-auth session + a `providerId: "google"` account row, skipping the OAuth handshake |

Pair `simulate-checkout` with `pawapay-webhook` to exercise the full
initiate → webhook → `Listing`/`Subscription`/`Boost` state machine locally.
