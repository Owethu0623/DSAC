import { PublicEntity } from '../types';
import {
  BudgetLine,
  DisbursementRecord,
  EntityBudgetProfile,
  FinancialQuarter,
  QuarterlyExpenditureLine,
  QuarterlyFinancialStatus,
  QuarterlyFinancialSubmission,
} from '../types/financial';
import { INITIAL_ENTITIES, INITIAL_REPORTS } from './initialData';
import {
  INITIAL_BUDGET_PROFILES,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_QUARTERLY_SUBMISSIONS,
} from './initialFinancialData';
import {
  DEFAULT_REPORTING_PERIOD,
  QUARTER_ORDER,
  allocateProportionally,
  financialYearStart,
  normalizeFinancialYear,
  quarterDueDate,
} from '../services/reportingPeriod';

/**
 * FINANCIAL SEED BASELINE
 *
 * The calculation engine used to fabricate anything that was missing (prior-year budgets at 90-95% of the
 * current allocation, quarterly actuals as a 32/34/34 split of one scalar, and 2026/27 spend copied from
 * 2025/26). That made "not submitted" undetectable and let the same number appear under different years.
 *
 * The same demonstration figures are now materialised here as REAL records: an approved budget profile whose
 * expense lines foot exactly to the header, lodged quarterly returns whose lines sum to the quarter total, and
 * a disbursement ledger. The engine can therefore be strict. In production this file is replaced by imports of
 * the gazetted appropriation, BAS transfers and entity returns.
 */

/**
 * When true, the demonstration spend is spread unevenly (still summing to the same portfolio total) so the
 * early-warning engine has something to discriminate on. Set to false for a uniform spend ratio.
 */
export const SEED_VARIATION_ENABLED = true;

const CURRENT_FY = DEFAULT_REPORTING_PERIOD.financialYear;
const CURRENT_FY_START = financialYearStart(CURRENT_FY);

const CAT_IDS = ['cat-comp', 'cat-goods', 'cat-comm', 'cat-events', 'cat-travel', 'cat-train', 'cat-equip', 'cat-infra', 'cat-trans', 'cat-prof', 'cat-other'];
/** Standard chart-of-accounts order and default split, reused when a budget line breakdown is not supplied. */
export const STANDARD_CATEGORY_IDS = CAT_IDS;
export const STANDARD_CATEGORY_WEIGHTS = [32, 14, 12, 10, 5, 3, 4, 8, 6, 4, 2];
const CAT_WEIGHTS = {
  DEFAULT: [32, 14, 12, 10, 5, 3, 4, 8, 6, 4, 2],
  GRANT: [12, 6, 4, 4, 2, 1, 2, 2, 62, 3, 2],
  NPO: [22, 8, 38, 12, 8, 4, 3, 1, 0, 2, 2],
  HERITAGE: [30, 14, 8, 10, 4, 4, 5, 18, 2, 3, 2],
};

const catName = (id: string) => INITIAL_EXPENSE_CATEGORIES.find(c => c.id === id)?.name || id;

function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const unit = (key: string) => hash32(key) / 4294967296;

function weightsFor(e: PublicEntity): number[] {
  if (e.shortCode === 'NAC' || e.shortCode === 'NFVF') return CAT_WEIGHTS.GRANT;
  if (e.type === 'NPO') return CAT_WEIGHTS.NPO;
  if (e.cluster === 'Heritage & Museums') return CAT_WEIGHTS.HERITAGE;
  return CAT_WEIGHTS.DEFAULT;
}

const fyTag = (fy: string) => fy.replace('/', '');

function daysBefore(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() - days * 86400000).toISOString();
}
function daysAfter(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86400000).toISOString();
}

// ---------------------------------------------------------------------------------------------
// Repairs: applied to hand-authored AND generated records so nothing enters the store un-footed
// ---------------------------------------------------------------------------------------------

