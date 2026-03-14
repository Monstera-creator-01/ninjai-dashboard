# PROJ-8: Campaign Intervention Flag System (Layer 6)

## Status: Deployed
**Created:** 2026-03-13
**Last Updated:** 2026-03-14

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs activity metrics data
- Requires: PROJ-3 (Campaign Intelligence Snapshot) — shares health thresholds

## User Stories
- As a team lead, I want an early warning system that flags underperforming campaigns so that problems are caught before they worsen
- As a campaign operator, I want to see exactly which metric triggered a flag so that I know what to investigate
- As a team member, I want to dismiss or acknowledge flags so that resolved issues don't keep cluttering the view
- As a team lead, I want to configure flag thresholds so that sensitivity matches our campaign standards

## Flag Types & Default Thresholds

| Flag | Condition | Severity |
|------|-----------|----------|
| Low connection acceptance | Acceptance rate < 8% over 7 days | High |
| Low reply rate | Reply rate < 5% over 7 days | High |
| Activity drop | Connections sent dropped > 50% vs. previous week | High |
| Sender inactive | A sender account has 0 activity for 3+ days (weekdays) | Medium |
| High rejection pattern | > 30% of replies tagged as "Not interested" or "Wrong person" | Medium |
| Declining trend | Key metrics declining for 3+ consecutive weeks | Medium |
| No replies | 0 inbound replies over 7 days despite active messaging | High |

## Acceptance Criteria
- [ ] Flag notification panel accessible from all dashboard pages (bell icon or sidebar)
- [ ] Active flags displayed with:
  - Workspace name
  - Flag type and severity (High / Medium)
  - Metric value that triggered the flag
  - Date flag was created
  - Link to relevant dashboard view for investigation
- [ ] Flags auto-generated when new data is uploaded (checked on CSV import)
- [ ] Flag states: Active → Acknowledged → Resolved
  - Acknowledged: team member has seen it, optionally added a note
  - Resolved: metric has recovered above threshold OR manually dismissed
- [ ] Auto-resolve: flags automatically clear when the metric recovers above threshold in next upload
- [ ] Flag history log showing all past flags with resolution notes
- [ ] Configurable thresholds: team lead can adjust threshold values per flag type
- [ ] Dashboard badge showing count of active flags
- [ ] Flags sorted by severity (High first) then by date

## Edge Cases
- What happens if a workspace is new and has < 7 days of data? → Don't generate flags until 7 days of data exist
- What happens if the same flag triggers on consecutive uploads? → Don't create duplicate flags; update existing flag's date
- What happens if all flag types are disabled? → Show "All flags disabled" message in settings
- What happens if 10+ flags are active simultaneously? → Paginate or collapse by workspace
- What happens if thresholds are set to unrealistic values (e.g., 0%)? → Show warning but allow it

## Technical Requirements
- Performance: Flag evaluation runs in < 2 seconds per upload
- Storage: Flags stored in Supabase `flags` table
- Real-time: Flags update immediately after CSV upload completes

---

## Tech Design (Solution Architect)

### Component Structure

```
Dashboard Layout (existing)
├── Sidebar (existing — "Interventions" link already wired)
│   └── Flag Count Badge (NEW — shows active flag count next to bell icon)
│
├── Interventions Page (/dashboard/interventions)
│   ├── Flag Summary Bar
│   │   ├── Active Flags Count (High severity)
│   │   ├── Active Flags Count (Medium severity)
│   │   └── Acknowledged Flags Count
│   │
│   ├── Flag Filter Bar
│   │   ├── Status Filter (Active / Acknowledged / All)
│   │   ├── Severity Filter (High / Medium / All)
│   │   └── Workspace Filter (reuse existing WorkspaceFilter)
│   │
│   ├── Flag List (sorted: High first, then by date)
│   │   └── Flag Card (repeating)
│   │       ├── Severity Badge (High = red, Medium = amber)
│   │       ├── Workspace Name
│   │       ├── Flag Type (human-readable label)
│   │       ├── Metric Value that triggered
│   │       ├── Date Created
│   │       ├── "View Campaign" link → /dashboard/campaigns/[workspace]
│   │       ├── "Acknowledge" button → opens note dialog
│   │       └── "Dismiss" button → resolves manually
│   │
│   └── Empty State (no active flags — "All clear!" message)
│
├── Flag History Tab (/dashboard/interventions?tab=history)
│   └── Table of resolved/dismissed flags with:
│       ├── Resolution type (auto-resolved / manually dismissed)
│       ├── Resolution note
│       └── Date resolved
│
└── Flag Settings Page (/dashboard/interventions/settings)
    └── Threshold Configuration Table
        └── Per flag type row:
            ├── Flag name + description
            ├── Current threshold value (editable input)
            ├── Enabled/Disabled toggle
            └── Save button
```

