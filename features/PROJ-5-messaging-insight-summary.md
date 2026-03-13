# PROJ-5: Weekly Messaging Insight Summary (Layer 3)

## Status: Planned
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs conversation data

## User Stories
- As a team lead, I want to see which opening messages get the most replies so that we can double down on effective hooks
- As a campaign operator, I want to identify recurring objections so that I can adjust messaging or targeting
- As an account manager, I want to see conversation quality trends so that I can report messaging effectiveness to clients
- As a team member, I want to browse recent conversations filtered by response type so that I can quickly find interesting reply patterns

## Acceptance Criteria
- [ ] Conversation browser with filters:
  - By workspace
  - By conversation depth (1-touch, 2-touch, 3+ touch)
  - By date range
  - By sender account
  - By inbound reply status (replied / not replied)
- [ ] Reply analysis view showing:
  - Total conversations with replies vs. without
  - Conversation depth distribution (pie or bar chart)
  - Most active sender accounts by reply rate
- [ ] Conversation detail view showing:
  - Lead info (name, position, company, location)
  - Full message thread (outbound + inbound)
  - Conversation depth category
  - Custom fields / message variants used
- [ ] Reply categorization (manual tagging in MVP):
  - Interested / Positive
  - Objection / Pushback
  - Not now / Timing
  - Wrong person / Left company
  - Not interested / Rejection
  - Referral / Redirect
- [ ] Weekly summary card showing:
  - Number of new replies this week
  - Reply category breakdown
  - Notable conversations (flagged by user or by depth > 2)
- [ ] Search across conversation content (message text)

## Edge Cases
- What happens if a conversation has no inbound replies? → Show as "No reply" with outbound message only
- What happens if custom_fields is empty or malformed? → Display "No additional data" gracefully
- What happens if lead_position or lead_company is missing? → Show "Unknown" with available fields
- What happens if there are 1000+ conversations? → Paginate results (25 per page)
- What happens if the same conversation_id appears in multiple uploads? → Upsert to latest data, preserve manual tags

## Technical Requirements
- Performance: Conversation list loads in < 2 seconds with pagination
- Search: Full-text search on message content
- Manual tags: Stored in Supabase, linked to conversation_id

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
