# Ghar Khata — Web

Angular 22 SPA/PWA for Family Expense Manager. Talks to `../GharKhata-api`.

## Run
```
npm install
npm start        # http://localhost:4200, proxies /api -> https://localhost:7001
```
Start the API and PostgreSQL first (see ../GharKhata-api, ../Gharkhata-db).

## Structure
- `core/` singletons (auth, http interceptors, state stores, api/generated types)
- `shared/` presentational components, pipes, validators
- `features/` lazy-loaded routes
- `layout/` shell (sidebar/topbar/bottom-nav/FAB)
- `styles/` design tokens

Design system: warm-dark, tokens in `src/app/styles/_tokens.scss`. Not fintech neon.
