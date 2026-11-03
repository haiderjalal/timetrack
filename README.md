# TimeTrack

Attendance and time tracking for teams. Members sign in with Google and clock in and out each day.
TimeTrack records the hours worked against the organization's working hours, counts overtime, and
handles leave requests. Owners get a monthly report for every member.

> **Status:** Phase 0 (foundation) of the [roadmap](docs/roadmap.md). Sign-in and the app itself
> arrive in Phase 1.

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
supabase/      config, migrations and pgTAP tests (from Phase 1)
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
