# Amatangazo Design System

Single source of truth: [`src/app/globals.css`](../src/app/globals.css). All tokens are CSS
variables on `:root`, exposed to Tailwind v4 utilities via `@theme inline`. **Never hardcode a
hex color or an arbitrary `[...]` value in a component** — if a value isn't expressible with the
tokens and classes below, add a token first.

## Design language

Amatangazo is **flat, fast, and trustworthy**. The palette (Rwanda-inspired green + sun yellow on
warm off-white) is chosen so the product doesn't read as generic dark-mode SaaS — so the UI must
stay flat to match.

**Do not use** in production surfaces: glassmorphism (`backdrop-blur`, translucent `white/10`
fills), `mix-blend-*`, large decorative blurs (`blur-[120px]` orbs), full-bleed animated gradients,
CTA shimmer, or count-up number animations. These are GPU-expensive on the low-end Android devices
that dominate our market and they fight the brand. The `.glass` / `.glass-dark` utilities have been
**removed** from `globals.css` — don't reintroduce them. No production surface uses `backdrop-filter`
or `mix-blend-mode`; keep it that way (verify with a grep of the built CSS in `.next/static`).

Motion is minimal: short, optional fades only, and everything must respect
`prefers-reduced-motion` (already wired globally in `globals.css` and via `MotionProvider`).

## Design tokens

### Colors

| Token | Value | Use |
|-------|-------|-----|
| `--background` | `#faf9f6` | App background (warm off-white) |
| `--surface` | `#ffffff` | Cards, inputs, header |
| `--foreground` | `#1c1917` | Body text |
| `--muted` | `#6b6560` | Secondary text |
| `--border` | `#e7e2d9` | Hairlines, input borders |
| `--primary` / `--primary-hover` / `--primary-contrast` | `#16704f` / `#115c40` / white | Brand green (Rwanda-inspired). Main actions, links, focus ring |
| `--accent` / `--accent-hover` / `--accent-contrast` | `#f2b705` / `#d9a404` / `#1c1917` | Sun yellow. Featured/boost emphasis only — not a second action color |
| `--danger` / `--danger-surface` / `--danger-border` | `#b42318` / `#fceae7` / `#e9a79d` | Errors, destructive actions, breached SLAs |
| `--cat-job` / `--cat-tender` / `--cat-auction` / `--cat-classified` | green / blue / rust / purple | Per-category identity on tiles, badges, filters |

Use them as Tailwind utilities: `text-danger`, `bg-cat-tender/15`, `border-border`, etc.
There is no dark mode; the palette is light-only by design.

### Typography & spacing

Geist Sans / Geist Mono via `next/font`; Tailwind's default type and spacing scales. No custom
scale tokens — don't introduce arbitrary sizes.

### Corner radius

Use Tailwind's default radius utilities on a fixed three-step convention — don't hand-pick a
different radius per component:

| Utility | Use |
|---------|-----|
| `rounded-lg` | Controls: buttons, inputs, small chips |
| `rounded-xl` | Cards and card-like containers (`.card`, listing cards) |
| `rounded-2xl` | Large section shells only (e.g. the hero panel) |

`rounded-full` stays reserved for pills and avatars. Anything larger than `rounded-2xl`
(e.g. `rounded-3xl`) is out.

### Casing

All English UI copy is **sentence case** — capitalise the first word and proper nouns only. No
Title Case ("Post Listing" → "Post a listing") and no hardcoded ALL-CAPS (use CSS `uppercase` if a
label ever needs it). French and Kinyarwanda follow their own orthographic norms in the message
files.

## Component classes (`@layer components`)

> Tailwind v4 note: `@apply` can only reference real utilities, not other custom classes, so each
> variant repeats its base styles instead of composing off a shared class. Follow that pattern
> when adding variants.

### Page scaffolds

