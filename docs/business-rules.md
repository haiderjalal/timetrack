# TimeTrack: Business Rules

> Status: **Draft v0.3.** Items marked **[ASSUMPTION]** are proposed defaults that need product-owner confirmation (see §10). Marked **[CONFIRMED]**: confirmed by the product owner on 2026-11-03 (§1 roles, §8 default working hours, Q1, Q2 per-day overtime, Q3, Q6, Q8, Q10).
> These rules are implemented in pure TypeScript (`src/features/attendance/services/attendanceCalculator.ts`) and covered by unit tests. Postgres only enforces the hard invariants listed in [database.md](database.md).

---

## 1. Roles and permissions

**[CONFIRMED]** as written below.

| Capability                                              | Owner |        Admin         | Member |
| ------------------------------------------------------- | :---: | :------------------: | :----: |
| Clock in / out, view own timesheet                      |  ✅   |          ✅          |   ✅   |
| Request leave, cancel own pending request               |  ✅   |          ✅          |   ✅   |
| See teammates' names and avatars                        |  ✅   |          ✅          |   ✅   |
| See everyone's attendance, live board, reports, export  |  ✅   |          ✅          |   –    |
| Approve / reject leave                                  |  ✅   | ✅ _(not their own)_ |   –    |
| Adjust time entries (with a reason)                     |  ✅   | ✅ _(not their own)_ |   –    |
| Invite members, deactivate members                      |  ✅   | ✅ _(members only)_  |   –    |
| Edit working hours, holidays, leave types, org settings |  ✅   |          ✅          |   –    |
| Promote/demote admins, transfer ownership, delete org   |  ✅   |          –           |   –    |

- An org always has **at least one active owner** (enforced in the database).
- A person can belong to **several orgs**, each with its own role. **[CONFIRMED]**
- Removing someone **deactivates** them: their history stays in reports, and they lose access immediately.

## 2. Key terms

| Term              | Definition                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Org timezone**  | IANA zone set on the org (e.g. `Asia/Karachi`). All dates, schedules and reports use it. **[CONFIRMED]** members don't have personal timezones in v1. |
| **Session**       | One clock-in → clock-out pair (`time_entries` row).                                                                                                   |
| **Work date**     | The org-local calendar date of the session's **clock-in**. A night shift from 22:00 to 06:00 counts entirely toward the day it started.               |
| **Scheduled day** | The weekday rule from the schedule version in effect on that date: working or not, start/end time, required minutes.                                  |
| **Required time** | `required_minutes` of the scheduled day (default **480 min = 8h**), adjusted for leave (§5).                                                          |
| **Worked time**   | Sum of all closed sessions on that work date. Breaks are simply the gaps between sessions.                                                            |

## 3. Clock in / clock out

1. Clock-in and clock-out times are **always set by the server** (`now()` in Postgres). The device clock is never trusted.
2. A member can have **at most one open session** per org. A second clock-in is rejected with the message "You're already clocked in."
3. A member can clock in and out **several times a day** (lunch, errands). All sessions count toward that day. **[CONFIRMED]** (Q1)
4. Clocking in is allowed **any time**, including before shift start, after shift end, on weekends and holidays. That time counts (see overtime). **[CONFIRMED]** (Q1, Q3)
5. A single session can last at most 24 hours.
6. An optional note (≤ 500 chars) can be added at clock-out.

## 4. Daily calculation

For each member and each date in a period:

```
required  = scheduled_day.required_minutes          (0 if not a working day or a holiday)
required  = adjust_for_leave(required, approved_leave)   (§5)
worked    = Σ closed sessions on that work date
overtime  = max(0, worked − required)
shortfall = required > 0 ? max(0, required − worked) : 0
late      = is_working_day && no leave covering the start
            && first_clock_in > start_time + grace_minutes
```

### Day status (first matching rule wins)

