# PROJ-4: Weekly Campaign Health Review (Layer 2)

## Status: Deployed
**Created:** 2026-03-13
**Last Updated:** 2026-03-14

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs activity metrics data
- Requires: PROJ-3 (Campaign Intelligence Snapshot) — builds on snapshot with deeper weekly analysis

## User Stories
- As a team lead, I want a structured weekly review view so that I can evaluate all campaigns in a consistent format every week
- As a campaign operator, I want to see where the outreach funnel is breaking for each workspace so that I can focus my optimization efforts
- As an account manager, I want week-over-week trend charts so that I can communicate campaign trajectory to clients
- As a team lead, I want recommended actions generated from the data so that the team knows what to prioritize

## Acceptance Criteria
- [ ] Week selector allows choosing any week with available data (Mon-Sun)
- [ ] Per-workspace weekly summary showing:
  - Campaign health status badge (green / yellow / red)
  - Connections sent → accepted (with rate)
  - Messages started → replies received (with rate)
  - Profile views and engagement actions (likes, follows)
  - Conversation depth breakdown (1-touch, 2-touch, 3+ touch)
- [ ] Funnel visualization per workspace: Connections Sent → Accepted → Messages Started → Replies
  - Each stage shows count and conversion rate to next stage
  - Highlights where the biggest drop-off occurs
- [ ] Week-over-week comparison table:
  - Current week vs. previous week for all key metrics
  - Percentage change with color coding (green = improved, red = declined)
- [ ] Sender account breakdown within each workspace (who is sending what)
- [ ] Recommended actions section listing campaigns that need intervention and why
- [ ] Export weekly review as a summary (copy-to-clipboard or PDF — future)

## Edge Cases
- What happens if a workspace has partial data for a week (e.g., started mid-week)? → Show available days with a note
- What happens if there are no replies in a given week? → Show 0% reply rate, flag as red
- What happens if a sender account has 0 activity for the entire week? → Flag as "Sender inactive" in the breakdown
- What happens if the user selects a week with no data at all? → Show "No data available for this week"
- How are weekends handled? → Excluded from daily averages but included in weekly totals

## Technical Requirements
- Performance: Weekly aggregation completes in < 3 seconds
- Charts: Line or bar charts for week-over-week trends
- Date handling: Weeks defined as Monday to Sunday

---

## Tech Design (Solution Architect)

### Page Location & Navigation

New page at `/dashboard/health` — already wired in the sidebar as "Health Review."

### Component Structure

```
Weekly Health Review Page (/dashboard/health)
├── Header (title + sidebar trigger)
├── Week Selector (dropdown: pick any Mon-Sun week with data)
├── Summary Bar (aggregate stats for selected week across all workspaces)
│   ├── Total Connections Sent
│   ├── Avg Acceptance Rate
│   ├── Total Messages Started
│   ├── Avg Reply Rate
│   └── Total Replies
├── Week-over-Week Comparison Table
│   ├── Row per workspace
│   ├── Current week vs. previous week for each metric
│   └── % change with color coding (green = improved, red = declined)
├── Per-Workspace Sections (expandable cards)
│   ├── Health Status Badge (green / yellow / red)
│   ├── Funnel Visualization (Recharts)
│   │   └── Connections Sent → Accepted → Messages Started → Replies
│   │       (each stage: count + conversion rate, biggest drop-off highlighted)
│   ├── Engagement Metrics (profile views, follows)
│   ├── Sender Breakdown Table (derived from conversations)
│   │   └── Rows: sender_name | conversations count | replies | last active
│   └── Recommended Actions (from active intervention flags for that workspace)
└── Empty / Partial Data States
    ├── No data for selected week → "No data available" message
    └── Partial week → "Data covers X of 7 days" note
```

### Data Model

No new database tables needed. Everything is derived from existing data:

- **`daily_metrics`** — core metrics (connections, messages, replies, rates, profile views, follows) per workspace per day. Aggregated by Mon-Sun week.
- **`conversations`** — has `sender_name`, `workspace`, `last_message_at`, `is_inbound_reply`. Used to approximate sender-level activity within a week.
- **`intervention_flags`** (PROJ-8) — active flags provide the "recommended actions" section.

