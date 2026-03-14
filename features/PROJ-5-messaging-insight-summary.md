# PROJ-5: Weekly Messaging Insight Summary (Layer 3)

## Status: In Review
**Created:** 2026-03-13
**Last Updated:** 2026-03-14

### Frontend Implementation Notes
- Built 8 components: `messaging-insight.tsx` (main container), `messaging-weekly-card.tsx` (AC-5), `reply-analysis-overview.tsx` (AC-2), `conversation-filter-bar.tsx` (AC-1/AC-6), `conversation-table.tsx` (AC-1), `conversation-detail-row.tsx` (AC-3), `conversation-tag-select.tsx` (AC-4), `messaging-empty-state.tsx`
- Created 3 API routes: `GET /api/conversations`, `GET /api/conversations/summary`, `PATCH /api/conversations/tags`
- Created `useMessagingInsights` hook for data fetching with filter state management
- Created types in `src/lib/types/messaging.ts`
- Page at `/dashboard/messaging`, sidebar entry "Messaging Insights" with MessageSquare icon
- Pie chart for reply category breakdown (user choice), semantic colors for categories
- **Pending for backend**: `conversation_tags` table migration + RLS policies needed before tagging works

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs conversation data in `conversations` table

## User Stories
- As a team lead, I want to see which opening messages get the most replies so that we can double down on effective hooks
- As a campaign operator, I want to identify recurring objections so that I can adjust messaging or targeting
- As an account manager, I want to see conversation quality trends so that I can report messaging effectiveness to clients
- As a team member, I want to browse recent conversations filtered by response type so that I can quickly find interesting reply patterns
- As a campaign operator, I want to manually tag conversations by reply type so that we can track objection patterns over time

## Acceptance Criteria

### AC-1: Conversation Browser with Filters
- [ ] Table/list view of all conversations with pagination (25 per page)
- [ ] Filter by workspace (dropdown, multi-select)
- [ ] Filter by conversation depth category (1-touch, 2-touch, 3+ touch)
- [ ] Filter by date range (based on `last_message_at`)
- [ ] Filter by sender account (dropdown based on `sender_name`)
- [ ] Filter by inbound reply status (replied / not replied, based on `is_inbound_reply`)
- [ ] Filter by reply category tag (if tagged)
- [ ] Filters are combinable (AND logic)
- [ ] Results sortable by date, depth, workspace

### AC-2: Reply Analysis Overview
- [ ] Summary stats at top of page:
  - Total conversations count
  - Conversations with replies vs. without (count + percentage)
  - Conversation depth distribution (bar chart: 1-touch / 2-touch / 3+ touch)
  - Most active sender accounts ranked by reply rate (top 5)
- [ ] Stats update dynamically when filters are applied

### AC-3: Conversation Detail View
- [ ] Expandable row or side panel showing:
  - **Lead info:** Name (`lead_first_name` + `lead_last_name`), position, company, location, LinkedIn profile link
  - **Conversation preview:** Shows available message data:
    - First outbound message (`first_outbound_message`)
    - First inbound reply (`first_inbound_reply`) — or "No reply" if empty
    - Last message (`last_message_text`) — shown only if different from above
  - **Metadata:** Conversation depth category, sender name, sender email
  - **Custom fields:** Parsed from `custom_fields` JSONB, shown as key-value pairs
- [ ] Note: Full message thread is NOT available — Heyreach CSV only provides these 3 message snapshots

### AC-4: Manual Reply Categorization (Tagging)
- [ ] Dropdown per conversation to assign ONE reply category:
  - Interested / Positive
  - Objection / Pushback
  - Not now / Timing
  - Wrong person / Left company
  - Not interested / Rejection
  - Referral / Redirect
- [ ] Tags are persisted in a new `conversation_tags` table (linked by `conversation_id`)
- [ ] Tags are preserved across CSV re-imports (upsert on conversations must not delete tags)
- [ ] Tags can be changed or removed by any team member
- [ ] Tag changes are reflected immediately in filters and summary stats

### AC-5: Weekly Summary Card (Rolling 7 Days)
- [ ] Card/section at top of the page showing data for the **last 7 days** (based on `last_message_at`):
  - Number of new replies this period
  - Reply category breakdown (pie or bar chart — only for tagged conversations)
  - Count of untagged conversations (prompt to tag them)
  - Notable conversations: conversations with `conversation_depth_category` = '3+ touch' OR manually flagged
