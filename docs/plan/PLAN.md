# metadatum People — Phase 0 plan

Status: **draft for approval**. Nothing in here is wired up yet. The data model is in
[prisma/schema.prisma](../../prisma/schema.prisma).

## 1. Stack and versions

| Concern | Choice | Version (Oct 2026) | Note |
|---|---|---|---|
| Framework | Next.js App Router, RSC, Server Actions | 16.4.3 (already scaffolded) | Next 16 renamed `middleware.ts` to `proxy.ts`. Proxy only does an optimistic "is there a session" redirect; real authorisation happens in every action and page. |
| DB / ORM | PostgreSQL 17 + Prisma | 7.10.1 | Pinned. On npm, `prisma@latest` currently points at 8.0.0-rc.28, a release candidate. |
| Auth | Auth.js (`next-auth`) v5 + `@auth/prisma-adapter` | 5.0.0-beta.32 | v5 is still published as beta, and v4 doesn't suit the App Router. It is still the de facto choice. |
| UI | Tailwind v4 + shadcn/ui | – | Poppins (headings) and Inter (UI) via `next/font` |
| Forms / validation | React Hook Form 7 + zod 4 | 7.91 / 4.6 | The same zod schema runs on the client and in the Server Action |
| Tables | TanStack Table | 9.3 | Server-side filter, sort and pagination for large tables |
| PDF | @react-pdf/renderer | 4.9 | Payslips and letters |
| Tests | Vitest 5, Playwright 1.64 | – | |
| Local infra | Docker Compose: Postgres 17 + Mailpit (catches magic-link email in dev) | – | Docker isn't installed on this Mac yet, see Q1 |

## 2. Data model: key decisions

- **Person vs Employment.** A `Person` holds profile data and is one human. An `Employment` is one stint, holding the employee code, type, department, manager and status. Converting an intern closes the `MD-INT-xxx` employment and opens a new `MD-xxxx` one linked through `convertedFromId`, so the history is kept. Payroll and payslips point at the Employment, so old payslips keep the intern code.
- **Employee codes** come from a `Counter` row incremented inside the creating transaction: `MD-0001` and `MD-INT-001`.
- **Sensitive fields** (PAN, Aadhaar, UAN, ESI number, bank account, IFSC) are encrypted with AES-256-GCM using a key from `FIELD_ENCRYPTION_KEY`. Each ciphertext is prefixed with a key version so the key can be rotated. Only `*Last4` is kept in plaintext, for masked display. PAN also gets an HMAC blind index to catch duplicates. Unmasking writes a `VIEW_SENSITIVE` audit entry.
- **Money** is stored as Int paise, and all salary figures are monthly, so Int is large enough. Annual CTC is computed in code.
- **Leave** is an append-only ledger counted in half-day units. The balance is the sum of entries. Accrual, carry-forward, lapse, comp-off credits, leave taken and reversals are all ledger rows, so every balance can be explained.
- **Payroll** history doesn't depend on later settings changes. Each `PayrollEntryLine` copies the component code and name, and the run stores the statutory settings it used. A locked run is read-only, and corrections are `PayrollAdjustment` rows applied in a later run.
- **Soft delete and timestamps** are on every table, enforced by a Prisma client extension. The exceptions are the Auth.js `VerificationToken` table (fixed adapter shape), `Counter`, `RateLimitHit` and the append-only `AuditLog`.
- **Audit**: one helper, `withAudit(tx, actor, entity, before, after)`, is used by every mutating service function for people, payroll and access. Encrypted fields are logged as `«changed»`, never as values.

## 3. Roles and permissions

The stored role is one of **ADMIN / HR / EMPLOYEE**. **Manager** and **Intern** are derived, not stored:

- **Manager** means the person has at least one active direct report. This lets an HR or Admin user also manage a team, and it updates automatically when reporting lines change.
- **Intern** means the person's current Employment has type `INTERN`. The UI hides PF and ESI and applies the intern leave policy.

All checks go through one `can(user, action, resource)` function in `src/lib/rbac.ts`, called at the top of every Server Action and route handler and in every page loader. "Own" means records belonging to the signed-in person. "Reports" means records of their active direct reports.