| Order | Status        | Condition                                              | Counts as                             |
| :---: | ------------- | ------------------------------------------------------ | ------------------------------------- |
|   1   | `upcoming`    | Date is after today                                    | not counted                           |
|   2   | `holiday`     | Date is an org holiday                                 | all worked time = overtime            |
|   3   | `day_off`     | Not a working day in the schedule (e.g. weekend)       | all worked time = overtime            |
|   4   | `on_leave`    | Approved **full-day** leave                            | required = 0; worked time = overtime  |
|   5   | `in_progress` | Today, and the shift hasn't ended or a session is open | shown live, not final                 |
|   6   | `absent`      | Working day, worked = 0, no full-day leave             | 1 absence                             |
|   7   | `complete`    | worked ≥ required                                      | present; overtime = worked − required |
|   8   | `short`       | 0 < worked < required                                  | present; shortfall recorded           |

**Overtime is calculated per day.** A short Monday is **not** offset by a long Tuesday; both are reported. **[CONFIRMED]** (Q2) Time worked on a day off or a holiday counts in full as overtime. **[CONFIRMED]** (Q3)

The monthly report also shows a **net balance** (overtime − shortfall) for orgs that want to offset them. **[ASSUMPTION]** (still open; needed for the Phase 4 report)

All overtime minutes count. No rounding, no minimum threshold. Durations are shown to the minute (e.g. `8h 42m`). **[ASSUMPTION]**

### Examples (schedule: Mon–Fri 09:00–18:00, 8h required, 15 min grace)

| Day | Sessions                               | Worked | Status   | Overtime | Shortfall |  Late   |
| --- | -------------------------------------- | -----: | -------- | -------: | --------: | :-----: |
| Mon | 09:05–13:00, 14:00–18:30               | 8h 25m | complete |      25m |         – |   no    |
| Tue | 09:40–17:00                            | 7h 20m | short    |        – |       40m | **yes** |
| Wed | –                                      |      0 | absent   |        – |        8h |    –    |
| Thu | half-day leave (1st half), 13:30–18:00 | 4h 30m | complete |      30m |         – |   no    |
| Sat | 10:00–13:00                            |     3h | day_off  |   **3h** |         – |    –    |

### As built (Phase 3)

