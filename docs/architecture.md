# TimeTrack: Architecture

> Status: **Draft v0.1, awaiting approval** · Date: 2026-11-03
> Related: [database.md](database.md) · [business-rules.md](business-rules.md) · [design-system.md](design-system.md) · [roadmap.md](roadmap.md)

---

## 1. What we are building

A multi-tenant attendance and time-tracking SaaS.

### Functional requirements

| #   | Requirement                                                                                                       | Who                                    |
| --- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| F1  | Sign in with Google                                                                                               | Everyone                               |
| F2  | Create an organization                                                                                            | Any signed-in user (becomes **Owner**) |
| F3  | Invite teammates by email, assign a role                                                                          | Owner, Admin                           |
| F4  | Define working hours per weekday, timezone, grace period, holidays                                                | Owner, Admin                           |
| F5  | Clock in and clock out daily (several sessions per day allowed)                                                   | Member                                 |
| F6  | Required hours per day (default 8h); time beyond it is recorded as **overtime**                                   | System                                 |
| F7  | Apply for leave (full day or half day)                                                                            | Member                                 |
| F8  | Approve or reject leave                                                                                           | Owner, Admin                           |
| F9  | Monthly report per member: days present, absent, on leave, hours worked, overtime, late arrivals, plus CSV export | Owner, Admin                           |
| F10 | Live view of who is clocked in right now                                                                          | Owner, Admin                           |

### Non-functional requirements

| Concern          | Target                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Security**     | Hard tenant isolation: one org can never read another org's data, even if app code has a bug. Timestamps come from the server, not the user's device. Every manual edit is audited. |
| **Speed**        | Clock-in round trip < 300 ms (p95). Dashboard shell paints instantly; data streams in < 1 s.                                                                                        |
| **Scale (v1)**   | 1,000 orgs × 50 members = 50k users, with a clear path to 10× that.                                                                                                                 |
| **Correctness**  | Time math holds across timezones, DST changes, and shifts that cross midnight.                                                                                                      |
| **Availability** | Managed platforms (Vercel + Supabase), with point-in-time recovery for the database.                                                                                                |

---

## 2. Tech stack decision

| Layer           | Choice                                                                                | Why                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | **Next.js 16** (App Router, React 19.2, TypeScript strict, Turbopack)                 | Server Components keep JS small; Server Actions give type-safe mutations without hand-written APIs; Cache Components / partial prerendering give an instant app shell. |
| Database        | **Supabase Postgres**                                                                 | Relational data with strict invariants. See §2.1.                                                                                                                      |
| Auth            | **Supabase Auth with Google OAuth** (PKCE), cookie sessions via `@supabase/ssr`       | Google login with no auth server of our own. The user's JWT flows into Postgres RLS.                                                                                   |
| Data access     | `supabase-js` + generated TypeScript types; **RPC functions for critical writes**     | Talks to Postgres over HTTP (PostgREST), so serverless functions never exhaust DB connections.                                                                         |
| Realtime        | Supabase Realtime (Broadcast from DB triggers)                                        | Live "who's in" board with no polling.                                                                                                                                 |
| Background jobs | `pg_cron` (auto clock-out, reminders) + Next.js `after()` (emails after the response) | No extra queue infrastructure for v1.                                                                                                                                  |
| UI              | **Tailwind CSS v4 + shadcn/ui + Lucide + `next/font` (Inter)**                        | Accessible Radix primitives, a token-based theme, one icon set.                                                                                                        |
| Forms           | React Hook Form + Zod (schemas shared by client and server)                           | One source of truth for validation.                                                                                                                                    |
| Tables / charts | TanStack Table + Recharts (shadcn chart wrappers)                                     | Report tables with sorting and sticky columns; light charts.                                                                                                           |
| Dates           | `date-fns` v4 + `@date-fns/tz`                                                        | Timezone-correct date math with tree-shakable code.                                                                                                                    |
| Email           | Resend + React Email                                                                  | Invitations and leave notifications.                                                                                                                                   |
| Rate limiting   | Upstash Redis (`@upstash/ratelimit`)                                                  | Works across serverless instances.                                                                                                                                     |
| Testing         | Vitest, React Testing Library, Playwright, **pgTAP** (RLS tests)                      | Business rules unit-tested; tenant isolation proven in SQL.                                                                                                            |
| Observability   | Sentry, Vercel Analytics + Speed Insights, structured logger (pino)                   | Errors, Web Vitals, request tracing.                                                                                                                                   |
| Hosting         | Vercel + Supabase, **same region**                                                    | Every DB call stays inside one region.                                                                                                                                 |
| CI              | GitHub Actions                                                                        | Lint, typecheck, unit tests, `supabase db lint`, RLS tests, build.                                                                                                     |

