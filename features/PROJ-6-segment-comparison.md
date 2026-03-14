# PROJ-6: Segment Comparison Analysis (Layer 4)

## Status: In Progress
**Created:** 2026-03-13
**Last Updated:** 2026-03-14

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs conversation data with lead details
- Requires: PROJ-5 (Messaging Insight Summary) — builds on conversation data and reply categorization (tags)

## Overview
Einfacher Dimensionsvergleich: Nutzer wählt EINE Vergleichsdimension (Workspace, Sender, Position oder Reply-Kategorie) und sieht alle Werte dieser Dimension nebeneinander mit Kern-Metriken verglichen. Keine gespeicherten Vergleiche — reine Live-Ansicht. Eigene Seite mit eigenem Sidebar-Menüpunkt.

## User Stories
- As a team lead, I want to compare workspace performance side-by-side so that I can see which client campaigns generate the most engagement and allocate resources accordingly
- As a campaign operator, I want to compare sender accounts by reply rate so that I can identify top-performing LinkedIn profiles and balance workload
- As a campaign operator, I want to see which lead positions (CEO, CTO, VP Sales) respond most so that I can refine targeting lists for each workspace
- As an account manager, I want to see reply category distribution across workspaces so that I can understand which clients generate the most "Interested" responses and prepare talking points for client calls
- As a team lead, I want to filter the comparison to a specific time period so that I can track how segment performance changes week over week

## Acceptance Criteria

### AC-1: Dimension Selector
- [ ] Dropdown at the top of the page to select the comparison dimension
- [ ] Available dimensions:
  - **Workspace** — groups by `conversations.workspace` (e.g., UCP, FDI, DataQI, Ninja, Daentra)
  - **Sender Account** — groups by `conversations.sender_name`
  - **Lead Position** — groups by `conversations.lead_position`
  - **Reply Category** — groups by `conversation_tags.category` (Interested, Objection, Not now, Wrong person, Not interested, Referral) + "Untagged"
- [ ] Changing the dimension immediately reloads the comparison data
- [ ] Default dimension on page load: Workspace

### AC-2: Date Range Filter with Presets
- [ ] Date range filter with quick-select presets:
  - Last 7 days
  - Last 30 days (default)
  - Last 90 days
  - All time
  - Custom range (date picker for from/to)
- [ ] Date filter applies to `last_message_at` field
- [ ] Changing the date range reloads the comparison data
- [ ] Presets are based on relative dates (calculated from today)

### AC-3: Comparison Bar Chart
- [ ] Horizontal or vertical bar chart at the top of the page
- [ ] Shows the selected metric across all segment values
- [ ] Metric selector to switch the chart between:
  - Reply Rate (%) — default
  - Conversation Count
  - Average Conversation Depth
- [ ] Bars are labeled with segment name and value
- [ ] Bars are sorted by value (highest first)
- [ ] Maximum 15 bars shown; if more segment values exist, show top 15 with a note "X weitere Segmente nicht angezeigt"

### AC-4: Comparison Table
- [ ] Table below the chart with one row per segment value
- [ ] Columns:
  - Segment (dimension value, e.g., workspace name or position title)
  - Conversations (total count)
  - Reply Rate (% of conversations with `is_inbound_reply = true`)
  - Avg. Depth (average `total_messages` per conversation in this segment)
  - Top Reply Category (most common `conversation_tags.category` for this segment, or "—" if no tags)
  - Category Breakdown (mini horizontal stacked bar showing distribution of reply categories)
- [ ] Table is sortable by any numeric column (click column header to sort)
- [ ] Default sort: by Conversations count descending
- [ ] Rows with fewer than 5 conversations show a "⚠ Kleine Stichprobe" badge

### AC-5: Segment Detail Drill-Down
- [ ] Clicking a row in the comparison table opens a detail view / expands the row
- [ ] Detail view shows:
  - Reply category pie chart for this specific segment
  - Conversation depth distribution (1-touch / 2-touch / 3+ touch counts)
  - Top 3 sender accounts in this segment (by reply rate) — only shown when dimension is NOT "Sender Account"
  - Link "Conversations anzeigen" that navigates to `/dashboard/messaging` with the appropriate filter pre-applied (e.g., workspace=UCP)

### AC-6: Empty & Loading States
- [ ] Loading skeleton while data is being fetched
- [ ] Empty state when no conversations exist: "Noch keine Conversations vorhanden. Importiere Daten über CSV Upload."
- [ ] Empty state when date filter returns 0 results: "Keine Conversations im gewählten Zeitraum." with option to reset filters
- [ ] If a dimension has only 1 value (e.g., only 1 workspace): Show data but display info "Nur 1 Segment vorhanden — importiere weitere Daten für einen Vergleich."