export function repairBudgetProfile(profile: EntityBudgetProfile): EntityBudgetProfile {
  if (!profile.lines || profile.lines.length === 0) return profile;
  const approvedSum = profile.lines.reduce((a, l) => a + l.annualBudget, 0);
  const requestedSum = profile.lines.reduce((a, l) => a + l.requestedAmount, 0);
  const needsApproved = profile.approvedAmount > 0 && approvedSum !== profile.approvedAmount;
  const needsRequested = profile.requestedAmount > 0 && requestedSum !== profile.requestedAmount;
  if (!needsApproved && !needsRequested) return profile;

  const approvedParts = needsApproved
    ? allocateProportionally(profile.approvedAmount, profile.lines.map(l => l.annualBudget))
    : profile.lines.map(l => l.annualBudget);
  const requestedParts = needsRequested
    ? allocateProportionally(profile.requestedAmount, profile.lines.map(l => l.requestedAmount))
    : profile.lines.map(l => l.requestedAmount);

  return {
    ...profile,
    fundingGap: profile.requestedAmount - profile.approvedAmount,
    lines: profile.lines.map((l, i) => ({ ...l, annualBudget: approvedParts[i], requestedAmount: requestedParts[i] })),
  };
}

export function repairSubmission(sub: QuarterlyFinancialSubmission, profile?: EntityBudgetProfile): QuarterlyFinancialSubmission {
  const total = sub.lines.reduce((a, l) => a + l.actualAmount, 0);
  const trajectory = profile?.expectedSpendingTrajectory;
  const qi = QUARTER_ORDER.indexOf(sub.quarter);
  const pctPoints = trajectory ? [trajectory.q1Percent, trajectory.q2Percent, trajectory.q3Percent, trajectory.q4Percent] : [25, 50, 75, 100];
  const delta = pctPoints[qi] - (qi > 0 ? pctPoints[qi - 1] : 0);
  return {
    ...sub,
    totalQuarterlyActual: sub.lines.length > 0 ? total : sub.totalQuarterlyActual,
    lines: sub.lines.map(l => {
      const budget = profile?.lines.find(b => b.categoryId === l.categoryId)?.annualBudget;
      return budget !== undefined ? { ...l, plannedAmount: Math.round((budget * delta) / 100) } : l;
    }),
  };
}

// ---------------------------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------------------------

function buildLines(profileId: string, approved: number, requested: number, weights: number[]): BudgetLine[] {
  const ids = CAT_IDS.filter((_, i) => weights[i] > 0);
  const w = weights.filter(x => x > 0);
  const approvedParts = allocateProportionally(approved, w);
  const requestedParts = allocateProportionally(requested, w);
  return ids.map((id, i) => ({
    id: `bl-${profileId}-${i + 1}`,
    budgetId: profileId,
    categoryId: id,
    categoryName: catName(id),
    requestedAmount: requestedParts[i],
    annualBudget: approvedParts[i],
  }));
}

function buildProfile(e: PublicEntity, fy: string, approved: number, requested: number): EntityBudgetProfile {
  const start = financialYearStart(fy);
  const id = `bp-gen-${e.id}-${fyTag(fy)}`;
  return {
    id,
    entityId: e.id,
    entityName: e.name,
    financialYear: fy,
    requestedAmount: requested,
    approvedAmount: approved,
    fundingGap: requested - approved,
    status: 'APPROVED',
    requestDate: `${start}-01-15`,
    approvalDate: `${start}-03-22`,
    reviewedByName: 'DSAC Finance Directorate',
    reviewDate: `${start}-03-22`,
    justification: `Annual allocation for ${fy} per the gazetted Vote 37 appropriation (demonstration baseline).`,
    expectedSpendingTrajectory: { q1Percent: 25, q2Percent: 50, q3Percent: 75, q4Percent: 100 },
    createdAt: `${start}-01-15T08:00:00Z`,
    updatedAt: `${start}-03-22T14:00:00Z`,
    lines: buildLines(id, approved, requested, weightsFor(e)),
  };
}