Week definition: Monday to Sunday. The API accepts a `week_start` parameter (a Monday date) and aggregates 7 days of data.

### New API Endpoint

**`GET /api/campaigns/weekly-review`**

Parameters:
- `week_start` (required) — Monday date in YYYY-MM-DD format
- `workspace` (optional) — filter to a single workspace

Returns:
- Available weeks (list of Mondays that have data)
- Per-workspace weekly summaries with health status
- Current week metrics + previous week metrics + percentage change
- Funnel data (connections sent → accepted → messages started → replies, with conversion rates)
- Sender breakdown (from conversations table)
- Active intervention flags per workspace

### Reusable Components

Existing components reused as-is:
- `health-badge.tsx` — health status badges (green/yellow/red)
- `trend-arrow.tsx` — trend direction indicators
- shadcn/ui: Card, Table, Select, Badge, Skeleton, Tabs

New components to build:
- `week-selector.tsx` — dropdown listing available weeks
- `weekly-review.tsx` — main orchestrator component
- `weekly-summary-bar.tsx` — aggregate summary for the selected week
- `wow-comparison-table.tsx` — week-over-week comparison table
- `workspace-weekly-card.tsx` — expandable per-workspace detail
- `funnel-chart.tsx` — Recharts-based horizontal funnel visualization
- `sender-breakdown-table.tsx` — sender activity within a workspace/week

### Tech Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Charting library | Recharts | Composable React components, works naturally with shadcn/ui, lightweight, great docs |
| Week aggregation | Server-side (API route) | Keeps client thin, same pattern as existing snapshot API |
| Available weeks | Derived from daily_metrics dates | No new table needed — query distinct weeks |
| Sender breakdown | Derived from conversations table | Approximation using sender_name + conversation counts. Known limitation: no per-sender connection/message counts |
| Recommended actions | Pull from intervention_flags | PROJ-8 flags already identify problems + reasons |
| WoW comparison | Previous Mon-Sun week | Always compare to immediately preceding week |

### Dependencies to Install

| Package | Purpose |
|---------|---------|
| recharts | Funnel and bar chart visualizations |

### Known Limitations

1. **Sender breakdown is approximate** — derived from conversations, not per-sender daily metrics. Accurate for "who is active" but won't show per-sender connection/acceptance rates.
2. **Export (copy/PDF)** — marked as future in spec. Not included in this design round.

## Implementation Notes (Frontend)

### Components Built
All 7 new components from the tech design plus 3 state components:

- `week-selector.tsx` — Select dropdown listing available Mon-Sun weeks with human-readable labels (e.g., "Mar 3 - Mar 9, 2026")
- `weekly-review.tsx` — Main orchestrator: manages loading/error/empty states and composes all child components
- `weekly-summary-bar.tsx` — 5-card summary grid (connections sent, avg acceptance rate, messages started, avg reply rate, total replies)
- `wow-comparison-table.tsx` — Full table with all workspaces, health badge, current metrics, and color-coded % change columns
- `workspace-weekly-card.tsx` — Collapsible card per workspace with key metrics visible by default; expanded view shows engagement metrics, funnel chart, sender breakdown, and recommended actions
- `funnel-chart.tsx` — Recharts horizontal bar chart showing 4-stage funnel (Connections Sent -> Accepted -> Messages Started -> Replies) with conversion rates and biggest drop-off callout
- `sender-breakdown-table.tsx` — Table of sender activity with conversation count, reply count, last active date, and active/inactive badge
- `weekly-review-loading.tsx` — Skeleton loading state matching the full page layout
- `weekly-review-empty.tsx` — Empty state with CTA to import CSV data
- `weekly-review-error.tsx` — Error state with retry button

### API Endpoint
`GET /api/campaigns/weekly-review` — Server-side aggregation from `daily_metrics`, `conversations`, and `intervention_flags` tables. Returns available weeks, per-workspace summaries with WoW changes, funnel data, sender breakdown, and active flags.

