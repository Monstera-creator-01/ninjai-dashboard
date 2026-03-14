# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Planned** - Requirements written, ready for development
- **In Progress** - Currently being built
- **In Review** - QA testing in progress
- **Deployed** - Live in production

## Features

| ID | Feature | Status | Spec | Created |
|----|---------|--------|------|---------|
| PROJ-1 | Authentication & User Management | Deployed | [PROJ-1-authentication.md](PROJ-1-authentication.md) | 2026-03-13 |
| PROJ-2 | CSV Data Import (Heyreach) | In Review | [PROJ-2-csv-data-import.md](PROJ-2-csv-data-import.md) | 2026-03-13 |
| PROJ-3 | Campaign Intelligence Snapshot (Layer 1) | Deployed | [PROJ-3-campaign-intelligence-snapshot.md](PROJ-3-campaign-intelligence-snapshot.md) | 2026-03-13 |
| PROJ-4 | Weekly Campaign Health Review (Layer 2) | Deployed | [PROJ-4-weekly-campaign-health-review.md](PROJ-4-weekly-campaign-health-review.md) | 2026-03-13 |
| PROJ-5 | Weekly Messaging Insight Summary (Layer 3) | Planned | [PROJ-5-messaging-insight-summary.md](PROJ-5-messaging-insight-summary.md) | 2026-03-13 |
| PROJ-6 | Segment Comparison Analysis (Layer 4) | Planned | [PROJ-6-segment-comparison.md](PROJ-6-segment-comparison.md) | 2026-03-13 |
| PROJ-7 | Account Manager Campaign Summary (Layer 5) | Planned | [PROJ-7-account-manager-summary.md](PROJ-7-account-manager-summary.md) | 2026-03-13 |
| PROJ-8 | Campaign Intervention Flag System (Layer 6) | Deployed | [PROJ-8-intervention-flag-system.md](PROJ-8-intervention-flag-system.md) | 2026-03-13 |
| PROJ-9 | Operator Dashboard (Layer 7) | Planned | [PROJ-9-operator-dashboard.md](PROJ-9-operator-dashboard.md) | 2026-03-13 |

<!-- Add features above this line -->

## Next Available ID: PROJ-10

## Recommended Build Order

### Phase 1: Foundation (P0)
1. **PROJ-1** — Authentication & User Management (no dependencies)
2. **PROJ-2** — CSV Data Import (requires PROJ-1)

### Phase 2: Core Dashboard (P0)
3. **PROJ-3** — Campaign Intelligence Snapshot (requires PROJ-2)
4. **PROJ-8** — Intervention Flag System (requires PROJ-2, PROJ-3)
5. **PROJ-4** — Weekly Campaign Health Review (requires PROJ-3)
6. **PROJ-9** — Operator Dashboard (requires PROJ-2, PROJ-8)

### Phase 3: Intelligence Layer (P1)
7. **PROJ-5** — Messaging Insight Summary (requires PROJ-2)
8. **PROJ-6** — Segment Comparison (requires PROJ-5)
9. **PROJ-7** — Account Manager Summary (requires PROJ-3, PROJ-5)
