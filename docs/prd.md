> *GetRwanda LTD | AI Automation Agency | Kigali, Rwanda*

# Amatangazo 2.0 — Product Requirements Document

**Status:** Draft v4 — fully resolved, no open questions remaining
**Owner:** Product (you)
**Scope:** Full platform rebuild — jobs, tenders, auctions, classifieds — off WordPress onto a self-service, self-monetizing stack

---

## Decision Log (v2)

| # | v1 Open Question | Decision |
|---|---|---|
| 1 | Umucyo ingestion mechanism | No public API — build a scraper. See updated Requirement P0-3. |
| 2 | Verification badge data source | No RDB API — badge runs on manual document upload + admin review instead of automated lookup. See updated P1 table. |
| 3 | Auction escrow / live bidding | Deferred entirely for now, not just deposits. v1 auctions ship as structured notice listings — no in-platform bidding. See updated Non-Goals and Personas. |
| 4 | Pricing | RWF 10,000 per listing/boost (24 hrs) and RWF 300,000/year unlimited subscription, both admin-configurable. See new Monetization & Pricing section. |
| 5 | Notification vendor | Twilio replaces direct Meta WhatsApp Cloud API integration — one vendor, one API for SMS + WhatsApp. See updated Technical Architecture. |
| 6 | Referral structure | Concrete credit-based proposal below. See updated Requirement P0-4. |

## Decision Log (v3)

| # | Question | Decision |
|---|---|---|
| 7 | Auction countdown | Kept in scope — auctions display a live countdown to the auction date. This is a static event timer, not a bid clock; still no in-platform bidding. See updated Non-Goals, Requirement P0-1, and Personas. |
| 8 | Umucyo scraping legality | Resolved — no restriction found in Umucyo's terms; treated as public-interest government data, safe to scrape with the guardrails already specified in P0-3. Legal question closed. |
| 9 | Listing duration vs. boost window | Resolved — RWF 10,000 publishes the listing **and** grants 24 hours of featured/boosted placement; the listing itself stays live at standard placement until its natural deadline. See updated Monetization & Pricing, with reasoning. |
| 10 | Verification semantics | Resolved — verification is optional and never gates the ability to publish. Every self-service poster can publish regardless of verified status; the badge is a trust signal layered on top. See updated Requirement P0-5 and P1. |

## Decision Log (v4)

| # | Question | Decision |
|---|---|---|
| 11 | Verification SLA | Resolved — 1-business-day public SLA, 48-hour internal escalation ceiling, priority queue for paying accounts. See new "Verified Badge — Review Process & SLA" block under P1. |
| 12 | Subscriber boost allotment | Resolved — 2 included boosts/month, additional boosts at a 20% subscriber discount, featured slots capped per category to protect scarcity value. See updated Monetization & Pricing, with reasoning. |

## Decision Log (v5)

| # | Question | Decision |
|---|---|---|
| 13 | PawaPay card support | Resolved — the T2.1 build spike confirmed PawaPay's Merchant API only accepts `payer.type: "MMO"` (mobile money); there is no card option anywhere in their documented deposits API. Card is dropped from v1 checkout — MoMo (`MTN_MOMO_RWA`) and Airtel Money (`AIRTEL_RWA`) only. A second, card-capable processor is a backlog item if demand shows up post-launch, not a v1 blocker. |

## Decision Log (v6)

| # | Question | Decision |
|---|---|---|
| 14 | Auth provider & method priority | Resolved — Clerk ruled out on cost; NextAuth/Auth.js ruled out because it has no native phone/SMS OTP (would be entirely hand-built) and has open Next.js 16 compatibility issues, while Auth.js's own maintainers now steward Better Auth and recommend it for new projects. **Better Auth** is the auth library. Separately, the original P0-6 priority (phone OTP primary, email fallback) is reversed by direct product decision: **Google social login is now primary, email OTP is secondary, phone-number OTP is tertiary.** No further business rationale beyond this direct instruction was captured. |

## Decision Log (v7)

