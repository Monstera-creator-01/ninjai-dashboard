# PROJ-6: Segment Comparison Analysis (Layer 4)

## Status: Planned
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs conversation data with lead details
- Requires: PROJ-5 (Messaging Insight Summary) — builds on conversation data and reply categorization

## User Stories
- As a team lead, I want to compare performance across different ICP segments so that I can identify which audiences generate the best engagement
- As a campaign operator, I want to see which job titles respond most positively so that I can refine targeting lists
- As an account manager, I want to compare message angles side-by-side so that I can recommend the best approach to clients
- As a team lead, I want to compare workspace performance against each other so that I can allocate resources to the highest-potential campaigns

## Acceptance Criteria
- [ ] Segment builder allowing grouping conversations by:
  - Lead position / job title
  - Lead company
  - Lead location
  - Workspace
  - Sender account
  - Conversation depth category
  - Reply category (from PROJ-5 manual tags)
- [ ] Side-by-side comparison view showing:
  - Total conversations per segment
  - Reply rate per segment
  - Average conversation depth per segment
  - Reply category breakdown per segment
- [ ] Bar chart visualization comparing segments on key metrics
- [ ] Ability to save and name segment comparisons for re-use
- [ ] Cross-workspace comparison:
  - Same metrics across different workspaces
  - Identify which client campaigns are producing commercially relevant conversations
- [ ] Table view with sortable columns for detailed segment analysis

## Edge Cases
- What happens if a segment has fewer than 5 conversations? → Show data with "Low sample size" warning
- What happens if lead_position values are inconsistent (e.g., "CEO" vs "Chief Executive Officer")? → Show raw values; grouping/normalization as future enhancement
- What happens if the user tries to compare more than 5 segments? → Limit to 5 segments per comparison with clear message
- What happens if no conversations match a segment filter? → Show "No data for this segment" empty state
- What happens if reply tags are not yet applied? → Show "Untagged" as a category in breakdowns

## Technical Requirements
- Performance: Segment queries return in < 3 seconds
- Charts: Side-by-side bar charts for comparison
- Saved comparisons: Stored per user in Supabase

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
