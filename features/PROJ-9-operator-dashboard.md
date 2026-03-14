# PROJ-9: Operator Dashboard (Layer 7)

## Status: In Review
**Created:** 2026-03-13
**Last Updated:** 2026-03-14

## Overview

Die tägliche Schaltzentrale für Campaign Operators. Während PROJ-3 (Snapshot) den 7-Tage-Überblick zeigt und PROJ-4 (Weekly Review) wöchentlich in die Tiefe geht, bietet das Operator Dashboard den **Tagesfokus**: Was ist heute passiert? Welche Sender sind aktiv? Wo muss ich eingreifen?

### Abgrenzung zu bestehenden Views

| View | Zeitraum | Fokus | Zielgruppe |
|------|----------|-------|------------|
| PROJ-3 Snapshot | 7-Tage rollierend | Workspace-Gesundheit | Team Lead |
| PROJ-4 Weekly Review | Woche (Mo-So) | Tiefenanalyse + Funnels | Account Manager |
| PROJ-8 Interventions | Laufend | Flag-Management | Alle |
| **PROJ-9 Operator Dashboard** | **Heute / ausgewählter Tag** | **Tagesaktivität + Sender-Produktivität** | **Campaign Operator** |

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs activity metrics and conversation data
- Requires: PROJ-8 (Intervention Flag System) — shows active high-severity flags inline

## User Stories
- Als Campaign Operator möchte ich auf einen Blick sehen, was heute über alle Workspaces gelaufen ist, damit ich weiß ob das Outreach-Volumen on track ist
- Als Campaign Operator möchte ich die Sender-Aktivität pro Workspace sehen, damit ich inaktive Accounts sofort erkenne
- Als Campaign Operator möchte ich kritische Intervention Flags direkt im Dashboard sehen, damit ich nicht extra zur Interventions-Seite navigieren muss
- Als Campaign Operator möchte ich einen 30-Tage-Trend meiner Kampagnen sehen, damit ich Muster und Ausreißer schnell erkennen kann
- Als Campaign Operator möchte ich einen Tag auswählen können, damit ich historische Tagesaktivität nachschauen kann

## Acceptance Criteria

### AC-1: Daily Activity Overview
- [ ] Zeigt Metriken für den ausgewählten Tag (Standard: letzter Tag mit Daten):
  - Connections Sent + Accepted (mit Acceptance Rate)
  - Messages Started + Replies Received (mit Reply Rate)
  - Profile Views + Follows
- [ ] Vergleich zum gleichen Wochentag der Vorwoche (z.B. Montag vs. vorheriger Montag):
  - Prozentuale Veränderung mit Farbcodierung (grün = besser, rot = schlechter)
  - Trend-Pfeil (up/down/stable)
- [ ] Werte sind aggregiert über alle Workspaces (oder gefiltert, wenn Workspace-Filter aktiv)

### AC-2: Sender Activity Table
- [ ] Tabelle mit Sender-Aktivität, abgeleitet aus der `conversations`-Tabelle:
  - Spalten: Sender Name, Workspace, Anzahl Gespräche, Anzahl Replies, Letztes Aktiv-Datum, Status (Active/Inactive)
  - Sortiert nach Workspace, dann nach Gesprächsanzahl absteigend
- [ ] Sender gilt als "Inactive" wenn keine Conversation-Aktivität in den letzten 7 Tagen
- [ ] Filterbar nach Workspace
- [ ] Bei 20+ Sendern: Paginierung oder gruppiertes Collapsing nach Workspace

### AC-3: Active Intervention Flags (Inline)
- [ ] Zeigt High-Severity Flags aus PROJ-8 prominent oben im Dashboard
- [ ] Pro Flag: Workspace, Flag-Typ, ausgelöster Wert, Erstelldatum
- [ ] Quick-Link zu `/dashboard/interventions` für volle Flag-Verwaltung
- [ ] Wenn keine aktiven High-Severity Flags: Grüner "All Clear" Indikator
- [ ] Medium-Severity Flags nur als Zähler anzeigen (nicht einzeln auflisten)