| # | Question | Decision |
|---|---|---|
| 15 | AI tender summarization scope for document-less tenders | Resolved during the Epic 8 build — the ticket framed summarization as "from uploaded tender documents", but the majority of live tenders at launch are Umucyo mirrors that carry no attached PDF, only structured fields plus a composed description. Summarization therefore runs on the attached PDF **when one exists** and otherwise on the listing's own title + description, so the summary card works for the entire tender inventory, not just user-uploaded tenders. Extraction is instructed to never invent values ("Not stated" when absent). |

No open questions remain.

---

## Executive Summary

Amatangazo.com today is a WordPress site running the same category structure as the market leader, jobinrwanda.com, without the scale, self-service checkout, or monetization engine to compete. This spec defines a rebuild that ships **category parity from day one** (jobs, tenders, auctions, classifieds all live at launch) while **concentrating build depth on tenders and auctions** — the two categories where every competitor treats the experience as an afterthought. Monetization is two-sided from launch (pay-per-post/boost, or unlimited-posting subscription) and payments run on PawaPay for mobile-money-native, self-service checkout. Growth is engineered deliberately to solve the cold-start problem (government tender mirroring + referral loop) rather than left to organic adoption.

---

## Problem Statement

Rwanda's jobs/tenders/auctions/classifieds market is dominated by jobinrwanda.com (21,464+ jobs published, 4,333 employers, 292,260 candidates), whose posting flow is sales-assisted rather than self-service, and whose tenders/auctions are treated as secondary categories bolted onto a jobs-first product. Amatangazo.com, in its current WordPress form, is a thinner clone of the same structure with no clear self-service monetization engine and no differentiated trust or discovery experience. Rwandan SMEs hunting for tenders today must manually read long, bureaucratic PDF notices to extract deadline, budget, and eligibility — a real and recurring time cost with no tooling built to solve it. Buyers and sellers in the auction category have no verification or deposit mechanism, leaving the category vulnerable to the scam concerns that already dog online classifieds regionally.

---

## Goals

1. **Ship full category parity at launch** (jobs, tenders, auctions, classifieds) so a first-time visitor perceives amatangazo as a complete alternative to jobinrwanda.com — while concentrating actual product investment in tenders and auctions, the categories competitors underserve.
2. **Make self-service the default publishing path.** A poster should be able to go from "start" to "live listing" via PawaPay checkout with no manual sales or ops touch for the large majority of listings.
3. **Establish recurring, two-sided monetization from day one** — pay-per-post/boost and unlimited-posting subscriptions — rather than one-off fees only.
4. **Break the cold-start problem deliberately**, using government tender mirroring (Umucyo) and a referral/affiliate growth loop, instead of waiting years for organic two-sided adoption the way an unfunded listings site would.
5. **Build a visible trust layer** (verification, moderation, deposits) that a legacy WordPress competitor has not retrofitted, and that directly addresses the scam concerns known in this market.

---

## Non-Goals