- `summarizeDay()` implements the formulas and statuses above, except `holiday` and `on_leave`, which
  arrive with holidays (Phase 4) and leave (Phase 5). The worked examples in the table are its unit
  tests (Thursday's half-day leave waits for Phase 5).
- **In progress** also covers a day whose shift hasn't ended yet or that still has an open session, so
  a night shift (22:00–06:00) stays "in progress" after midnight instead of turning absent.
- Worked time is counted in whole seconds and shown in whole minutes, without rounding up, which
  matches the proposed "no rounding" default above (still to be confirmed).
- Shortfall is only counted once a day is final; a day in progress shows time to go instead.
- Period totals (the dashboard's week, the Timesheet month) leave out days still to come.

## 5. Leave

1. A member requests leave for **one day or a date range**, as **full day**, **first half** or **second half** (half days are single-date only).
2. Leave types are defined per org. Defaults: **Casual, Sick, Annual** (paid) and **Unpaid**.
3. New requests are **pending**. An owner or admin **approves or rejects** them, with an optional note. Nobody can approve their own request; an owner's own request is auto-approved. **[ASSUMPTION]**
4. Requests may be submitted up to **7 days in the past** (e.g. sick leave) and up to **365 days ahead**. **[ASSUMPTION]**
5. Pending and approved requests **cannot overlap** for the same person (enforced in the database).
6. Only **scheduled working days** inside a range count as leave days. Weekends and holidays inside the range are not consumed.
7. Effect on required time: full day → 0; half day → `required / 2`.
8. **Quota**: if a leave type has a yearly quota (calendar year), requests over the quota show a warning to the requester and reviewer but are **not blocked**. **[ASSUMPTION]**
9. Cancelling: the requester can cancel a pending request, or an approved one before it starts. After that, only an admin can change it.
10. Everyone involved is notified by email: admins on a new request, the requester on a decision.

## 6. Forgotten clock-out

A `pg_cron` job runs every 15 minutes and auto-closes stale sessions. **[CONFIRMED]** thresholds (Q6; the second row confirmed separately on 2026-11-03):

| Situation                                       | Auto-close when          | Clock-out set to | Time credited    |
| ----------------------------------------------- | ------------------------ | ---------------- | ---------------- |
| Working day, clocked in before shift end        | now > shift end + **4h** | shift end        | up to shift end  |
| Clocked in after shift end, day off, or holiday | now > clock-in + **12h** | clock-in         | 0 (needs review) |

- Auto-closed sessions get `auto_closed = true` and an audit entry, and appear in the admins' **Needs review** queue.
- The member sees a banner: _"We closed your session automatically. Ask an admin to correct it if needed."_

## 7. Corrections and edits

1. **Members cannot edit their own times.** This keeps the records trustworthy.
2. Admins and owners can **add, edit or remove** a session for someone else, and must enter a **reason**.
3. Every change writes an **audit log** entry (before/after values, who, when, why), and the member is notified.
4. **v1.1:** members can submit a _correction request_ (proposed times + note) that an admin approves with one click.

## 8. Working hours (schedules)

1. Set per weekday: working or not, start time, end time, required hours (default 8h), plus an org-wide grace period (default 15 min).
2. Default for new orgs: **Mon–Fri 09:00–18:00, 8h required, 15 min grace**, Sat/Sun off. **[CONFIRMED]** The creator can change every day during onboarding.
3. Changing hours creates a **new version effective from a chosen date** (default: today). Past days keep the rules that applied then, so reports from earlier months don't change.
4. Shifts crossing midnight are allowed (end time earlier than start time).
5. Holidays are managed as a dated list per org.

## 9. Monthly report

For a selected month (org timezone), one row per active member (plus members deactivated during that month):

| Column       | Meaning                                                 |
| ------------ | ------------------------------------------------------- |
| Working days | Scheduled working days in the month, excluding holidays |
| Present      | `complete` + `short` days                               |
| Short days   | Days with 0 < worked < required                         |
| Absent       | `absent` days                                           |
| Leave        | Leave days (paid / unpaid split; half days = 0.5)       |
| Late         | Days marked late                                        |
| Worked       | Total hours worked                                      |
| Required     | Total required hours                                    |
| Overtime     | Σ daily overtime                                        |
| Shortfall    | Σ daily shortfall                                       |
| Net          | Overtime − shortfall                                    |
| Attendance % | Present ÷ (working days − full leave days)              |
| Needs review | Count of auto-closed sessions                           |

- Clicking a member opens their **calendar view**: every day color-coded by status, with sessions listed.
- **Export to CSV** (one row per member, plus an optional per-day sheet). PDF export is planned for later.
- Members see the same breakdown for **themselves only** on their Timesheet page.

## 10. Open questions (please confirm or change)

| #   | Question                                                           | Proposed default                                               |
| --- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| Q1  | Can someone clock in/out several times a day (breaks)?             | **Yes**, all sessions are summed ✅ confirmed 2026-11-03       |
| Q2  | Is overtime counted per day, or do short days offset long days?    | **Per day** ✅ confirmed 2026-11-03; "net" column still open   |
| Q3  | Does any time worked on weekends/holidays count fully as overtime? | **Yes** ✅ confirmed 2026-11-03                                |
| Q4  | Does leave need approval? Who approves?                            | **Yes**, owner or any admin (not their own)                    |
| Q5  | Leave quotas: enforce, warn, or ignore?                            | **Warn only** in v1                                            |
| Q6  | Forgotten clock-out: auto-close rule above OK?                     | **Yes**, shift end + 4h ✅ confirmed 2026-11-03                |
| Q7  | Can members edit their own entries?                                | **No**, admins only, with a reason                             |
| Q8  | One timezone per org, or per member?                               | **Per org** ✅ confirmed 2026-11-03                            |
| Q9  | Should clock-in be restricted by location / IP / Wi-Fi?            | **No** in v1 (planned later)                                   |
| Q10 | Can a person belong to several orgs?                               | **Yes** ✅ confirmed 2026-11-03                                |
| Q11 | Do members see teammates' attendance, or only their own?           | **Only their own**; they see teammates' names and avatars only |
| Q12 | Billing / paid plans in v1?                                        | **No**, free while building                                    |
