# CLAUDE.md: TimeTrack

@AGENTS.md

This file is the project guide for **TimeTrack**, a multi-tenant attendance and time-tracking SaaS.
The engineering standards in `D:\Projects\CLAUDE.md` (layering, naming, Git workflow, Definition of
Done) apply here too, but its **PeptoLogics product details do not**: no products, cart, inquiries or
PeptoLogics colors. Where the two disagree, this file wins.

## Source of truth

Read the relevant doc before changing an area, and update it in the same PR when a decision changes.

| Doc                                              | Covers                                                       |
| ------------------------------------------------ | ------------------------------------------------------------ |
| [docs/architecture.md](docs/architecture.md)     | Stack, layers, folder structure, flows, caching, security    |
| [docs/database.md](docs/database.md)             | Tables, constraints, RLS policies, RPC functions, cron jobs  |
| [docs/business-rules.md](docs/business-rules.md) | Overtime, day status, leave, auto clock-out (open questions) |
| [docs/design-system.md](docs/design-system.md)   | Tokens, components, page map, screen layouts, accessibility  |
| [docs/roadmap.md](docs/roadmap.md)               | Phases, branches and "done when" criteria                    |

**Never invent business rules.** Anything marked `[ASSUMPTION]` in business-rules.md is a proposed
default; ask before building behavior that depends on an unconfirmed one.

## Stack

Next.js 16 (App Router, Cache Components, Partial Prefetching) · React 19 · TypeScript strict ·
Tailwind CSS v4 + shadcn/ui (Radix, Nova preset) · Supabase (Postgres, Auth with Google, RLS,
Realtime, pg_cron) · Vercel · Vitest + Testing Library · Playwright + axe.

## Commands

```bash
npm run dev            # local dev server (Turbopack)
npm run lint           # ESLint
npm run format         # Prettier write; CI runs format:check
npm run typecheck      # next typegen + tsc
npm test               # Vitest unit/component tests
npm run test:e2e       # Playwright against a production build (desktop + mobile)
npm run build          # production build
npm run db:start       # local Supabase (requires Docker)
```

All of `lint`, `format:check`, `typecheck`, `test`, `test:e2e` and `build` must pass before a PR.

## Rules specific to this codebase

- **Next.js 16.4 differs from older versions.** Check `node_modules/next/dist/docs/` first. Known
  differences used here: `proxy.ts` instead of `middleware.ts`; `error.tsx` receives
  `{ error: unknown, retry }`; `LayoutProps<"/route">` / `PageProps` are global generated types;
  with Cache Components, request data (`cookies()`, `headers()`, `params`) must sit behind
  `<Suspense>`, and Route Handlers that must run per request call `await connection()`.
- **Tenant data is never cached across users.** It is read with the user's JWT under RLS.
- **Security headers live in `src/lib/security/securityHeaders.ts`** (CSP without nonces, so the
  static shell survives). Adding a third-party origin means updating that file and its tests.
- **Design tokens only.** Use `bg-status-present-soft`, `text-muted-foreground`, `bg-brand`, etc.
  from `src/app/globals.css`. Never hardcode hex values in components. Status is always shown with a
  label or icon, never color alone. Times and durations use the `tabular` utility.
- **Icons:** Lucide 1.x. Old aliases are gone (`TreePalm` not `Palmtree`, `House` not `Home`,
  `TriangleAlert` not `AlertTriangle`).
- **Links that look like buttons** use `<Link className={buttonVariants(...)}>` from
  `@/components/ui/button-variants`, not `<Button asChild>` (that ships Radix Slot to the browser).
  The root `error.tsx` and `EmptyState` must not import `cn`: they ship with every page.
- **Imports:** React/Next → third-party → `@/` aliases → relative → `import type` → styles.
- **Members never send timestamps.** Clock times come from Postgres `now()` via RPC.
- **Supabase:** `auto_expose_new_tables = false`, so every migration writes its own grants and RLS
  policies, and every policy gets a pgTAP test in `supabase/tests/`.
- **Git:** `main` is protected; work on `feature/*`, `fix/*`, `chore/*` branches with Conventional
  Commits, and merge through squash-merged PRs.
