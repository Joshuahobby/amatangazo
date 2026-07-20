# Contributing

## Branch strategy

- `master` — production-deployed branch. Must always be green (passing CI).

## PR workflow

1. Create a feature branch from `master`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make changes and commit using conventional commits:
   - `feat:` — new feature
   - `fix:` — bug fix
   - `chore:` — tooling, config, deps
   - `refactor:` — code change with no behavior change
   - `docs:` — documentation only
   - `test:` — tests only
3. Run checks before pushing:
   ```bash
   npm run lint
   npm test
   npm run typecheck   # if available
   ```
4. Push and open a PR against `master`.

## Code conventions

### TypeScript & React

- Strict TypeScript — no `any` without a good reason and a comment
- Server components by default; use `"use client"` only when needed (hooks, event handlers, state)
- Import paths use the `@/` alias (maps to `src/`)
- i18n strings go in `messages/{en,fr,rw}.json` — always update all three languages

### Styling

- Use Tailwind utility classes; no CSS modules or styled-components
- Design tokens are defined as CSS custom properties in `:root` in `src/app/globals.css` — never hardcode hex values
- Color palette: `--color-green` (#16704f) as primary

### Database

- All schema changes go through `prisma/schema.prisma`
- After editing the schema, run `npm run db:push` (`prisma db push`) to sync local DB, then `npx prisma generate`
- Manual SQL (e.g., extensions) goes in `prisma/manual-migrations/`
- **This project does not use Prisma Migrate** — there is no `prisma/migrations` directory. Don't run `npm run db:migrate` / `prisma migrate dev`: with no migration history it detects drift and offers to reset (drop) your database. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#database-schema)
- A schema change is only half done until it's pushed to every environment — deploying code ahead of its schema push fails at query time

### Testing

- Tests live in `test/` and use Vitest
- Pure function tests don't need a database
- Integration tests that touch the DB should use the existing `test/setup.ts`

### i18n

All three language files must stay in sync. When adding a key:
1. Add to `messages/en.json` (source of truth)
2. Translate and add to `messages/fr.json` and `messages/rw.json`
3. Use the key in code via `useTranslations()` from next-intl

## Code review

Every PR needs at least one approval. Reviewers check:

- Correctness — does the code do what it claims?
- i18n — are all user-facing strings translated?
- Security — no SQL injection, no stored XSS, no leaked secrets
- Performance — no N+1 queries, proper indexes, `next/image` for user-uploaded images
- Mobile — new pages/components must work on mobile viewports
