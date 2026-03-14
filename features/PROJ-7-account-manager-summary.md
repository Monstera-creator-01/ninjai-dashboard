# PROJ-7: Account Manager Campaign Summary (Layer 5)

## Status: In Progress
**Created:** 2026-03-13
**Last Updated:** 2026-03-14

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs both activity and conversation data
- Requires: PROJ-3 (Campaign Intelligence Snapshot) — uses campaign health metrics, trend data, workspace summaries
- Requires: PROJ-5 (Messaging Insight Summary) — uses reply categorization, notable conversations, conversation tags

## Overview
Eine Zusammenfassungsseite für Account Manager, um sich schnell auf Client-Calls vorzubereiten. Aggregiert Campaign-Performance-Daten (aus PROJ-3), Messaging-Insights (aus PROJ-5) und editierbare Talking Points pro Workspace. Folgt dem Übersicht + Detail Pattern (wie PROJ-3 Snapshot).

## User Stories
- As an account manager, I want a per-client weekly summary so that I can prepare for client calls in under 5 minutes
- As an account manager, I want to see notable prospect conversations so that I can share relevant examples and wins with clients
- As an account manager, I want auto-generated talking points that I can edit and save so that my client communication is consistent and data-driven
- As an account manager, I want to copy the full summary as formatted text so that I can paste it into Slack or email before a call
- As an account manager, I want to see emerging risks for my assigned workspaces so that I can proactively address issues with clients
- As a team lead, I want to assign workspaces to specific AMs so that each person has a focused, personalized view
- As a team lead, I want to review past weeks' talking points so that I can see how client messaging has evolved

## Acceptance Criteria

### AC-1: Übersichtsseite mit Workspace-Karten
- [ ] Route: `/dashboard/am-summary`
- [ ] Zeigt kompakte Karten für alle zugewiesenen Workspaces (oder alle, wenn keine Zuweisung)
- [ ] Jede Karte zeigt:
  - Workspace-Name + Health Badge (green/yellow/red aus PROJ-3)
  - Activity Level (active / low activity / inactive)
  - Key KPIs der letzten 7 Tage: Connections sent, Reply Rate, Replies received
  - Trend-Pfeile (up/down/stable) vs. vorherige 7 Tage
  - Anzahl Notable Conversations (aus PROJ-5 Tags)
  - Anzahl offene Risiken/Warnings
- [ ] Klick auf Karte → Detailseite `/dashboard/am-summary/[workspace]`
- [ ] Workspace-Filter für nicht-zugewiesene User (alle Workspaces sichtbar)

### AC-2: Detailseite pro Workspace
- [ ] Route: `/dashboard/am-summary/[workspace]`
- [ ] Header: Workspace-Name, Health Badge, Activity Level, Zeitraum (letzte 7 Tage)
- [ ] Vier Sektionen:
  1. **KPIs & Trends** — Metriken der letzten 7 Tage mit Vergleich zur Vorwoche
  2. **Notable Conversations** — Conversations mit Tag "Interested" oder "Referral", oder manuell als Notable markiert (aus PROJ-5)
  3. **Emerging Risks** — Metriken die 2+ Wochen abwärts trenden, niedrige Acceptance/Reply Rates, Sender mit Problemen
  4. **Talking Points** — Editierbares Textfeld mit auto-generierten Vorschlägen
- [ ] Back-Link zur Übersichtsseite

### AC-3: KPIs & Trends Sektion
- [ ] Folgende Metriken (letzte 7 Tage rolling):
  - Connections sent (absolut + Trend)
  - Connection Acceptance Rate (% + Trend)
  - Messages started (absolut + Trend)
  - Reply Rate (% + Trend)
  - Replies received (absolut + Trend)
  - Week-over-week Gesamtbewertung: "Improved" / "Stable" / "Declining"
- [ ] Datenquelle: `/api/campaigns/snapshot` (bestehender PROJ-3 Endpunkt)