### Data Model

**New table: `flags`**

Each flag has:
- Unique ID
- Workspace name (which campaign)
- Flag type (e.g., "low_acceptance", "low_reply", "activity_drop", etc.)
- Severity (High or Medium)
- Triggered metric value (the actual number, e.g., "3.2%")
- Threshold value at time of trigger (e.g., "8%")
- Status (Active → Acknowledged → Resolved)
- Acknowledged by (which user, optional)
- Acknowledgment note (optional text)
- Resolved at (timestamp, optional)
- Resolution type ("auto" or "manual")
- Created at (when flag was generated)
- Updated at

Unique constraint: (workspace, flag_type, status='Active') — prevents duplicate active flags for same workspace + type

**New table: `flag_thresholds`**

Each threshold configuration has:
- Unique ID
- Flag type (matches the 7 flag types from the spec)
- Display name (human-readable label)
- Threshold value (the number to compare against)
- Comparison period in days (e.g., 7 days)
- Severity (High or Medium — default from spec)
- Enabled (true/false toggle)
- Updated by (which user last changed it)
- Updated at

Pre-seeded with the 7 default thresholds from the spec.

### Flag Evaluation Flow

```
1. User uploads CSV via /dashboard/import
       ↓
2. Import API processes CSV → writes to daily_metrics or conversations
       ↓
3. After successful import → trigger flag evaluation
       ↓
4. Flag evaluation API:
   a. Read current thresholds from flag_thresholds table
   b. For each workspace with data:
      - Query last 7 days of daily_metrics
      - Query previous 7 days for trend comparison
      - Check each enabled flag condition against thresholds
      - If condition met AND no active flag exists → create new flag
      - If condition met AND active flag exists → update timestamp
      - If condition NOT met AND active flag exists → auto-resolve it
       ↓
5. Return flag evaluation results to import response
       ↓
6. Dashboard badge updates to show new flag count
```

### Flag Lifecycle

```
  [Metric drops below threshold]
          ↓
      ACTIVE  ──── User clicks "Acknowledge" ───→  ACKNOWLEDGED
          │                                              │
          │    [Metric recovers on next upload]          │
          ↓                                              ↓
     AUTO-RESOLVED                              User clicks "Dismiss"
                                                         ↓
                                                    RESOLVED
```

