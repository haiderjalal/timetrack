# TimeTrack: Design System, Information Architecture and Layouts

> Status: **Draft v0.1** · Built on Tailwind CSS v4 + shadcn/ui · Icons: Lucide · Font: Inter (`next/font`)

---

## 1. Design principles

1. **The clock is the hero.** A member's main job is to clock in and out. It must take one tap on every screen size, with clear feedback.
2. **Color is reserved for meaning.** The interface chrome is neutral ink and gray. Color only appears for status (present, short, absent, leave, overtime) and the live indicator. Status is **never** shown by color alone; there is always a label or icon too.
3. **Numbers are first-class.** All times and durations use tabular figures, right-aligned in tables, in one consistent format (`7h 42m`, `09:05`).
4. **Calm in the app, alive on the landing page.** Inside the app: borders instead of heavy shadows, generous spacing, no decorative motion. This is a tool people open twice a day, every day. Marketing pages may use **purposeful brand motion**: the interactive hero clock, gentle scroll reveals, a sticky header. All of it is pure CSS where possible, and it never delays the main heading (the LCP element).
5. **Same rules for everyone.** Members see exactly the numbers their admin sees about them.
6. **One brand mark.** The logo is an indigo tile holding a ¾ progress arc and a clock hand, echoing the ring members see when they clock in. It looks the same in light and dark mode (`--brand-mark`) and appears in the header, favicon, share image, sign-in panel and CTA band.

---

## 2. Design tokens

Defined as CSS variables in `src/app/globals.css` and mapped to Tailwind v4 with `@theme inline` (the shadcn convention). Components use only tokens (`bg-status-present-soft`, `text-muted-foreground`), never raw hex values.

### 2.1 Color: neutrals and brand

| Token                     | Light     | Dark            | Use                                                                                                  |
| ------------------------- | --------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `--background`            | `#FFFFFF` | `#09090B`       | Cards, inputs                                                                                        |
| `--canvas`                | `#FAFAFA` | `#0C0C0E`       | App background behind cards                                                                          |
| `--foreground`            | `#18181B` | `#FAFAFA`       | Primary text                                                                                         |
| `--muted`                 | `#F4F4F5` | `#27272A`       | Subtle fills, table header                                                                           |
| `--muted-foreground`      | `#6B6B74` | `#A1A1AA`       | Secondary text: AA on white, canvas **and** muted surfaces (`#71717A` failed on `--muted` at 4.39:1) |
| `--border`                | `#E4E4E7` | `#27272A`       | Dividers, card borders                                                                               |
| `--primary`               | `#18181B` | `#FAFAFA`       | Primary buttons ("ink")                                                                              |
| `--primary-foreground`    | `#FAFAFA` | `#18181B`       | Text on primary                                                                                      |
| `--brand`                 | `#4F46E5` | `#818CF8`       | Links, focus ring, active nav marker, highlights                                                     |
| `--brand-soft`            | `#EEF2FF` | brand 15% on bg | Icon tiles, demo badge                                                                               |
| `--brand-mark`            | `#4F46E5` | `#4F46E5`       | Logo tile, CTA band, sign-in brand panel (same in both themes)                                       |
| `--brand-mark-foreground` | `#FFFFFF` | `#FFFFFF`       | Text and strokes on `--brand-mark`                                                                   |
| `--brand-mark-muted`      | `#E0E7FF` | `#E0E7FF`       | Secondary text on `--brand-mark` (6.3:1)                                                             |
| `--ring`                  | `#4F46E5` | `#818CF8`       | Focus outline                                                                                        |
| `--destructive`           | `#E11D48` | `#FB7185`       | Destructive actions                                                                                  |

### 2.2 Color: attendance status (semantic)

Each status has a **solid** color (dots, chart bars, ring), a **soft** background, and a **text-on-soft** color that meets AA contrast.

| Status                                 | Solid (light / dark)    | Soft bg (light) | Text on soft | Icon          |
| -------------------------------------- | ----------------------- | --------------- | ------------ | ------------- |
| `present`: complete day                | `#059669` / `#34D399`   | `#ECFDF5`       | `#047857`    | `CircleCheck` |
| `short`: under required, also **late** | `#D97706` / `#FBBF24`   | `#FFFBEB`       | `#B45309`    | `CircleAlert` |
| `absent`                               | `#E11D48` / `#FB7185`   | `#FFF1F2`       | `#BE123C`    | `CircleX`     |
| `leave`                                | `#0284C7` / `#38BDF8`   | `#F0F9FF`       | `#0369A1`    | `TreePalm`    |
| `overtime`                             | `#9333EA` / `#C084FC`   | `#FAF5FF`       | `#7E22CE`    | `TrendingUp`  |
| `off`: weekend, holiday                | `#71717A` / `#A1A1AA`   | `#F4F4F5`       | `#52525B`    | `CircleMinus` |
| `live`: clocked in now                 | `#10B981` (pulsing dot) | –               | –            | `Radio`       |

