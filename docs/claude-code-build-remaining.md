# Amatangazo — remaining build brief (for Claude Code)

This is the single source of truth for finishing the UX/UI remediation. Work top to bottom. Two
companion docs in this folder are referenced and must be treated as part of this brief:

- `docs/ux-remediation-plan.md` — the full phased plan (all 18 items, acceptance criteria).
- `docs/p1.1-contact-seller-spec.md` — the detailed, file-by-file spec for the contact-seller feature.
- `docs/design-system.md` — the design rules you MUST obey (flat language, radius, casing, i18n).

---

## 0. Guardrails (read first)

- **Flat design only.** No glassmorphism, `backdrop-blur`, `mix-blend`, big blurs, animated gradients,
  shimmer, or count-up. See `docs/design-system.md` § Design language.
- **Radius:** `rounded-lg` controls, `rounded-xl` cards, `rounded-2xl` section shells only.
- **Casing:** English UI is sentence case.
- **i18n:** every customer-facing string goes through `next-intl` in all three locale files
  (`messages/{en,fr,rw}.json`). Never ship a hardcoded English literal on a customer surface. `/admin`
  stays English-only.
- Reuse the token classes (`.btn-*`, `.input`, `.card`, `.badge-*`, `.detail-grid`). Don't hardcode hex
  or arbitrary `[...]` values.

## 1. Already done this session — DO NOT redo

These edits are already in the repo. Verify they compile; don't rebuild them.

- `docs/design-system.md` — added Design language, radius, casing sections; stricter i18n note.
- `src/app/globals.css` — `.glass`/`.glass-dark` marked deprecated.
- `src/components/hero-section.tsx` — rebuilt flat/light, search-first, no motion/emoji/orbs.
- `src/components/marketplace-search.tsx` — now uses `.input` / `.btn-primary`.
- `src/app/page.tsx` — homepage trimmed; removed 3 discovery feeds, 2nd ad, testimonials, newsletter,
  and their unused queries. Those feeds now live on the category pages (see § 4).
- `src/app/listings/[id]/page.tsx` — removed map placeholder; single WhatsApp share; i18n'd
  `shareWhatsApp` / `similarListings` / `seeAll`.
- `src/components/site-header.tsx` — dropped redundant "pricing"→/post link; i18n'd "Notifications" and
  all bottom-nav labels.
- `src/components/login-form.tsx` + `src/app/login/phone/page.tsx` — OTP inputs now have
  `inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*"`.
- `src/components/listing-card.tsx` — radius aligned to `rounded-xl`.
- `messages/{en,fr,rw}.json` — sentence-case fixes, new hero badge copy, and added keys:
  `nav.notifications`, `nav.dashboard`, `listing.shareWhatsApp`, `listing.similarListings`,
  `listing.seeAll`.

## 2. Sanity pass (do this first)

Confirm the session's edits compile and there are no regressions:

```bash
npx prisma generate
npm run lint
npm run build
```

Fix anything that fails — likely candidates: an unused import left behind, or a JSON key that a
component references but a locale file is missing. Do not proceed until lint + build are green.

## 3. Build P1.1 — contact-seller CTA (critical)

Implement exactly as written in **`docs/p1.1-contact-seller-spec.md`** (steps 1–7): schema migration
adding `contactPhone`/`contactWhatsapp` to `ClassifiedDetails`, zod validation, classified post-form
fields, the shared `ContactSeller` server component, detail-page wiring for CLASSIFIED and AUCTION,
de-duping the auction spec grid, and the i18n keys in all three locales. Meet all 7 acceptance criteria
in that doc.

## 4. Optional fast-follows (do if time allows, after P1.1)

- ~~**Re-surface discovery feeds.**~~ Done: high-paying jobs / urgent tenders / ending auctions now
  render as a discovery strip above the results on `/listings?category=…`
  (`src/components/category-discovery.tsx`, `src/lib/discovery.ts`). The three old homepage feed
  components were deleted — they were unreferenced and built on the card-grid/framer-motion style the
  § 0 guardrails rule out.