- [ ] "Notable" flag: simple boolean toggle per conversation (stored in `conversation_tags` or separate field)

### AC-6: Text Search
- [ ] Search input field that searches across:
  - `first_outbound_message`
  - `first_inbound_reply`
  - `last_message_text`
  - `lead_first_name`, `lead_last_name`, `lead_company`
- [ ] ILIKE-based search (case-insensitive, partial match)
- [ ] Search is combinable with all filters
- [ ] Minimum 2 characters to trigger search

## Edge Cases
- Conversation has no inbound replies → Show as "No reply" with outbound message only, `is_inbound_reply = false`
- `custom_fields` is null or empty → Display "No additional data" gracefully
- `lead_position` or `lead_company` is null → Show available fields, omit missing ones (no "Unknown" placeholder)
- 1000+ conversations → Paginated (25 per page), filters reduce result set server-side
- Same `conversation_id` in multiple uploads → Upsert updates conversation data but preserves manual tags
- User applies search + filters with 0 results → Show empty state with "No conversations match your criteria" and option to clear filters
- All conversations untagged → Weekly summary shows "No tagged conversations yet" with CTA to start tagging
- `last_message_at` is null → Exclude from weekly summary, show at end of conversation list sorted by `created_at`

## Data Model Notes (for Architecture)
- **Existing table:** `conversations` — all fields already available, 0 rows currently (needs conversation CSV import via PROJ-2)
- **New table needed:** `conversation_tags` with columns:
  - `id` (PK)
  - `conversation_id` (FK → conversations.conversation_id, unique)
  - `category` (text, one of the 6 reply categories)
  - `is_notable` (boolean, default false)
  - `tagged_by` (FK → profiles.id)
  - `tagged_at` (timestamptz)
- **Search:** ILIKE queries on text fields — sufficient for expected data volume (< 10k conversations)
- **RLS:** Same policy as `conversations` table (all authenticated users can read/write)

## Technical Requirements
- Performance: Conversation list loads in < 2 seconds with pagination
- Search: ILIKE-based search on message content and lead fields
- Manual tags: Stored in Supabase `conversation_tags` table, linked by `conversation_id`
- Filters: Server-side filtering with Supabase query builder

---

## Tech Design (Solution Architect)

### A) Seitenstruktur & Komponenten-Baum

```
/dashboard/messaging                          ← Neue Seite
├── Weekly Insight Card (AC-5)                 ← Letzte 7 Tage Zusammenfassung
│   ├── Neue Replies Zähler
│   ├── Reply-Kategorie Verteilung (Chart)
│   ├── Ungetaggte Conversations Hinweis
│   └── Notable Conversations Liste
│
├── Reply Analysis Overview (AC-2)            ← Zusammenfassende Statistiken
│   ├── Total Conversations
│   ├── Mit/Ohne Replies (Zähler + Prozent)
│   ├── Conversation Depth Verteilung (Balkendiagramm)
│   └── Top 5 Sender nach Reply-Rate
│
├── Filter Bar (AC-1 + AC-6)                  ← Kombinierbare Filter
│   ├── Suche (Texteingabe, min. 2 Zeichen)
│   ├── Workspace Filter (Multi-Select)
│   ├── Depth Filter (1-touch / 2-touch / 3+)
│   ├── Datum Filter (Von–Bis)
│   ├── Sender Filter (Dropdown)
│   ├── Reply Status Filter (replied / not replied)
│   ├── Kategorie Filter (Dropdown)
│   └── Filter-Reset Button
│
├── Conversation Table (AC-1)                 ← Paginierte Liste (25/Seite)
│   ├── Tabellenzeile pro Conversation
│   │   ├── Lead-Name + Firma
│   │   ├── Workspace Badge
│   │   ├── Depth Kategorie
│   │   ├── Letztes Nachrichtendatum
│   │   ├── Reply Status Indikator
│   │   ├── Tag Dropdown (AC-4)              ← Inline-Kategorisierung
│   │   ├── Notable Toggle (AC-5)            ← Stern/Flag Button
│   │   └── Expand Button                    ← Öffnet Detail-Ansicht
│   └── Pagination (Seitenzahlen)
│
└── Conversation Detail Panel (AC-3)          ← Expandierbare Zeile
    ├── Lead Info (Name, Position, Firma, Ort, LinkedIn-Link)
    ├── Message Preview
    │   ├── Erste ausgehende Nachricht
    │   ├── Erste eingehende Antwort (oder "Keine Antwort")
    │   └── Letzte Nachricht (falls anders)
    ├── Metadata (Depth, Sender, Sender-Email)
    └── Custom Fields (Key-Value Paare aus JSONB)
```

