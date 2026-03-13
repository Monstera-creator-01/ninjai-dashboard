# PROJ-9: Operator Dashboard (Layer 7)

## Status: Planned
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs both activity and conversation data
- Requires: PROJ-8 (Intervention Flag System) — shows active flags inline

## User Stories
- As a campaign operator, I want a real-time operational view of all campaigns so that I can manage my daily workload efficiently
- As a campaign operator, I want to see sender account productivity so that I can identify accounts that need attention
- As a campaign operator, I want to see today's and this week's activity at a glance so that I know if outreach volume is on track
- As a campaign operator, I want to see reply quality indicators so that I can prioritize which conversations to handle first

## Acceptance Criteria
- [ ] Daily activity overview (for selected date):
  - Connections sent and accepted today
  - Messages started and replies received today
  - Profile views, post likes, follows today
  - Comparison to same day last week
- [ ] Sender account productivity table:
  - Rows: each sender account (Casey Kelly, Ian Anderson, Tom Short, Jack Sheh, etc.)
  - Columns: connections sent, accepted, messages started, replies, acceptance rate, reply rate
  - Filterable by workspace and date range
  - Color-coded performance (green/yellow/red per metric)
- [ ] Reply quality indicators:
  - Count of new replies today/this week
  - Unread conversations count
  - Conversation depth distribution for recent replies
  - Quick link to conversation browser (PROJ-5)
- [ ] Active intervention flags section (from PROJ-8):
  - Shows high-severity flags at top of dashboard
  - Quick-acknowledge action
- [ ] Campaign activity timeline:
  - Line chart showing daily connections sent and replies over the last 30 days
  - Toggle between workspaces or view all combined
- [ ] Quick-action shortcuts:
  - "Upload new data" → PROJ-2
  - "View weekly review" → PROJ-4
  - "Browse conversations" → PROJ-5
- [ ] Date picker to view historical daily snapshots

## Edge Cases
- What happens if no data exists for today? → Show "No data uploaded for today" with last available date
- What happens if a sender account appears in multiple workspaces? → Show separate rows per workspace
- What happens if there are 20+ sender accounts? → Paginate or allow collapsing by workspace
- What happens if the data is several days old? → Show prominent "Data is X days old" warning banner
- What happens on weekends when there's no activity? → Show weekend as expected low activity, compare to previous weekend

## Technical Requirements
- Performance: Dashboard loads in < 2 seconds
- Charts: Interactive line charts with hover tooltips
- Responsive: Optimized for desktop with acceptable tablet view
- Auto-refresh: Not required for MVP (data is manual CSV upload)

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
