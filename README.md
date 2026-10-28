# metadatum People

Internal HR portal for metadatum: people, onboarding, attendance, leave, payroll records and documents.
Design notes, data model rationale and the permission matrix live in [docs/plan/PLAN.md](docs/plan/PLAN.md).

> Status: **Phase 1 (foundation)**. Auth, RBAC, layout, audit infrastructure and seed data are in place;
> feature modules arrive in later phases.

## Local setup

Requirements: Node 24, Docker (Docker Desktop, OrbStack or Colima).

```bash
cp .env.example .env          # then fill AUTH_SECRET, FIELD_ENCRYPTION_KEY, BLIND_INDEX_KEY, CRON_SECRET
npm install                   # also generates the Prisma client
npm run db:up                 # Postgres 17 + Mailpit
npm run db:migrate            # apply migrations
npm run db:seed               # fake company data (wipes the dev DB)
npm run dev                   # http://localhost:3000
```

### Signing in locally

Google SSO is hidden until `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are set. Use the magic-link form with a
seeded account; the email lands in **Mailpit at http://localhost:8025**.

| Role | Email |
|---|---|
| Admin | ananya.krishnan@themetadatum.com |
| HR | meera.iyer@themetadatum.com |
| Manager (Employee with reports) | rahul.menon@themetadatum.com |
| Employee | priya.sharma@themetadatum.com |

Only users that already exist in the database can sign in; there is no self sign-up.

## Scripts

| Command | What it does |
|---|---|
| `npm run check` | typecheck + lint + unit tests + production build (run before marking a phase done) |
| `npm test` | Vitest unit tests |
| `npm run db:reset` | drop, re-migrate and re-seed the dev database |
| `npm run db:studio` | Prisma Studio |

## Conventions

- **Authorisation**: every page calls `requireActor()`, every Server Action / route handler calls
  `authorize(permission, targetPersonId)` ([src/lib/session.ts](src/lib/session.ts)). Rules are in
  [src/lib/rbac.ts](src/lib/rbac.ts). `src/proxy.ts` only does an optimistic signed-in redirect.
- **Data access**: use `db` (soft-delete aware) from [src/lib/db.ts](src/lib/db.ts). Mutations to people,
  payroll and access records call `audit(tx, …)` inside the same transaction.
- **Sensitive fields** (`*Enc` columns) go through [src/lib/crypto.ts](src/lib/crypto.ts); only `*Last4` is shown.
- **Money** is integer paise; **leave** is integer half-day units; **dates** are Asia/Kolkata
  ([src/lib/format.ts](src/lib/format.ts)).
- **No passwords or secrets** are stored anywhere, including the access tracker.