### 2.1 Why Supabase Postgres

1. **The data is relational and full of invariants**: one open shift per person, no overlapping leave, members belong to an org, at least one owner. Postgres enforces these with partial unique indexes, exclusion constraints, and composite foreign keys, so a bug can't get around them.
2. **Row Level Security gives tenant isolation inside the database.** Even if a Server Action forgets a `where org_id = …`, Postgres still won't return another org's rows.
3. **Google login, cron, realtime, backups** come in one managed platform, so there is less infrastructure to build and secure.
4. **It works well with serverless.** `supabase-js` uses HTTP, so a 9:00 AM clock-in spike across thousands of function instances doesn't open thousands of Postgres connections.
5. **It's the stack you already use** (the PeptoLogics standards in `D:\Projects\CLAUDE.md`), so what you know carries over.

### 2.2 Alternatives considered

| Option                                      | Strengths                    | Why not for v1                                                                                                                                                                                               |
| ------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Neon / RDS Postgres + Drizzle + Better Auth | Portable, very type-safe SQL | Authorization lives only in app code (no RLS by default). We'd have to build auth, cron and realtime ourselves. **Revisit if we outgrow Supabase**; the schema is plain Postgres, so migrating is realistic. |
| Prisma + any Postgres                       | Familiar ORM                 | Heavier client; serverless needs a connection pooler; no RLS benefit.                                                                                                                                        |
| MongoDB / Firestore                         | Flexible documents           | Reports are relational aggregations (members × days × schedules × leave). Integrity constraints are much harder to enforce.                                                                                  |

**Trade-offs we accept:** some coupling to Supabase (mitigated because migrations are plain SQL in git), and RLS has a learning curve and must be tested (mitigated with pgTAP tests in CI).

---

## 3. System overview

```
┌──────────────────────────────── Browser ─────────────────────────────────┐
│  Server-rendered HTML + small client islands                             │
│  (ClockButton, LiveTimer, LiveBoard, forms, report table)                │
└──────┬──────────────────────────────┬──────────────────────────┬─────────┘
       │ HTTPS + httpOnly session     │ Server Actions           │ WebSocket
       ▼                              ▼                          │ (Realtime)
┌──────────────── Vercel · Node runtime · region = DB region ───────────┐  │
│ proxy.ts ── refresh session cookie, redirect signed-out users         │  │
│ RSC pages ── features/*/services ── repositories ── supabase-js (JWT) │  │
│ Server Actions ── Zod ── rate limit ── services ── repositories       │  │
│ Route Handlers ── /auth/callback · /api/reports/export · /api/health  │  │
│ after() ── send emails, analytics (never blocks the response)         │  │
└─────────┬─────────────────────────────────────────┬───────────────────┘  │
          │ PostgREST (HTTP) + RPC                  │ HTTPS                │
          ▼                                         ▼                      │
┌──────────────────── Supabase ─────────────────┐ ┌──────────┐             │
│ Auth (Google OAuth → JWT)                     │ │ Resend   │             │
│ Postgres: tables · RLS · RPC · pg_cron        │ └──────────┘             │
│ Realtime: broadcast from triggers ────────────┼──────────────────────────┘
└───────────────────────────────────────────────┘ ┌──────────┐
                                                  │ Upstash  │ rate limits
                                                  └──────────┘
```