| Area / action | Admin | HR | Manager (extra) | Employee / Intern |
|---|---|---|---|---|
| Directory and org chart (name, title, dept, work email, photo) | ✅ | ✅ | ✅ | ✅ |
| Full profile, read | all | all | reports (no statutory/bank) | own (no statutory/bank) |
| Edit profile | all | all | – | own contact and emergency fields only |
| Statutory and bank, masked | all | all | – | own, masked (last 4) |
| Statutory and bank, unmask or edit | ✅ | ✅ | – | – |
| Create person, conversion, separation | ✅ | ✅ | – | – |
| Onboarding/offboarding checklists | all | all | tasks assigned to Manager for reports | own Employee tasks |
| Checklist templates | ✅ | ✅ | – | – |
| Access grants and assets | all | all | view reports | view own |
| Check in/out, own calendar | ✅ | ✅ | ✅ | ✅ |
| Team attendance grid | all | all | reports | – |
| Approve regularisation | all | all | reports | – |
| Edit attendance directly | ✅ | ✅ | – | – |
| Apply/cancel own leave | ✅ | ✅ | ✅ | ✅ |
| Approve/reject leave | all | all | reports | – |
| Leave ledger adjustments, comp-off credit | ✅ | ✅ | request only | – |
| Salary structures | ✅ | ✅ | – | – |
| Payroll run: compute, edit TDS, mark in review | ✅ | ✅ | – | – |
| Payroll run: **lock** | ✅ | – | – | – |
| Payment status, bank CSV export | ✅ | ✅ | – | – |
| Payslips | all | all | – | own, from locked runs only |
| Reimbursements | all | all, final approval | approve reports' claims (1st step) | submit and view own |
| Documents, upload/generate | ✅ | ✅ | – | upload own (ID, education), view own visible ones |
| Settings: holidays, leave policies, departments, templates, checklists | ✅ | ✅ | – | – |
| Settings: company, statutory, salary components, bank format, **roles** | ✅ | – | – | – |
| Audit log | ✅ | – | – | – |
| CSV export | any table | any table except audit | reports' attendance/leave | own data |

A manager never approves their own requests. Requests from someone with no manager, or from a manager themselves, go to HR.

## 4. Route map

`(auth)` is unauthenticated. Everything under `(app)` requires a session. The layout shows a sidebar filtered by permissions.

```
/login                                  Google SSO button + magic-link form
/api/auth/[...nextauth]                 Auth.js handlers (rate limited)

/                                       Dashboard (HR/Admin or Employee variant)
/me                                     Own profile, tasks, documents (shortcut)

/people                                 Directory (search, filters, CSV)
/people/org-chart                       Org chart
/people/new                             Create person + first employment
/people/[id]                            Profile tabs: Overview · Employment · Statutory & bank ·
                                        Access · Assets · Attendance · Leave · Payroll · Documents · History
/people/[id]/convert                    Intern → full-time conversion
/people/[id]/separation                 Start/track offboarding

/onboarding                             Open checklists (onboarding / offboarding / intern-end), "my tasks"
/onboarding/[checklistId]

/access                                 Access grants across systems (filter by system, active/revoked)
/assets                                 Asset register
/assets/[id]                            Asset + assignment history

/attendance                             My calendar + check-in/out card (mobile-first)
/attendance/team                        Team grid (Manager: reports; HR: all)
/attendance/regularisations             Requests (mine / to approve)
/attendance/summary/[yyyy-mm]           Monthly summary feeding payroll

/leave                                  My balances + requests + apply
/leave/approvals                        Pending approvals
/leave/calendar                         Team leave calendar

/payroll                                Runs list
/payroll/[yyyy-mm]                      Run: compute → review → lock; payment status; bank export
/payroll/structures                     Salary structures per employment
/payroll/adjustments
/payslips                               My payslips
/reimbursements                         Mine / to approve

/documents                              All documents (HR) / mine
/documents/generate                     Generate from template

/settings                               Company · Departments · Designations · Holidays · Weekly offs ·
                                        Leave types & policies · Salary components · Statutory (PF/ESI/PT) ·
                                        Bank export format · Checklist templates · Document templates ·
                                        Systems · Users & roles
/settings/audit                         Audit log (Admin)

/api/files/[fileId]                     Authenticated file download (permission re-checked)
/api/export/[table]                     CSV export (permission-scoped)
/api/payslips/[entryId]/pdf             Payslip PDF
/api/cron/daily                         Intern-end tasks (14-day lead), monthly leave accrual, year-end
                                        carry-forward; protected by CRON_SECRET, idempotent
```

Sensitive values never go in URLs. Routes use cuids, and searching by PAN is done through a POST action.

## 5. Payroll calculation (no statutory numbers invented)

For each Employment active in the month:

