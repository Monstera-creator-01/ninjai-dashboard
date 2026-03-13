# Product Requirements Document

## Vision
Build an internal reporting dashboard for Ninja Marketing that connects **Activity → Responses → Conversation Quality → Strategic Recommendations** across all outbound LinkedIn campaigns managed via Heyreach. The system converts raw outreach data into operational intelligence so the team can continuously monitor campaign performance, detect problems early, and extract actionable insights — replacing reactive month-end reviews with a structured, always-on campaign intelligence system.

## Target Users
**Ninja Marketing team (3 people)** — a small outbound marketing agency managing LinkedIn campaigns for multiple clients.

- **Account Managers** — manage client relationships, need campaign summaries, talking points, and performance overviews to prepare for client calls
- **Campaign Operators** — run day-to-day campaigns, need real-time metrics, sender account productivity, and intervention alerts
- **Team Lead** — oversees all campaigns, needs the full strategic picture across all clients

### Pain Points
- Manual digging through Heyreach exports to understand campaign health
- Reactive troubleshooting instead of proactive campaign management
- No structured way to extract messaging insights from conversations
- Month-end reporting instead of continuous monitoring
- No early warning system for underperforming campaigns

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | Authentication & User Management | Planned |
| P0 (MVP) | CSV Data Import (Heyreach) | Planned |
| P0 (MVP) | Campaign Intelligence Snapshot (Layer 1) | Planned |
| P0 (MVP) | Weekly Campaign Health Review (Layer 2) | Planned |
| P0 (MVP) | Campaign Intervention Flag System (Layer 6) | Planned |
| P0 (MVP) | Operator Dashboard (Layer 7) | Planned |
| P1 | Weekly Messaging Insight Summary (Layer 3) | Planned |
| P1 | Segment Comparison Analysis (Layer 4) | Planned |
| P1 | Account Manager Campaign Summary (Layer 5) | Planned |

## Data Sources
- **Heyreach CSV exports** (MVP — manual upload)
  - Daily activity metrics per workspace (connections, messages, replies, rates)
  - Conversation-level data (lead info, message content, reply categorization)
- **Heyreach API** (future — automatic sync)
- **Workspaces/Clients:** UCP, FDI, DataQI, Ninja, Daentra (and future clients)

## Success Metrics
- Team can assess all campaign health in < 5 minutes (vs. 30+ min manual review)
- Underperforming campaigns flagged within 1 week of deterioration (vs. discovered at month-end)
- Weekly messaging insights generated from conversation data
- Reduction in time spent preparing for client calls
- All campaigns visible in a single view with clear health indicators

## Constraints
- **Team size:** Solo developer, no hard deadline — iterative delivery
- **Data input:** CSV upload first, API integration later
- **Platform:** LinkedIn outreach via Heyreach (no email outreach currently)
- **Resource reality:** Small team means prioritizing high-impact insights over comprehensive analysis
- **AI support:** Human workflow first, AI automation (conversation summarization, objection detection) as a later enhancement

## Non-Goals
- Email outreach tracking (LinkedIn only for now)
- Client-facing portal (internal team use only)
- AI-powered conversation analysis (future phase)
- Heyreach API integration (future — CSV upload for MVP)
- InMail tracking (not currently used based on data)
- Multi-agency support (single agency — Ninja Marketing)

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
