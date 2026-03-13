# PROJ-1: Authentication & User Management

## Status: Planned
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

## Dependencies
- None (foundation feature)

## User Stories
- As a team member, I want to log in with my email so that only authorized Ninja Marketing staff can access the dashboard
- As a team lead, I want to invite new team members so that they can access the dashboard
- As a team member, I want to stay logged in across sessions so that I don't have to re-authenticate every time
- As a team lead, I want to assign roles (Operator, Account Manager, Team Lead) so that team members see relevant views
- As a team member, I want to reset my password if I forget it so that I can regain access

## Acceptance Criteria
- [ ] Users can sign up with email + password via Supabase Auth
- [ ] Users can log in and are redirected to the main dashboard
- [ ] Users can log out and are redirected to the login page
- [ ] Unauthenticated users are redirected to the login page when accessing any dashboard route
- [ ] Password reset flow works via email
- [ ] User roles are stored in a Supabase `profiles` table (operator, account_manager, team_lead)
- [ ] Role is displayed in the UI (e.g., user menu or profile area)
- [ ] Team lead can invite users by email
- [ ] Session persists across browser refreshes

## Edge Cases
- What happens if a user tries to sign up with an already-registered email? → Show clear error message
- What happens if the password reset email doesn't arrive? → Allow resend after 60 seconds
- What happens if an invited user never completes registration? → Invitation expires after 7 days
- What happens if there's only one team lead and they try to downgrade their own role? → Prevent removal of last team lead
- What happens if Supabase is unreachable? → Show connection error with retry option

## Technical Requirements
- Authentication: Supabase Auth (email + password)
- Session management: Supabase session tokens with auto-refresh
- Role storage: `profiles` table linked to `auth.users`
- Protected routes: Middleware-based auth guard on all `/dashboard/*` routes
- Browser Support: Chrome, Firefox, Safari, Edge

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