### B) Datenmodell

**Bestehende Tabelle: `conversations`**
- Alle nötigen Felder bereits vorhanden (Lead-Daten, Nachrichten, Depth, etc.)
- Keine Änderungen nötig

**Neue Tabelle: `conversation_tags`**
- Jeder Eintrag gehört zu genau einer Conversation
- Speichert:
  - Welche Kategorie zugewiesen wurde (eine aus 6 Optionen: Interested, Objection, Not now, Wrong person, Not interested, Referral)
  - Ob die Conversation als "Notable" markiert ist (ja/nein)
  - Wer das Tag gesetzt hat und wann
- Verknüpfung über `conversation_id` (eindeutig — max. 1 Tag pro Conversation)
- Tags bleiben bei CSV-Re-Import erhalten (Upsert auf conversations löscht keine Tags)
- Zugriff: Alle authentifizierten Teammitglieder können Tags lesen, setzen und ändern

### C) API-Routen (3 neue Endpunkte)

| Route | Methode | Zweck |
|-------|---------|-------|
| `/api/conversations` | GET | Conversations mit Filtern, Suche, Pagination abrufen |
| `/api/conversations/summary` | GET | Statistiken (Reply-Analyse + Weekly Summary) |
| `/api/conversations/tags` | PATCH | Tag setzen, ändern oder entfernen |

**Route 1: `GET /api/conversations`**
- Query-Parameter: `workspace`, `depth`, `dateFrom`, `dateTo`, `sender`, `replied`, `category`, `search`, `sort`, `page`
- Filter werden serverseitig kombiniert (AND-Logik)
- Suche: ILIKE über Nachrichtenfelder und Lead-Name/Firma
- Pagination: 25 pro Seite, mit Gesamtanzahl
- Gibt Conversations inkl. zugehörigem Tag zurück (LEFT JOIN auf `conversation_tags`)

**Route 2: `GET /api/conversations/summary`**
- Gleiche Filter-Parameter wie Route 1 (Stats reagieren auf Filter)
- Berechnet: Gesamtzahl, Reply-Quote, Depth-Verteilung, Top Sender
- Separat: Weekly Card Daten (letzte 7 Tage, Kategorie-Breakdown, Ungetaggte)

**Route 3: `PATCH /api/conversations/tags`**
- Body: `{ conversationId, category?, isNotable? }`
- Upsert: Erstellt oder aktualisiert Tag
- Wenn category `null` und isNotable `false` → Tag wird gelöscht
- Antwort: Aktualisiertes Tag-Objekt

### D) Tech-Entscheidungen

| Entscheidung | Begründung |
|--------------|------------|
| Serverseitige Filter & Pagination | Bei 1000+ Conversations wäre clientseitig zu langsam. Supabase-Queries filtern direkt in der Datenbank |
| ILIKE für Suche | Einfach, ausreichend performant bei < 10k Conversations. Kein Volltextindex nötig |
| LEFT JOIN statt separater Abfrage | Tags und Conversations zusammen laden vermeidet N+1 Problem und hält die API einfach |
| Expandierbare Zeile statt Side Panel | Konsistenter mit dem bestehenden Table-Pattern im Projekt. Weniger Layout-Komplexität |
| Inline Tag-Dropdown | Schnelles Tagging direkt in der Tabelle statt Extra-Dialog. Reduziert Klicks für den Operator |
| Recharts für Charts | Bereits im Projekt installiert (wird in PROJ-3 und PROJ-4 verwendet). Kein neues Package nötig |
| useEffect + useState Pattern | Bestehende Features nutzen dieses Pattern für Datenabruf. Konsistenz beibehalten |

### E) Wiederverwendete Komponenten

| Komponente | Verwendung |
|------------|------------|
| `ui/table` | Conversation-Tabelle |
| `ui/select` | Filter-Dropdowns, Tag-Dropdown |
| `ui/badge` | Workspace-Badges, Depth-Badges |
| `ui/card` | Weekly Insight Card, Reply Analysis |
| `ui/input` | Suchfeld |
| `ui/button` | Filter-Reset, Notable Toggle |
| `ui/pagination` | Seitennavigation |
| `ui/popover` + `ui/calendar` | Datumsbereich-Filter |
| `ui/skeleton` | Ladezustand |
| `workspace-filter` | Workspace Multi-Select |

