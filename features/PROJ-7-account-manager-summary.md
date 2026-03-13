# PROJ-7: Account Manager Campaign Summary (Layer 5)

## Status: Planned
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in
- Requires: PROJ-2 (CSV Data Import) — needs both activity and conversation data
- Requires: PROJ-3 (Campaign Intelligence Snapshot) — uses campaign health metrics
- Requires: PROJ-5 (Messaging Insight Summary) — uses reply categorization

## User Stories
- As an account manager, I want a weekly summary of my client campaigns so that I can prepare for client calls in minutes
- As an account manager, I want to see notable prospect conversations so that I can share relevant examples with clients
- As an account manager, I want talking points auto-generated from campaign data so that client communication is consistent
- As a team lead, I want each AM to have a personal summary view so that preparation work is reduced across the team

## Acceptance Criteria
- [ ] Per-workspace weekly summary page including:
  - Campaign activity levels (connections, messages, replies) for the week
  - Health status (green/yellow/red) with explanation
  - Week-over-week change summary (improved / stable / declining)
  - Key changes: any notable shifts in metrics
- [ ] Notable conversations section:
  - Conversations with depth > 1-touch (prospect replied)
  - Conversations tagged as "Interested" or "Referral"
  - Sortable by date, depth, reply category
- [ ] Emerging risks section:
  - Metrics trending downward for 2+ consecutive weeks
  - Sender accounts with low activity or high rejection
  - Low connection acceptance or reply rates
- [ ] Talking points section (editable text area):
  - Pre-populated with key data points from the week
  - AM can edit, add notes, and save for later reference
- [ ] Copy-to-clipboard for the full summary (formatted for sharing in Slack/email)
- [ ] AM can be assigned to specific workspaces via user settings

## Edge Cases
- What happens if an AM has no assigned workspaces? → Show all workspaces with a prompt to set assignments
- What happens if there are no notable conversations this week? → Show "No notable conversations this week" with a suggestion to review messaging
- What happens if a workspace was inactive for the entire week? → Show "No activity" with last active date
- What happens if talking points are edited but not saved? → Auto-save draft or warn before navigation
- What happens if multiple AMs are assigned to the same workspace? → Both see the same data; talking points are per-user

## Technical Requirements
- Performance: Summary page loads in < 3 seconds
- Copy function: Plain text + markdown formatting
- Editable fields: Auto-save with 3-second debounce

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