- ~~**Hardcoded-string sweep.**~~ Done for the interactive surfaces: apply, report and share buttons,
  the image-gallery a11y labels, the dashboard (listings, applications, profile danger zone) and the
  public profile page all go through `next-intl` now, in all three locales.

  What's deliberately still English, and why:
  - `/admin` — intentionally English-only (§ 0).
  - Dev-gated blocks (`checkout` sandbox controls, the `login-form` test-user sign-in) — allowed here.
  - `terms/page.tsx` and `privacy/page.tsx` — binding legal prose. Translating those is a legal
    decision, not a code change; they need human-authored fr/rw text before the keys go in.
  - Brand name ("Amatangazo") and format hints (`2507XXXXXXXX`, `https://...`).
- ~~**sticky-search.tsx**~~ No longer exists; no production surface uses `backdrop-blur` (the only
  remaining mention is the note in `globals.css` recording its removal).
- ~~**Localize dates and amounts.**~~ Done: every rendered `toLocaleDateString()` /
  `toLocaleString()` outside `/admin` now goes through `useFormatter` / `getFormatter`, so dates and
  amounts follow the reader's locale instead of the server's. A French listing page showed `9/1/2026`
  before; it shows `1 sept. 2026` now.

  Two call sites are deliberately untouched, because neither renders per reader:
  - `src/lib/tender-summary.ts` formats a budget into the AI summary text that is **stored** on the
    tender. One row, one string, every reader — making it locale-aware means storing a summary per
    locale, which is a schema decision.
  - `src/lib/referrals.ts` builds a notification body that is hardcoded English (`"You earned a
    RWF … referral credit"`). The number is the least of it — notification copy isn't translated at
    all yet, and it needs a decision first: translate at send time from the recipient's
    `preferredLanguage`, or store a key + params and translate at render time.

### Known gap: Kinyarwanda dates on client-rendered surfaces

Worth knowing before anyone files it as a bug in the above. **Chromium ships no `rw` locale data** —
`Intl.DateTimeFormat.supportedLocalesOf(["rw"])` and the `NumberFormat` equivalent both return `[]`,
and `rw` resolves to `en-US`. Node's ICU *does* have `rw`. So for a Kinyarwanda reader:

- server-rendered dates and amounts (listing detail pages, the landing feed) format in Kinyarwanda;
- client-rendered ones (browse results, notifications, dashboard lists) fall back to US English.

It doesn't crash and it doesn't produce a hydration mismatch — the client-rendered surfaces fetch
their data after mount, so those dates were never in the SSR HTML to disagree with. But a reader can
see `2026 Kan. 1` on one page and `Aug 10, 2026` on the next. Fixing it means choosing what a
Kinyarwanda date should look like everywhere — either accept the English fallback on both sides for
consistency, or format dates from our own message strings rather than from `Intl`. That's a product
call, not a refactor, which is why it's written down here instead of guessed at.

## 5. Phase 4 — verification (required before calling this done)

- **Accessibility:** run axe / Lighthouse on `/`, `/listings`, `/listings/[id]`, `/login`. Confirm no
  WCAG AA contrast failures (esp. the rebuilt hero), correct focus order, and that
  `prefers-reduced-motion` still holds. Header icon buttons should be ≥40px touch targets where feasible.
- **Mobile performance:** throttled mid-range Android profile. Capture LCP / TTI / CLS on `/` and confirm
  an improvement vs. the pre-trim baseline, and that no blur/mix-blend remains in production output.
- **Localization smoke test:** load `/`, `/listings`, `/listings/[id]`, `/post`, `/login` in en, fr, rw.
  No missing-key errors, no English islands, no layout breakage from longer strings.
- **Conversion walkthrough:** as a logged-in non-owner, complete find → view → contact for all four
  categories (JOB apply, TENDER submission path, AUCTION register CTA, CLASSIFIED contact CTA).

## Definition of done

- `npm run lint && npm run build` green.
- P1.1 acceptance criteria (spec doc) all met.
- Phase 4 verification passes on all four checks.
- No new violations of the guardrails in § 0.
