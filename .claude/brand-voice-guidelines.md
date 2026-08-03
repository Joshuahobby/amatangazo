# Amatangazo Brand Voice Guidelines

**Version:** 1.0 · August 2026
**Scope:** Amatangazo — Rwanda's marketplace for jobs, tenders, auctions and classifieds
**Derived from:** this repository only — `messages/en.json` (~350 shipped user-facing strings),
`docs/design-system.md`, `src/app/globals.css`, `docs/prd.md` (v4).

> This document describes the voice Amatangazo **already speaks**. It was reverse-engineered from
> shipped copy, not invented. Where a rule is stated, there is production copy behind it. Where the
> evidence runs out, the section says so rather than guessing — see § 12.

---

## 1. Positioning

Amatangazo is Rwanda's self-service marketplace for four categories of opportunity: **jobs,
tenders, auctions, and classifieds**. Anyone can publish in minutes, pay with mobile money, and go
live without talking to a salesperson.

**One-sentence truth:** Amatangazo puts every opportunity in Rwanda — a job, a government tender, an
auction, a thing for sale — in one searchable place, and lets anyone publish to it in minutes with
the phone already in their pocket.

Three commitments sit underneath that, and they are the reason the voice sounds the way it does:

| Commitment | What it means in copy |
|---|---|
| **Self-service** | Copy must let someone finish alone. Never "contact us to post." |
| **Mobile-money-native** | Payment is MTN MoMo and Airtel Money. Never assume a card. |
| **Trust you can check** | Claims are sourced and verifiable, never adjectival. |

Coverage is broad, depth is deliberate: tenders and auctions get the real product investment
because competitors treat them as afterthoughts. Copy on those surfaces should carry the extra
care that reflects it.

---

## 2. Audiences

| Audience | What they want | Voice notes |
|---|---|---|
| **Seekers** — job seekers, bidders, buyers | To find the opportunity and act before the deadline | Warm, plain, deadline-aware. Never make them feel they're competing with the interface. |
| **Posters** — employers, procurement officers, auctioneers, sellers | To publish fast and be seen | Efficient and concrete. Lead with what it costs and what happens next. |
| **Subscribers** — repeat posters on the annual plan | Value for a standing commitment | Matter-of-fact about allotments and rates. No upsell theatre. |
| **Admins** — internal moderation and ops | To act correctly and quickly | Functional labels only. `/admin` is intentionally English-only with hardcoded strings. |

Special care for **SMEs chasing tenders**. The problem Amatangazo exists to solve for them is that
official notices are long, bureaucratic PDFs that hide the deadline, the budget, and the
eligibility rules. Every tender surface should do the opposite: surface the facts, plainly, up top.

---

## 3. We are / We are not

| We are | We are not |
|---|---|
| Plain — "Post a listing" | Clever — no puns, no wordplay in UI |
| Specific — "Listings from all 30 districts" | Vague — "nationwide coverage" |
| Sourced — "Sourced from Rwanda's Umucyo portal" | Boastful — "Rwanda's #1 marketplace" |
| Calm — "Payment failed or was declined." | Alarmed — no "Error!", no red-alert language |
| Practical — "Works on any phone — no app needed" | Aspirational — no "empowering", "revolutionising" |
| Honest about limits — "Automatically extracted — always verify against the official notice." | Overclaiming — never present AI output as authoritative |
| Local by default — RWF, MoMo, WhatsApp, Umucyo, districts | Generically global — no "$", no card-first assumptions |
| Warm at the right moments — "Keep it" | Sentimental — no "we're so glad you're here" |
| Brief | Padded — no "in order to", no "please note that" |

---

## 4. Voice principles

Each principle is followed by real production strings. **Right** examples are shipped copy.

### 4.1 Say what happened, then what to do

Errors state the failure and hand back an action. They never blame the user and never end on a
dead stop.

- **Right:** `Could not load listings. Check your connection and try again.`
- **Right:** `No listings found` → `Try adjusting your search terms or filters.`
- **Wrong:** `Error 500` · `Invalid input` · `Oops! Something broke.`