### AC-4: Notable Conversations Sektion
- [ ] Zeigt Conversations aus dem Workspace der letzten 7 Tage die:
  - Tag "interested" oder "referral" haben ODER
  - Als `is_notable = true` markiert sind ODER
  - `conversation_depth_category` = '3+ touch' haben
- [ ] Pro Conversation anzeigen:
  - Lead-Name, Position, Firma
  - Tag-Kategorie (Badge)
  - Letzte Nachricht (Vorschau, max 100 Zeichen)
  - Datum der letzten Nachricht
- [ ] Klick öffnet expandierte Ansicht mit vollständigem Conversation-Detail (wie PROJ-5 AC-3)
- [ ] Sortiert nach Datum (neueste zuerst)
- [ ] Max. 10 Conversations anzeigen, "Alle anzeigen" Link → `/dashboard/messaging` mit Workspace-Filter
- [ ] Datenquelle: `/api/conversations` (bestehender PROJ-5 Endpunkt) mit Workspace + Zeitraum Filter

### AC-5: Emerging Risks Sektion
- [ ] Zeigt Warnungen wenn:
  - Reply Rate oder Acceptance Rate 2+ aufeinanderfolgende Wochen sinkt
  - Reply Rate unter 5% (red threshold)
  - Acceptance Rate unter 8% (red threshold)
  - Workspace als "inactive" oder "low_activity" eingestuft ist
- [ ] Jedes Risiko zeigt:
  - Beschreibung des Problems (z.B. "Reply Rate sinkt seit 3 Wochen: 12% → 8% → 5%")
  - Severity: Warning (gelb) / Critical (rot)
  - Empfohlene Aktion (z.B. "Messaging überprüfen", "Sender-Accounts prüfen")
- [ ] Wenn keine Risiken: "Keine aktuellen Risiken" anzeigen
- [ ] Datenquelle: Kombiniert aus `/api/campaigns/snapshot` und `/api/campaigns/weekly-review`

### AC-6: Talking Points Sektion (Editierbar + Wochen-Archiv)
- [ ] Auto-generierte Talking Points basierend auf:
  - Top-KPIs und deren Veränderung (z.B. "Reply Rate stieg um 15% auf 12.3%")
  - Anzahl und Typ der Notable Conversations (z.B. "3 neue Interested-Replies")
  - Aktive Risiken (z.B. "Acceptance Rate unter Schwellenwert")
- [ ] Editierbares Textfeld (Textarea) unter den auto-generierten Punkten
  - AM kann eigene Notizen hinzufügen, bearbeiten, löschen
  - Auto-Save mit 3-Sekunden Debounce
  - Visual Indicator: "Gespeichert" / "Speichert..."
- [ ] Wochen-Archiv:
  - Talking Points werden pro Woche gespeichert (Kalenderwoche als Key)
  - Dropdown/Selector um vergangene Wochen einzusehen
  - Vergangene Wochen sind read-only
  - Aktuelle Woche ist editierbar
- [ ] Neue DB-Tabelle: `am_talking_points`
  - `id` (PK)
  - `user_id` (FK → profiles.id)
  - `workspace` (text)
  - `week_start` (date — Montag der Kalenderwoche)
  - `auto_generated` (text — die generierten Punkte)
  - `user_notes` (text — die vom AM bearbeiteten Notizen)
  - `created_at`, `updated_at` (timestamptz)
  - Unique constraint: (`user_id`, `workspace`, `week_start`)

### AC-7: Copy-to-Clipboard
- [ ] Button "Summary kopieren" auf der Detailseite
- [ ] Kopiert die gesamte Zusammenfassung als formatiertes Markdown:
  ```
  ## [Workspace] — Woche [Datum] - [Datum]

  **Health:** 🟢/🟡/🔴 [Status]
  **Connections (7d):** [Zahl] ([Trend])
  **Acceptance Rate:** [%] ([Trend])
  **Reply Rate:** [%] ([Trend])
  **Replies:** [Zahl]

  ### Notable Conversations
  - [Lead Name] ([Firma]) — [Tag]
  - ...

  ### Risiken
  - [Risiko-Beschreibung]
  - ...

  ### Talking Points
  - [Auto-generierte Punkte]
  - [User-Notizen]
  ```