---

## 4. Application layers

```
UI (Server Component / Client island)
   ↓ calls
Server Action / Route Handler   validate input (Zod), resolve auth + org context, rate limit
   ↓ calls
Service                         business rules, pure TypeScript, unit-tested, knows nothing about React
   ↓ calls
Repository                      the only code that talks to Supabase (queries + RPC)
   ↓
Postgres                        RLS + constraints + RPC for invariants
```

### Where each kind of logic lives

| Lives in **Postgres** (cannot be bypassed) | Lives in **TypeScript services** (changes with product decisions) |
| ------------------------------------------ | ----------------------------------------------------------------- |
| Tenant isolation (RLS)                     | Overtime calculation                                              |
| Server-side timestamps for clock in/out    | Late-arrival detection                                            |
| One open time entry per member             | Day status (present / incomplete / absent / leave / holiday)      |
| No overlapping time entries or leave       | Monthly report aggregation                                        |
| An org always has ≥ 1 owner                | Who gets notified, and when                                       |
| Append-only audit log                      | Invitation rules, leave policy checks                             |

---

## 5. Folder structure

```
timetrack/
├── docs/                          architecture, database, rules, design, roadmap
├── supabase/
│   ├── migrations/                ordered SQL migrations (schema, RLS, RPC, cron)
│   ├── tests/                     pgTAP tests (RLS isolation, constraints, RPC)
│   └── seed.sql                   local dev data only
├── src/
│   ├── app/
│   │   ├── (marketing)/page.tsx           static landing page
│   │   ├── (auth)/login/page.tsx          "Continue with Google"
│   │   ├── auth/callback/route.ts         OAuth code exchange
│   │   ├── dashboard/route.ts             after sign-in: last org's dashboard, or onboarding
│   │   ├── onboarding/                    create-org wizard
│   │   ├── invite/[token]/                accept invitation
│   │   ├── o/[orgSlug]/                   authenticated app (AppShell layout)
│   │   │   ├── layout.tsx                 sidebar + topbar + org context
│   │   │   ├── dashboard/                 clock card, today, week
│   │   │   ├── timesheet/                 my entries, month calendar
│   │   │   ├── leave/                     my requests + apply
│   │   │   ├── attendance/                (admin) live board, needs review
│   │   │   ├── team/                      (admin) members, invites, roles
│   │   │   ├── team/[memberId]/           (admin) one member's month
│   │   │   ├── approvals/                 (admin) leave approvals
│   │   │   ├── reports/                   (admin) monthly report + export
│   │   │   └── settings/                  general, working hours, holidays, leave types
│   │   ├── account/                       profile, connected orgs
│   │   └── api/
│   │       ├── reports/export/route.ts    CSV stream
│   │       └── health/route.ts
│   ├── features/
│   │   ├── auth/            sign-in, sign-out, getCurrentUser() / requireUser()
│   │   ├── organizations/   { actions, services, repositories, components, types, utils }, requireMembership()
│   │   ├── app-shell/       org layout parts: sidebar, top bar, org switcher, mobile tabs, nav config
│   │   ├── dashboard/
│   │   ├── members/
│   │   ├── invitations/
│   │   ├── schedules/       working-hours versions, the rule for any date
│   │   ├── time-tracking/   clock actions, ClockCard, SessionList, top-bar timer, useLiveNow
│   │   ├── attendance/      AttendanceCalculator (pure), Timesheet calendar; later the live board
│   │   ├── leave/
│   │   └── reports/
│   ├── components/
│   │   ├── ui/              shadcn primitives
│   │   ├── layout/          marketing header/footer, UserMenu
│   │   ├── forms/           FieldError
│   │   └── shared/          EmptyState, ErrorState, DurationText, StatusBadge, PageHeader
│   ├── lib/
│   │   ├── supabase/        server.ts · client.ts · admin.ts (server-only, cron/maintenance only)
│   │   ├── validations/     Zod schemas shared by forms and Server Actions
│   │   ├── email/           Resend client + React Email templates
│   │   ├── rate-limit.ts
│   │   ├── logger.ts
│   │   └── time/            timezone helpers (org-local date, duration formatting)
│   ├── types/database.types.ts    generated by `supabase gen types`
│   └── proxy.ts                   session refresh + auth gate (Next.js 16 replacement for middleware)
└── e2e/                           Playwright specs
```