### 4.2 Second person for the user, first person only for platform commitments

"You" and "your" carry almost all copy. "We" appears only where the platform is promising or
disclosing something — and it is rare.

- **Right:** `Your listing is live` · `Check your phone and approve the mobile money payment request.`
- **Right (the "we" case):** `We never see or store your PIN.` · `we verify within 1 business day`
- **Wrong:** `We are pleased to inform you that your listing is now live.`

### 4.3 Every empty state names the next move

An empty state is a prompt, not a report. Fact first, then the one action that fixes it.

- **Right:** `No saved searches yet. Save one from the browse page.`
- **Right:** `No notifications yet` → `Save a search to get notified when new listings match.`
- **Wrong:** `Nothing here.` · `You have 0 items.`

### 4.4 Trust is evidence, never adjective

Amatangazo does not describe itself as trustworthy. It shows the receipts and lets the reader
conclude it.

- **Right:** `Sourced from Rwanda's Umucyo portal` · `Employers verified before they post` ·
  `Listings from all 30 districts`
- **Wrong:** `Rwanda's most trusted marketplace` · `Safe and secure` · `Leading platform`

### 4.5 Money is always concrete

State the currency, the amount, and what it buys. Never make someone hunt for the price.

- **Right:** `RWF 10,000 publishes your listing with 24 hours featured on this page — pay with MTN MoMo or Airtel Money.`
- **Right:** `Publishes now, 24hr featured placement included.`
- **Wrong:** `Affordable pricing` · `Starting from just...` · `Contact us for pricing`

### 4.6 Destructive actions state the consequence and offer a friendly way out

Confirmations spell out what will be lost. The safe option is phrased warmly, not as a bare
"Cancel".

- **Right:** `Delete this saved search? You'll stop getting alerts for it.` with actions
  `Delete search` / `Keep it`
- **Right (two-step, for account deletion):** `Are you sure? This cannot be undone.` →
  `All your listings, payments, and data will be deleted. Continue?`
- **Wrong:** `Are you sure?` alone · `OK` / `Cancel` on a destructive step

### 4.7 Soften rejection toward people; stay blunt about content

A candidate who wasn't chosen reads **`Not selected`**. A listing that failed moderation reads
**`Rejected`**. This split is deliberate — keep it.

### 4.8 Label AI, and tell people to verify

AI output is always marked as AI and always paired with a verification instruction. Extraction
never invents values — absent fields read `Not stated`.

- **Right:** `Quick summary (AI)` + `Automatically extracted — always verify against the official notice.`
- **Wrong:** presenting a generated summary as the notice itself

### 4.9 Assume the cheapest phone on the slowest network

The market runs on low-end Android. Copy stays short, avoids jargon, and never assumes an app, a
card, or a fast connection.

- **Right:** `Works on any phone — no app needed`
- **Wrong:** `Download our app for the best experience`

---

## 5. Tone by context

| Context | Register | Length | Punctuation | Example (shipped) |
|---|---|---|---|---|
| **Landing hero** | Confident, plain | One line + one line | No exclamation | `Jobs, tenders, auctions & classifieds — all of Rwanda in one place` |
| **Navigation & labels** | Neutral | 1–3 words | None | `Browse` · `Post a listing` |
| **CTAs** | Directive, specific | Verb + object | None | `Post job` · `Boost a listing` · `Save this search & get alerts` |
| **Form fields** | Functional | Noun phrase | `(optional)` suffix where true | `Salary range min (RWF, optional)` |
| **Validation** | Terse fragment appended to the field name | 2–6 words | None | `is required` · `must be at least {count} characters` |
| **Success** | Brief, closed | One sentence, full stop | Period | `Application sent.` · `Profile updated.` |
| **Errors** | Calm, actionable | 1–2 sentences | Period | `Could not save your changes.` |
| **Payment waiting** | Reassuring, procedural | 1–2 sentences | Period | `Check your phone and approve the mobile money payment request. This page will update automatically...` |
| **Empty states** | Encouraging | Fact + action | Period on the action | `No applications yet` / `Apply to jobs you're interested in.` |
| **Destructive confirms** | Direct about loss | 1–2 sentences | Question mark | `Are you sure? This cannot be undone.` |
| **Trust / footer** | Factual | Fragment | None | `Employers verified before they post` |
| **Admin** | Purely functional | Minimal | None | English-only, hardcoded |

