# PROJ-5: Weekly Messaging Insight Summary (Layer 3)

## Status: Planned
**Created:** 2026-03-13
**Last Updated:** 2026-03-14

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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
