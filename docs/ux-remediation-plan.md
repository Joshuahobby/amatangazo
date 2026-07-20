# Amatangazo 2.0 — UX/UI remediation plan

A sequenced, one-by-one plan to resolve every finding from the design critique. Items are ordered so that shared foundations land first, then critical conversion/performance work, then trust, consistency, and accessibility cleanup, then verification.

Legend — Effort: S (≤2h) · M (half day) · L (1–2 days). Each item lists the files to touch, the steps, and the acceptance criteria that mean "done."

---

## Phase 0 — Foundations (do first; unblocks later items)

These are cheap decisions and tokens that several later items depend on. Landing them first prevents rework.

### P0.1 — Lock the design language: flat, not glassy · S
- **Problem:** Tokens are flat and disciplined, but hero/glass utilities add blur, mix-blend, gradients, and 2xl shadows that appear nowhere else. The brand fights itself.
- **Files:** `docs/design-system.md`, `src/app/globals.css`
- **Steps:**
  1. Write a one-paragraph decision in `design-system.md`: "Amatangazo is flat, fast, and trustworthy. No glassmorphism, mix-blend, or large blurs in production UI."
  2. Mark `.glass`, `.glass-dark`, and the heavy hero effects as deprecated in `globals.css` comments.
- **Acceptance:** Decision recorded; every later item references it. No new glass utilities added.
- **Depends on:** none.

### P0.2 — Add a radius scale · S
- **Problem:** `.card` = `rounded-xl`, listing cards = `rounded-2xl`, hero = `rounded-3xl`. Three radii, no system.
- **Files:** `src/app/globals.css`
- **Steps:**
  1. Define tokens: `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (16px).
  2. Standardize: inputs/buttons → sm, cards → md, hero/section shells → lg.
- **Acceptance:** No raw `rounded-2xl`/`rounded-3xl` left in components; all reference the scale.
- **Depends on:** none.

### P0.3 — Set the casing rule: sentence case everywhere · S
- **Problem:** Sentence case, Title Case ("Similar Listings"), and UPPERCASE stat labels all coexist.
- **Files:** `docs/design-system.md`, plus all offending strings (fixed in P3.2).
- **Steps:** Record the rule in `design-system.md`: sentence case for all UI text across en/fr/rw. Uppercase only via CSS if ever needed, never hardcoded.
- **Acceptance:** Rule documented; used as the standard in P3.2.
- **Depends on:** none.

### P0.4 — i18n string audit · S
- **Problem:** Real user-facing strings are hardcoded in English and bypass next-intl.
- **Files:** repo-wide grep.
- **Steps:**
  1. Grep for hardcoded UI strings: `"Share on WhatsApp"`, `"Map view coming soon"`, `"Similar Listings"`, `"See all"`, `"Notifications"`, `"Dashboard"`, `"Dev mode"`, `"Sign in as test user"`.
  2. List each with file + line in a checklist appended to this plan.
- **Acceptance:** Complete inventory exists; feeds P3.1.
- **Depends on:** none.

---

## Phase 1 — Critical: conversion & performance

### P1.1 — Add "Contact seller" to classified, auction, and tender detail pages · L
- **Problem:** Three of four categories have no primary conversion action. Non-owners see only Report and "Share on WhatsApp" (which shares to others, not to the seller). This breaks the core marketplace loop.
- **Files:** `src/components/listing-details/classified-details.tsx`, `auction-details.tsx`, `tender-details.tsx`, `src/app/listings/[id]/page.tsx`, new `src/components/contact-seller.tsx`, messages files.
- **Steps:**
  1. Decide the contact mechanism per category. Recommended: reveal-on-click phone + a "Message on WhatsApp to the seller" deep link (`https://wa.me/<seller phone>?text=...`), gated behind auth to reduce scraping.
  2. Build a reusable `ContactSeller` component taking seller phone/WhatsApp + listing context.
  3. Render it as the primary CTA block on classified and auction detail pages; for tender, wire the existing apply/submission path (verify `apply-link.tsx`) and add contact fallback.
  4. Ensure the seller's phone is only exposed with consent (respect any privacy flag on `UserProfile`).
  5. Make it the visually dominant action; demote Report/Share.
- **Acceptance:** On every category's detail page a non-owner has one obvious primary way to reach the seller; jobs keep Apply; owners still see Boost. Phone reveal requires login.
- **Depends on:** P0.1 (styling), decision on privacy exposure.