In dark mode, soft backgrounds are the solid color at 15% opacity on `--background`.

### 2.3 Typography

| Token          | Size / line height | Weight                | Use                                 |
| -------------- | ------------------ | --------------------- | ----------------------------------- |
| `text-display` | 56 / 60            | 600, tracking −0.02em | Live timer                          |
| `text-3xl`     | 30 / 36            | 600                   | KPI values                          |
| `text-2xl`     | 24 / 32            | 600                   | Page titles                         |
| `text-lg`      | 18 / 28            | 600                   | Card titles                         |
| `text-base`    | 16 / 24            | 400                   | Marketing body, mobile body         |
| `text-sm`      | 14 / 20            | 400 / 500             | **App default body**, tables, forms |
| `text-xs`      | 12 / 16            | 500                   | Labels, badges, captions            |

- Inter variable font, self-hosted with `next/font/google`, `display: swap`.
- `font-variant-numeric: tabular-nums` on every time, duration and count (`.tabular` utility).
- Formats: time `09:05` (24h by default, org setting for 12h), duration `7h 42m`, date `Mon, 3 Nov`.

### 2.4 Spacing, layout, shape, elevation, motion

| Category          | Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spacing scale     | 4 px base: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Page gutter       | 16 mobile · 24 tablet · 32 desktop                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Content max width | 1280 px (reports can go full width)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Radius            | `--radius: 10px` → inputs/buttons 8, cards 12, badges/pills full                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Elevation         | Cards: 1px border + `shadow-xs`. Popovers/menus: `shadow-lg`. Nothing else.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Motion            | Hover/press 150 ms ease-out · panels/sheets 200 ms · progress ring transitions over 600 ms · live dot pulses (1.6 s) · page-load entrance `animate-enter` (600 ms, staggered with `--enter-delay`) · scroll reveals `reveal` / `reveal-line` (scroll-driven, **movement only, never opacity**, so text keeps full contrast mid-reveal). Every animation opts in under `prefers-reduced-motion: no-preference` (or Tailwind `motion-safe:`); with reduced motion content shows in its final state. **No global "duration: 0.01ms" override.** Scroll reveals and the stuck-header shadow are progressive enhancement (no fallback). |
| Touch targets     | ≥ 44 × 44 px on mobile                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Icons             | Lucide, 16 px in text, 20 px in nav, stroke 1.75                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

---

## 3. Components

shadcn/ui gives us the primitives (Button, Input, Select, Dialog, Sheet, Popover, Calendar, Tabs, Table, Badge, Avatar, DropdownMenu, Command, Tooltip, Sonner toasts, Skeleton, Chart). On top of them we build these product components:

