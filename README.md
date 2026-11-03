# TimeTrack

Attendance and time tracking for teams. Members sign in with Google and clock in and out each day.
TimeTrack records the hours worked against the organization's working hours, counts overtime, and
handles leave requests. Owners get a monthly report for every member.

> **Status:** Phase 1 of the [roadmap](docs/roadmap.md): Google sign-in, onboarding (create an
> organization with its working hours), the app shell and the dashboard. Clocking in and out
> arrives in Phase 3.

## Tech stack

| Layer      | Choice                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Cache Components), React 19, TypeScript strict |
| UI         | Tailwind CSS v4, shadcn/ui (Radix), Lucide icons, Inter                |
| Data       | Supabase: Postgres + Row Level Security, Auth (Google), Realtime       |
| Testing    | Vitest + Testing Library, Playwright + axe accessibility checks        |
| Deployment | Vercel, GitHub Actions CI                                              |

Why these choices: [docs/architecture.md](docs/architecture.md).

## Getting started

**Prerequisites:** Node.js 20.9+ (CI uses 24) and npm. Docker Desktop is needed only for the local
Supabase database (`npm run db:start`), from Phase 1 on.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

### Connect Supabase (sign-in)

1. Put your project's URL, publishable key and secret key in **`.env.local`** (git-ignored).
   Never put them in `.env.example`: it is committed, and a test fails CI if it holds real keys.
2. In Supabase, open **Authentication → Sign In / Providers** and enable **Google** with your
   Google OAuth client. Turn **Email** off: TimeTrack signs in with Google only.
3. In **Authentication → URL Configuration**, set the Site URL and add
   `http://localhost:3000/auth/callback` (plus each deployed URL's `/auth/callback`) to Redirect URLs.
4. In Google Cloud, the OAuth client's redirect URI is
   `https://<project-ref>.supabase.co/auth/v1/callback`.

### Apply the database

The schema lives in `supabase/migrations` (design: [docs/database.md](docs/database.md)). The
project ref is the subdomain of `NEXT_PUBLIC_SUPABASE_URL`. `link` asks for the database password:
type it in your terminal only.

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.types.ts
```

Row Level Security is covered by pgTAP tests in `supabase/tests/database`. Run them against the
local database with `npm run db:start` then `npx supabase test db` (Docker required).

## Scripts

| Script                                    | What it does                                        |
| ----------------------------------------- | --------------------------------------------------- |
| `npm run dev`                             | Start the dev server                                |
| `npm run build` / `npm start`             | Production build / serve it                         |
| `npm run lint` / `npm run lint:fix`       | ESLint                                              |
| `npm run format` / `npm run format:check` | Prettier                                            |
| `npm run typecheck`                       | Generate route types and run `tsc`                  |
| `npm test`                                | Unit and component tests (Vitest)                   |
| `npm run test:e2e`                        | End-to-end tests on desktop and mobile (Playwright) |
| `npm run db:start` / `npm run db:stop`    | Local Supabase (Docker)                             |

First-time e2e setup: `npx playwright install chromium`.

## Project structure

```
docs/          architecture, database, business rules, design system, roadmap
e2e/           Playwright specs
supabase/      config, migrations and pgTAP tests (supabase/tests/database)
src/
  app/         routes only (pages, layouts, route handlers)
  features/    feature modules: components, services, repositories, validation
  components/  shared UI: ui/ (shadcn), layout/, shared/
  constants/   routes, site metadata
  lib/         integrations and helpers (security headers, site URL, Supabase later)
  types/       shared types (API response shape, generated DB types later)
```

## Contributing

`main` is protected. Create a branch (`feature/…`, `fix/…`, `chore/…`), use Conventional Commits,
and open a PR. CI must pass: lint, format check, type check, unit tests, build and e2e.
