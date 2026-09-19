# GovTrack SA: DSAC Public Entities & NPO Reporting Platform

A React + TypeScript (Vite) prototype for the DSAC "Public Entities Reporting System" challenge. **It has no
backend**: all data lives in the browser's local storage, so it is a demonstration build and must not hold real
personal or financial records (see *Limitations*).

## Run it

```bash
npm ci            # reproducible install from package-lock.json
npm run dev       # http://localhost:3000
npm run check     # type-check + tests + production build (what CI runs)
```

Demo mode is on by default: it seeds the demo organisations and shows the one-click demo sign-in buttons. The
demo accounts share one non-secret password (`VITE_DEMO_PASSWORD`, default in `src/config/demoMode.ts`). For any
real deployment set `VITE_DEMO_MODE=false`. See `.env.example`.

## How the numbers are produced (single source of truth)

Every money figure is derived from three records. Nothing is typed into a screen or back-filled by the engine.

| Fact | Source of truth | Notes |
|---|---|---|
| Approved budget | `EntityBudgetProfile.approvedAmount` (lines always add up to it) | set only by a DSAC decision |
| Amount disbursed | `DisbursementRecord` ledger (sum of `RELEASED`) | tranches release in order, never above approved |
| Expenditure | `QuarterlyFinancialSubmission` (sum of its expense lines) | counts once lodged and certified; accepted returns are "verified" |

`PublicEntity.budgetAllocationZAR / transferredAmountZAR / reportedExpenditureZAR` are a **read cache** rebuilt by
the store; they cannot be written directly. The dashboards, the entity pages, the portfolio totals and the AI
analyst all read the same functions in `src/services/financialService.ts` and `calculationEngine.ts`.

**Metric definitions** (used everywhere, always named):

- **Budget Utilisation** = actual to date / approved annual budget
- **Transfer Absorption** = actual to date / disbursed to date
- **Left to disburse** = approved - disbursed; **Left to spend** = approved - actual to date
- **Achievement** (KPIs) = actual / year-to-date target. Portfolio performance is the equal-weight average of each
  KPI's achievement capped at 100%, so unlike units (visitors, workshops, jobs) are never summed together.

Return workflow: `DRAFT` (not certified, not counted) -> `SUBMITTED` (counted as reported) -> `APPROVED`
(verified and locked) or `CORRECTION_REQUIRED` (excluded until resubmitted).

## Reporting period

`src/services/reportingPeriod.ts` is the only place that decides the current financial year and quarter, and the
only financial-year normaliser. The demonstration data is frozen at **2025/26 Q3** (statutory cut-off 31 Jan
2026). Change it with `VITE_REPORTING_PERIOD` or `derivePeriodFromDate()`.

## Navigation and the entity page

The DSAC sidebar has the six items the specification asks for. Everything that used to be a sidebar item is a
sub-tab inside one of them, so no screen was lost. The definition lives in `src/config/dsacNavigation.ts`, which
also maps every older section id, so links written against the old names still work.

| Item | Sub-tabs |
|---|---|
| Dashboard | Overview, Targets & Delivery, Budgets & Spending, Trends, AI Analyst |
| Entities & NPOs | the list, then one page per organisation |
| Reports | Quarterly Reports, Evidence Vault, Parliament Questions |
| Requests & Support | Support Requests, Directives & Tasks |
| Alerts | Risk & Early Warning, Deadlines & Rules, Notifications |
| Administration | Audit Trail, Settings, Security & Privacy |

Every drill-down to one organisation opens the **same six-tab page** (Overview, Performance, Finance, Compliance,
Reports, Profile) inside the DSAC shell, so the sidebar stays. Funding-tranche release, statutory holds, return
review and document verification are done there, on the tab where the evidence is. The header bell and each
page's "Needs attention" list come from `src/services/attention.ts`, which reads the same engines as the
dashboards, so an alert can never disagree with a headline figure.

## Tests

`npm test` runs `src/services/__tests__/`:

- `reconciliation.test.ts`: portfolio = engine = sum of entities for every period, budget lines and returns foot,
  disbursement and workflow controls, document verification, authorisation, authentication, and guards that fail
  the build if a credential, a typed monetary total or a synthetic content generator is committed.
- `navigation.test.ts`: six primary items, every legacy id resolves, alerts agree with the headline counts and
  follow the data, and the retired side panel and drawer stay gone.

## Limitations (read before showing this as "live")

- **No server.** No shared truth between users, no real-time comments, no Microsoft 365 / Entra ID integration, and
  document "downloads" are metadata stubs. Authentication and role checks run in the browser, so they deter honest
  mistakes but cannot stop a determined user. Production needs a server (API + database), SSO with MFA,
  South-African-region hosting, encryption at rest, and an append-only audit store.
- **Seed data is synthetic.** Budgets, returns and the tranche ledger are generated in `src/data/financialSeed.ts`
  from the original demonstration figures; prior-year quarterly KPI results are interpolated from annual results and
  labelled as such. Replace both with real imports.
- The AI analyst is **rule-based**, not a language model.