function buildSubmission(
  e: PublicEntity,
  fy: string,
  q: FinancialQuarter,
  total: number,
  status: QuarterlyFinancialStatus,
  profile: EntityBudgetProfile
): QuarterlyFinancialSubmission {
  const id = `qs-gen-${e.id}-${fyTag(fy)}-${q}`;
  const base = weightsFor(e);
  const spendWeights = CAT_IDS.map((cid, i) => (base[i] > 0 ? base[i] * (0.85 + unit(`${e.id}|${fy}|${q}|${cid}`) * 0.3) : 0));
  const idx = spendWeights.map((w, i) => (w > 0 ? i : -1)).filter(i => i >= 0);
  const parts = allocateProportionally(total, idx.map(i => spendWeights[i]));
  const due = quarterDueDate(fy, q);
  const submittedAt = daysBefore(due, 5);
  const lines: QuarterlyExpenditureLine[] = idx.map((i, k) => ({
    id: `qsl-${id}-${k + 1}`,
    quarterlySubmissionId: id,
    categoryId: CAT_IDS[i],
    categoryName: catName(CAT_IDS[i]),
    actualAmount: parts[k],
    plannedAmount: Math.round((profile.lines.find(l => l.categoryId === CAT_IDS[i])?.annualBudget || 0) * 0.25),
  }));
  return {
    id,
    entityId: e.id,
    entityName: e.name,
    financialYear: fy,
    quarter: q,
    status,
    submittedAt,
    submittedByName: e.reportingOfficerName || e.headOfEntity,
    totalQuarterlyActual: total,
    supportingDocumentIds: [],
    accountingOfficerAffirmation: true,
    accountingOfficerName: e.headOfEntity,
    createdAt: submittedAt,
    updatedAt: daysAfter(submittedAt, 7),
    reviewedAt: status === 'APPROVED' ? daysAfter(submittedAt, 7) : undefined,
    reviewedByName: status === 'APPROVED' ? 'DSAC Finance Directorate' : undefined,
    lines,
  };
}

/** Q3 return status mirrors what the entity's performance report for that quarter is doing. */
function currentQ3ReturnStatus(e: PublicEntity): QuarterlyFinancialStatus | null {
  const report = INITIAL_REPORTS.find(r => r.entityId === e.id && r.quarter === 'Q3');
  if (!report) return 'APPROVED';
  switch (report.submissionStatus) {
    case 'OVERDUE':
      return null; // no return has been lodged
    case 'CORRECTION_REQUIRED':
      return /asset|accounting|financ|expenditure|voucher|ledger/i.test(`${report.reviewNotes || ''} ${report.rejectionReason || ''}`)
        ? 'CORRECTION_REQUIRED'
        : 'APPROVED';
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
    case 'RESUBMITTED':
      return 'SUBMITTED';
    default:
      return 'APPROVED';
  }
}

const RISK_BURN_FACTOR: Record<string, number> = { CRITICAL: 1.3, HIGH: 1.25, MEDIUM: 1.05, LOW: 0.95 };

/**
 * Year-to-date (Q1-Q3) spend per entity for the current year. Sums to exactly the same portfolio total as the
 * original demonstration figures, but spread unevenly (higher burn for higher-risk entities) instead of every
 * entity sitting at an identical 62.6% of transfers.
 */
function seededCurrentYtd(entities: PublicEntity[], fixed: Map<string, number>): Map<string, number> {
  const result = new Map<string, number>();
  const free = entities.filter(e => !fixed.has(e.id));
  fixed.forEach((v, k) => result.set(k, v));

  if (!SEED_VARIATION_ENABLED) {
    free.forEach(e => result.set(e.id, e.reportedExpenditureZAR));
    return result;
  }

  const target = free.reduce((a, e) => a + e.reportedExpenditureZAR, 0);
  const base = free.map(e => {
    const legacyRatio = e.transferredAmountZAR > 0 ? e.reportedExpenditureZAR / e.transferredAmountZAR : 0.6;
    return legacyRatio * (1 + (unit(`${e.id}|burn`) - 0.5) * 0.7) * (RISK_BURN_FACTOR[e.riskLevel] ?? 1);
  });
  const clamp = (x: number) => Math.min(0.97, Math.max(0.35, x));
  let k = 1;
  for (let pass = 0; pass < 8; pass++) {
    const total = free.reduce((a, e, i) => a + e.transferredAmountZAR * clamp(base[i] * k), 0);
    if (total <= 0) break;
    k *= target / total;
  }
  const spent = free.map((e, i) => Math.round(e.transferredAmountZAR * clamp(base[i] * k)));
  const drift = target - spent.reduce((a, b) => a + b, 0);
  if (free.length > 0 && drift !== 0) {
    let largest = 0;
    free.forEach((e, i) => { if (e.transferredAmountZAR > free[largest].transferredAmountZAR) largest = i; });
    spent[largest] += drift;
  }
  free.forEach((e, i) => result.set(e.id, spent[i]));
  return result;
}

