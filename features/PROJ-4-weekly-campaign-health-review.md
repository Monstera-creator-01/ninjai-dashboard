# PROJ-4: Weekly Campaign Health Review (Layer 2)

## Status: Planned
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs activity metrics data
- Requires: PROJ-3 (Campaign Intelligence Snapshot) — builds on snapshot with deeper weekly analysis

## User Stories
- As a team lead, I want a structured weekly review view so that I can evaluate all campaigns in a consistent format every week
- As a campaign operator, I want to see where the outreach funnel is breaking for each workspace so that I can focus my optimization efforts
- As an account manager, I want week-over-week trend charts so that I can communicate campaign trajectory to clients
- As a team lead, I want recommended actions generated from the data so that the team knows what to prioritize

## Acceptance Criteria
- [ ] Week selector allows choosing any week with available data (Mon-Sun)
- [ ] Per-workspace weekly summary showing:
  - Campaign health status badge (green / yellow / red)
  - Connections sent → accepted (with rate)
  - Messages started → replies received (with rate)
  - Profile views and engagement actions (likes, follows)
  - Conversation depth breakdown (1-touch, 2-touch, 3+ touch)
- [ ] Funnel visualization per workspace: Connections Sent → Accepted → Messages Started → Replies
  - Each stage shows count and conversion rate to next stage
  - Highlights where the biggest drop-off occurs
- [ ] Week-over-week comparison table:
  - Current week vs. previous week for all key metrics
  - Percentage change with color coding (green = improved, red = declined)
- [ ] Sender account breakdown within each workspace (who is sending what)
- [ ] Recommended actions section listing campaigns that need intervention and why
- [ ] Export weekly review as a summary (copy-to-clipboard or PDF — future)

## Edge Cases
- What happens if a workspace has partial data for a week (e.g., started mid-week)? → Show available days with a note
- What happens if there are no replies in a given week? → Show 0% reply rate, flag as red
- What happens if a sender account has 0 activity for the entire week? → Flag as "Sender inactive" in the breakdown
- What happens if the user selects a week with no data at all? → Show "No data available for this week"
- How are weekends handled? → Excluded from daily averages but included in weekly totals

## Technical Requirements
- Performance: Weekly aggregation completes in < 3 seconds
- Charts: Line or bar charts for week-over-week trends
- Date handling: Weeks defined as Monday to Sunday

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