---

## 6. Terminology

### Preferred

| Term | Meaning | Never |
|---|---|---|
| **Listing** | Any user-published item, all four categories | "ad", "advert", "post" (as a noun) |
| **Post** (verb) | The act of publishing | "submit a listing", "upload" |
| **Poster** | The person publishing | "vendor", "advertiser" |
| **Boost** | The paid action that lifts a listing | "promote", "sponsor", "upgrade" |
| **Featured** | The resulting state of a boosted listing | "premium", "top", "highlighted" |
| **Ad** / **Sponsored** | A paid banner unit — a *different thing* from a listing | using "ad" for user listings |
| **Verified** | The trust badge from document review | "certified", "approved", "trusted" |
| **Umucyo** | Rwanda's government procurement portal — name it explicitly | "the government site" |
| **Mobile money** / **MTN MoMo** / **Airtel Money** | The payment rails | "wallet", "e-money", "card" |
| **RWF** | Currency prefix, always | "Rwf", "FRw", "₣", bare numbers |
| **Deadline** | Application/submission cut-off | "closing", "expiry" (for deadlines) |
| **Jobs · Tenders · Auctions · Classifieds** | The four categories, fixed names | inventing synonyms |

### Prohibited

| Avoid | Why |
|---|---|
| "#1", "leading", "best", "most trusted" | Unverifiable — § 4.4 requires evidence |
| "Simply", "just", "easy" | Presumes the reader's experience |
| "Please" in error messages | Inconsistent with the dominant pattern — see § 11 |
| "Oops", "Uh-oh", "Whoops" | Not the register; errors stay calm |
| "Click here" | Inaccessible and non-descriptive |
| "Submit" as a primary CTA | Use the specific action: `Post job`, `Send code` |
| Exclamation marks | One shipped exception (`Copied!`); add no more |
| Emoji in UI copy | None ships today; keep it that way |
| Card-payment language | v1 is mobile money only |
| Dark-mode phrasing | There is no dark mode; the palette is light-only by design |

---

## 7. Mechanics

**Casing.** All English UI copy is **sentence case** — first word and proper nouns only.
`Post a listing`, not `Post Listing`. No hardcoded ALL-CAPS; use CSS `uppercase` if a label needs
it. French and Kinyarwanda follow their own orthographic norms in the message files.

**Ampersands.** `&` in short labels and headings (`Billing & subscription`, `Buy & sell locally`,
`Auction date & time`). Spelled-out `and` inside sentences
(`Rwanda's marketplace for jobs, tenders, auctions and classifieds.`).

**Periods.** Full sentences take them (`Application sent.`). Labels, CTAs, headings and fragments
do not (`Save changes`, `Browse listings`).

**Ellipsis.** Use the three-dot form `...` for in-progress states and search placeholders —
`Loading...`, `Saving...`, `Posting...`, `Uploading...`, `Submitting...`. Never the single-character
`…`. This is uniform across all three locale files as of August 2026; keep it that way.

**Money.** `RWF` prefix, space, thousands separated by commas: `RWF 10,000`, `RWF 300,000`.
In interpolated strings: `RWF {amount}`.

**Numbers.** Numerals for quantities and counts (`30 districts`, `2 boosts/month`,
`6-digit code`). Pluralisation goes through ICU: `{count, plural, one {# result} other {# results}}`.

**Time.** `24 hours` in prose; `24hr` only where space is genuinely tight. `1 business day` for
the verification SLA.

**Dates** are localised at render — never hardcode a format.

---

## 8. Copy patterns by surface

**Error** = what failed + what to do.
`Could not <action>.` optionally + `Check your connection and try again.`

**Success** = past tense, one sentence, full stop. `Application sent.` `Report submitted. Thank you.`

**In-progress** = present participle + `...`. `Posting...` `Uploading...`

**Empty state** = `No <things> yet` + one sentence naming the action that fills it.