### Tech Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Flag evaluation trigger | Run inside the import API after CSV processing | Keeps it synchronous — user sees flags immediately after upload. No background job infrastructure needed for a 3-person team. |
| Threshold storage | Database table (not hardcoded) | Spec requires configurable thresholds. Storing in DB lets team lead adjust without code changes. |
| Flag deduplication | Unique constraint on (workspace, flag_type) for active flags | Prevents the "duplicate flags on consecutive uploads" edge case from the spec. |
| Auto-resolve | Check on every import | When the metric recovers, the flag clears automatically — no manual cleanup needed. |
| Shared health logic | Extract existing threshold computation from snapshot/detail routes into a shared utility | The snapshot route already computes health status using the same kind of thresholds. Extracting this avoids duplication and keeps flag logic consistent with dashboard colors. |
| Settings access | Available to all roles, but only team_lead can edit | Matches existing role system. Operators and AMs can see thresholds but not change them. |
| Flag count in sidebar | Fetched via lightweight API call on layout mount | Shows badge count without loading full flag data. Cached with same pattern as snapshot hook. |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/flags` | GET | List flags with filters (status, severity, workspace) |
| `/api/flags` | PATCH | Acknowledge or dismiss a flag (by ID) |
| `/api/flags/evaluate` | POST | Run flag evaluation for all workspaces (called after import) |
| `/api/flags/count` | GET | Return count of active flags (for sidebar badge) |
| `/api/flags/thresholds` | GET | Get all threshold configurations |
| `/api/flags/thresholds` | PATCH | Update a threshold value or enabled state (team_lead only) |

### Page Routes

| Route | Purpose |
|-------|---------|
| `/dashboard/interventions` | Active flags list with filters |
| `/dashboard/interventions?tab=history` | Resolved/dismissed flag history |
| `/dashboard/interventions/settings` | Threshold configuration (team_lead editable) |

### Dependencies

No new packages needed. All UI uses existing shadcn/ui components (Badge, Card, Table, Switch, Dialog, Tabs, Input). All data fetching follows existing patterns.

### Reused Components

- **HealthBadge** → repurposed for severity badges
- **WorkspaceFilter** → same workspace filtering pattern
- **Sidebar** → "Interventions" link already exists, just needs the badge
- **Health threshold logic** → extracted from snapshot/detail routes into shared utility
- **useCampaignSnapshot pattern** → new useFlags hook follows same fetch/cache pattern
- **RLS policy pattern** → same "authenticated users can read" approach

### Edge Case Handling

| Edge Case | Solution |
|-----------|----------|
| Workspace with < 7 days of data | Skip flag evaluation — not enough data to flag |
| Same flag triggers on consecutive uploads | Update existing flag's timestamp, don't create duplicate |
| All flag types disabled | Show "All flags disabled" message on interventions page |
| 10+ active flags | Paginate with 10 per page |
| Unrealistic threshold values (e.g., 0%) | Show warning toast but allow saving |
| No data uploaded yet | Interventions page shows empty state |

## Implementation Notes (Frontend)

### Files Created
- `src/lib/types/flags.ts` — Type definitions for flags, thresholds, severity, status, filters, and API responses
- `src/hooks/use-flags.ts` — Hooks: `useFlags` (fetch flags with filters/pagination), `useFlagCount` (sidebar badge count), `useFlagActions` (acknowledge/dismiss)
- `src/hooks/use-flag-thresholds.ts` — Hooks: `useFlagThresholds` (fetch threshold config), `useUpdateThreshold` (save threshold changes)
- `src/components/severity-badge.tsx` — Severity badge (High=red, Medium=amber), follows HealthBadge pattern
- `src/components/flag-summary-bar.tsx` — Summary cards showing active high/medium/acknowledged counts
- `src/components/flag-filter-bar.tsx` — Filter bar with status, severity, and workspace dropdowns
- `src/components/flag-card.tsx` — Individual flag card with workspace, type, metric values, acknowledge/dismiss actions
- `src/components/flag-list.tsx` — Paginated list of flag cards
- `src/components/flag-history-table.tsx` — Table view for resolved/dismissed flags with resolution details
- `src/components/flag-empty-state.tsx` — Empty states: all clear, no data, all flags disabled
- `src/components/flag-loading-skeleton.tsx` — Loading skeleton for flags page
- `src/components/flag-error-state.tsx` — Error state with retry button
- `src/components/acknowledge-flag-dialog.tsx` — Dialog to acknowledge a flag with optional note
- `src/components/threshold-settings.tsx` — Threshold configuration table with editable values and enabled toggles
- `src/components/intervention-flags.tsx` — Main orchestrator component with tabs (Active/History), filters, and flag actions
- `src/components/sidebar-flag-badge.tsx` — Badge showing active flag count in sidebar
- `src/app/dashboard/interventions/page.tsx` — Interventions page with settings link
- `src/app/dashboard/interventions/settings/page.tsx` — Threshold settings page (team_lead can edit, others view-only)

### Files Modified
- `src/components/app-sidebar.tsx` — Added SidebarFlagBadge import, changed Interventions nav item to `exact: false` to match settings sub-route, added badge component

### Design Decisions
- Followed existing patterns: useCampaignSnapshot hook pattern, HealthBadge component pattern, page layout pattern
- All components use shadcn/ui primitives (Badge, Card, Table, Tabs, Dialog, Switch, Input, Select, Button, Skeleton)
- Responsive design with grid breakpoints matching existing components
- All icons use `aria-hidden="true"`, interactive elements have `aria-label`
- Settings page is a server component that checks user role via Supabase before rendering

## Implementation Notes (Backend)

### Database Migration
- `supabase/migrations/20260314_create_flags_tables.sql` — Creates `flags` and `flag_thresholds` tables with:
  - RLS enabled on both tables
  - SELECT/INSERT/UPDATE policies for authenticated users on `flags`
  - SELECT for all authenticated users + UPDATE restricted to team_lead on `flag_thresholds`
  - Partial unique index on `flags(workspace, flag_type) WHERE status IN ('active', 'acknowledged')` to prevent duplicate active flags
  - Indexes on status, workspace, severity, created_at, and composite status+severity
  - 7 default threshold rows pre-seeded: `low_acceptance`, `low_reply`, `activity_drop`, `sender_inactive` (disabled), `high_rejection` (disabled), `declining_trend`, `no_replies`

### Files Created
- `src/lib/flag-evaluation.ts` — Core flag evaluation engine with functions for each flag type
- `src/app/api/flags/route.ts` — GET (list flags with filters/pagination/summary) + PATCH (acknowledge/dismiss)
- `src/app/api/flags/count/route.ts` — GET (active flag count for sidebar badge)
- `src/app/api/flags/evaluate/route.ts` — POST (run flag evaluation, callable manually or after import)
- `src/app/api/flags/thresholds/route.ts` — GET (list thresholds) + PATCH (update threshold, team_lead only)

### Files Modified
- `src/app/api/import/route.ts` — Added flag evaluation call after successful activity_metrics CSV import. Flag evaluation runs synchronously so users see flags immediately. Errors in flag evaluation do not fail the import.

### API Design Decisions
- Any authenticated user can acknowledge/dismiss flags (no role restriction per user's requirement)
- Only team_lead can edit thresholds (both API-level check and RLS defense-in-depth)
- `sender_inactive` and `high_rejection` flag types are stored as thresholds but disabled by default — they require per-sender activity data and reply categorization data respectively, which are not yet available in daily_metrics
- Flag evaluation is idempotent: re-running it on the same data state produces the same result
- Auto-resolve: when a metric recovers above threshold, the corresponding active/acknowledged flag is automatically resolved with resolution_type='auto'
- All PATCH endpoints use Zod validation for input
- Rate limiting on flag evaluation (5/min per user) and inherited rate limiting on import
- Admin client used for flag writes to bypass RLS for the evaluation engine (runs server-side only)

### Flag Evaluation Logic
- `low_acceptance`: average acceptance rate over N days < threshold
- `low_reply`: average reply rate over N days < threshold
- `activity_drop`: connections sent dropped > threshold% vs previous period
- `no_replies`: zero replies with active messaging over N days
- `declining_trend`: acceptance rate or reply rate declining for N consecutive weeks
- Workspaces with fewer than `comparison_period_days` of data are skipped (edge case from spec)

## QA Test Results

**Tested:** 2026-03-14
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)

### Build & Lint Verification
- [x] `npm run build` passes with zero errors -- all routes compiled successfully
- [x] `npm run lint` passes with zero warnings or errors
- [x] All PROJ-8 routes appear in the build output: `/api/flags`, `/api/flags/count`, `/api/flags/evaluate`, `/api/flags/thresholds`, `/dashboard/interventions`, `/dashboard/interventions/settings`

### Acceptance Criteria Status

#### AC-1: Flag notification panel accessible from all dashboard pages (bell icon or sidebar)
- [x] Interventions link present in sidebar navigation (AlertTriangle icon)
- [x] SidebarFlagBadge component shows active flag count next to the Interventions nav item
- [x] Badge uses `useFlagCount` hook to fetch from `/api/flags/count`
- [x] Badge auto-hides when count is 0 or loading
- [x] Sidebar `exact: false` ensures active highlight on settings sub-route
- [x] Badge accessible via `aria-label` with count and pluralization

#### AC-2: Active flags displayed with required information
- [x] Workspace name displayed in CardTitle
- [x] Flag type displayed via human-readable label from `FLAG_TYPE_LABELS`
- [x] Severity badge shown (High=red, Medium=amber) via SeverityBadge component
- [x] Metric value that triggered the flag displayed ("Triggered at: X")
- [x] Threshold value displayed ("Threshold: Y")
- [x] Date flag was created shown with relative format (and full date on hover via title attr)
- [x] "View Campaign" link goes to `/dashboard/campaigns/[workspace]` with proper encoding
- [x] "Acknowledge" button available for active flags (hidden for acknowledged flags)
- [x] "Dismiss" button available for all non-resolved flags

#### AC-3: Flags auto-generated when new data is uploaded (checked on CSV import)
- [x] Import route (`/api/import`) calls `evaluateFlags(adminClient)` after successful activity_metrics upload (line 393)
- [x] Flag evaluation runs synchronously so user sees flags immediately
- [x] Flag evaluation errors do not fail the import (wrapped in try/catch, line 394-397)
- [x] Flag evaluation results included in import response as `flagEvaluation` field
- [x] Only runs on activity_metrics CSV type (not conversation_data)

#### AC-4: Flag states: Active -> Acknowledged -> Resolved
- [x] Active flags can be acknowledged (PATCH with action=acknowledge)
- [x] Only active flags can be acknowledged (server validates status check, line 180)
- [x] Acknowledged flags show visual distinction (blue-50 bg, blue border, "Acknowledged" badge)
- [x] Acknowledge dialog allows optional note with Textarea
- [x] Already-resolved flags cannot be dismissed again (server validates, line 208)
- [x] Dismiss sets status to "resolved" with resolution_type "manual"

#### AC-5: Auto-resolve when metric recovers
- [x] In `evaluateFlags`, if condition NOT met AND active flag exists, flag is auto-resolved (line 268-286)
- [x] Auto-resolved flags get `resolution_type: "auto"` and `resolved_at` timestamp
- [x] Works for both "active" and "acknowledged" status flags (query uses `.in("status", ["active", "acknowledged"])`)

#### AC-6: Flag history log showing all past flags with resolution notes
- [x] History tab accessible via Tabs component in interventions page
- [x] FlagHistoryTable shows: Workspace, Flag Type, Severity, Triggered Value, Resolution type (Auto-resolved/Manually dismissed), Note, Created date, Resolved date
- [x] Resolution type displayed with color-coded badges (green for auto, gray for manual)
- [x] Empty state shown when no resolved flags exist
- [x] Pagination available for history view

#### AC-7: Configurable thresholds (team_lead can adjust)
- [x] Settings page at `/dashboard/interventions/settings`
- [x] Server component checks user role before rendering
- [x] `canEdit` prop controls editability of inputs and switches
- [x] Non-team_lead users see read-only values
- [x] team_lead users see editable Input fields and Switch toggles
- [x] Save button per row, disabled until changes are made
- [x] API-level role check for PATCH endpoint (line 78 of thresholds/route.ts)
- [x] RLS defense-in-depth: only team_lead can update thresholds in database
- [x] Zod validation: threshold_value must be 0-999, id must be UUID

#### AC-8: Dashboard badge showing count of active flags
- [x] `/api/flags/count` returns count of flags with `status = 'active'`
- [x] SidebarFlagBadge renders count, caps at "99+" for large numbers
- [x] Badge counts "active" flags only (acknowledged flags excluded by design -- they've been seen)

#### AC-9: Flags sorted by severity (High first) then by date
- [x] API sorts by `severity ascending` ("high" < "medium" alphabetically) then `created_at descending`
- [x] Sort order is correct: High severity flags appear before Medium

### Edge Cases Status

#### EC-1: Workspace with < 7 days of data
- [x] Handled correctly: `evaluateFlags` skips evaluation when `currentRows.length < comparison_period_days` (line 201)

#### EC-2: Same flag triggers on consecutive uploads
- [x] Handled correctly: if active flag already exists, timestamp and triggered_value are updated (line 222-239)
- [x] Partial unique index prevents duplicate active flags at database level (migration line 28-30)
- [x] Race condition handled: unique constraint violation (error code 23505) counted as an update (line 255)

#### EC-3: All flag types disabled
- [x] FlagEmptyState component has `allDisabled` prop with proper UI
- [x] FIXED: InterventionFlags now fetches thresholds via `useFlagThresholds` and passes `allDisabled` prop when all thresholds are disabled

#### EC-4: 10+ flags active simultaneously
- [x] Pagination implemented with 10 flags per page
- [x] Page navigation with Previous/Next buttons
- [x] Proper "Showing X to Y of Z flags" display

#### EC-5: Unrealistic threshold values (e.g., 0%)
- [x] Warning icon shown when threshold is set to 0 (AlertCircle with amber color and title text)
- [x] Value is still allowed to be saved (warning only, not blocking)
- [x] Zod validation allows 0 (min: 0)

#### EC-6: No data uploaded yet
- [x] FlagEmptyState shows "No Data Uploaded Yet" with link to import page when `hasData` is false

### Security Audit Results

#### Authentication
- [x] All API endpoints verify authentication via `supabase.auth.getUser()`
- [x] Middleware redirects unauthenticated users from `/dashboard/*` to `/login`
- [x] 401 returned for unauthenticated API requests

#### Authorization
- [x] Threshold updates restricted to `team_lead` role at API level
- [x] RLS policy on `flag_thresholds` restricts UPDATE to `team_lead`
- [x] Settings page determines `canEdit` via server-side role check
- [x] Any authenticated user can acknowledge/dismiss flags (correct per spec)
- [x] No DELETE policy on flags table (flags never deleted)

#### Input Validation
- [x] Flag action body validated with Zod (id=UUID, action=enum, note=max 500 chars)
- [x] Threshold update body validated with Zod (id=UUID, threshold_value=0-999, enabled=boolean)
- [x] Flag ID validated as UUID format
- [x] FIXED: Note textarea has `maxLength={500}` with character counter

#### SQL Injection / XSS
- [x] All database queries use Supabase parameterized queries (no raw SQL)
- [x] No `dangerouslySetInnerHTML` or `innerHTML` usage anywhere
- [x] No `eval()` or `new Function()` usage
- [x] Workspace names displayed via React text nodes (auto-escaped)
- [x] Note text displayed via React text nodes (auto-escaped)

#### Rate Limiting
- [x] Flag evaluation endpoint rate-limited: 5 requests per minute per user
- [x] Import endpoint rate-limited: 10 requests per minute per user
- [x] Rate limiter uses sliding window with cleanup (memory-safe)

#### Secrets & Data Exposure
- [x] Service role key only used in `admin.ts` (server-side only)
- [x] No secrets exposed in client-side code
- [x] Admin client uses `autoRefreshToken: false, persistSession: false`
- [x] Security headers configured: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, HSTS

#### IDOR (Insecure Direct Object Reference)
- [x] Flag IDs are UUIDs (not guessable sequential integers)
- [x] RLS policies enforce authenticated-only access
- [x] Admin client used server-side only for flag evaluation writes
- [x] Any authenticated user can modify any flag (by design -- 3-person internal team)

### Regression Testing

#### PROJ-1 (Authentication) Regression
- [x] Sidebar still renders correctly with new SidebarFlagBadge
- [x] `flex-1` on nav item text does not break sidebar layout for non-Interventions items
- [x] No changes to auth flow or middleware

#### PROJ-2 (CSV Data Import) Regression
- [x] Import route modified minimally: flag evaluation added after successful upload (lines 387-398)
- [x] Flag evaluation failure does not block import success (try/catch)
- [x] Import response now includes `flagEvaluation` field (additive, non-breaking)
- [x] Existing import validation, parsing, and upsert logic untouched

#### PROJ-3 (Campaign Intelligence Snapshot) Regression
- [x] No files from PROJ-3 were modified
- [x] Snapshot route, hooks, and components untouched
- [x] Campaign detail route untouched

### Bugs Found

#### BUG-1: NaN propagation in pagination parameters — FIXED
- **Severity:** Medium
- **Fix:** Added explicit `Number.isNaN()` check with fallback defaults in `/api/flags` route. Non-numeric `page` defaults to 1, non-numeric `pageSize` defaults to 10.

#### BUG-2: Both Active and History API calls fire simultaneously regardless of active tab
- **Severity:** Low
- **Steps to Reproduce:**
  1. Navigate to `/dashboard/interventions`
  2. Observe network tab: two `/api/flags` requests fire immediately (one for active, one for history)
  3. When any filter changes, both queries re-execute even if user only views one tab
- **Expected:** Only the active tab's data should be fetched initially; the other should lazy-load when the tab is selected
- **Actual:** Both tabs fetch data simultaneously on every filter change
- **Priority:** Nice to have (performance optimization)

#### BUG-3: Sidebar badge only counts "active" flags, excludes "acknowledged" flags
- **Severity:** Low
- **Steps to Reproduce:**
  1. Have flags in "acknowledged" status
  2. Observe sidebar badge count from `/api/flags/count`
  3. The count only includes `status = 'active'`, not acknowledged flags
- **Expected:** Depending on intent, the badge could include both active and acknowledged flags to show "total non-resolved" count, which better represents "items needing attention"
- **Actual:** Only pure "active" flags are counted; acknowledged flags are excluded from the badge
- **Note:** This may be intentional design -- acknowledged flags have been seen by someone and may not need badge visibility. Flagging for product decision.
- **Priority:** Nice to have (product decision)

#### BUG-4: "All flags disabled" empty state never shown — FIXED
- **Severity:** Medium
- **Fix:** `InterventionFlags` now imports `useFlagThresholds`, computes `allFlagsDisabled = thresholds.length > 0 && thresholds.every(t => !t.enabled)`, and passes `allDisabled` prop to `FlagEmptyState`.

#### BUG-5: Acknowledge note textarea missing client-side maxLength — FIXED
- **Severity:** Low
- **Fix:** Added `maxLength={500}` attribute to Textarea and a `{note.length}/500` character counter below it in `AcknowledgeFlagDialog`.

#### BUG-6: ThresholdRow hasChanges state can desync from actual values
- **Severity:** Low
- **Steps to Reproduce:**
  1. As team_lead, go to settings
  2. Change a threshold value (e.g., from 8 to 10)
  3. Click Save -- threshold updates successfully
  4. The `hasChanges` state is set to `false` but the component state `value` is still "10" while `threshold.threshold_value` from props is still 8 (stale until refetch completes)
  5. After refetch, the component re-renders with new prop, but the local `useState` value may not update since `useState(String(threshold.threshold_value))` only runs on initial mount
- **Expected:** After a successful save and refetch, the local state should sync with the new prop value
- **Actual:** Local `useState` initializer only runs once on mount. After refetch, the prop changes but the local state retains the old value. However, since the value IS the new value (user just typed it), this is typically not visible. The real issue surfaces if the user saves, then the refetch returns a different value (e.g., server rounds the number), causing a desync.
- **Priority:** Nice to have

#### BUG-7: declining_trend comparison_period_days displayed as "21 days" but logic uses threshold_value (3 weeks)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Go to `/dashboard/interventions/settings`
  2. Observe "Declining Trend" row shows "21 days" in the Period column
  3. The actual logic in `evaluateDecliningTrend` uses `thresholdValue` (3) as "consecutive weeks required" and ignores `comparisonPeriodDays`
- **Expected:** The Period column should show "3 weeks" or the description should clarify that the threshold_value represents consecutive declining weeks
- **Actual:** "21 days" is technically correct (21 days = 3 weeks of data needed) but could confuse users who think it means "evaluate over a 21-day window"
- **Priority:** Nice to have (UX clarity)

### Cross-Browser Testing Notes
- Code review shows standard React/Next.js rendering with shadcn/ui components and Tailwind CSS
- No browser-specific APIs used (no `window.crypto`, no `ResizeObserver`, no `IntersectionObserver`)
- All icons use Lucide React (SVG-based, cross-browser compatible)
- Flexbox and Grid layouts used are well-supported across Chrome, Firefox, and Safari
- Note: Manual browser testing not possible in this environment; recommendations based on code review

### Responsive Testing Notes
- Grid layout `sm:grid-cols-3` on summary bar adapts from 1 column (mobile) to 3 columns (sm+)
- Filter bar uses `flex-col` on mobile, `sm:flex-row` on tablet/desktop
- Flag cards use full width with appropriate padding
- History table may have horizontal scroll issues on mobile (375px) due to 8 columns -- recommend testing
- Pagination controls stack properly with `flex items-center justify-between`

### Summary (QA Pass 2 — 2026-03-14)
- **Acceptance Criteria:** 9/9 passed
- **Edge Cases:** 6/6 passed
- **Bugs Found:** 7 total — 3 fixed (BUG-1, BUG-4, BUG-5), 4 remaining low-severity
- **Bugs Remaining:** BUG-2 (dual fetch, low), BUG-3 (badge scope, product decision), BUG-6 (threshold desync, low), BUG-7 (period display, low)
- **Security:** Pass — no vulnerabilities found
- **Regression:** Pass — no regressions in PROJ-1, PROJ-2, or PROJ-3
- **Production Ready:** YES
- **Recommendation:** All blocking bugs fixed. Remaining 4 low-severity issues can be addressed in a future sprint.

## Deployment
- **Deployed:** 2026-03-14
- **Commit:** deploy(PROJ-8)
- **Database Migration:** `create_flags_tables` applied to production Supabase
- **No new environment variables required**
