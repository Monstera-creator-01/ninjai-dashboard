# PROJ-8: Campaign Intervention Flag System (Layer 6)

## Status: Planned
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