- [ ] Toast-Nachricht: "Summary in Zwischenablage kopiert"
- [ ] Fallback: `navigator.clipboard` mit Fehlerbehandlung

### AC-8: Workspace-Zuweisung (Admin-Settings)
- [ ] Neue Settings-Seite: `/dashboard/am-summary/settings`
- [ ] Nur für Admins zugänglich (oder alle, je nach Auth-Setup)
- [ ] Zeigt alle Team-Mitglieder (aus `profiles` Tabelle)
- [ ] Pro Mitglied: Multi-Select der verfügbaren Workspaces
- [ ] Speichert Zuweisungen in neuer DB-Tabelle: `workspace_assignments`
  - `id` (PK)
  - `user_id` (FK → profiles.id)
  - `workspace` (text)
  - `assigned_by` (FK → profiles.id)
  - `assigned_at` (timestamptz)
  - Unique constraint: (`user_id`, `workspace`)
- [ ] Wenn ein User keine Zuweisungen hat → AM Summary zeigt alle Workspaces
- [ ] Änderungen werden sofort wirksam

## Edge Cases
- **AM hat keine zugewiesenen Workspaces** → Alle Workspaces anzeigen mit Hinweis "Keine Workspace-Zuweisung. Alle Workspaces werden angezeigt."
- **Keine Notable Conversations diese Woche** → Sektion zeigt "Keine bemerkenswerten Conversations diese Woche" mit Link zu Messaging Insights
- **Workspace war die gesamte Woche inaktiv** → Karte zeigt "Keine Aktivität" mit letztem Aktivitätsdatum. Detailseite zeigt historische Daten der letzten aktiven Woche
- **Talking Points bearbeitet aber nicht gespeichert** → Auto-Save nach 3s Debounce. Kein Datenverlust bei Navigation
- **Mehrere AMs dem gleichen Workspace zugewiesen** → Beide sehen die gleichen Daten. Talking Points sind pro User getrennt
- **Erste Woche (kein Archiv vorhanden)** → Wochen-Dropdown zeigt nur aktuelle Woche. "Noch kein Archiv vorhanden"
- **Workspace existiert in Zuweisungen aber hat keine Daten** → Karte zeigt "Keine Daten verfügbar" mit Prompt zum CSV-Upload
- **Copy-to-Clipboard fehlgeschlagen** → Fallback-Nachricht: "Kopieren fehlgeschlagen. Bitte manuell kopieren."

## Technical Requirements
- Performance: Übersichtsseite lädt in < 3 Sekunden
- Performance: Detailseite lädt in < 2 Sekunden
- Auto-Save: 3-Sekunden Debounce auf Talking Points
- Copy: Markdown-formatierter Text via `navigator.clipboard.writeText()`
- Responsive: Desktop und Tablet
- Daten-Wiederverwendung: Nutzt bestehende PROJ-3 und PROJ-5 API-Endpunkte wo möglich

## Neue Datenbank-Tabellen

### `am_talking_points`
Speichert editierbare Talking Points pro User, Workspace und Woche.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → profiles.id, NOT NULL |
| workspace | text | NOT NULL |
| week_start | date | NOT NULL |
| auto_generated | text | NULL |
| user_notes | text | NULL |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Unique: (`user_id`, `workspace`, `week_start`)
RLS: User kann eigene Einträge lesen/schreiben. Admins können alle lesen.

### `workspace_assignments`
Speichert Workspace-Zuweisungen pro User.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK → profiles.id, NOT NULL |
| workspace | text | NOT NULL |
| assigned_by | uuid | FK → profiles.id, NULL |
| assigned_at | timestamptz | default now() |