## Edge Cases
- Lead position values are inconsistent (e.g., "CEO" vs "Chief Executive Officer" vs "Geschäftsführer") → Show raw values as-is; normalization/grouping is a future enhancement. Each unique value is its own segment.
- A segment has fewer than 5 conversations → Show data but display "⚠ Kleine Stichprobe" warning badge on that row
- Lead position is null/empty for some conversations → Group these under "Keine Angabe" segment
- Reply category dimension selected but no conversations are tagged → Show all conversations under "Untagged" segment with a hint to tag conversations in Messaging Insights
- More than 15 unique values for a dimension (especially lead_position) → Chart shows top 15 by conversation count; table shows all values with pagination
- Date range from > to → Calendar `disabled` prop prevents invalid ranges (same pattern as PROJ-5)
- User switches dimension rapidly → Cancel/ignore previous request, only show latest result (debounce or abort controller)

## Out of Scope (Future Enhancements)
- Free segment builder with combined filters (e.g., "CEOs in UCP")
- Saved/named comparisons
- Lead company and lead location as dimensions (could be added later)
- Conversation depth category as a dimension (already visible in detail drill-down)
- Trend over time per segment
- AI-powered position normalization
- Export comparison as CSV/PDF

## Technical Requirements
- Performance: Segment aggregation query returns in < 3 seconds for up to 10k conversations
- Charts: Recharts (already installed) for bar chart and pie charts
- No new database tables needed — reads from existing `conversations` + `conversation_tags`
- No saved state — purely computed from current data with selected filters
- New API endpoint for segment aggregation (avoids loading all conversations client-side)
- Navigation: New sidebar entry "Segmente" with `BarChart3` icon (lucide-react), after "Messaging Insights"

---

## Tech Design (Solution Architect)

### A) Seitenstruktur & Komponenten-Baum

```
/dashboard/segments                              ← Neue Seite
├── Segment Filter Bar (AC-1 + AC-2)             ← Dimension + Datumsbereich
│   ├── Dimension Dropdown (Workspace / Sender / Position / Reply-Kategorie)
│   ├── Date Preset Buttons (7d / 30d / 90d / All time)
│   └── Custom Date Range Picker (Von–Bis)
│
├── Comparison Bar Chart (AC-3)                   ← Visueller Vergleich
│   ├── Metric Selector (Reply Rate / Count / Avg. Depth)
│   ├── Balken pro Segment-Wert (max. 15, sortiert)
│   └── Hinweis wenn > 15 Segmente existieren
│
├── Comparison Table (AC-4)                       ← Detaillierte Tabelle
│   ├── Zeile pro Segment-Wert
│   │   ├── Segment-Name
│   │   ├── Conversations (Anzahl)
│   │   ├── Reply Rate (%)
│   │   ├── Avg. Depth
│   │   ├── Top Reply Category
│   │   ├── Category Breakdown (Mini Stacked Bar)
│   │   └── "⚠ Kleine Stichprobe" Badge (wenn < 5 Conversations)
│   └── Sortierung per Klick auf Spaltenheader
│
├── Segment Detail Panel (AC-5)                   ← Expandierbarer Drill-Down
│   ├── Reply-Kategorie Pie Chart
│   ├── Depth Distribution (1-touch / 2-touch / 3+)
│   ├── Top 3 Sender (nur wenn Dimension ≠ Sender)
│   └── Link "Conversations anzeigen" → /dashboard/messaging?filter=...
│
└── Empty / Loading States (AC-6)
    ├── Loading Skeleton
    ├── Leerzustand (keine Conversations)
    ├── Leerzustand (Datumsfilter, 0 Ergebnisse)
    └── Info-Hinweis (nur 1 Segment vorhanden)
```

### B) Datenmodell

**Keine neuen Tabellen nötig.** Liest ausschließlich aus bestehenden Tabellen:

- **`conversations`** — Alle Felder vorhanden (`workspace`, `sender_name`, `lead_position`, `is_inbound_reply`, `total_messages`, `last_message_at`)
- **`conversation_tags`** — Für Reply-Kategorie-Dimension und Kategorie-Breakdown (LEFT JOIN über `conversation_id`)

Aggregation passiert serverseitig per Gruppierung auf der gewählten Dimension. Kein clientseitiges Laden aller Conversations.

### C) API-Route (1 neuer Endpunkt)