| Component                   | Purpose                                                   | Key states / variants                                                                                                                                                                                                            |
| --------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ClockCard** ✅            | Main clock in/out surface                                 | `idle` (Clock in) · `running` (timer, ring, Clock out) · `pending` (spinner, disabled) · `done` · `on_leave` · `day_off` ("counts as overtime" hint) · `auto_closed` warning · `error` (inline + retry)                          |
| **ProgressRing** ✅         | Today's progress toward required hours                    | Built (`components/shared/ProgressRing`): a native `<progress>` with `aria-valuetext`; 0–100% fills **green**, past 100% a second lap fills **purple** (overtime); `fillOnLoad`; `on-brand` variant. Center label: `6h 12m / 8h` |
| **StatusBadge** ✅          | Day status pill: dot + label                              | Built (`components/shared/StatusBadge`): tones present · short · absent · leave · overtime · off                                                                                                                                 |
| **TabSwitcher** ✅          | Small accessible tabs (WAI-ARIA tabs pattern)             | One tab stop, arrow keys / Home / End, server-rendered panels passed in; ~1 KB instead of Radix Tabs                                                                                                                             |
| **LogoMark / Logo** ✅      | Brand mark and wordmark                                   | Mark scales via `className` (`size-7` default)                                                                                                                                                                                   |
| **ClockStatusChip** ✅      | Compact running timer in the top bar on every page        | hidden when idle · green dot + `03:12:45` when running · click → dashboard                                                                                                                                                       |
| **DurationText**            | Formats minutes; screen-reader label "7 hours 42 minutes" | default · `signed` (+25m / −40m)                                                                                                                                                                                                 |
| **AttendanceCalendar** ✅   | Month grid; each day shows status color + hours           | keyboard grid navigation (arrow keys), legend, today outline, selected day                                                                                                                                                       |
| **StatCard**                | KPI tile: label, big tabular value, sub-line              | default · loading skeleton                                                                                                                                                                                                       |
| **LiveBoard**               | Who's in right now, grouped                               | groups: Clocked in · Not in yet · On leave · Day off; each row: avatar, name, since 09:02, running duration                                                                                                                      |
| **ReportTable**             | Monthly report (TanStack Table)                           | sticky member column, sortable numeric columns, totals footer, row → member month                                                                                                                                                |
| **SessionList** ✅          | Today's / a day's sessions                                | each: in → out, duration, source icon, `auto_closed` tag, admin "Edit"                                                                                                                                                           |
| **LeaveRequestSheet**       | Apply for leave                                           | type select, date / range picker, half-day segmented control, reason, quota hint, overlap error                                                                                                                                  |
| **ApprovalCard**            | Pending leave for admins                                  | summary, conflict hint (others off that day), Approve / Reject + note                                                                                                                                                            |
| **ScheduleEditor**          | Working-hours editor                                      | 7 rows: toggle, start, end, required hours; "Copy Monday to weekdays"; effective-from date                                                                                                                                       |
| **InviteDialog**            | Invite by email                                           | multi-email input (paste a list), role select, pending invites list with Resend / Revoke                                                                                                                                         |
| **OrgSwitcher**             | Switch org / create new                                   | Command-menu combobox                                                                                                                                                                                                            |
| **EmptyState / ErrorState** | Consistent empty and failure screens                      | icon, title, one sentence, primary action                                                                                                                                                                                        |

Every data view has **loading** (skeleton matching the final layout, so nothing shifts), **empty**, **error** (with retry) and **success** states.

---

## 4. Information architecture

```
/                         Landing (static, SEO)
/login                    Continue with Google
/onboarding               Create org: name → timezone → working hours → invite (optional)
/invite/[token]           Accept invitation
/account                  Profile, my orgs, sign out

/o/[org]/dashboard        Everyone   Clock card · today's sessions · this week · leave balance
/o/[org]/timesheet        Everyone   Month calendar + daily list of my sessions, month summary
/o/[org]/leave            Everyone   My requests, balances, "Request leave"
── Manage (Owner/Admin) ─────────────────────────────────────────────
/o/[org]/attendance       Live board (who's in) · Needs review queue
/o/[org]/team             Members, roles, invites
/o/[org]/team/[member]    One member: month calendar, sessions, adjust entries, audit trail
/o/[org]/approvals        Pending leave requests (badge count in nav)
/o/[org]/reports          Monthly report · export CSV
/o/[org]/settings         General · Working hours · Holidays · Leave types · Danger zone
```

Primary journey for a member: **open app → Dashboard → Clock in** (1 tap). Evening: **Clock out** (1 tap).
Primary journey for an owner: **Attendance** (morning check) → **Approvals** → **Reports** (month end).

---

## 5. App shell

### Desktop (≥ 1024 px)

```
┌───────────────┬───────────────────────────────────────────────────────────────┐
│ ◆ Acme Inc  ▾ │  Dashboard                       Tue, 3 Nov   ● 03:12:45  (HJ)│
│               ├───────────────────────────────────────────────────────────────┤
│ ME            │                                                               │
│ ▣ Dashboard   │                         page content                          │
│ ▦ Timesheet   │                       (max-width 1280)                        │
│ ✈ Leave       │                                                               │
│               │                                                               │
│ MANAGE        │                                                               │
│ ◉ Attendance  │                                                               │
│ 👥 Team       │                                                               │
│ ✓ Approvals 3 │                                                               │
│ ▤ Reports     │                                                               │
│ ⚙ Settings    │                                                               │
│               │                                                               │
│ (HJ) Haider ▾ │                                                               │
└───────────────┴───────────────────────────────────────────────────────────────┘
  sidebar 248px            top bar: title · date · ClockStatusChip · user menu
```