### P1.2 — Rebuild the hero: flat, fast, search-first · L
- **Problem:** Black gradient + two 120px blurred orbs + mix-blend + noise + framer stagger + shimmer + count-up. GPU-expensive on low-end Android (the core market) and it buries the search bar.
- **Files:** `src/components/hero-section.tsx`, `src/components/marketplace-search.tsx`, `src/app/globals.css` (remove `animate-gradient-x`, `animate-float`, shimmer keyframes if unused elsewhere).
- **Steps:**
  1. Replace the black/gradient shell with a flat surface using brand green (solid or a single subtle tint), radius-lg.
  2. Remove the floating orbs, `mix-blend`, `noise.png` overlay, and CTA shimmer.
  3. Make the search field the visual center: full-width, high-contrast, clearly the primary element; CTAs secondary.
  4. Keep entrance motion minimal (or none); drop the count-up or make it a static number with `+`.
  5. Replace the ✨ emoji badge (see P3.3).
- **Acceptance:** Hero renders with no blur/mix-blend; search is the dominant element; Lighthouse mobile performance and CLS improve; visual holds up on a throttled mid-range device.
- **Depends on:** P0.1, P0.2.

### P1.3 — Fix hero text contrast (WCAG AA) · S
- **Problem:** `text-gray-500`, `text-gray-400`, and `placeholder:text-white/50` on the dark hero likely fail AA — and they sit next to your primary CTAs.
- **Files:** `src/components/hero-section.tsx`, `src/components/marketplace-search.tsx`
- **Steps:**
  1. After P1.2's background is finalized, set body/sub-labels to a shade meeting ≥4.5:1 against the actual background.
  2. Raise placeholder contrast to ≥4.5:1.
  3. Verify each pairing with a contrast checker against the rendered background, not the base color.
- **Acceptance:** All hero text passes AA (4.5:1 normal, 3:1 large) verified.
- **Depends on:** P1.2.

### P1.4 — Trim the homepage · M
- **Problem:** ~13 stacked sections and 40+ cards with heavy effects before the user reaches anything actionable; slow first scroll on mobile.
- **Files:** `src/app/page.tsx` and the feed components.
- **Steps:**
  1. Reduce the initial render to: Hero + search → CategoryShowcase → FeedLatest → HowItWorks.
  2. Move or remove FeedFeatured/FeedJobsHighPaying/FeedTendersUrgent/FeedAuctionsEnding below the fold or onto category pages; lazy-load any kept feeds.
  3. Reduce `take` counts on the homepage Prisma queries to match what's shown.
  4. Defer Testimonials/Newsletter (and see P2.3).
- **Acceptance:** Fewer initial DB queries and DOM nodes; meaningful improvement in mobile TTI/LCP; core actions reachable within one short scroll.
- **Depends on:** P1.2.

---

## Phase 2 — Trust & polish

### P2.1 — Hide the "Map view coming soon" placeholder · S
- **Problem:** Unfinished UI ships on the detail page — an empty promise where trust converts.
- **Files:** `src/app/listings/[id]/page.tsx`
- **Steps:** Remove/comment the map placeholder block until a real map exists; keep the location text line.
- **Acceptance:** No "coming soon" text on production detail pages.
- **Depends on:** none.

### P2.2 — De-duplicate share actions · S
- **Problem:** Generic ShareButton + "Share on WhatsApp" + Save cluttered together; primary action not dominant.
- **Files:** `src/app/listings/[id]/page.tsx`, `src/components/share-button.tsx`
- **Steps:**
  1. Keep one share control — WhatsApp is the right default for Rwanda; fold native share into it or drop the generic button.
  2. Ensure Save and Share visually defer to the P1.1 primary CTA.
- **Acceptance:** One share affordance; action bar reads clearly with a single dominant CTA.
- **Depends on:** P1.1.

### P2.3 — Replace launch testimonials · S
- **Problem:** Testimonials with no real users read as fabricated.
- **Files:** `src/components/testimonials.tsx`, `src/app/page.tsx`
- **Steps:** Swap for concrete value props or real partner/institution logos until genuine quotes exist; remove the section if neither is ready.
- **Acceptance:** No invented social proof on the homepage.
- **Depends on:** P1.4.

### P2.4 — Resolve header redundancy · S
- **Problem:** "pricing" nav → `/post` duplicates the "Post listing" pill and mobile "Post"; "search" link overlaps "Browse" and hero search.
- **Files:** `src/components/site-header.tsx`
- **Steps:**
  1. If a real pricing page exists, point "pricing" there; otherwise remove the item.
  2. Collapse duplicate search entry points; keep the "Post listing" pill as the single post CTA on desktop.
  3. Add an unread indicator to the notifications icon (the `relative` wrapper already anticipates it) or remove the empty relative positioning.
- **Acceptance:** No duplicate destinations in the header; notification affordance is either functional or clean.
- **Depends on:** none.

### P2.5 — OTP input mobile attributes · S
- **Problem:** Code input lacks `inputMode="numeric"` and `autocomplete="one-time-code"`.
- **Files:** `src/components/login-form.tsx`, `src/app/login/phone/page.tsx`
- **Steps:** Add `inputMode="numeric"`, `autoComplete="one-time-code"`, and `pattern="[0-9]*"` to the code field(s).
- **Acceptance:** Mobile keyboards show numeric pad; SMS autofill offered on supported devices.
- **Depends on:** none.