### Hook
`use-weekly-review.ts` — Manages fetch state, selected week, and re-fetching on week change.

### Types
`src/lib/types/weekly-review.ts` — Full TypeScript types for the API response including FunnelStage, SenderBreakdown, WowChange, WorkspaceWeeklySummary, and WeeklyReviewResponse.

### Reused Components
- `health-badge.tsx` (green/yellow/red status badges)
- shadcn/ui: Card, Table, Select, Badge, Skeleton, Collapsible, Separator, Button
- Lucide icons: Calendar, Link2, Mail, MessageSquare, BarChart3, Users, ChevronDown, AlertTriangle, etc.

### Dependencies Added
- `recharts` — for funnel bar chart visualization

### Deviations from Spec
- **Conversation depth breakdown** (1-touch, 2-touch, 3+ touch) from acceptance criteria is not implemented — the current data model does not track conversation depth. This would require additional data enrichment.
- **Export (copy-to-clipboard or PDF)** is explicitly marked as future in the spec and not included.
- Used Collapsible (Radix) for expandable workspace cards instead of a custom expand/collapse implementation.

## QA Test Results

**QA Date:** 2026-03-14
**Build:** PASS | **Lint:** PASS | **TypeScript:** PASS

### Acceptance Criteria
| Criteria | Result |
|----------|--------|
| Week selector (Mon-Sun with available data) | PASS |
| Health status badge (green/yellow/red) | PASS |
| Connections sent → accepted (with rate) | PASS |
| Messages started → replies (with rate) | PASS |
| Profile views and engagement (follows) | PASS |
| Conversation depth breakdown (1-touch, 2-touch, 3+) | SKIP — documented deviation, data model lacks depth tracking |
| Funnel visualization with conversion rates | PASS |
| Biggest drop-off highlighted | PASS |
| WoW comparison table with % change + color coding | PASS |
| Sender account breakdown | PASS |
| Recommended actions from intervention flags | PASS |
| Export (copy/PDF) | SKIP — marked as future |

### Edge Cases
| Edge Case | Result |
|-----------|--------|
| Partial week data | PASS — shows "X of 7 days" note |
| No replies in a week | PASS — shows 0% reply rate |
| Sender with 0 activity for the week | PASS (fixed) — now detects inactive senders by cross-referencing all-time sender list |
| Week with no data | PASS — shows empty state message |
| No data uploaded at all | PASS — empty state with CTA to import CSV |

### Security Audit
| Check | Result |
|-------|--------|
| Auth check on API | PASS |
| SQL injection | PASS — Supabase parameterizes queries |
| XSS | PASS — no raw HTML rendering |
| Error message leakage | LOW RISK — Supabase error messages exposed to client, acceptable for internal 3-person team |

### Bugs Found & Fixed
1. **BUG (LOW): Dead code in `formatChange`** — `wow-comparison-table.tsx:29-31` had identical `isPercent` ternary branches. **Fixed:** removed dead branching.
2. **BUG (LOW): `isInactive` always false** — `route.ts:448` set `isInactive: data.count === 0` which was unreachable since senders only appear if they have conversations. **Fixed:** added cross-reference query to detect truly inactive senders (known from other weeks but no activity in selected week).
3. **BUG (MEDIUM): Rate calculation inaccuracy** — `route.ts:339-380` averaged pre-computed daily rates instead of computing `totalAccepted/totalSent*100`. This gave misleading results when daily volumes varied. **Fixed:** now computes rates from weekly totals.
4. **BUG (LOW): No row limit on conversations query** — `route.ts:215-218` could silently truncate at Supabase default limit. **Fixed:** added `.limit(5000)` to both conversation queries.

### Overall Assessment
**PASS** — All acceptance criteria met (with 2 documented deviations). 4 bugs found and fixed. Security posture is appropriate for an internal team tool. Ready for deployment.

## Deployment

- **Production URL:** https://ninjai-dashboard-office-monstera-sols-projects.vercel.app/dashboard/health
- **Deployed:** 2026-03-14
- **Vercel Build:** PASS (1m build time)
- **Git Tag:** v1.4.0-PROJ-4