// ---------------------------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------------------------

/** Illustrative prior-year outcomes recorded for the demonstration NPO. */
const SPECIAL_HISTORY: Record<string, Record<string, { approved: number; requested: number; quarters: number[] }>> = {
  'ent-ubuntu-arts': {
    '2023/24': { approved: 4500000, requested: 4700000, quarters: [1120000, 1120000, 1120000, 1120000] },
  },
};

interface Seeded {
  profiles: EntityBudgetProfile[];
  submissions: QuarterlyFinancialSubmission[];
  disbursements: DisbursementRecord[];
}

function assemble(): Seeded {
  const entities = INITIAL_ENTITIES;
  const profiles: EntityBudgetProfile[] = INITIAL_BUDGET_PROFILES.map(repairBudgetProfile);
  const submissions: QuarterlyFinancialSubmission[] = [...INITIAL_QUARTERLY_SUBMISSIONS];

  const hasProfile = (id: string, fy: string) => profiles.some(p => p.entityId === id && normalizeFinancialYear(p.financialYear) === fy);
  const subsFor = (id: string, fy: string) => submissions.filter(s => s.entityId === id && normalizeFinancialYear(s.financialYear) === fy);

  // Current-year spend already recorded by hand for some entities stays as authored.
  const fixed = new Map<string, number>();
  entities.forEach(e => {
    const existing = subsFor(e.id, CURRENT_FY);
    if (existing.length > 0) fixed.set(e.id, existing.reduce((a, s) => a + s.lines.reduce((x, l) => x + l.actualAmount, 0), 0));
  });
  const currentYtd = seededCurrentYtd(entities, fixed);

  entities.forEach(e => {
    const history: [string, number, number][] = [
      [CURRENT_FY, e.budgetAllocationZAR, e.budgetAllocationZAR],
      [`${CURRENT_FY_START - 1}/${String(CURRENT_FY_START % 100).padStart(2, '0')}`, Math.round(e.budgetAllocationZAR * 0.95), Math.round(e.budgetAllocationZAR * 0.95)],
      [`${CURRENT_FY_START - 2}/${String((CURRENT_FY_START - 1) % 100).padStart(2, '0')}`, Math.round(e.budgetAllocationZAR * 0.9), Math.round(e.budgetAllocationZAR * 0.9)],
    ];

    history.forEach(([fy, approvedDefault, requestedDefault]) => {
      const special = SPECIAL_HISTORY[e.id]?.[fy];
      const approved = special?.approved ?? approvedDefault;
      const requested = special?.requested ?? requestedDefault;

      if (!hasProfile(e.id, fy)) profiles.push(buildProfile(e, fy, approved, requested));
      const profile = profiles.find(p => p.entityId === e.id && normalizeFinancialYear(p.financialYear) === fy)!;

      if (subsFor(e.id, fy).length > 0) return; // hand-authored returns exist for this year

      if (fy === CURRENT_FY) {
        const ytd = currentYtd.get(e.id) ?? 0;
        const q1 = Math.round(ytd * 0.32);
        const q2 = Math.round(ytd * 0.34);
        const q3 = ytd - q1 - q2;
        submissions.push(buildSubmission(e, fy, 'Q1', q1, 'APPROVED', profile));
        submissions.push(buildSubmission(e, fy, 'Q2', q2, 'APPROVED', profile));
        const q3Status = currentQ3ReturnStatus(e);
        if (q3Status) submissions.push(buildSubmission(e, fy, 'Q3', q3, q3Status, profile));
      } else {
        // Closed prior year: full-year return in four quarters at ~98% of the approved budget.
        const quarters = special?.quarters || (() => {
          const fullYear = Math.round(approved * 0.98);
          const q = Math.round(fullYear / 4);
          return [q, q, q, fullYear - q * 3];
        })();
        QUARTER_ORDER.forEach((q, i) => submissions.push(buildSubmission(e, fy, q, quarters[i], 'APPROVED', profile)));
      }
    });
  });

  // Repair everything (hand-authored and generated) so totals and planned amounts are internally consistent.
  const repairedSubs = submissions.map(s => {
    const profile = profiles.find(p => p.entityId === s.entityId && normalizeFinancialYear(p.financialYear) === normalizeFinancialYear(s.financialYear));
    return repairSubmission(s, profile);
  });

  // --- Disbursement ledger ------------------------------------------------------------------------
  const disbursements: DisbursementRecord[] = [];
  const isWithheld = (e: PublicEntity) => e.overdueReportsCount > 0 || e.riskLevel === 'CRITICAL';

  profiles.filter(p => p.status === 'APPROVED' && p.approvedAmount > 0).forEach(p => {
    const e = entities.find(x => x.id === p.entityId);
    if (!e) return;
    const fy = normalizeFinancialYear(p.financialYear);
    const start = financialYearStart(fy);
    const tag = fyTag(fy);
    const trancheDate = (q: FinancialQuarter) => {
      const month = ({ Q1: '04', Q2: '07', Q3: '10', Q4: '01' } as const)[q];
      const year = q === 'Q4' ? start + 1 : start;
      return `${year}-${month}-15T09:00:00Z`;
    };
    const rec = (q: FinancialQuarter, amount: number, status: DisbursementRecord['status']): DisbursementRecord => ({
      id: `dis-${e.id}-${tag}-${q}`,
      entityId: e.id,
      financialYear: fy,
      tranche: q,
      amountZAR: amount,
      status,
      scheduledDate: trancheDate(q),
      releasedAt: status === 'RELEASED' ? trancheDate(q) : undefined,
      releasedByName: status === 'RELEASED' ? 'DSAC Finance Directorate' : undefined,
      reference: `BAS-${tag}-${e.shortCode}-${q}`,
    });

    if (start < CURRENT_FY_START) {
      allocateProportionally(p.approvedAmount, [1, 1, 1, 1]).forEach((amt, i) => disbursements.push(rec(QUARTER_ORDER[i], amt, 'RELEASED')));
    } else if (start === CURRENT_FY_START) {
      // Three tranches released to date (as previously recorded), the fourth still to come.
      const released = Math.min(e.transferredAmountZAR, p.approvedAmount);
      const [t1, t2, t3] = allocateProportionally(released, [34, 33, 33]);
      disbursements.push(rec('Q1', t1, 'RELEASED'), rec('Q2', t2, 'RELEASED'), rec('Q3', t3, 'RELEASED'));
      disbursements.push(rec('Q4', p.approvedAmount - released, isWithheld(e) ? 'WITHHELD' : 'SCHEDULED'));
    } else {
      // Future year: a tranche is released only for quarters in which the entity has actually reported.
      const reported = new Set(repairedSubs.filter(s => s.entityId === e.id && normalizeFinancialYear(s.financialYear) === fy).map(s => s.quarter));
      allocateProportionally(p.approvedAmount, [1, 1, 1, 1]).forEach((amt, i) => {
        const q = QUARTER_ORDER[i];
        disbursements.push(rec(q, amt, reported.has(q) ? 'RELEASED' : 'SCHEDULED'));
      });
    }
  });

  return { profiles, submissions: repairedSubs, disbursements };
}

const SEEDED = assemble();

export const SEEDED_BUDGET_PROFILES: EntityBudgetProfile[] = SEEDED.profiles;
export const SEEDED_QUARTERLY_SUBMISSIONS: QuarterlyFinancialSubmission[] = SEEDED.submissions;
export const SEEDED_DISBURSEMENTS: DisbursementRecord[] = SEEDED.disbursements;
