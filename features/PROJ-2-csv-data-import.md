# PROJ-2: CSV Data Import (Heyreach)

## Status: Planned
**Created:** 2026-03-13
**Last Updated:** 2026-03-13

## Dependencies
- Requires: PROJ-1 (Authentication) — user must be logged in to upload data

## User Stories
- As a campaign operator, I want to upload Heyreach CSV exports so that campaign data is available in the dashboard
- As a team member, I want the system to automatically detect which CSV type I'm uploading (activity metrics vs. conversations) so that I don't have to manually categorize files
- As a team member, I want to see upload history so that I know when data was last refreshed
- As a team member, I want to see validation errors if my CSV is malformed so that I can fix and re-upload
- As a campaign operator, I want to upload data for specific workspaces without overwriting other workspaces so that partial updates are safe

## Accepted CSV Formats

### Format 1: Daily Activity Metrics
**File:** `heyreach_all_workspaces_lifetime.csv`
**Fields:** workspace, date, profile_views, post_likes, follows, messages_sent, total_message_started, total_message_replies, inmail_messages_sent, total_inmail_started, total_inmail_replies, connections_sent, connections_accepted, message_reply_rate, inmail_reply_rate, connection_acceptance_rate

### Format 2: Conversation Data
**File:** `heyreach_conversations_sample*.csv`
**Fields:** workspace, conversation_id, read, last_message_at, last_message_sender, is_inbound_reply, total_messages, inbound_message_count, outbound_message_count, conversation_depth_category, lead_first_name, lead_last_name, lead_headline, lead_position, lead_company, lead_location, lead_profile_url, sender_name, sender_email, sender_profile_url, sender_account_id, last_message_text, first_outbound_message, first_inbound_reply, custom_fields

## Acceptance Criteria
- [ ] Upload page accessible from the main navigation
- [ ] Drag-and-drop or file picker for CSV upload
- [ ] System auto-detects CSV type by inspecting column headers
- [ ] Activity metrics CSV: data stored in a `daily_metrics` table with workspace + date as unique key
- [ ] Conversation CSV: data stored in a `conversations` table with conversation_id as unique key
- [ ] Duplicate rows (same workspace+date or same conversation_id) are updated, not duplicated (upsert)
- [ ] Upload progress indicator shown during processing
- [ ] Validation errors displayed: missing required columns, invalid data types, empty file
- [ ] Upload history log shows: filename, type, row count, timestamp, uploaded_by
- [ ] Data is available in the dashboard immediately after successful upload

## Edge Cases
- What happens if the CSV has extra columns not in the schema? → Ignore extra columns, proceed with known ones
- What happens if the CSV has missing columns? → Show error listing which required columns are missing
- What happens if the CSV is empty (headers only)? → Show "No data rows found" warning
- What happens if a very large file is uploaded (>10MB)? → Show file size limit error, suggest splitting
- What happens if the same file is uploaded twice? → Upsert logic prevents duplicates, show "X rows updated" message
- What happens if date format varies in the CSV? → Parse ISO 8601 format (as exported by Heyreach); reject unrecognized formats
- What happens if workspace name doesn't match any existing workspace? → Auto-create the workspace entry

## Technical Requirements
- File size limit: 10MB per upload
- Parsing: Client-side CSV parsing for validation, server-side for storage
- Storage: Supabase PostgreSQL tables
- Performance: Process 1000 rows in < 5 seconds

---

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