| Class | Width | Use |
|-------|-------|-----|
| `.page` | `max-w-3xl` | Default content pages (listings, dashboard, legal) |
| `.page-md` | `max-w-xl` | Medium single-column pages (referrals, saved searches) |
| `.page-sm` | `max-w-sm` | Narrow flows (login, checkout, verification) |

Pick the variant — **don't stack `max-w-*` on top of `.page`**; that only works because the
utilities cascade layer happens to beat the components layer. All share `px-4 py-8`.

**Sanctioned exceptions:** the landing page (`src/app/page.tsx`, marketing layout at `max-w-5xl`)
and the admin layout (own `max-w-5xl` container in `src/app/admin/layout.tsx`).

Headings inside a scaffold: `.page-title` + `.page-subtitle`.

### Buttons

All `<button>`s and button-shaped links use a `btn-*` class. Base: hover, disabled
(`opacity-50` + `cursor-not-allowed`), and a global focus ring (see Accessibility).

| Class | Use |
|-------|-----|
| `.btn-primary` | The one main action on a view |
| `.btn-accent` | Boost/featured purchase actions |
| `.btn-outline` | Secondary actions |
| `.btn-danger` | Destructive confirmation (delete, reject) |
| `.btn-sm` (modifier) | Compact contexts: filters, table rows, inline actions |
| `.btn-lg` (modifier) | Marketing-scale pill (rounded-full), e.g. landing hero CTAs |

Combine modifier with a variant: `className="btn-primary btn-lg"`. Loading state is a disabled
button with swapped label (`{submitting ? t("submitting") : t("submit")}`).

### Forms

- `.field` — `<label>` wrapper providing stacked label + control.
- `.input` — text inputs, selects, textareas alike.
- `.form-error` — inline validation text (small, `--danger`). Use it for every error message
  under a field or form; don't hand-roll red text.

### Badges

| Class | Use |
|-------|-----|
| `.badge-neutral` | Category/status chips with no sentiment |
| `.badge-featured` | Boosted listings (accent). If content is only the `★` glyph, add `role="img"` + `aria-label` |
| `.badge-status` | Outlined, muted status |
| `.badge-danger` | Negative states (SLA breached, non-live listing) |
| `.badge-verified` | Verified-poster trust chip (primary tint) |
| `.badge-cat-job/-tender/-auction/-classified` | Category-tinted chips |

`.badge` alone is the escape hatch for one-off compositions — if you use the same composition
twice, promote it to a variant here instead.

On listing surfaces, don't compose these by hand: use the shared components in
[`src/components/listing-badges.tsx`](../src/components/listing-badges.tsx)
(`CategoryBadge`, `FeaturedBadge`, `VerifiedBadge`, `StatusBadge` — all translated) and
[`src/components/listing-card.tsx`](../src/components/listing-card.tsx) (`ListingCard`: thumbnail,
badges, key fact, time-ago, poster row) so every surface renders listings identically.

### Other

- `.card` — surface container; add `transition-shadow hover:shadow-md` when clickable.
- `.card-media` — card variant without padding for edge-to-edge media (listing thumbnails);
  pad the content block inside.
- `.stat-card` with `.stat-value` / `.stat-label` — dashboard stat tiles.
- `.detail-grid` — label/value `<dl>` grid on listing detail pages.
- `.admin-table` — admin data tables.
- `.link` — inline text links.

## Accessibility

- A global `@layer base` rule gives every interactive element a 2px `--primary` outline on
  `:focus-visible`. Never suppress it (`outline-none`) without providing an equally visible
  replacement.
- Decorative color swatches: `aria-hidden`. Glyph-only badges (`★`): `role="img"` +
  translated `aria-label`.

## Language & i18n

All user-facing strings go through `next-intl` (`messages/{en,fr,rw}.json`) — including
transient states like loading/uploading, and including the marketing landing page and listing
detail pages. Never ship a hardcoded English literal on a customer-facing surface; add a key to
all three locale files instead. Exception: the `/admin` area is intentionally English-only and
uses hardcoded strings.