### AC-4: Campaign Activity Timeline (30 Tage)
- [ ] Line Chart (Recharts) mit täglichen Werten der letzten 30 Tage:
  - Linie 1: Connections Sent (primäre Farbe)
  - Linie 2: Replies Received (sekundäre Farbe)
- [ ] Hover-Tooltips mit exakten Werten und Datum
- [ ] Toggle zwischen einzelnem Workspace und "All Combined"
- [ ] Wochenenden visuell markiert (z.B. leicht grauer Hintergrund)

### AC-5: Date Picker
- [ ] Datums-Auswahl für historische Tagesansichten
- [ ] Nur Tage mit vorhandenen Daten auswählbar (disabled dates für Tage ohne Daten)
- [ ] Standard: letzter Tag mit Daten (nicht heute, falls keine Daten für heute)
- [ ] Datum-Änderung aktualisiert die Daily Activity Overview (AC-1)
- [ ] Timeline-Chart (AC-4) bleibt unabhängig vom gewählten Tag (zeigt immer 30 Tage)

### AC-6: Quick-Action Shortcuts
- [ ] Shortcut-Buttons am oberen Rand:
  - "Upload New Data" → `/dashboard/import`
  - "Weekly Review" → `/dashboard/health`
  - "Manage Flags" → `/dashboard/interventions`
- [ ] Dezent gestaltet (keine prominenten CTA-Buttons, eher Link-Stil)

### AC-7: Workspace Filter
- [ ] Select-Dropdown zum Filtern nach einzelnem Workspace
- [ ] "All Workspaces" als Standard (zeigt aggregierte Werte)
- [ ] Filter wirkt auf: Daily Activity (AC-1), Sender Table (AC-2), Timeline Chart (AC-4)
- [ ] Gleiche Komponente/Pattern wie in PROJ-3 (WorkspaceFilter)

## Edge Cases

### EC-1: Kein Daten für heute
- Zeige "No data for today" Banner mit dem letzten verfügbaren Datum
- Date Picker springt automatisch zum letzten Tag mit Daten

### EC-2: Sender erscheint in mehreren Workspaces
- Separate Zeilen pro Workspace in der Sender-Tabelle
- Workspace-Spalte macht die Zuordnung eindeutig

### EC-3: 20+ Sender Accounts
- Paginierung mit 15 Sendern pro Seite
- Alternativ: Gruppierung nach Workspace mit Collapsible-Sections

### EC-4: Daten sind mehrere Tage alt
- Prominentes Warning-Banner: "Data is X days old — last upload on [date]"
- Banner verschwindet wenn Daten < 2 Tage alt sind

### EC-5: Wochenende ohne Aktivität
- Wochenendtage in der Timeline als erwartete Low-Activity markieren
- Vergleich (AC-1) vergleicht immer gleichen Wochentag (Sa vs. vorheriger Sa)

### EC-6: Kein Vergleichstag vorhanden (erster Datenwoche)
- Vergleichswerte zeigen "--" statt Prozentwerte
- Tooltip: "Not enough data for comparison"

### EC-7: Keine Conversation-Daten hochgeladen (nur Activity Metrics)
- Sender-Tabelle zeigt: "No conversation data available. Upload conversation CSV to see sender activity."
- Restliches Dashboard funktioniert normal (Activity Overview, Timeline)

### EC-8: Keine Daten überhaupt hochgeladen
- Gesamte Seite zeigt Empty State mit CTA zu `/dashboard/import`

## Technical Requirements
- Performance: Dashboard lädt in < 2 Sekunden
- Charts: Recharts (bereits installiert via PROJ-4) für 30-Tage Timeline
- Responsive: Optimiert für Desktop, akzeptable Tablet-Ansicht
- Auto-refresh: Nicht nötig für MVP (Daten kommen via manuellem CSV Upload)
- Datenquellen: `daily_metrics` (Tagesaktivität), `conversations` (Sender-Breakdown), `flags` (Intervention Flags)

## Data Sources & Queries

### Daily Activity Overview (AC-1)
- **Quelle:** `daily_metrics`
- **Query:** Filter nach Datum (ausgewählter Tag) + optional Workspace. Summe über alle Metriken.
- **Vergleich:** Gleicher Wochentag 7 Tage zurück. Berechne prozentuale Veränderung.