**Org in the URL (`/o/[orgSlug]/…`)**: every page is scoped to one org, links can be shared, and switching orgs is just navigation. The `o/` prefix means org slugs can never collide with top-level routes like `/login` or `/account`.

---

## 6. Key flows

### 6.1 Sign in with Google

**Built** (`src/features/auth`, `src/lib/supabase`, `src/proxy.ts`):

1. `/login` → Server Action `signInWithGoogle` → `signInWithOAuth({ provider: 'google', redirectTo: <site>/auth/callback })` with PKCE. The page to return to (`next`) is sanitized by `getSafeRedirectPath` and kept in a 10-minute httpOnly `tt_next` cookie scoped to `/auth/callback`. Keeping it out of the URL means the redirect URL allow-listed in Supabase stays exact.
2. Google → Supabase → `/auth/callback` → `exchangeCodeForSession(code)` → session cookies set (`httpOnly`, `SameSite=Lax`, `Secure` in production). A cancelled consent or a bad code goes back to `/login?error=…` with a friendly message. The callback response is `Cache-Control: private, no-store`.
3. `proxy.ts` refreshes the session on every page request, skipping Supabase entirely when there is no auth cookie. Its routing is optimistic: signed-out users on protected paths (`/account`, `/onboarding`, `/o/*`) are sent to `/login?next=…`, and verified users opening `/login` go straight to their destination. Pages, Server Actions and Route Handlers still verify with `requireUser()` (JWT signature checked by `getClaims()`).
4. A DB trigger on `auth.users` creates the `public.profiles` row from the Google profile.
5. With no explicit `next`, sign-in lands on `/dashboard`, a Route Handler that resolves the destination: the org in `profiles.last_org_id` if the person is still an active member, else the first org they joined, else `/onboarding`. If the lookup fails it falls back to `/account`, which works without org data. An explicit, safe `next` (a deep link) still wins. Visiting any page in an org saves it as `last_org_id` (in `after()`, so it never slows the page). Phase 2 adds: has a pending invite → `/invite/{token}`.

Supabase setup this needs: Google provider enabled; `<site>/auth/callback` in **Authentication → URL Configuration → Redirect URLs** for every environment; email sign-up disabled (TimeTrack is Google-only).

### 6.2 Create an organization (onboarding)

**Built** (`/onboarding`, `src/features/organizations`): one page with the name, web address (slug, suggested from the name), timezone (detected from the browser, editable) and working hours (default Mon–Fri 09:00–18:00, 8h required, 15 min grace). React Hook Form validates with the same Zod schema (`src/lib/validations/organization.schema.ts`) that the `createOrganization` Server Action runs again on the server, after `requireUser()`.
A single RPC, `create_organization()`, creates the org, the owner membership, the first schedule version and the default leave types **in one transaction**, then the action opens `/o/{slug}/dashboard`. Phase 2 adds an optional "invite your team" step.

### 6.2.1 Pages inside an org

`/o/[orgSlug]/layout.tsx` is the app shell. Its frame is static; the sidebar, top bar and tabs stream in, and each calls `requireMembership(orgSlug)` (`src/features/organizations/services/membership.ts`): a verified user who is an active member of that org, or a 404, so slugs can't be probed. It is cached per request, so the layout and page share one membership query. Every page, Server Action and Route Handler under `/o/[orgSlug]` calls it too.

### 6.3 Invite a teammate