Unique: (`user_id`, `workspace`)
RLS: Alle authentifizierten User können lesen. Nur Admins können schreiben.

## Neue API-Endpunkte

| Route | Methode | Zweck |
|-------|---------|-------|
| `/api/am-summary` | GET | Übersichtsdaten für zugewiesene Workspaces (aggregiert aus PROJ-3 + PROJ-5) |
| `/api/am-summary/[workspace]` | GET | Detaildaten für einen Workspace inkl. Risks |
| `/api/am-summary/talking-points` | GET/PUT | Talking Points lesen und speichern |
| `/api/am-summary/assignments` | GET/PUT | Workspace-Zuweisungen verwalten |

---

## Tech Design (Solution Architect)

### Component Structure

```
/dashboard/am-summary (Übersichtsseite)
+-- AMSummaryPage (Client Component)
|   +-- useAMSummary() Hook (fetches workspace overview data)
|   +-- AMSummaryHeader
|   |   +-- Titel + Beschreibung
|   |   +-- Link zu Settings (wenn Admin)
|   +-- AMWorkspaceGrid
|       +-- AMWorkspaceCard (pro zugewiesenem Workspace)
|           +-- HealthBadge (bestehendes Component ✓)
|           +-- ActivityIndicator (bestehendes Component ✓)
|           +-- KPI-Zeile: Connections, Reply Rate, Replies
|           +-- TrendArrow (bestehendes Component ✓) pro KPI
|           +-- Notable Conversations Count (Badge)
|           +-- Risiko-Count (Badge, wenn > 0)
|           +-- Klick → navigiert zu Detail

/dashboard/am-summary/[workspace] (Detailseite)
+-- AMWorkspaceDetailPage (Client Component)
|   +-- useAMWorkspaceDetail() Hook (fetches detail data)
|   +-- Breadcrumb → zurück zur Übersicht
|   +-- DetailHeader (Name, HealthBadge, ActivityIndicator, Zeitraum)
|   +-- Tabs oder Sektionen:
|       +-- AMKPISection
|       |   +-- KPI-Karten mit Current / Previous / Trend
|       |   +-- TrendArrow (bestehendes Component ✓)
|       |   +-- Gesamtbewertung Badge (Improved/Stable/Declining)
|       +-- AMNotableConversations
|       |   +-- Conversation-Liste (max 10)
|       |   +-- ConversationDetailRow (bestehendes Component ✓)
|       |   +-- "Alle anzeigen" Link → /dashboard/messaging?workspace=X
|       +-- AMEmergingRisks
|       |   +-- Risiko-Karten mit Severity Badge
|       |   +-- SeverityBadge (bestehendes Component ✓)
|       |   +-- Empfohlene Aktionen
|       |   +-- Leer-Zustand: "Keine aktuellen Risiken"
|       +-- AMTalkingPoints
|           +-- Auto-generierte Punkte (read-only Liste)
|           +-- Editierbares Textarea (Auto-Save, 3s Debounce)
|           +-- Save-Status Indicator ("Gespeichert" / "Speichert...")
|           +-- Wochen-Archiv Dropdown (vergangene Wochen read-only)

/dashboard/am-summary/settings (Admin-Settings)
+-- AMSettingsPage (Client Component)
    +-- useWorkspaceAssignments() Hook
    +-- Team-Mitglieder Liste
        +-- Pro Mitglied: Multi-Select für Workspaces
        +-- Speichern-Button
```

### Wiederverwendete Components (bereits vorhanden)

| Component | Aus Feature | Zweck in PROJ-7 |
|-----------|-------------|-----------------|
| `HealthBadge` | PROJ-3 | Health-Status auf Karten + Detailseite |
| `TrendArrow` | PROJ-3 | Trend-Richtung bei KPIs |
| `ActivityIndicator` | PROJ-9 | Activity Level (active/low/inactive) |
| `ConversationDetailRow` | PROJ-5 | Notable Conversations expandierbar |
| `SeverityBadge` | PROJ-8 | Risiko-Severity (Warning/Critical) |