### Sender Activity (AC-2)
- **Quelle:** `conversations`
- **Query:** Gruppiert nach `sender_name` + `workspace`. Count conversations, count replies (`is_inbound_reply = true`), max `last_message_at`.
- **Inactive-Check:** Kein `last_message_at` innerhalb der letzten 7 Tage.
- **Limitation:** Keine per-Sender Connection/Message Counts — nur Conversations-basiert (gleicher Ansatz wie PROJ-4).

### Timeline Chart (AC-4)
- **Quelle:** `daily_metrics`
- **Query:** Letzte 30 Tage, gruppiert nach Datum. Optional gefiltert nach Workspace.
- **Metriken:** `connections_sent`, `total_message_replies` pro Tag.

### Inline Flags (AC-3)
- **Quelle:** `flags` (PROJ-8)
- **Query:** `status IN ('active', 'acknowledged')`, `severity = 'high'`, sortiert nach `created_at DESC`.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure

```
Operator Dashboard Page (/dashboard/operator)
├── Quick-Action Shortcuts (links to Import, Health Review, Interventions)
├── Toolbar Row
│   ├── Workspace Filter (reuse existing WorkspaceFilter component)
│   └── Date Picker (shadcn Calendar + Popover)
├── Inline Intervention Flags (high-severity only)
│   ├── Flag Cards (reuse existing flag-card pattern)
│   ├── Medium-Severity Counter (badge only, not listed)
│   └── "All Clear" indicator (when no high-severity flags)
├── Daily Activity Overview (6 metric cards in a grid)
│   ├── Connections Sent + Accepted (with Acceptance Rate)
│   ├── Messages Started + Replies Received (with Reply Rate)
│   ├── Profile Views + Follows
│   └── Each card: value, week-over-week % change, trend arrow
├── Campaign Activity Timeline (30-day line chart)
│   └── Recharts LineChart (connections sent + replies received)
│       ├── Hover tooltips with date + values
│       ├── Weekend shading (gray background bands)
│       └── Workspace toggle (all combined vs. single)
└── Sender Activity Table
    ├── Columns: Sender, Workspace, Conversations, Replies, Last Active, Status
    ├── Grouped/sorted by Workspace
    ├── Pagination (15 per page) for 20+ senders
    └── Empty state when no conversation data uploaded
```

### Data Model (plain language)

**Daily Activity Overview (AC-1)**
- Source: `daily_metrics` table (already exists from PROJ-2)
- Selected day: sum all metrics for that date (optionally filtered by workspace)
- Comparison: same weekday 7 days prior (Monday vs. previous Monday)
- Calculate: percentage change per metric, color-coded (green = better, red = worse)

**Sender Activity (AC-2)**
- Source: `conversations` table (already exists from PROJ-2)
- Group by: sender_name + workspace
- Metrics per sender: count of conversations, count of replies (is_inbound_reply = true), latest last_message_at
- Inactive rule: no last_message_at within 7 days = "Inactive"
- Same approach as PROJ-4 sender breakdown — conversations-based, not per-sender message counts

**Timeline Chart (AC-4)**
- Source: `daily_metrics` table
- Last 30 days, grouped by date, optionally filtered by workspace
- Two lines: connections_sent, total_message_replies per day

**Inline Flags (AC-3)**
- Source: existing `/api/flags` endpoint
- Filter: `severity=high`, `status` in (active, acknowledged)
- No new API needed — reuse existing flags API

**Date Picker (AC-5)**
- Source: distinct dates from `daily_metrics` that have data
- Default: most recent date with data (not necessarily today)
- Dates without data are disabled in the calendar

### API Design

**New endpoint: `GET /api/campaigns/operator`**

Query parameters:
- `date` — selected day (YYYY-MM-DD), defaults to latest date with data
- `workspace` — optional workspace filter ("all" or specific name)

Returns:
- `dailyActivity` — metrics for selected day + comparison day metrics + percentage changes
- `senderBreakdown` — sender activity list from conversations table
- `timeline` — 30 days of daily connections_sent + total_message_replies
- `availableDates` — list of dates that have data (for date picker)
- `latestDate` — most recent date with data
- `workspaces` — list of distinct workspace names
- `dataFreshness` — timestamp of last successful upload