- **Tablet (768–1023 px):** the sidebar collapses to a 64 px icon rail with tooltips.
- The **MANAGE** group only renders for owners and admins; the server never sends it to members.

### Mobile (< 768 px)

```
┌─────────────────────────────┐
│ ◆ Acme ▾            ● (HJ)  │  top bar
├─────────────────────────────┤
│                             │
│        page content         │
│                             │
├─────────────────────────────┤
│  ⌂ Home  ▦ Time  ✈ Leave  ☰ │  bottom tabs (☰ Manage sheet for admins)
└─────────────────────────────┘
```

### As built (Phase 1)

- `src/app/o/[orgSlug]/layout.tsx` + `src/features/app-shell`. The frame (sidebar column, top bar,
  main) is static; the org switcher, nav, date and user menu stream in behind Suspense with
  skeletons of the same size.
- **Org switcher** sits at the top of the sidebar (desktop, as on the design canvas) and in the top
  bar on phones. It's a dropdown menu listing your orgs with your role, plus **Create
  organization**. A command-palette search can replace it once people belong to many orgs.
- **User menu** (avatar, top bar right, every size): name and email, **Account**, **Sign out**.
- **Page title** is the top bar's `<h1>` (visually hidden on phones), taken from the nav config.
- **Nav config** (`src/features/app-shell/constants/navigation.ts`) lists only pages that exist.
  Today that's Dashboard, so the Manage group is empty and hidden. It appears for owners and admins
  once a Manage page ships.
- **Bottom tabs** show the "Me" pages and render only when there are at least two (a bar with one
  tab is noise). Since Phase 3 that's Home and Time; the Manage sheet comes with the first Manage
  page.
- The tablet rail keeps labels for screen readers (`sr-only`) and shows them as tooltips (`title`).

### As built (Phase 3)