**CTA** = verb + object, specific enough to read out of context. `Post a tender`, not `Continue`.

**Validation** = lowercase fragment that appends to the field label: `is required`, `isn't valid`.

**Trust line** = a checkable fact, no adjective, no period.

**Payment** = tell them what happens on their phone, then reassure about what you don't hold:
`Payments are processed securely by PawaPay. We never see or store your PIN.`

**Notification** = a subject that names the event, then a body carrying the fact and the link.
Every notification gets its own subject — never a generic `Amatangazo update`, because email
readers triage on the subject line. Copy lives in the `notificationTemplates` namespace and renders
in the **recipient's** `User.preferredLanguage`, resolved at send time: the person who triggers a
notification is usually not the person who reads it, and cron has no locale at all. Keep bodies
short enough to survive a single SMS segment where possible.

---

## 9. Visual identity

Single source of truth: [`src/app/globals.css`](../src/app/globals.css). Never hardcode a hex value
or an arbitrary `[...]` value in a component — add a token first.

**Design language: flat, fast, and trustworthy.** The palette is Rwanda-inspired green and sun
yellow on warm off-white, chosen so the product does not read as generic dark-mode SaaS. The UI
stays flat to match.

| Token | Value | Use |
|---|---|---|
| `--background` | `#faf9f6` | App background (warm off-white) |
| `--surface` | `#ffffff` | Cards, inputs, header |
| `--foreground` | `#1c1917` | Body text |
| `--muted` | `#6b6560` | Secondary text |
| `--border` | `#e7e2d9` | Hairlines, input borders |
| `--primary` | `#16704f` | Brand green. Main actions, links, focus ring |
| `--accent` | `#f2b705` | Sun yellow. Featured/boost emphasis **only** — not a second action colour |
| `--danger` | `#b42318` | Errors, destructive actions, breached SLAs |
| `--cat-job` / `-tender` / `-auction` / `-classified` | green / blue / rust / purple | Per-category identity |

**Banned in production surfaces:** glassmorphism (`backdrop-blur`, translucent `white/10` fills),
`mix-blend-*`, large decorative blurs, full-bleed animated gradients, CTA shimmer, count-up number
animations. These are GPU-expensive on the low-end Android devices that dominate the market and
they fight the brand. The `.glass` / `.glass-dark` utilities were **removed** — do not reintroduce
them.

**Typography:** Geist Sans / Geist Mono via `next/font`. Tailwind's default type and spacing
scales — no custom scale tokens.

**Radius:** `rounded-lg` controls · `rounded-xl` cards · `rounded-2xl` section shells only.
`rounded-full` for pills and avatars. Nothing larger.

**Motion:** minimal — short optional fades, always respecting `prefers-reduced-motion`.

**Advertising honesty:** an unsold ad slot renders **nothing at all**. Never a placeholder or a
"your ad here" panel — a previous static placeholder was removed precisely because it read as
fabricated inventory. Creatives render `object-contain`, never cropped.

---

## 10. Language and i18n

Three locales: **English (source)**, **French**, **Kinyarwanda** — `messages/{en,fr,rw}.json`.

1. Write new copy in English first.
2. Add the key to **all three** locale files in the same change.
3. Never ship a hardcoded English literal on a customer-facing surface — including transient states
   like loading and uploading, and including the landing and listing detail pages.
4. Exception: `/admin` is intentionally English-only with hardcoded strings.

**Translation is not transliteration.** French and Kinyarwanda follow their own capitalisation and
orthographic norms — do not force English sentence case onto them. Kinyarwanda copy should read as
written for Rwandans, not as translated English.

Brand name **Amatangazo** and format hints (`2507XXXXXXXX`, `https://...`) stay untranslated.

---

## 11. Consistency rules (drift resolved August 2026)

Three inconsistencies were found in the message catalogues and corrected. The resulting rules are
now enforceable — check new copy against them.