**Reused endpoint: `GET /api/flags?severity=high`**
- Already supports severity and status filtering
- Called separately by the inline flags component

### Tech Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Page route** | `/dashboard/operator` | Separate from existing `/dashboard` (Snapshot) — different audience and time focus |
| **API strategy** | 1 new endpoint + reuse flags API | One call for all operator data minimizes loading time. Flags already have their own endpoint with full filtering |
| **Workspace filter** | Reuse `WorkspaceFilter` component | Same pattern as PROJ-3 — consistent UX, no duplication |
| **Trend comparison** | Reuse `TrendArrow` component | Already handles up/down/stable/null states |
| **Sender table** | New `OperatorSenderTable` component | The PROJ-4 `SenderBreakdownTable` lacks a Workspace column and pagination — extending it would break PROJ-4. New component with shared styling |
| **Date picker** | shadcn Calendar + Popover | Standard shadcn pattern. Requires installing `calendar` component and `date-fns` package |
| **30-day chart** | Recharts `LineChart` | Already installed (PROJ-4). Consistent with existing chart patterns |
| **Inline flags** | Lightweight component, not full `FlagList` | Only needs high-severity display + medium count badge — simpler than the full interventions page |
| **Sidebar navigation** | Add "Operator" entry with `Gauge` icon | Fits between "Health Review" and "Interventions" in nav order |

### Dependencies (to install)

| Package | Purpose |
|---------|---------|
| `date-fns` | Date formatting and manipulation for date picker |
| shadcn `calendar` component | `npx shadcn@latest add calendar` — provides the Calendar UI component |

All other packages (Recharts, Zod, shadcn/ui components) are already installed.

### New Files to Create

| File | Purpose |
|------|---------|
| `src/app/dashboard/operator/page.tsx` | Operator Dashboard page |
| `src/app/api/campaigns/operator/route.ts` | API endpoint for operator data |
| `src/components/operator-dashboard.tsx` | Main client component (data fetching + state) |
| `src/components/operator-daily-activity.tsx` | Daily metric cards with comparison |
| `src/components/operator-sender-table.tsx` | Sender table with workspace column + pagination |
| `src/components/operator-timeline-chart.tsx` | 30-day Recharts line chart |
| `src/components/operator-inline-flags.tsx` | High-severity flags inline display |
| `src/lib/types/operator.ts` | TypeScript types for operator API response |

### Existing Files to Modify

| File | Change |
|------|--------|
| `src/components/app-sidebar.tsx` | Add "Operator" nav entry |

### Backend Needs

- **Yes, backend needed** — new API endpoint aggregates data from `daily_metrics`, `conversations`, and `upload_history` tables
- **No new database tables** — all data already exists from PROJ-2 imports
- **No new RPC functions** — queries can be done with standard Supabase client filters and JS aggregation (same pattern as PROJ-3/PROJ-4 APIs)

## Implementation Notes (Frontend)

**Date:** 2026-03-14

### Files Created
- `src/lib/types/operator.ts` — TypeScript types for operator API response
- `src/hooks/use-operator-dashboard.ts` — Data fetching hook with date/workspace state
- `src/components/operator-dashboard.tsx` — Main orchestrator with loading/error/empty states, date picker, quick actions, data freshness banner
- `src/components/operator-daily-activity.tsx` — 8 metric cards with week-over-week comparison and trend arrows
- `src/components/operator-timeline-chart.tsx` — 30-day Recharts LineChart with weekend shading, custom tooltips, legend
- `src/components/operator-sender-table.tsx` — Sender table with workspace column, active/inactive status, pagination (15 per page)
- `src/components/operator-inline-flags.tsx` — High-severity flags inline display with medium count badge, "All Clear" indicator
- `src/app/dashboard/operator/page.tsx` — Operator Dashboard page
- `src/app/api/campaigns/operator/route.ts` — API endpoint aggregating daily_metrics, conversations, upload_history

### Files Modified
- `src/components/app-sidebar.tsx` — Added "Operator" nav entry with Gauge icon between Health Review and Interventions