- **Dashboard:** the Today card holds the greeting, the shift line ("Shift today 09:00 – 18:00 · 8h
  required · late after 09:15"), the **ClockCard** and today's **SessionList**. The right column is
  **This week** (a bar per day: required time green, or amber when short, overtime purple; +/− per
  day; totals), then Working hours and the org card.
- **ClockCard** (`src/features/time-tracking/components`): ring + "You're clocked in since 09:02" +
  stopwatch (`text-display` from `sm`), "3h 51m to go" or "+25m overtime", one primary button
  (Clock in / Clock out) and "Add note" while running. On a day off the ring becomes a "Day off"
  disc with the overtime hint. Pending: spinner and "Clocking in…". Errors: inline alert with "Try
  again". The auto-closed notice (amber, `TriangleAlert`) stays until the next clock-in.
  `on_leave` arrives with leave (Phase 5).
- **ClockStatusChip** sits between the date and the user menu: green dot + stopwatch, just the dot
  on phones; its accessible name is "Clocked in since 09:02. Open the dashboard".
- **Timesheet** (`/o/[orgSlug]/timesheet?month=YYYY-MM`): month name with previous/next (no next past
  this month), four stat tiles (Worked of required, Overtime, Shortfall, Present with absent/late),
  an auto-closed warning when there are any, the **AttendanceCalendar**, then every day so far,
  newest first, with its sessions. Calendar cells link to those days (`#day-YYYY-MM-DD`).
- **AttendanceCalendar** is a `<table role="grid">`: one tab stop (today), arrow keys, Home/End.
  Each status has its own icon (✓ complete, ↗ overtime, ↘ short, ✕ absent, – day off, clock in
  progress) and soft tone, and the cell's name says everything in words. Phones show the day and
  icon; from `sm` the label ("Short · Late") and hours too. Days still to come are plain numbers.

---

## 6. Key screens

### 6.1 Member dashboard

```
┌──────────────────────────────────────────────┬──────────────────────────────┐
│ Good morning, Haider                         │ This week                    │
│ Shift today 09:00 – 18:00 · 8h required      │ Mon ████████▌ 8h 25m  +25m    │
│                                              │ Tue ███████   7h 20m  −40m    │
│        ╭──────────╮                          │ Wed ░░░░░░░   absent          │
│      ╭─  6h 12m   ─╮   ● You're clocked in   │ Thu ████▌     4h 30m  ½ leave │
│      │   of 8h     │     since 09:02         │ Fri ███▌      in progress     │
│      ╰─           ─╯                         │──────────────────────────────│
│        ╰──────────╯     03:12:45             │ Overtime this month   +3h 10m│
│                                              │ Leave left (Annual)   9 days │
│   [  Clock out  ]   Add note                 │──────────────────────────────│
│                                              │ Upcoming                     │
│ Today's sessions                             │ Fri 14 Nov · Casual (approved)│
│ 09:02 → 13:00   3h 58m                       │                              │
│ 14:01 → now     2h 14m  ● live               │                              │
└──────────────────────────────────────────────┴──────────────────────────────┘
```

On mobile, the ring and button stack vertically and the button sits in the lower-middle thumb zone.

### 6.2 Admin: Attendance (live board)

```
Attendance · Today, Tue 3 Nov                              [ Needs review (2) ]
┌──────────┬──────────┬──────────┬──────────┐
│ In now   │ Not in   │ On leave │ Late     │
│ 18 / 24  │ 3        │ 2        │ 4        │
└──────────┴──────────┴──────────┴──────────┘
● Clocked in (18)
  (AK) Ayesha Khan     since 08:56   3h 16m
  (BR) Bilal Raza      since 09:24   2h 48m   Late
  …
○ Not in yet (3)        (SM) Sara M.  shift 09:00   Absent so far
✈ On leave (2)          (UF) Usman F. Sick · full day
```

Updates live via Realtime; no refresh needed.

### 6.3 Admin: Monthly report

```
Reports                                   [ November 2026 ▾ ]  [ Export CSV ]
┌────────────┬────────────┬────────────┬────────────┐
│ Hours      │ Overtime   │ Absences   │ Attendance │
│ 3,412h     │ +146h      │ 11 days    │ 96.2 %     │
└────────────┴────────────┴────────────┴────────────┘
Member        Present Short Absent Leave Late  Worked  Overtime Shortfall  Att.%
Ayesha Khan     20      1     0     1     0   168h 20m  +9h 05m   −0h 40m   100%
Bilal Raza      18      3     1     1     5   149h 10m  +1h 30m   −6h 20m    95%
…
Total          412     27    11    19    31   3,412h    +146h     −38h      96.2%
```

Sticky member column, sortable numeric columns, row → `/team/[member]` month calendar.

### 6.4 Leave

- **Member:** balances per leave type at the top, then a list of requests with StatusBadge (pending / approved / rejected / cancelled), and a **"Request leave"** button that opens the LeaveRequestSheet.
- **Admin, Approvals:** a list of ApprovalCards showing who else is off on those dates. One-click approve; reject asks for an optional note.

### 6.5 Onboarding

Built as one page with two cards (Phase 1); the invite step arrives with invitations (Phase 2).

1. **Your organization**: name, web address (slug suggested from the name until edited; phones
   show `/o/` only before it), timezone (detected from the browser, editable, native select).
2. **Working hours**: ScheduleEditor pre-filled with the confirmed defaults (Mon–Fri 09:00–18:00,
   8h, 15 min grace). On phones each day shows Start and End side by side with hours below, so a
   12-hour `06:00 PM` still fits; from 768 px each day is one row.
3. _(Phase 2)_ **Invite your team**: paste emails, choose a role. Can be skipped.

Errors appear under each field (`aria-invalid` + `aria-describedby`), focus moves to the first
one, and server problems that aren't about a field show in an alert above the button.

---

## 7. Accessibility (WCAG 2.1 AA)

- Status always has a **label/icon plus color**. Contrast is checked for text-on-soft and muted text in both themes.
- Visible focus: 2 px `--ring` outline, 2 px offset. Logical tab order; the Clock button is the first focusable control on the Dashboard.
- The live timer is **not** announced every second. State changes are announced once through `aria-live="polite"` (e.g. "Clocked in at 09:02").
- The AttendanceCalendar uses the grid pattern (arrow keys, Home/End, Enter opens the day). Tables use `<th scope>` and a caption.
- Dialogs and sheets trap focus and close with Escape (Radix). Forms have real labels, inline errors linked with `aria-describedby`, and specific messages ("End date can't be before start date").
- Motion respects `prefers-reduced-motion` per animation (see §2.4). Dark mode follows the OS, with a manual toggle.
- Automated accessibility checks (axe in Playwright) audit the **settled** page by emulating reduced motion, so fades can't skew contrast; a separate test proves animations run by default and none run under reduced motion.

## 8. Voice and copy

- Short, human, specific. "You're clocked in since 09:02." "8h done. Any more time counts as overtime."
- Errors say what happened and what to do next: "Couldn't clock you in. Check your connection and try again."
- No blame, no jargon (never "RPC error" or "unique violation").
