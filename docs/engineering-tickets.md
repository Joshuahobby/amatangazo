> *GetRwanda LTD | AI Automation Agency | Kigali, Rwanda*

# Amatangazo 2.0 — Engineering Ticket Breakdown

**Companion to:** `amatangazo-v2-prd.md` (v4) and `amatangazo-data-schema.md` / `schema.prisma`
**How to use this doc:** Import epics as-is into your project tracker, or hand this whole file to Claude Code as a build checklist. Ticket IDs (e.g., `T1.2`) are stable references — use them in commit messages/branch names. Sizes are **relative**, not time estimates (no velocity baseline exists yet — see PRD Success Metrics): **S** = a few hours, **M** = 1–2 days, **L** = 2–4+ days or genuinely uncertain scope.

For the six core P0 requirements' detailed acceptance criteria (Given/When/Then), reference the PRD directly rather than this doc — tickets here point back to it instead of duplicating.

---

## Suggested Build Order

Not committed sprint numbers — depends on team size/velocity. This is the dependency-sound order:

1. **Start immediately, in parallel:** Epic 0 (Foundation) + T2.1 (PawaPay spike) + T3.1 (Umucyo spike) + T7.1 (Twilio/WhatsApp sender registration — kick off now even though it's P1, since Meta approval has its own lead time)
2. **Epic 1** (Core Listing System) — the spine everything else attaches to
3. **Epic 2** (Checkout) + **Epic 6** (Auth) — parallel, once Epic 1's forms exist
4. **Epic 3** (Tender scraper) + **Epic 4** (Referral loop) + **Epic 5** (Trust & moderation) — parallel, none blocks the others
5. **P0 complete → launch-ready.** Epics 7–10 (P1) start post-launch per the PRD's phasing

---

## Epic 0 — Foundation & Infrastructure

| ID | Title | Size | Depends On | Notes |
|---|---|---|---|---|
| T0.1 | Repo scaffolding | S | — | Next.js App Router + TypeScript, lint/format config |
| T0.2 | Database provisioning | S | — | Neon / Supabase / Railway Postgres |
| T0.3 | Apply `schema.prisma`, run first migration | M | T0.2 | Also enable `pg_trgm` extension — see data-schema.md manual migration steps |
| T0.4 | Auth provider setup | M | — | Clerk or NextAuth, phone OTP primary |
| T0.5 | Cloudflare R2 bucket + upload utility | S | — | |
| T0.6 | Environment/secrets scaffolding | S | — | `.env` structure for PawaPay, Twilio, R2 keys |
| T0.7 | Vercel project + CI/CD | S | — | Deploy on push |
| T0.8 | Admin panel route scaffolding | M | T0.4 | Auth-gated route group |

## Epic 1 — Core Listing System (P0-1)

| ID | Title | Size | Depends On | Notes |
|---|---|---|---|---|
| T1.1 | Listings base API (CRUD) | M | T0.3 | Core `Listing` model routes |
| T1.2 | Job posting form + `JobDetails` | M | T1.1 | |
| T1.3 | Tender posting form + `TenderDetails` | M | T1.1 | |
| T1.4 | Auction posting form + `AuctionDetails` | M | T1.1 | Include `auctionDate` field — feeds the countdown |
| T1.5 | Classifieds posting form + `ClassifiedDetails` | S | T1.1 | |
| T1.6 | Listing detail page templates (per category) | M | T1.2–T1.5 | Includes the auction countdown UI component — static event timer, no bid logic |
| T1.7 | Search & filter (Postgres FTS + trigram) | L | T0.3, T1.1 | |
| T1.8 | Schema.org structured data injection | S | T1.6 | `JobPosting` etc., for SEO |
| T1.9 | Image upload flow (R2) | M | T0.5, T1.4, T1.5 | Auctions + classifieds |

## Epic 2 — Self-Service Posting + PawaPay Checkout (P0-2)

| ID | Title | Size | Depends On | Notes |
|---|---|---|---|---|
| T2.1 | **PawaPay integration spike** | M | — | Confirm checkout flow type (hosted vs. API-driven) and webhook signature verification before building the real flow. Do this early. |
| T2.2 | Checkout UI (category → form → tier) | M | T1.2–T1.5 | Both pay-per-post/boost and subscription options |
| T2.3 | PawaPay payment initiation + webhook handler | L | T2.1, T2.2 | Payment confirmation flips listing to `LIVE` |
| T2.4 | Payment retry flow | S | T2.3 | Failed payment → retry without re-entering the form |
| T2.5 | Post-payment confirmation message | S | T2.3 | SMS ships without waiting on Epic 7; WhatsApp comes once the sender's approved |
| T2.6 | Admin pricing dashboard | M | T0.8 | `PricingConfig` CRUD — no code deploy for price changes |
| T2.7 | Boost purchase flow + featured-slot cap | L | T2.3, T1.6 | **Decide the slot-cap/rotation policy before building** — see data-schema.md design note |

## Epic 3 — Government Tender Mirroring (P0-3)

| ID | Title | Size | Depends On | Notes |
|---|---|---|---|---|
| T3.1 | **Umucyo site structural investigation (spike)** | S | — | No code — confirm scrape targets, pagination, fields. Do this first. |
| T3.2 | Scraper implementation | L | T3.1, T0.3 | Respects robots.txt, rate-limited, scheduled daily |
| T3.3 | Scrape monitoring | M | T3.2 | `UmucyoScrapeLog`, breakage alerting |
| T3.4 | Mirrored tender ingestion | M | T3.2 | Creates `Listing` + `TenderDetails` with source tag + backlink |

## Epic 4 — Referral / Affiliate Growth Loop (P0-4)

| ID | Title | Size | Depends On | Notes |
|---|---|---|---|---|
| T4.1 | Referral code generation + link tracking | S | T0.4 | |
| T4.2 | Referral credit issuance logic | M | T2.3, T4.1 | RWF 10,000 credit on first paid listing, RWF 30,000 on annual conversion |
| T4.3 | Fraud detection (payment/device overlap) | M | T4.2 | Holds credit for manual review |
| T4.4 | Referral admin dashboard | M | T0.8, T4.2 | |
| T4.5 | Credit redemption at checkout | M | T2.2, T4.2 | |
| T4.6 | Credit expiry + monthly cap job | S | T4.2 | 90-day expiry, 10/month cap, scheduled job |

## Epic 5 — Trust & Moderation Baseline (P0-5)

| ID | Title | Size | Depends On | Notes |
|---|---|---|---|---|
| T5.1 | Admin moderation actions | M | T0.8, T1.1 | Approve/reject/edit/refund |
| T5.2 | AI-assisted flagging | L | T1.1 | Duplicate/scam/spam classification — needs an LLM API decision, not specified in the PRD |
| T5.3 | Multilingual UI (EN/FR/RW) | L | T1.6 | i18n framework + translated strings |

*Note: "verification never gates posting" isn't a separate ticket — it's satisfied by not building a gate. Confirm this is explicitly tested in T2.2/T2.3's QA pass.*

## Epic 6 — Auth (P0-6)

| ID | Title | Size | Depends On | Notes |
|---|---|---|---|---|
| T6.1 | Phone OTP login flow | M | T0.4 | |
| T6.2 | Email fallback path | S | T6.1 | |

---

### P0 ends here — this is launch scope.

---

## Epic 7 — Notifications: SMS & WhatsApp (P1)

| ID | Title | Size | Depends On | Notes |
|---|---|---|---|---|
| T7.1 | Twilio account setup + WhatsApp sender registration | S | — | Start during Phase 1 — Meta approval has lead time even brokered via Twilio |
| T7.2 | Saved search creation UI | M | — | |
| T7.3 | Digest notification job | L | T7.1, T7.2 | Matches saved searches, sends via Twilio's unified API |
| T7.4 | SMS→WhatsApp channel switch | S | T7.1, T7.3 | Same code path, different address prefix, once sender's approved |

## Epic 8 — AI Tender Summarization (P1)

| ID | Title | Size | Depends On | Notes |
|---|---|---|---|---|
| T8.1 | PDF text extraction | M | T1.3 | From uploaded tender documents |
| T8.2 | LLM summarization | M | T8.1 | Deadline/budget/eligibility/required-docs extraction |
| T8.3 | Summary card UI | S | T8.2 | On the tender listing page |

## Epic 9 — Verified Badge (P1)

| ID | Title | Size | Depends On | Notes |
|---|---|---|---|---|
| T9.1 | Document upload flow | M | T0.5 | Business registration cert / TIN |
| T9.2 | Admin review queue | M | T0.8, T9.1 | Priority-sorted by account value (subscribers/recent boosts first) |
| T9.3 | SLA tracking | S | T9.2 | 1-business-day public promise, 48-hour auto-flag — uses the composite index in `schema.prisma`, no extra table needed |
| T9.4 | Verification status UI | S | T9.1 | Unverified / Pending / Verified states |

## Epic 10 — Employer Analytics Dashboard (P1)

| ID | Title | Size | Depends On | Notes |
|---|---|---|---|---|
| T10.1 | View/application counters | S | T1.6 | Increment on read/action |
| T10.2 | Dashboard UI | M | T10.1 | With benchmark comparison |

---

## Phase 3 / P2 — Not Ticketed

On-platform live bidding + auction escrow, CV database, B2B data API, AI natural-language search, AI drafting assist, RDB API automation, native mobile app. These stay as the PRD's "P2 — Future Considerations" list until they're actually scheduled — ticketing them now would lock in assumptions before there's any Phase 1 data to base them on.

---

*— GetRwanda LTD*
