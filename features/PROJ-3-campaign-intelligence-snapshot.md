# PROJ-3: Campaign Intelligence Snapshot (Layer 1)

## Status: Planned
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs activity metrics data

## User Stories
- As a team lead, I want to see all active campaigns in one view so that I can quickly assess the state of the entire outbound operation
- As an account manager, I want to see client-level performance summaries so that I know which clients need attention
- As a campaign operator, I want to see campaign trend indicators so that I can spot deteriorating campaigns before they become problems
- As a team member, I want to filter the snapshot by workspace/client so that I can focus on specific campaigns
- As a team member, I want to see the date range of available data so that I know how current the information is

## Acceptance Criteria
- [ ] Dashboard shows a card/row for each workspace (UCP, FDI, DataQI, Ninja, Daentra)
- [ ] Each workspace card displays:
  - Total connections sent (lifetime and last 7 days)
  - Connection acceptance rate (last 7 days vs. previous 7 days)
  - Total messages started (last 7 days)
  - Reply rate (last 7 days vs. previous 7 days)
  - Total replies received (last 7 days)
  - Activity level indicator (active / low activity / inactive)
- [ ] Trend arrows (up/down/stable) shown for key metrics comparing current week to previous week
- [ ] Campaign health indicator (green/yellow/red) based on acceptance rate and reply rate thresholds
- [ ] Click on a workspace card drills down to detailed workspace view
- [ ] Summary bar at top shows totals across all workspaces
- [ ] Data freshness indicator shows when data was last uploaded
- [ ] Workspace filter allows viewing one or multiple workspaces

## Health Indicator Thresholds (Configurable)
- **Green:** Acceptance rate > 15% AND reply rate > 10%
- **Yellow:** Acceptance rate 8-15% OR reply rate 5-10%
- **Red:** Acceptance rate < 8% OR reply rate < 5%

## Edge Cases
- What happens if a workspace has no data in the last 7 days? → Show as "Inactive" with last active date
- What happens if there's only 1 week of data (no previous week to compare)? → Show metrics without trend arrows, display "Not enough data for trends"
- What happens if a workspace has weekend-only gaps? → Exclude weekends from activity calculations
- What happens if no data has been uploaded yet? → Show empty state with prompt to upload CSV data
- What happens if a new workspace appears in an upload? → Auto-add it to the snapshot view

## Technical Requirements
- Performance: Dashboard loads in < 2 seconds
- Data aggregation: Server-side for large datasets
- Responsive: Works on desktop and tablet screens

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