---

## Phase 3 — Copy, i18n & consistency

### P3.1 — Route all hardcoded strings through i18n · M
- **Problem:** English strings bypass next-intl on a tri-lingual (rw/fr/en) product.
- **Files:** everything from the P0.4 inventory; `messages/*.json`
- **Steps:**
  1. Add keys for each inventoried string to all locale message files.
  2. Replace hardcoded text with `t()` calls.
  3. Gate dev-only strings ("Dev mode…", "Sign in as test user") so they never render in production regardless of locale.
- **Acceptance:** Grep for the inventoried English literals returns zero production hits; all three locales render translated.
- **Depends on:** P0.4.

### P3.2 — Apply sentence case across UI · S
- **Problem:** Mixed casing.
- **Files:** offending strings/components ("Similar Listings", stat labels in `hero-section.tsx`, etc.)
- **Steps:** Normalize all UI copy and message-file values to sentence case; remove hardcoded uppercase.
- **Acceptance:** No Title Case or ALL-CAPS UI strings; matches P0.3 rule.
- **Depends on:** P0.3, P3.1.

### P3.3 — Replace the hero emoji with an icon · S
- **Problem:** ✨ emoji in the hero badge breaks the otherwise SVG-icon system.
- **Files:** `src/components/hero-section.tsx`
- **Steps:** Swap the emoji for an existing inline SVG icon consistent with the set.
- **Acceptance:** No emoji in production UI; badge uses a system icon.
- **Depends on:** P1.2.

### P3.4 — Rewrite hero microcopy around differentiators · S
- **Problem:** Generic "premium" hype instead of real, compelling differentiators.
- **Files:** `messages/*.json` (hero keys)
- **Steps:** Rewrite hero title/subtitle/badge to lead with Umucyo government-tender mirroring, WhatsApp/SMS alerts, and verified badges. Localize all three.
- **Acceptance:** Hero copy names concrete differentiators; no "premium/✨" filler; translated.
- **Depends on:** P1.2.

### P3.5 — Align listing-card radius to the scale · S
- **Problem:** Card uses `rounded-2xl` inline vs `.card` `rounded-xl`.
- **Files:** `src/components/listing-card.tsx`, `listing-thumbnail.tsx`, `category` accent.
- **Steps:** Replace inline radii with the P0.2 tokens; ensure the top category accent matches the card's top radius.
- **Acceptance:** Cards use the radius scale; accent stripe corners match.
- **Depends on:** P0.2.

---

## Phase 4 — Verification

### P4.1 — Accessibility pass · M
- **Steps:** Run axe/Lighthouse on home, listings, detail, login. Verify contrast (esp. hero), focus order, touch-target sizes (header icons ≥40px where feasible), and reduced-motion still honored after the hero rebuild.
- **Acceptance:** No AA contrast failures; keyboard nav clean; reduced-motion verified.

### P4.2 — Mobile performance pass · M
- **Steps:** Throttled mid-range Android profile. Measure LCP/TTI/CLS on the homepage before/after. Confirm no blur/mix-blend in production and reduced query/DOM counts.
- **Acceptance:** Documented improvement vs. baseline; no jank on scroll.

### P4.3 — Localization smoke test · S
- **Steps:** Load each key page in rw, fr, en. Confirm no English islands and no layout breakage from longer strings.
- **Acceptance:** All three locales clean on home, listings, detail, post, login.

### P4.4 — Conversion-loop walkthrough · S
- **Steps:** As a logged-in non-owner, complete "find → view → contact seller" for each of the four categories.
- **Acceptance:** Every category has a working, obvious primary action end to end.

---

## Suggested execution order (flat list)

1. P0.1 lock flat design language
2. P0.2 radius scale
3. P0.3 casing rule
4. P0.4 i18n string audit
5. P1.1 contact-seller CTA (critical)
6. P1.2 hero rebuild (critical)
7. P1.3 hero contrast
8. P1.4 homepage trim (critical)
9. P2.1 remove map placeholder
10. P2.2 de-dupe share
11. P2.3 replace testimonials
12. P2.4 header redundancy
13. P2.5 OTP attributes
14. P3.1 i18n strings
15. P3.2 sentence case
16. P3.3 emoji → icon
17. P3.4 hero microcopy
18. P3.5 card radius
19. P4.1–P4.4 verification

**Fastest path to the biggest wins:** P1.1 (contact seller) and P1.2–P1.4 (hero + homepage) are ~80% of the user-facing value. If time is tight, ship Phase 0 + Phase 1 first and treat Phases 2–3 as fast-follow.