1. Admin pastes emails on `/o/{slug}/team` and picks a role (owners can invite admins or members; admins only members). The action checks the role, then creates one invitation per address through `create_invitation`. Each token is 32 random bytes, and **only its SHA-256 hash is stored**. Inviting an address again revokes its open invitation.
2. The action first checks that email is set up (`EMAIL_FROM` and `RESEND_API_KEY`), so a missing sender creates nothing. It then sends each invitee an email with `/invite/{token}` (7-day expiry, single use, revocable from the team page) and answers only after the sends finish, so the admin sees which emails didn't go out. Admins can resend, which issues a fresh link.
3. The invitee opens the link and signs in with Google if needed. `/invite/[token]` shows the org and role through `preview_invitation`, and changes nothing. The person presses **Join**, which calls `accept_invitation(token)`: it checks the hash, expiry and revocation, and that the **invite email matches the Google email**. Then it creates the membership (or reactivates a deactivated one) and opens the org's dashboard.
4. Joining on a button press, not on page load, means an email link scanner that fetches the URL can't use up the invitation.

### 6.4 Clock in / clock out

1. Button → Server Action → rate limit → RPC `clock_in(org_id)`.
2. Postgres inserts with `now()` and sets `work_date` to the org-local date. A partial unique index rejects a second open entry, so double-clicking or two tabs can't create duplicates.
3. Returns the entry and `server_now`. The client timer counts locally from `clock_in_at`, corrected for the device clock's offset, so there is **no polling**.
4. A trigger broadcasts the change to the org's Realtime channel, and the admin live board updates instantly.
5. The UI updates immediately with `useOptimistic` and rolls back if the action fails.

**As built (Phase 3, `feature/time-tracking`):**

- `ClockCard` (client) → `clockIn` / `clockOut` Server Actions (`src/features/time-tracking/actions/clock.ts`): parse the shared schema (`src/lib/validations/clock.schema.ts`), `requireMembership()`, call the RPC, then `refresh()` so the whole page (card, sessions, week, top-bar timer) re-renders from the server. Refusals (`already_clocked_in`, `not_clocked_in`, …) map to plain messages in `utils/clockErrors.ts`; the page refreshes on those too, so a second tab shows the real state. The card shows a pending state while the action runs instead of an optimistic one: the server's answer arrives in one round trip.
- `clock_in` / `clock_out` first close the caller's own **stale** session with the auto-close rule (§6.7), so a missed job run never blocks anyone. Clocking out a stale session returns it with `auto_closed = true`, and the card says so.
- **Live timers** (`hooks/useLiveNow.ts`) start from the server's `Date.now()` at render and add the seconds that pass on the device, through one shared one-second ticker. A wrong device clock never skews them, and server render and hydration show the same value. Screen readers hear state changes once, never the ticking timer.
- The note at clock-out is a single optional field with `maxLength`, validated by the shared Zod schema in the action, without React Hook Form: one field doesn't justify ~10 KB on the dashboard.
- **Not yet:** the Upstash rate limit (Phase 6; the unique index already makes a double clock-in impossible) and the Realtime broadcast (Phase 4, with the live board).
- Day totals come from the pure calculator in `src/features/attendance/services/attendanceCalculator.ts` (business-rules §4): the dashboard's week and the Timesheet (`/o/[orgSlug]/timesheet?month=YYYY-MM`) both use it.

### 6.5 Monthly report

1. Admin opens `/o/acme/reports?month=2026-11`.
2. The service loads independent data in parallel (`Promise.all`): members, **daily totals** (aggregated in SQL, grouped by user and work date), schedule versions, holidays, and approved leave.
3. The pure `AttendanceCalculator` produces per-member, per-day statuses and monthly totals (rules in [business-rules.md](business-rules.md)).
4. Rendered as a table with summary cards. `/api/reports/export` streams the same data as CSV.

### 6.6 Leave

Member submits → insert (RLS forces `user_id = me` and `status = 'pending'`; an exclusion constraint blocks overlapping requests) → `after()` emails the admins → admin approves or rejects via RPC `review_leave()` → member gets an email and sees the status in the app.

### 6.7 Forgotten clock-out