### Neue Components (zu erstellen)

| Component | Zweck |
|-----------|-------|
| `AMWorkspaceCard` | Kompakte Workspace-Karte für die Übersicht |
| `AMKPISection` | KPI-Raster mit Vergleich zur Vorwoche |
| `AMNotableConversations` | Notable Conversations Liste mit Expand |
| `AMEmergingRisks` | Risiko-Warnungen mit Severity + Aktion |
| `AMTalkingPoints` | Editierbares Textarea + Wochen-Archiv |
| `AMCopyButton` | Copy-to-Clipboard für formatierte Zusammenfassung |

### Datenfluss

```
Übersichtsseite:
  useAMSummary() → GET /api/am-summary
    → Backend aggregiert intern:
       • GET /api/campaigns/snapshot (PROJ-3 Daten)
       • DB-Query: workspace_assignments (für User-Filter)
       • DB-Query: conversations (Notable Count)
       • Risiko-Berechnung (Trend-Analyse)
    → Liefert: Workspace-Karten-Daten

Detailseite:
  useAMWorkspaceDetail(workspace) → GET /api/am-summary/[workspace]
    → Backend aggregiert intern:
       • Snapshot-Daten für diesen Workspace
       • Notable Conversations (aus conversations Tabelle)
       • Risiko-Berechnung (multi-week Trend-Analyse)
       • Talking Points (aus am_talking_points Tabelle)
    → Liefert: Vollständige Detail-Daten

Talking Points speichern:
  PUT /api/am-summary/talking-points
    → Upsert in am_talking_points Tabelle
    → Auto-Save mit 3s Debounce im Frontend

Workspace-Zuweisungen:
  GET/PUT /api/am-summary/assignments
    → CRUD auf workspace_assignments Tabelle
```

### Datenmodell (Klartext)

**Talking Points** (neue Tabelle `am_talking_points`):
- Speichert pro User, pro Workspace, pro Kalenderwoche
- Auto-generierte Punkte werden beim ersten Laden einer Woche erzeugt und gespeichert
- User-Notizen werden separat gespeichert (nicht mit auto-generierten vermischt)
- Vergangene Wochen sind nach Ablauf read-only
- Woche wird als Montag-Datum identifiziert (z.B. 2026-03-09)

**Workspace-Zuweisungen** (neue Tabelle `workspace_assignments`):
- Verknüpft einen User mit einem oder mehreren Workspaces
- Wenn ein User keine Zuweisungen hat → sieht alle Workspaces
- Admins können Zuweisungen für andere User verwalten
- `assigned_by` trackt wer die Zuweisung vorgenommen hat

### Risiko-Berechnung (Emerging Risks)

Die Risiko-Erkennung passiert serverseitig im `/api/am-summary/[workspace]` Endpunkt:

**Regeln:**
1. **Reply Rate sinkt** — 2+ aufeinanderfolgende Wochen Abwärtstrend → Warning; 3+ Wochen → Critical
2. **Reply Rate unter 5%** → Critical (roter Schwellenwert aus PROJ-8)
3. **Acceptance Rate unter 8%** → Critical (roter Schwellenwert aus PROJ-8)
4. **Inaktivität** — Workspace als "inactive" oder "low_activity" → Warning

**Datenquelle:** Nutzt die wöchentlichen Snapshot-Daten (bereits in `daily_activity_metrics` gespeichert) und berechnet den Multi-Wochen-Trend über 3-4 Wochen Rückblick.

**Output pro Risiko:**
- Beschreibung (z.B. "Reply Rate sinkt seit 3 Wochen: 12% → 8% → 5%")
- Severity: Warning oder Critical
- Empfohlene Aktion (vordefinierte Texte basierend auf Risiko-Typ)

### Talking Points Auto-Generierung

Die auto-generierten Talking Points werden beim ersten Laden einer neuen Woche erzeugt:

**Quellen:**
- KPI-Veränderungen (aus Snapshot-Daten): "Reply Rate stieg um 15% auf 12.3%"
- Notable Conversations Count + Typen: "3 neue Interested-Replies, 1 Referral"
- Aktive Risiken: "Achtung: Acceptance Rate unter Schwellenwert (7.2%)"
- Activity Level: "Workspace war diese Woche aktiv mit 5 Tagen Daten"

**Format:** Bullet-Point Liste, auf Deutsch, max 5-7 Punkte.

### Tech-Entscheidungen

| Entscheidung | Begründung |
|-------------|------------|
| **Server-seitige Aggregation** statt mehrere Client-Requests | Reduziert Ladezeit: Ein API-Call statt 3-4 separate. Performance-Ziel < 3s |
| **Bestehende APIs intern aufrufen** (nicht duplizieren) | Konsistenz: Gleiche Berechnungslogik wie in PROJ-3/PROJ-5. Kein doppelter Code |
| **Auto-Save mit Debounce** statt manueller Speicher-Button | UX: Kein Datenverlust bei Navigation. Bekanntes Pattern (Google Docs) |
| **Wochen-Key als Montag-Datum** | Eindeutig, Timezone-unabhängig, einfach zu berechnen |
| **Client-Side Rendering** mit Custom Hooks | Konsistent mit allen anderen Dashboard-Seiten (PROJ-3, 5, 8, 9) |
| **Risiko-Berechnung serverseitig** | Braucht Multi-Wochen-Daten, zu komplex für Frontend |
| **Copy als Markdown** statt Rich-Text | Universell: funktioniert in Slack, Email, Notion. Kein spezielles Clipboard-API nötig |

### Dependencies (zu installierende Pakete)

Keine neuen Pakete nötig. Alle benötigten Libraries sind bereits vorhanden:
- `@supabase/ssr` — DB-Zugriff und Auth
- `shadcn/ui` — Card, Badge, Button, Textarea, Select, Tabs, Separator, Tooltip
- `lucide-react` — Icons (Copy, AlertTriangle, CheckCircle, etc.)
- `sonner` — Toast-Nachrichten (bereits für Copy-Feedback genutzt)

### Neue API-Endpunkte (Detail)

| Route | Methode | Input | Output |
|-------|---------|-------|--------|
| `/api/am-summary` | GET | — (User aus Auth) | `{ workspaces: AMWorkspaceCard[], userAssignments: string[] }` |
| `/api/am-summary/[workspace]` | GET | `?workspace=X` | `{ kpis, notableConversations, risks, talkingPoints, weekArchive }` |
| `/api/am-summary/talking-points` | GET | `?workspace=X&week=YYYY-MM-DD` | `{ auto_generated, user_notes, week_start }` |
| `/api/am-summary/talking-points` | PUT | `{ workspace, week_start, user_notes }` | `{ success: true, updated_at }` |
| `/api/am-summary/assignments` | GET | — | `{ assignments: { user_id, workspace }[] }` |
| `/api/am-summary/assignments` | PUT | `{ user_id, workspaces: string[] }` | `{ success: true }` |

### Sidebar-Erweiterung

Neuer Eintrag in der Sidebar-Navigation:
- **Label:** "AM Summary"
- **Icon:** `ClipboardList` (aus lucide-react)
- **Position:** Nach "Messaging Insights" (Position 6)
- **Pfad:** `/dashboard/am-summary`
- **Match:** Prefix-Match (für Unterseiten)

### RLS-Policies (Klartext)

**`am_talking_points`:**
- SELECT: User kann eigene Einträge lesen (user_id = auth.uid)
- INSERT/UPDATE: User kann eigene Einträge schreiben (user_id = auth.uid)
- SELECT für Admins: Admins können alle Einträge lesen (über profiles.role = 'admin')

**`workspace_assignments`:**
- SELECT: Alle authentifizierten User können alle Zuweisungen lesen
- INSERT/UPDATE/DELETE: Nur Admins (profiles.role = 'admin')

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