| Route | Methode | Zweck |
|-------|---------|-------|
| `/api/campaigns/segments` | GET | Aggregierte Segment-Daten für gewählte Dimension + Zeitraum |

**`GET /api/campaigns/segments`**
- Query-Parameter:
  - `dimension` — `workspace` | `sender` | `position` | `category` (Pflicht)
  - `dateFrom` — ISO-Datum (optional)
  - `dateTo` — ISO-Datum (optional)
- Ablauf:
  1. Auth-Check (401 wenn nicht eingeloggt)
  2. Conversations + Tags laden (mit Datumfilter, Limit 10.000)
  3. Serverseitig gruppieren nach Dimension-Wert
  4. Pro Gruppe berechnen: Count, Reply Rate, Avg Depth, Top-Kategorie, Kategorie-Breakdown, Depth-Verteilung, Top Sender
- Antwort: Array von Segment-Objekten, sortiert nach Conversation Count absteigend
- Enthält alle Daten für Chart, Tabelle UND Drill-Down in einer Antwort

**Warum eigener Endpoint statt `/api/conversations/summary` erweitern?**
- Summary-Endpoint hat eigene Logik (Weekly Card, Top Senders). Dimension-Aggregation ist ein anderer Use Case.
- Eigener Endpoint hält die Verantwortlichkeiten getrennt und den Code wartbar.
- Folgt dem bestehenden Pattern: jedes Feature hat eigene API-Routen.

### D) Tech-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| Serverseitige Aggregation | Bei 10k Conversations wäre Client-Side-Grouping zu langsam. Supabase-Query mit Limit + serverseitige Berechnung in der Route |
| 1 API-Call inkl. Drill-Down-Daten | Alle Daten kommen aus demselben Query-Ergebnis. Separate Calls für Drill-Down wären redundant |
| Recharts für Bar Chart + Pie Chart | Bereits im Projekt installiert und in PROJ-3/PROJ-4/PROJ-5 verwendet |
| AbortController bei Dimensionswechsel | Spec nennt „User switches dimension rapidly" als Edge Case. AbortController verhindert Race Conditions |
| Expandierbare Tabellenzeile für Drill-Down | Konsistent mit dem Pattern in PROJ-5 (conversation-detail-row). Keine neue Layout-Komplexität |
| Null-Werte als „Keine Angabe" gruppieren | Lead Position kann null sein → eigener Segment-Wert „Keine Angabe" statt Datenverlust |

### E) Wiederverwendete Komponenten

| Komponente | Verwendung |
|------------|------------|
| `ui/table` | Comparison Table |
| `ui/select` | Dimension Dropdown, Metric Selector |
| `ui/card` | Chart-Container, Detail-Panel |
| `ui/badge` | „Kleine Stichprobe" Warning |
| `ui/button` | Date Presets |
| `ui/popover` + `ui/calendar` | Custom Date Range |
| `ui/skeleton` | Loading State |

### F) Neue Komponenten (5 Stück)

| Komponente | Verantwortung |
|------------|---------------|
| `segment-comparison.tsx` | Haupt-Container, State-Management (Dimension, Dates), API-Aufruf |
| `segment-filter-bar.tsx` | Dimension-Dropdown + Date Presets + Custom Range (AC-1, AC-2) |
| `segment-bar-chart.tsx` | Vergleichs-Balkendiagramm mit Metric-Selector (AC-3) |
| `segment-comparison-table.tsx` | Sortierbare Tabelle mit Category-Breakdown Bars (AC-4) |
| `segment-detail-panel.tsx` | Expandierbarer Drill-Down mit Pie Chart, Depth, Top Sender (AC-5) |

### G) Sidebar-Navigation

Neuer Eintrag in `app-sidebar.tsx`:
- Label: **„Segmente"**
- Route: `/dashboard/segments`
- Icon: `ArrowLeftRight` (aus lucide-react) — BarChart3 ist bereits für „Campaigns" vergeben, ArrowLeftRight symbolisiert „Vergleich" besser
- Position: Nach „Messaging Insights", vor „Operator"

### H) Dependencies

Keine neuen Packages nötig:
- **Recharts** — Bar Chart + Pie Chart (bereits installiert)
- **shadcn/ui** — UI-Komponenten (bereits installiert)
- **date-fns** — Datumsberechnung für Presets (bereits installiert)
- **Supabase Client** — Datenbankzugriff (bereits installiert)
- **lucide-react** — Icons (bereits installiert)

### I) Datenbank-Migration

**Keine Migration nötig.** Alle benötigten Daten existieren bereits in `conversations` + `conversation_tags`.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