Every 15 minutes, `pg_cron` closes entries that are still open long after the shift ended. They get `auto_closed = true` and appear in the admins' **Needs review** queue. See [business-rules.md §6](business-rules.md#6-forgotten-clock-out).

Built in Phase 3 as `private.close_stale_entries()` (job `auto-close-stale-entries`), which also writes an `audit_log` row per session. The member sees a notice on the dashboard until they clock in again; the Needs review queue arrives with the admin pages in Phase 4.

---

## 7. Rendering and caching (Next.js 16)

- **`cacheComponents: true`.** Marketing pages are fully static. App pages prerender a **static shell** (sidebar, header, skeletons), and user-specific data streams in through `<Suspense>`, so navigation feels instant.
- **Tenant data is never cached across users.** It is read with each user's JWT under RLS, so a shared cache could leak data between users. React `cache()` deduplicates within one request (for example, `requireMembership()` called from layout and page).
- **Mutations**: Server Actions call `revalidatePath` for the affected org routes and return the new state for optimistic UI.
- **Client JavaScript is limited to islands**: clock button, live timer, live board, forms, report table. Everything else is a Server Component.
- **Keep helpers out of the shared client bundle.** The root `error.tsx` loads with every page, so it uses `buttonVariants` rather than `<Button>`, and links styled as buttons use `buttonVariants` rather than `<Button asChild>` (which ships Radix Slot). This keeps `cn` and Slot off pages that don't need them. Measured: landing page JS dropped from 165 KB to 144 KB gzipped. The rest is the Next.js/React runtime.
- **`experimental.inlineCss` was considered and rejected.** It speeds up a first visit, but members return twice a day and benefit more from a cached stylesheet. It is also global-only and experimental.
- **Fonts and images**: `next/font` (self-hosted Inter); avatars through `next/image` with Google's avatar domain allow-listed.

---

## 8. Security

| Threat                          | Control                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cross-tenant data access        | RLS on **every** table, default deny. Policies use cached helper functions (`private.member_org_ids()`). pgTAP tests prove that user A of org X cannot read org Y.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Faked clock times               | Members **never** send timestamps. `clock_in` / `clock_out` RPCs use `now()`. Members have no INSERT/UPDATE permission on `time_entries`.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Members editing their own hours | Only admins can adjust an entry, through `adjust_time_entry()`, with a mandatory reason, written to an append-only `audit_log`.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Session theft / CSRF            | Session cookies are set `httpOnly` explicitly (`@supabase/ssr` defaults to readable cookies; we override because only server code uses the session), plus `SameSite=Lax` and `Secure` in production. Server Actions have built-in origin checks. On the server, identity is always verified with `auth.getClaims()`, never `getSession()`. Open redirects are blocked by `getSafeRedirectPath`.                                                                                                                                                                                             |
| Invitation abuse                | Token is hashed at rest, expires, works once, can be revoked, and the email must match. Invites are rate-limited per admin and per org.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Privilege escalation            | Role changes go through an RPC. Admins can't create owners. Triggers keep at least one owner per org.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Spam / brute force              | Upstash rate limits on clock, leave, invite and auth actions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Injection / XSS                 | Zod on every input; parameterized queries only (supabase-js / RPC); React escaping; no `dangerouslySetInnerHTML`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Secret leakage                  | The secret key exists only in `lib/supabase/admin.ts` (`import 'server-only'`), used by maintenance code. The browser only gets the publishable key.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Headers                         | CSP, HSTS, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP, built in `src/lib/security/securityHeaders.ts` and applied in `next.config.ts`. The CSP uses no nonces, because nonces force dynamic rendering and would drop the static shell. The trade-off is `'unsafe-inline'` in `script-src`, mitigated by React escaping, no raw HTML injection, and strict `frame-ancestors`, `object-src`, `base-uri` and `connect-src`. `form-action` allows Supabase and Google so the sign-in redirect chain works. Revisit with hash-based SRI when it leaves experimental. |
| Data loss                       | Supabase daily backups + PITR (paid plan). Members are soft-deactivated, never hard-deleted, so attendance history survives.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Privacy                         | Logs never contain emails, tokens or notes. Only the IDs needed for tracing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

