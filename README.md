# Ghar Khata — Web

Angular 22 SPA/PWA for Family Expense Manager. Zoneless (signals), standalone
components, OnPush throughout, custom SVG charts, warm-dark design tokens.

## Prerequisites

| Tool | Check |
|---|---|
| Node 20+ (24 works) | `node --version` |
| The API + PostgreSQL running | see `../GharKhata-api` |

## Run

```bash
npm install --legacy-peer-deps
npm start                 # http://localhost:4495, proxies /api -> http://localhost:5495
```

Windows: `.\dev.ps1 install` then `.\dev.ps1`.

Sign in with a seeded demo account:

> **sunilbgadakari@gmail.com** / **password123** — family Owner
> **demo@gharkhata.com** / **password123** — platform Super Admin (`/admin`)

## Scripts

| | |
|---|---|
| `npm start` | dev server on :4495 with the API proxy |
| `npm run build` | production build (≈83 kB gzip initial) |
| `npm test` | Vitest unit tests (93) |
| `npm run e2e` | Playwright journeys (needs API up; `npx playwright install chromium` once) |
| `npm run lint` | ESLint (fem- selector prefix) |
| `npm run gen:api` | regenerate `src/app/core/api/generated/schema.ts` from `swagger.json` |

## Structure

```
core/      auth, http interceptors, state stores, generated API types, ApiService
shared/    presentational components (charts, toast), inrCurrency pipe, viewport
features/  lazy routes: dashboard, expenses, income, budgets, bills, subscriptions,
           goals, debts, reports, family, settings, quick-add, voice, auth, admin
admin/     Super-Admin area (/admin): dashboard, users table + dialogs, user
           detail, families, audit logs — guarded by platformAdminGuard
layout/    shell (desktop sidebar+topbar / mobile header+bottom-nav+FAB)
styles/    _tokens.scss — the design system
```

## Conventions

- `fem-` selector prefix, OnPush, signal inputs/outputs
- Signals for state; a signal is never mutated from a component — call a store
- API types are generated, never hand-written
- Interceptor order: correlation → auth (queues concurrent 401s behind one
  refresh) → error → retry (idempotent GET only)

## Troubleshooting

| Symptom | Fix |
|---|---|
| Login page on every refresh | expected only if there's no refresh token; otherwise the app silently restores the session on load |
| `/api` calls 502 | the API isn't running on `http://localhost:5495` |
| `npm install` peer-dep errors | use `--legacy-peer-deps` (Angular 22 + tooling) |
| Playwright: no browser | `npx playwright install chromium` |