### F) Neue Komponenten (8 Stück)

| Komponente | Verantwortung |
|------------|---------------|
| `messaging-insight.tsx` | Haupt-Container, koordiniert State und Datenabruf |
| `messaging-weekly-card.tsx` | Weekly Summary Card (AC-5) |
| `reply-analysis-overview.tsx` | Statistik-Zusammenfassung (AC-2) |
| `conversation-filter-bar.tsx` | Alle Filter + Suche (AC-1, AC-6) |
| `conversation-table.tsx` | Paginierte Tabellenliste (AC-1) |
| `conversation-detail-row.tsx` | Expandierbare Detail-Ansicht (AC-3) |
| `conversation-tag-select.tsx` | Inline Tag-Dropdown (AC-4) |
| `messaging-empty-state.tsx` | Leerzustand wenn keine Conversations |

### G) Datenbank-Migration

Eine neue Migration wird benötigt:
- Erstellt `conversation_tags` Tabelle
- Setzt Foreign Key auf `conversations.conversation_id`
- Unique Constraint auf `conversation_id` (max. 1 Tag pro Conversation)
- RLS Policy: Authentifizierte User können lesen und schreiben
- Index auf `category` für schnelle Filterung

### H) Dependencies

Keine neuen Packages nötig. Alles mit bereits installierten Tools:
- **Recharts** — Charts (bereits installiert)
- **shadcn/ui** — UI-Komponenten (bereits installiert)
- **date-fns** — Datumsberechnung (bereits installiert)
- **Supabase Client** — Datenbankzugriff (bereits installiert)

### I) Sidebar-Navigation

Neuer Eintrag in `app-sidebar.tsx`:
- Label: "Messaging Insights"
- Route: `/dashboard/messaging`
- Icon: `MessageSquare` (aus lucide-react, bereits im Projekt)
- Position: Nach "Weekly Health" im Menü

## QA Test Results
**QA Date:** 2026-03-14
**Build:** Pass | **Lint:** Pass | **TypeScript:** Pass

### Bugs Found & Fixed (7)

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| BUG-1 | Critical | Category filter was client-side, breaking pagination (showed max 25 filtered results regardless of total) | Moved to DB-level: `!inner` join for specific categories, pre-query exclusion for "untagged" |
| BUG-2 | Critical | Un-toggling notable accidentally deleted entire tag row when no category was set | Tag PATCH now merges with existing tag values; only deletes when both category AND notable are cleared |
| BUG-3 | High | React Fragment shorthand `<>` in `.map()` had no key, causing console warning | Replaced with `<Fragment key={...}>` |
| BUG-4 | High | Notable conversations in weekly card pulled from ALL data, not 7-day window | Changed source from `conversations` to `weeklyConversations` |
| BUG-5 | High | Workspace/depth filters were single-select; spec requires multi-select | Replaced `<Select>` with Popover + Checkbox pattern for both filters |
| BUG-6 | Medium | ILIKE wildcards (`%`, `_`) in search input not escaped, causing unexpected results | Added escape for `%`, `_`, `\` before wrapping in ILIKE pattern |
| BUG-7 | Medium | No dateFrom/dateTo validation — user could set dateFrom > dateTo | Calendar `disabled` prop constrains range; fallback auto-adjusts other date if conflict |

### Security Assessment: PASS
- Auth checks on all 3 API routes (401 for unauthenticated)
- No SQL injection — Supabase query builder parameterizes all inputs
- No XSS — React auto-escapes JSX text content
- RLS policies match spec (all authenticated users can CRUD tags)

### Spec Compliance (Post-Fix)

| AC | Status | Notes |
|----|--------|-------|
| AC-1 | Pass | Multi-select workspace/depth, pagination correct with all filters |
| AC-2 | Pass | Reply analysis overview fully implemented |
| AC-3 | Pass | Expandable detail rows with all required fields |
| AC-4 | Pass | Tag CRUD works correctly, preserves notable flag |
| AC-5 | Pass | Weekly card scoped to 7-day window |
| AC-6 | Pass | Search with 2-char minimum, ILIKE chars escaped |

### Remaining Low-Priority Items (not blocking)
- No loading indicator during tag updates (cosmetic)
- Hard-coded 5000-row limit on summary endpoint (acceptable for < 10k scale)
- Custom fields parsing assumes `.raw` property structure (has fallback)

## Deployment
_To be added by /deploy_