---

## 9. Scalability and performance

### Load estimate (v1 target)

- 50k users × ~2.5 time entries/day ≈ **125k rows/day ≈ 45M rows/year**. Fine for one well-indexed Postgres table.
- Peak: most clock-ins land in about 15 minutes around 9:00 AM. 50k / 900 s ≈ **55 writes/s**, well within limits.
- Reports: one org-month of a 200-person org ≈ 200 × 31 × ~2.5 ≈ 15k rows, aggregated in SQL down to about 6k day rows.

### How it scales

| Lever                                                                                          | When                                                            |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Stateless Next.js on Vercel functions scales horizontally                                      | Automatically                                                   |
| PostgREST over HTTP, Supavisor pooler for any direct connections                               | From day one                                                    |
| Composite indexes matching every query (`(org_id, work_date)`, `(org_id, user_id, work_date)`) | From day one                                                    |
| RLS helpers return a set that is evaluated **once per query** (initPlan), not once per row     | From day one                                                    |
| `daily_attendance` rollup table maintained on clock-out                                        | If report p95 > 500 ms                                          |
| Read replica for reports and exports                                                           | If reports compete with clock-in writes                         |
| Monthly range partitioning of `time_entries` by `work_date`                                    | > ~100M rows (see [database.md §8](database.md#8-scaling-path)) |
| Move email/notifications to a queue (e.g. Supabase Queues / pgmq)                              | If notification volume or retries grow                          |

### Speed budget

- Vercel function region = Supabase region. Choose the region nearest most users (for example, Mumbai `bom1` + `ap-south-1` for South Asia).
- Clock-in is one RPC round trip. The dashboard loads in a single parallel `Promise.all`, with no request waterfalls.
- Lighthouse ≥ 95 on public pages; Core Web Vitals: LCP < 2.5 s, INP < 200 ms, CLS < 0.1.

---

## 10. Observability

- **Sentry**: server and client errors, tagged with `org_id` and `request_id` (never PII).
- **Structured logs** (pino) for business events: `clock_in`, `clock_out`, `invite.sent`, `leave.reviewed`, `entry.adjusted`.
- **Vercel Speed Insights** for real-user Web Vitals; Supabase `pg_stat_statements` for slow queries.
- **`/api/health`**: app is up and the DB responds (no sensitive details).
- Alerts: error-rate spikes, failed cron runs, email bounces.

---

## 11. Environments and deployment

| Env        | App                        | Database                                    |
| ---------- | -------------------------- | ------------------------------------------- |
| Local      | `next dev`                 | `supabase start` (Docker), seed data        |
| Preview    | Vercel preview per PR      | Supabase branch (or shared staging project) |
| Production | Vercel production (`main`) | Supabase production project                 |

Environment variables (`.env.example`):

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=            # server-only, maintenance tasks
RESEND_API_KEY=
EMAIL_FROM=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=
```

Google OAuth client ID and secret are configured in the **Supabase dashboard** (Auth → Providers → Google), not in the app.

CI (GitHub Actions) on every PR: `npm run lint` · `npm run typecheck` · `npm test` · `supabase db lint` · pgTAP RLS tests · `npm run build`. Migrations are applied to production via `supabase db push` from CI after merge.

---

## 12. What to revisit as the system grows

1. **Partition `time_entries`** once it passes ~100M rows; the "one open entry" rule then needs its own small table (see database.md §8).
2. **Per-member schedules** (part-timers, shifts). The schema already allows a member-level schedule override.
3. **Payroll period locking**, so approved months can't be edited.
4. **Mobile app / PWA** with offline clock-in queueing (server time is still authoritative when the event syncs).
5. **Geofence or IP allow-list** for clock-in, if orgs need proof of location.
6. **Billing** (Stripe, seat-based) and **SSO** (Google Workspace domain auto-join).
7. **Move off Supabase** only if needed. The schema is standard Postgres; RLS could be replaced with app-level authorization and Drizzle.
