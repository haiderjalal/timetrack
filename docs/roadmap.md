# TimeTrack: Delivery Roadmap

> Each phase ends with something working and testable, delivered through its own feature branch and PR.

|            Phase            | Branch                   | Delivers                                                                                                                                                                                                                                                            | Done when                                                                                                                      |
| :-------------------------: | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
|    **0. Foundation** ✅     | `chore/scaffold`         | Next.js 16 + TS strict + Tailwind v4 + shadcn/ui, ESLint/Prettier, Vitest/Playwright + axe, `supabase init`, design tokens in `globals.css`, landing page, 404/error pages, security headers + CSP, CI pipeline, `.env.example`, `/api/health`                      | `lint`, `format:check`, `typecheck`, unit + e2e tests and `build` all pass in CI                                               |
| **1. Auth + organizations** | `feature/auth-orgs`      | Google sign-in + `/login`, `proxy.ts` session refresh, `profiles` trigger, onboarding wizard, `create_organization` RPC, **AppShell** (sidebar, top bar, mobile tabs) fed by real membership data, org switcher, `typedRoutes`, RLS helpers + pgTAP isolation tests | A new Google user can sign in, create an org with working hours, and land on the dashboard; RLS tests prove isolation          |
|  **2. Team + invitations**  | `feature/invitations`    | Invite dialog, Resend emails, `/invite/[token]`, `accept_invitation`, roles, deactivate member, last-owner protection                                                                                                                                               | Owner invites a second Google account, which joins as a member; roles are enforced in UI **and** DB                            |
|    **3. Clock in / out**    | `feature/time-tracking`  | `clock_in` / `clock_out` RPCs, ClockCard + ProgressRing + live timer, ClockStatusChip, today's sessions, Timesheet page + calendar, auto-close cron                                                                                                                 | Member clocks in and out (multiple sessions), sees progress live; double clock-in is impossible; forgotten sessions auto-close |
| **4. Attendance + reports** | `feature/reports`        | AttendanceCalculator (pure, fully unit-tested against business-rules.md), schedule versions, holidays, live board (Realtime), Needs review queue, admin `adjust_time_entry` + audit log, monthly report + CSV export, member month view                             | Report numbers match hand-calculated fixtures; admin edits are audited; export opens cleanly in Excel / Sheets                 |
|        **5. Leave**         | `feature/leave`          | Leave types settings, LeaveRequestSheet, Approvals page, `review_leave` / `cancel_leave`, emails, leave applied in calculator and report                                                                                                                            | Member requests half and full days; admin approves; report reflects it; overlap is impossible                                  |
|  **6. Hardening + launch**  | `chore/launch-hardening` | Rate limits, CSP review (hash-based SRI once stable), Sentry, Speed Insights, Playwright E2E of all journeys, accessibility pass, Lighthouse ≥ 95, production Supabase + Vercel setup, backups/PITR                                                                 | All Definition-of-Done checks pass; production smoke test green                                                                |

## After launch (v1.1+)

- Correction requests from members (propose a fix → admin approves).
- Per-member schedules / shifts, part-time hours.
- Payroll period locking + PDF export.
- PWA install + offline clock-in queue; push or email reminders ("You haven't clocked out").
- Geofence / IP allow-list for clock-in.
- Google Workspace domain auto-join, Slack integration.
- Billing (Stripe, per seat).
