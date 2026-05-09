# Heritage Credit Union Banking Portal

A private, single-owner online banking portal for Dax Emry Brooks at Heritage Credit Union (Charleston, SC). Accessible only with the registered member email and personal password.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — Express session secret
- Required env: `ADMIN_EMAIL` — portal owner email (`daxemry5855@gmail.com`)
- Required secret: `ADMIN_PASSWORD_HASH` — bcrypt hash of portal password (set via Replit Secrets panel)
- Optional secret: `GMAIL_APP_PASSWORD` — Gmail App Password for email notifications to `daxemry5855@gmail.com`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Email: nodemailer + Gmail SMTP
- Frontend: React + Vite + Wouter routing + Shadcn UI + TanStack Query + Recharts

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas (run codegen to refresh)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/db/src/schema/` — Drizzle ORM schemas (source of truth for DB)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/email.ts` — Gmail notification service (nodemailer)
- `artifacts/api-server/src/middleware/requireAuth.ts` — session auth guard
- `artifacts/heritage-credit/src/` — React frontend
- `artifacts/heritage-credit/src/contexts/auth.tsx` — AuthProvider + useAuth hook

## Architecture decisions

- **Single-owner auth**: No sign-up flow. One admin email + bcrypt password hash stored in env vars. Session-based (express-session). If `ADMIN_PASSWORD_HASH` is stored as plaintext, it is hashed once at startup (bcrypt cost 12) and all comparisons use `bcrypt.compare()` — no plaintext comparison ever.
- **Auth guard**: All `/api/*` routes except `/auth/*` and `/healthz` are protected by `requireAuth` middleware. Frontend redirects to `/login` for unauthenticated users.
- **Session timeout**: 15-minute inactivity timeout with 2-minute warning modal on the frontend.
- **Contract-first API**: OpenAPI spec drives Orval codegen for both Zod validation schemas (server) and React Query hooks (client). Never edit generated files.
- **lib/api-zod exports only `./generated/api`** — codegen script (api-spec/package.json) overwrites index.ts after Orval runs.
- **South Carolina timezone**: All date/time values use `America/New_York` (Eastern Time).
- **Email notifications**: Gmail SMTP via nodemailer. Alerts sent on login, internal transfers, external transfers, bill payments. Silently skipped if `GMAIL_APP_PASSWORD` not set.

## Product

- Secure login gate (email + password, private portal)
- Dashboard: account cards (flip on click for routing/account details), balance summaries, spending pie chart, recent transactions, upcoming loan payment
- Transactions history with filtering
- Internal transfers between accounts (with balance deduction)
- **External transfers**: enter routing + account number → verify bank → save payee → send money. Tabs: "Between My Accounts" / "Send to Someone" / "My Payees"
- Bill pay with payee management (email alert on payment)
- Loan overview
- Card management with real freeze/unfreeze toggle (DB-persisted)
- Statements viewer
- Settings & Security pages
- Session timeout warning modal
- **Gmail email alerts**: login, internal transfer, external transfer, bill payment → sent to `daxemry5855@gmail.com`

## User preferences

- Portal is private to Dax Emry Brooks only — no public sign-up
- Email: `daxemry5855@gmail.com`
- Password is stored as a bcrypt hash in the `ADMIN_PASSWORD_HASH` Replit Secret — never stored in source or docs
- Heritage Credit Union branding: deep navy `#1a2b5e`, serif font for headings
- Charleston, SC 29401 · Member FDIC
- All dates/times displayed in South Carolina time (America/New_York / Eastern Time)

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen`. The codegen script auto-fixes `lib/api-zod/src/index.ts` to export only `./generated/api`.
- Do not run `pnpm dev` at the workspace root. Use `restart_workflow` instead.
- Email notifications require `GMAIL_APP_PASSWORD` Replit Secret (Gmail App Password, NOT your regular Gmail password). Get it at: myaccount.google.com → Security → 2-Step Verification → App passwords.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
