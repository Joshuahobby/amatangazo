# API Reference

All API routes are prefixed with `/api`. Authentication is handled via better-auth sessions (server-side `auth()` calls).

---

## Listings

### `GET /api/listings`

List listings with search, filter, and pagination.

**Query parameters**

| Param      | Type    | Default      | Description                        |
| ---------- | ------- | ------------ | ---------------------------------- |
| `q`        | string  | —            | Search keyword                     |
| `category` | enum    | —            | `JOB`, `TENDER`, `AUCTION`, `CLASSIFIED` |
| `location` | string  | —            | Location filter                    |
| `sort`     | enum    | `relevance`  | `relevance`, `newest`, `salary_desc`, `deadline_asc`, `price_asc`, `price_desc` |
| `sector`   | string  | —            | Filter by sector (JOB/TENDER only) |
| `experienceLevel` | enum | —       | `ENTRY`, `MID`, `SENIOR` (JOB only) |
| `subcategory` | string | —          | (CLASSIFIED only)                  |
| `priceMin` | number  | —            | (CLASSIFIED/AUCTION only)          |
| `priceMax` | number  | —            | (CLASSIFIED/AUCTION only)          |
| `page`     | number  | `1`          | Page number                        |
| `limit`    | number  | `20`         | Results per page                   |

**Response**
```json
{
  "listings": [{ "id": "…", "title": "…", … }],
  "total": 142,
  "page": 1,
  "totalPages": 8
}
```

### `POST /api/listings`

Create a new listing.

**Body** — validated by `createListingSchema`:
```json
{
  "category": "JOB",
  "title": "Software Engineer",
  "description": "…",
  "location": "Kigali",
  "language": "EN",
  "businessName": "Acme Corp",
  "whatsapp": "+2507…",
  "phone": "+2507…",
  "email": "hr@acme.rw",
  "website": "https://acme.rw",
  "details": { /* category-specific */ },
  "imageKeys": ["uploads/abc123.jpg"]
}
```

**Category-specific `details` shapes:**

*JOB* — `{ sector, experienceLevel, applicationDeadline, applicationMethod }`
*TENDER* — `{ sector, tenderNumber, tenderType, budget, deadline }`
*AUCTION* — `{ auctionType, startingBid, reservePrice, auctionEnd }`
*CLASSIFIED* — `{ subcategory, price, condition }`

### `GET /api/listings/[id]`

Get a single listing with all relations.

### `PATCH /api/listings/[id]`

Update a listing. Only `DRAFT` listings can be edited.

**Body** — partial update via `updateListingSchema`:
```json
{
  "title": "Updated title",
  "description": "…"
}
```

---

## Favorites

### `GET /api/favorites`

Get the current user's saved listing IDs.

**Response**
```json
{ "favoriteIds": ["id1", "id2"] }
```

### `POST /api/favorites`

Save a listing.
```json
{ "listingId": "…" }
```

### `DELETE /api/favorites`

Unsave a listing.
```json
{ "listingId": "…" }
```

---

## Applications

### `POST /api/applications`

Apply to a job listing.
```json
{ "listingId": "…" }
```
**Response** — `201` on success, `409` if already applied.

### `GET /api/applications`

Get the current user's applications (with listing details).

---

## Reports

### `POST /api/reports`

Report a listing.
```json
{
  "listingId": "…",
  "reason": "spam",
  "description": "…"
}
```
Reason must be one of: `spam`, `inappropriate`, `scam`, `duplicate`, `other`.

---

## Admin

### `GET /api/admin/reports`

List reported listings. **Admin only.**

**Query parameters**

| Param   | Type   | Default | Description                        |
| ------- | ------ | ------- | ---------------------------------- |
| `status`| enum   | `PENDING` | `PENDING`, `DISMISSED`, `ACTIONED` |

### `PATCH /api/admin/reports`

Dismiss or action a report. **Admin only.**
```json
{
  "id": "report-id",
  "status": "DISMISSED",
  "adminNotes": "No action needed"
}
```

---

## Dashboard

### `GET /api/dashboard`

Get the current user's listings with counts.

**Query parameters**

| Param    | Type   | Default | Description                        |
| -------- | ------ | ------- | ---------------------------------- |
| `tab`    | enum   | `live`  | `live`, `draft`, `expired`, `removed`, `saved` |
| `page`   | number | `1`     | Page number                        |

---

## Billing

### `GET /api/billing`

Get payment history and current subscription.

**Response**
```json
{
  "payments": [{ "id": "…", "amount": 5000, … }],
  "subscription": { "plan": "PRO", "listingsRemaining": 3, "boostsRemaining": 1 },
  "credits": { "available": 2 }
}
```

---

## Notifications

### `GET /api/notifications`

Get the current user's notifications.

---

## Account

### `DELETE /api/account`

Delete the current user and all associated data. Requires `{ confirmation: true }` in the body.

---

## User profile

### `GET /api/user`

Get the current user's profile.

### `PATCH /api/user`

Update profile fields (name, bio, phone, location, avatar).

---

## Checkout

### `POST /api/checkout`

Initiate a payment for a listing.

**Body**
```json
{
  "listingId": "…",
  "type": "LISTING_PUBLISH"
}
```
Types: `LISTING_PUBLISH`, `BOOST`, `SUBSCRIPTION`.

### `POST /api/checkout/webhook`

Pawapay payment callback. Idempotent — duplicate calls don't double-publish.

---

## Uploads

### `POST /api/uploads`

Upload an image to R2. Returns a presigned URL.

**Body** — multipart form with `file` field.

---

## Cron

### `POST /api/cron/listing-expiry`

Daily cron — expires listings older than 30 days. Protected by `CRON_SECRET`.