| Non-Goal | Why it's out of scope (v1) |
|---|---|
| Native mobile app | Web + WhatsApp covers the self-service loop faster and cheaper; revisit once web traffic validates demand. |
| Direct MTN/Airtel merchant integration | PawaPay gets multi-rail mobile money live in one integration now; direct-to-telco can be revisited later purely to reduce processing fees at higher volume. |
| Card payments | PawaPay's Merchant API doesn't support card for collections (v5 decision log, #13) — v1 checkout is MoMo + Airtel Money only. Revisit with a second, card-capable processor if demand shows up post-launch. |
| HR/payroll services upsell (à la jobinrwanda's HRMS) | Separate business line; would dilute focus before the core marketplace wedge is proven. |
| Deep vertical classifieds (structured car/real-estate schemas like Jiji or house-in-rwanda) | Classifieds ships as a general category for coverage parity, not a specialized vertical marketplace — avoids fighting dedicated players before tenders/auctions prove the model. |
| On-platform live bidding & escrow, any category | Auctions ship as structured notice listings in v1 — photos, price, date, location, contact, and a countdown to the auction date — informational only, matching how physical/third-party-run auctions are already announced in this market. The countdown is a static event timer, not a bid clock; there's still no in-platform bid placement or deposit-holding in v1. Revisit bidding/escrow once the core marketplace is proven and the fund-holding regulatory question is answered. |

---

## Strategic Positioning

🔵 **Parity in coverage, focus in depth.** All four categories are live and usable at launch so the site never looks incomplete next to jobinrwanda.com. But the roadmap below deliberately weights product effort — search quality, AI summarization, verification, notifications — toward **tenders and auctions**, where the competitive brief found every incumbent treats the category as a listings afterthought rather than a real product. Jobs and classifieds ship at "good enough to be credible," not "best in market," in v1.

---

## Monetization & Pricing

| Tier | Price | What it buys |
|---|---|---|
| **Pay-per-listing/boost** | RWF 10,000 | Publishes the listing **and** grants 24 hours of featured/boosted placement (top-of-category, homepage highlight) |
| **Annual subscription** | RWF 300,000/year | Unlimited posting across all categories, plus **2 featured boosts/month included** |

- [ ] Pricing is **not hardcoded** — the admin dashboard supports setting/editing price per tier (and later, per category) without a code deploy
- [ ] Checkout displays both options side-by-side so a poster can compare cost-per-listing against the subscription break-even point
- [ ] After the 24-hour boost window ends, the listing **stays live at standard (non-featured) placement** until its natural deadline (a job/tender's closing date) or a default lifespan for categories without one (proposed: 30 days for classifieds, through the auction date for auctions) — it does not disappear
- [ ] Posters can purchase additional 24-hour boosts at any time to re-feature an already-live listing
- [ ] Annual subscribers receive **2 included boosts/month** (24/year), which do **not** roll over — encourages steady use and keeps demand for featured slots predictable
- [ ] Once a subscriber's monthly allotment is used, additional boosts are purchasable at a **20% loyalty discount (RWF 8,000)** rather than the standard RWF 10,000 rate
- [ ] Featured/boosted placement is capped at a fixed number of slots per category (proposed: top 6–8, rotating among currently-active boosts) — this is what protects the scarcity that makes a boost worth paying for at all

🔵 **Resolved:** RWF 10,000 publishes the listing *and* buys 24 hours of featured placement — not 24 hours of total existence. Reasoning: under the total-existence reading, keeping a single listing alive for a month costs 30 × RWF 10,000 = RWF 300,000 — identical to the *unlimited-annual* price, which breaks the pricing logic entirely (nobody would repeat-buy one listing at the same price as unlimited everything). Reading the 24 hours as a boost window keeps the numbers coherent and gives serious posters a clear upgrade path from occasional boosts to the annual plan. It also keeps the search index growing with live, standard-placement listings between boosts — which directly serves the "feels like a complete alternative to jobinrwanda.com" goal.

🔵 **Resolved:** Annual subscribers get a modest included boost allotment (2/month) rather than unlimited free boosting, plus a loyalty discount beyond that. Reasoning: unlimited free boosts for subscribers would let heavy users occupy every "featured" slot at zero marginal cost, destroying the scarcity that makes a standalone boost worth RWF 10,000 to anyone else — a direct hit to both a la carte revenue and to "featured" meaning anything as a trust signal. A small included allotment plus a discount on anything beyond it keeps the subscription clearly worth upgrading to — unlimited *publishing* alone is already roughly a 4x discount over pay-per-post at 10 listings/month — while still capturing incremental revenue from your most active, highest-LTV accounts instead of capping their spend at a flat annual fee. The featured-slot cap is what makes this whole mechanic hold together: without it, boosting has no scarcity value regardless of how the subscriber allotment is set.

---

## Personas & User Stories

### Job Seeker
- As a job seeker, I want to filter listings by sector, location, and experience level so I can find relevant openings quickly.
- As a job seeker, I want to subscribe to WhatsApp/email alerts matching my criteria so I don't have to check the site daily.
- As a job seeker, I want to apply directly through the platform or be routed to the employer's application channel so applying is frictionless.

### Employer / HR Poster
- As an employer, I want to self-service post a job and pay via PawaPay so I can publish without waiting on a sales rep.
- As an employer, I want to choose pay-per-post/boost or an unlimited subscription so I can pick the model that fits my hiring volume.
- As an employer, I want a verified badge tied to my business registration so candidates trust my postings.
- As an employer, I want a dashboard of views/applications on my listings so I can gauge performance. *(P1)*

### SME / Tender Bidder
- As an SME owner, I want to filter tenders by sector, budget band, and deadline so I can find opportunities relevant to my business.
- As an SME owner, I want a one-glance AI summary of a tender (deadline, budget, eligibility, required documents) so I don't have to read the full PDF to decide if it's worth pursuing.
- As an SME owner, I want WhatsApp alerts for tenders matching my sector so I never miss a deadline.

### Tender Issuer
- As a tender issuer, I want to self-service publish a notice, or have it auto-published if sourced from Umucyo, so it reaches qualified bidders quickly.

### Auctioneer / Seller
- As an auctioneer, I want to publish an auction notice with photos, starting price, and the auction date/location so prospective buyers get clear, credible details, with a countdown to auction day building urgency.
- As an auctioneer, I want to list a registration/inquiry contact (phone, WhatsApp, email) so serious buyers can reach me directly to participate in the auction.
- As an auctioneer, I want bidders to pre-pay a refundable deposit before bidding so only serious bidders participate. *(Deferred — see Non-Goals)*

### Prospective Buyer
- As a prospective buyer, I want to browse and filter auction notices by category, location, and date so I can find upcoming sales relevant to me.
- As a prospective buyer, I want to see a live countdown to the auction date on the listing so I know how much time remains to prepare or register.
- As a prospective buyer, I want to contact the auctioneer directly from the listing so I can register or ask questions before the auction date.
- As a prospective buyer, I want a reminder alert as the auction date approaches so I don't miss it.

### Classifieds Poster
- As a classifieds poster, I want a simple self-service flow so my listing is live within minutes.

### Platform Admin / Moderator
- As an admin, I want AI-assisted flagging of suspicious or duplicate listings so most moderation happens without manual review.
- As an admin, I want to manually approve, reject, edit, or refund listings so I retain control over trust and quality.
- As an admin, I want a referral-program dashboard so I can track whether the growth loop is working.

---

## Requirements

### P0 — Must-Have for Launch

**1. Core listing system across four categories**
Structured taxonomy per category: sector/location/experience level (jobs), sector/budget band/deadline (tenders), starting price/lot photos/auction date, location & countdown (auctions), category/subcategory (classifieds).
- [ ] Each category has its own structured post form, not a generic free-text field
- [ ] All listings are searchable and filterable by their category-specific fields
- [ ] Listing detail pages carry Schema.org structured data (`JobPosting`, etc.) for SEO — most traffic in this market is organic search for specific titles
- [ ] Auction listings display a live countdown (days/hours/minutes) to the auction date on the listing page — a static event timer only, not tied to any in-platform bidding mechanism

**2. Self-service posting + PawaPay checkout**
- [ ] Poster selects category, fills the structured form, and chooses **pay-per-post/boost** or **subscription** at checkout
- [ ] PawaPay checkout (MoMo, Airtel Money) completes in-flow — no redirect to a manual sales or approval step
- [ ] Given payment succeeds, When automated checks pass, Then the listing goes live within 5 minutes with no manual intervention
- [ ] Given payment fails, When the poster returns to checkout, Then they can retry without re-entering the listing form
- [ ] Poster receives confirmation (WhatsApp/SMS/email) with a link to the live listing

**3. Government tender mirroring (Umucyo)** — *Decision: no public API exists; build a scraper.*
- [ ] Scheduled scraper ingests structured tender data from Rwanda's e-Procurement portal (umucyo.gov.rw) — target: daily run
- [ ] Scraper is built defensively: respects robots.txt, rate-limits requests, and is monitored for silent breakage when the source site's markup changes — a recurring maintenance cost to plan for, not a one-time build
- [ ] Each mirrored tender is tagged "Government / Official Source" and links back to the original Umucyo notice — amatangazo adds value through search, filtering, and AI summarization rather than obscuring the source
- [ ] Mirrored tenders sit in the same searchable index as privately-posted tenders
- [ ] 🔴 Before build starts: confirm Umucyo's terms of use don't explicitly prohibit automated collection of published notices — see new Open Question below

**4. Referral / affiliate growth loop** — *Proposed structure, adjustable via the same admin pricing dashboard:*
- [ ] Every registered poster gets a unique referral link/code
- [ ] Given a referred user completes their first paid listing (any category), When the referral is verified, Then the referrer receives **1 free boost credit (RWF 10,000 value)**
- [ ] Given a referred user purchases the **Annual subscription** instead, When verified, Then the referrer receives a larger credit — proposed at **RWF 30,000** — rewarding the higher-value conversion
- [ ] Credits are capped at **10 per referrer per month** by default (admin-configurable) to bound cost exposure while the model is unproven
- [ ] Referral performance (signups, conversions, credits issued, cost) is visible on an admin dashboard
- [ ] Given a referred account shares a payment method or device fingerprint with the referrer, When this is detected, Then the credit is held for manual review (fraud control)
- [ ] Credits expire 90 days after issuance to encourage use over stockpiling

**5. Trust & moderation baseline**
- [ ] Admin panel supports approve/reject/edit/refund on any listing
- [ ] AI-assisted flagging surfaces likely duplicate/scam/spam listings for review rather than requiring full manual read-through of every post
- [ ] Multilingual support (English, French, Kinyarwanda) across UI and listing submission — table stakes in this market, not a differentiator
- [ ] Verification is optional and never blocks the ability to publish — every registered poster can self-service publish regardless of verified status; the badge is a trust signal layered on top of the always-open posting flow, not a gate

**6. Auth**
- [ ] Google social login as the primary path, email OTP as secondary, phone-number OTP as tertiary — reversed from the original phone-first decision; see v6 decision log #14
- [ ] All three methods self-service, no manual/sales-assisted account creation

### P1 — Fast Follow

| Requirement | Behavior |
|---|---|
| **AI tender summarization** | Extracts deadline, budget band, eligibility, and required documents from uploaded tender PDFs into a one-glance card on the listing page |
| **SMS & WhatsApp alerts, matching** | Saved searches (sector/keyword/location) trigger digest notifications via Twilio's unified API — SMS ships at launch, WhatsApp switches on once the sender is approved, with no rework required |
| **Verified badge (manual review)** | Employer/auctioneer accounts upload a business registration document (RDB certificate or TIN); admin reviews and approves in the moderation panel — no automated lookup, since no RDB API is exposed. Verification is optional and doesn't gate posting; it's a trust layer on top |
| **Employer analytics dashboard** | Views, applications, and conversion stats per listing, with a benchmark comparison |

**Verified Badge — Review Process & SLA** *(resolves the last open question)*
- [ ] Public SLA: submitted documents are reviewed within **1 business day (24 hours)**
- [ ] Internal ceiling: any request still unreviewed after **48 hours** is auto-flagged as overdue on the admin dashboard
- [ ] Review queue is prioritized by account value — active subscribers and recent boost purchasers are reviewed ahead of free/unverified accounts, since they're the accounts most worth protecting for retention
- [ ] Immediately after document submission, the account shows a **"Verification Pending"** state — distinct from both "Unverified" and "Verified" — so the self-service feel isn't broken by an invisible wait
- [ ] Rejections include a stated reason (e.g., "document illegible," "name mismatch") so posters can correct and resubmit without contacting support

🔵 **Resolved:** A 1-business-day public promise with a 48-hour hard ceiling balances credibility against what's realistic for a small ops team at launch — fast enough that the badge is worth pursuing, not so fast it breaks the first time someone's out sick. Prioritizing paying accounts in the queue ties the SLA design directly to retention: the posters whose experience most affects renewal and referral get reviewed first.

### P2 — Future Considerations (design for, don't build yet)

- On-platform live bidding + escrow-style refundable deposits for auctions (via PawaPay holds) — deferred as a pair; revisit once the fund-holding regulatory question is answered
- CV/candidate database subscription for employers (jobinrwanda's current data-moat play)
- B2B structured data feed/API (sell tender/job data to agencies, consultancies, media)
- AI natural-language search ("accounting jobs in Kigali closing this week")
- AI-assisted CV and tender-proposal drafting as a paid add-on
- RDB-verified badge automation, if/when RDB ever exposes an API — would replace the manual review process
- Native mobile app

---

## Technical Architecture (reference)

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Database | PostgreSQL, via Prisma ORM |
| Auth | **Better Auth** — Google social login primary, email OTP secondary, phone OTP tertiary (v6 decision log #14) |
| Payments | **PawaPay** (MoMo, Airtel Money — no card, see v5 decision log #13) |
| File/image storage | Cloudflare R2 |
| Search (MVP) | Postgres full-text + trigram; Meilisearch if tender search becomes a bottleneck |
| Notifications | **Twilio** — unified SMS + WhatsApp API for alerts; Resend for transactional email |
| Hosting | Vercel + managed Postgres (Neon/Supabase/Railway) |
| Admin/moderation | In-house panel inside the same Next.js app, not a third-party tool |

---

## Success Metrics

⚠️ Targets below are launch hypotheses, not committed numbers — there's no existing baseline to anchor them to. Revisit after the first 4–6 weeks of real data.

### Leading Indicators
| Metric | Target |
|---|---|
| Self-service completion rate (start → paid → live, no manual touch) | 70%+ within 30 days |
| Time-to-publish (median) | <5 min (jobs/classifieds), <10 min (tenders) |
| WhatsApp alert opt-in rate | 40%+ of registered users within 60 days |
| Referral-attributed new poster signups | 20%+ by month 3 |
| Government tender mirror coverage | 90%+ of active Umucyo tenders mirrored within 24 hours |

### Lagging Indicators
| Metric | Target |
|---|---|
| MRR (subscriptions + pay-per-post) | Pricing is set (RWF 10,000/listing, RWF 300,000/year) — a firm MRR target still needs a volume forecast (listings/month, subscription conversions); compute once Phase 1 traffic data exists |
| Repeat-posting rate (poster returns within 90 days) | 40%+ |
| Listing volume vs. jobinrwanda.com (directional) | Reach 10% of their estimated monthly listing volume within 6 months |
| Scam/fraud report rate | <1% of published listings flagged post-publish |

---

## Open Questions

All questions raised across this spec are resolved — see the **Decision Log** at the top for the full trail. Nothing is outstanding or blocking build.

---

## Timeline Considerations

**Hard dependencies to start immediately, in parallel with build:**
- PawaPay merchant onboarding/KYC
- Twilio account setup + WhatsApp sender registration — this still routes through a Meta Business Manager approval step, just brokered via Twilio's console, so it isn't fully eliminated as a lead-time item
- Because Twilio's SMS and WhatsApp share one API, ship notifications on **SMS first** at launch and switch on WhatsApp the moment the sender is approved — same code path, just a different address prefix, so this doesn't block launch

**Suggested phasing** (adjust to actual team size/velocity — not a committed schedule):
- **Phase 1 (Launch):** All four categories live (auctions as notice listings, no bidding), self-service + PawaPay checkout at the confirmed pricing, government tender scraper, referral loop v1, multilingual UI, admin/moderation panel with a manual verification queue, SEO structured data, Twilio SMS alerts.
- **Phase 2 (post-launch fast follow):** AI tender summarization, WhatsApp alerts & matching (once sender is approved), verified badge (manual review), employer analytics dashboard.
- **Phase 3 (backlog / architectural insurance):** On-platform live bidding + auction escrow deposits, CV database, B2B data API, AI natural-language search, AI drafting assist, RDB API automation (if it ever ships), native app.

---

*— GetRwanda LTD*