1. Payable days = calendar days in month − LOP days. LOP days are absences (working day, no attendance, no approved leave), plus approved LOP leave, plus half of each half-day absence. Mid-month joining or exit counts days outside the stint as unpaid. See Q6 for the proration basis.
2. Each prorating earning is `round(monthly × payable / daysInMonth)`, rounded to the nearest rupee as a configurable rule. Approved reimbursements and pending adjustments are added on top.
3. PF, ESI and PT are calculated from the rates, ceilings and Karnataka PT slabs in **Settings → Statutory**. These start **empty**, with a banner saying "Enter and verify these values with our CA". A run can't be computed until they're filled in. Interns skip PF/ESI because their structure has `pfApplicable=false`. Whether PT applies to interns is part of Q7.
4. TDS is entered by hand for each entry.
5. Net = gross − employee deductions − TDS.
6. HR marks the run in review, Admin locks it, and payslip PDFs are generated and frozen at lock. Payment status and transaction references stay editable after lock. They are recorded with audit entries, and the amounts can't be changed.

## 6. Environment variables (planned)

`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ALLOWED_EMAIL_DOMAIN`,
`EMAIL_SERVER` / `EMAIL_FROM` (SMTP; Mailpit in dev), `FIELD_ENCRYPTION_KEY` (32-byte base64, versioned),
`BLIND_INDEX_KEY`, `STORAGE_DRIVER` (`local`|`s3`), `STORAGE_LOCAL_DIR`, `S3_ENDPOINT`, `S3_BUCKET`,
`S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `CRON_SECRET`.

## 7. Questions and assumptions to confirm

Each item has a default in **bold**. I'll proceed with the defaults unless you say otherwise.

1. **Local Postgres.** Docker isn't installed on this Mac. **Install OrbStack (`brew install orbstack`) and use the planned `docker-compose.yml`.** Alternatives are Colima or Docker Desktop, or a native `brew install postgresql@17` with Docker skipped in dev.
2. **Sign-in.** Only people already in the system (created by HR) can sign in, and there is no self sign-up. Google sign-in is limited to `@metadatum.<tld>`. **What is the exact domain?** Magic links are sent only to registered work emails. Is personal email allowed for exited employees who need old payslips? **Default: no.** You'll also need a Google OAuth client from Google Cloud. Until then, dev uses magic links through Mailpit.
3. **Email provider for magic links in production.** **SMTP (works with Google Workspace SMTP relay, Resend, SES, etc.).**
4. **Roles.** **Manager and Intern are derived (§3), not stored roles.** Is there an **IT** person or team? Checklists assign tasks to "IT", but RBAC has no IT role. **Default: Settings names one IT owner, who sees and completes IT tasks and can edit access grants and assets. Add more owners on request.**
5. **Leave year.** **Calendar year, January to December**, or April to March? Initial quotas for CL/SL/EL/comp-off/LOP and the intern policy will be **placeholders for you to set in Settings**.
6. **Proration basis for LOP and mid-month joins.** **Calendar days in the month.** The alternatives are working days or a fixed 30.
7. **Statutory scope.** **PF applies to full-time staff only, ESI only when gross ≤ the configured threshold, PT for full-time and contract staff. Interns: no PF/ESI. PT for interns is a setting, default off.** Contract staff: is PF applicable? **Default: per-employee toggle.**
8. **Weekly offs.** **Configurable per weekday, including "2nd and 4th Saturday" style rules.** The seed uses Saturday and Sunday off.
9. **Half day.** **Worked time below a configurable threshold (seed: 4h) counts as a half day, and no check-out counts as a half day until regularised.**
10. **Reimbursement approval.** **Two steps: manager, then HR.** Approved claims go into the next unlocked payroll run as a non-taxable earning.
11. **Document templates.** HR can't edit react-pdf code, so **templates are Markdown with `{{placeholders}}` placed in a fixed letterhead layout. Every edit creates a new version.**
12. **Scheduled jobs** (intern-end tasks, accrual, carry-forward). **A `/api/cron/daily` route, triggered by Vercel Cron or by system cron on a VPS.**
13. **Audit scope.** The spec lists people, payroll and access. **Leave and attendance decisions and settings changes will also be audited**, because the cost is low and it helps with disputes.
14. **Hosting.** Choosing between Vercel and a VPS can wait until Phase 7, but it affects file storage. **Plan for S3-compatible storage in production** (e.g. Cloudflare R2 or AWS S3 in ap-south-1).
15. **Branding.** Do you have a metadatum logo file (SVG preferred) for the app header, letterhead and payslips?