| Rule | Resolved to | Was |
|---|---|---|
| **Negated modal, English** | `Could not …` everywhere | `Couldn't …` in 3 `checkout` keys |
| **Ellipsis, all locales** | `...` three dots | `…` single char in `nav.searchPlaceholder`, `browse.loadingMore` |
| **No politeness marker in errors** | `Try again.` / `Réessayez.` | `Please try again.` / `Veuillez réessayer.` in `post.genericError` **and** `post.uploadStorageFailed` |

Two notes on how this was applied across locales:

- **The contraction rule is English-only.** French already used `Impossible de …` uniformly, and
  Kinyarwanda varies by verb aspect (`Ntibishoboka` = it is not possible, `Ntibyashobotse` = it was
  not possible). Flattening those into one form would impose English grammar on languages that
  don't work that way — see § 10. They were left alone deliberately.
- **French gained one extra fix.** `post.genericError` opened with `Une erreur s'est produite`
  while `common.networkError` opened with `Une erreur est survenue`. English uses one opening
  (`Something went wrong`) for both, so French now does too.

`common.networkError` and `post.genericError` remain **deliberately different strings**: one
diagnoses a connection, the other doesn't. Do not collapse them into a single key.

---

## 12. Confidence and open questions

| Section | Confidence | Basis |
|---|---|---|
| Voice principles, tone matrix, mechanics (§ 4–8) | **High** | ~350 shipped strings; patterns corroborated across surfaces |
| Visual identity (§ 9) | **High** | `design-system.md` + `globals.css`, actively enforced |
| Positioning and audiences (§ 1–2) | **High** | `docs/prd.md` v4, marked fully resolved |
| Terminology (§ 6) | **Medium-high** | Product terms are consistent in code; the prohibited list is partly inferred from absence |
| Long-form marketing voice | **Low** | The landing page is the only marketing surface in-repo |
| Email, SMS and WhatsApp voice | **Medium-high** | Nine templates in the `notificationTemplates` namespace, localised across all three catalogues (August 2026). English and French are solid; Kinyarwanda needs a native-speaker pass |
| Social and press voice | **None** | No evidence in this repository |
| Spoken/sales voice | **None** | No call transcripts were reachable |

**Open questions:**

1. **Does the Kinyarwanda notification copy read naturally?** It was built from vocabulary already
   in `rw.json` (`ubushakashatsi bwabitswe`, `amanota yo kumenyekanisha`, `Itangazo ryawe
   ryatangajwe`) rather than translated fresh, but it has not been reviewed by a native speaker.
   These go out over SMS to real users — this is the highest-value review in the document.
2. **Is there a French and Kinyarwanda voice standard, or only translations?** The mechanics in
   § 7 are English-specific. Someone fluent should decide whether rw copy has its own register.
3. **Should OTP messages be localised too?** `sendOtpSms` and `sendOtpEmail` still hardcode English
   ("Your Amatangazo verification code is …"). They fire pre-login, where the recipient's
   `preferredLanguage` may not be known yet, so they were left out of the notification work.
3. **Should `common.submit` ("Submit") exist at all?** § 6 prohibits "Submit" as a primary CTA, yet
   a generic key remains. Either remove it or document where a generic fallback is legitimate.
4. **Is "Not stated" the standard for every absent value**, or only AI tender extraction?
5. **Who owns this document?** No brand owner is recorded in-repo.

---

## 13. Governance

**Location:** `.claude/brand-voice-guidelines.md` — read automatically by `/brand-voice:enforce-voice`.

**Update this document when** the tagline or positioning changes · a category is added or renamed ·
a colour token or the type stack changes · a term moves onto or off the preferred/prohibited lists ·
a fourth locale is added · a new channel (email, SMS, WhatsApp) gets templated copy.

**How to use it:**

- **Engineers** — § 6 (terminology) and § 5 (tone by context) before writing any UI string, error,
  or CTA label. § 10 before adding a key.
- **Designers** — § 9. When a component deviates from the tokens, the component is wrong.
- **Anyone writing customer-facing copy** — § 4 through § 8 in full.

**Version history**

| Version | Date | Change |
|---|---|---|
| 1.0 | August 2026 | Initial release. Reverse-engineered from shipped UI copy, the enforced design system, and PRD v4. |