### Dependencies Installed
- shadcn `calendar` component (`react-day-picker` dependency)
- `date-fns` (already present, used for date formatting in date picker)

### Reused Components
- `WorkspaceFilter` (from PROJ-3) — consistent workspace dropdown pattern
- `TrendArrow` (from PROJ-3) — up/down/stable/null trend indicators
- `SeverityBadge` (from PROJ-8) — flag severity display
- Recharts (from PROJ-4) — timeline chart
- shadcn Calendar + Popover — date picker

### Design Decisions
- Date picker defaults to latest date with data (not today) per AC-5
- Inline flags component fetches independently from flags API (not bundled in operator API) for separation of concerns
- Timeline chart always shows 30 days from latest date, independent of selected day per AC-4/AC-5
- Sender activity uses all-time conversation data (not filtered by selected day) to show overall sender health
- Weekend shading uses Recharts ReferenceArea with muted fill
- Metric cards use 2-column grid on mobile, 4-column on desktop

## QA Test Results

**Date:** 2026-03-14
**Tester:** Claude Code (automated QA)
**Build:** PASS (Next.js 16.1.1, Turbopack, compiled in 12.2s)

### Acceptance Criteria Results

| AC | Description | Result | Notes |
|----|-------------|--------|-------|
| AC-1 | Daily Activity Overview | **PASS** | 8 Metrik-Karten mit Wochentag-Vergleich, Farbcodierung, TrendArrow |
| AC-2 | Sender Activity Table | **PASS** | 6 Spalten, sortiert Workspace→Conversations, Pagination 15/page |
| AC-3 | Active Intervention Flags | **PASS** | High-Severity inline, Medium als Zähler, "All Clear" Indikator |
| AC-4 | Campaign Activity Timeline | **PASS** | Chart funktional, Weekend-Shading, Tooltips OK. Workspace-Toggle Pill-Buttons im Chart Header |
| AC-5 | Date Picker | **PASS** | Disabled dates ohne Daten, Default = letzter Tag, Timeline unabhängig |
| AC-6 | Quick-Action Shortcuts | **PASS** | 3 Links (Import, Health, Interventions) mit ghost-Button Stil |
| AC-7 | Workspace Filter | **PASS** | Reused WorkspaceFilter, wirkt auf AC-1, AC-2, AC-4 |

### Edge Case Results

| EC | Description | Result |
|----|-------------|--------|
| EC-1 | Kein Daten für heute | **PASS** — Default zu letztem verfügbaren Datum |
| EC-2 | Sender in mehreren Workspaces | **PASS** — Separate Zeilen per Workspace |
| EC-3 | 20+ Sender | **PASS** — Paginierung mit 15 pro Seite |
| EC-4 | Daten mehrere Tage alt | **PASS** — Warning Banner mit Upload-Link |
| EC-5 | Wochenende ohne Aktivität | **PASS** — Weekend-Shading + gleicher Wochentag-Vergleich |
| EC-6 | Kein Vergleichstag | **PASS** — "--" mit Tooltip "Not enough data for comparison" |
| EC-7 | Keine Conversation-Daten | **PASS** — Empty State "No conversation data available" |
| EC-8 | Keine Daten überhaupt | **PASS** — CTA zu /dashboard/import |

### Security Audit

| Check | Result |
|-------|--------|
| Auth on API | **PASS** — getUser() check, 401 on unauthenticated |
| SQL Injection | **PASS** — Supabase parametrized queries |
| XSS | **PASS** — React auto-escaping, no dangerouslySetInnerHTML |
| Input Validation | **PASS** — Date validated against available set |
| Sensitive Data | **PASS** — No secrets in client, only aggregated metrics |

### Bugs Found

1. **[FIXED] AC-4: Kein dedizierter Workspace-Toggle im Timeline Chart**
   - Spec sagt: "Toggle zwischen einzelnem Workspace und 'All Combined'"
   - Fix: Workspace Pill-Buttons direkt im Chart Header hinzugefügt ("All Combined" + je Workspace)
   - Toggle steuert den globalen Workspace-Filter, ist aber visuell im Chart platziert

### Overall Result: **PASS** (all ACs pass, 1 bug found and fixed)

## Deployment
_To be added by /deploy_
