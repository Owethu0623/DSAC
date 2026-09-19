import { store } from './store';
import { formatZAR, isPortfolioMember } from './financialService';
import { calculateEntityPerformanceSummary } from './calculationEngine';
import { getCurrentReportingPeriod, sameFinancialYear } from './reportingPeriod';
import { getEvidenceSummary } from './evidenceStatus';
import { FinancialQuarter } from '../types/financial';

/**
 * What needs a DSAC official's attention, worked out from the same engines and store the dashboards read.
 * The alert bell in the header used to show three typed messages (with typed ages such as "18 days overdue" and a
 * typed parliamentary question reference) whatever the data said. Everything here is derived.
 */
export type AttentionLevel = 'critical' | 'warning' | 'info';
export type EntityTab = 'overview' | 'performance' | 'finance' | 'compliance' | 'reports' | 'profile';

export type AttentionCategory = 'Performance return' | 'Finance' | 'Funding hold' | 'Delivery' | 'Directives' | 'Evidence';

const CATEGORY: Record<string, AttentionCategory> = {
  'report-overdue': 'Performance return',
  'report-returned': 'Performance return',
  'report-review': 'Performance return',
  overspent: 'Finance',
  'projected-overspend': 'Finance',
  'ahead-of-cash': 'Finance',
  lines: 'Finance',
  'missing-returns': 'Finance',
  'returned-returns': 'Finance',
  'tranche-withheld': 'Funding hold',
  'tranche-conditional': 'Funding hold',
  'kpis-missed': 'Delivery',
  tasks: 'Directives',
  evidence: 'Evidence',
};

export interface AttentionItem {
  id: string;
  level: AttentionLevel;
  category: AttentionCategory;
  entityId: string;
  entityName: string;
  shortCode: string;
  title: string;
  detail: string;
  /** The tab of the entity page where this can be dealt with. */
  tab: EntityTab;
}

const LEVEL_RANK: Record<AttentionLevel, number> = { critical: 0, warning: 1, info: 2 };
const join = (qs: string[]) => qs.join(', ');
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function getEntityAttention(
  entityId: string,
  financialYear = getCurrentReportingPeriod().financialYear,
  quarter: FinancialQuarter = getCurrentReportingPeriod().quarter
): AttentionItem[] {
  const entity = store.entities.find(e => e.id === entityId);
  if (!entity) return [];

  const items: AttentionItem[] = [];
  const add = (key: string, level: AttentionLevel, title: string, detail: string, tab: EntityTab) =>
    items.push({ id: `${entity.id}:${key}`, level, category: CATEGORY[key], entityId: entity.id, entityName: entity.name, shortCode: entity.shortCode, title, detail, tab });

  // 1. The performance return for the current quarter
  const report = store.reports.find(r => r.entityId === entity.id && r.quarter === quarter && sameFinancialYear(r.financialYear, financialYear));
  if (report?.submissionStatus === 'OVERDUE') {
    add('report-overdue', 'critical', `${quarter} performance return is overdue`,
      `It was due ${new Date(report.dueDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}. Funding can be withheld under PFMA Section 38(1)(j).`, 'reports');
  } else if (report?.submissionStatus === 'CORRECTION_REQUIRED') {
    add('report-returned', 'warning', `${quarter} performance return was sent back`, report.reviewNotes || 'A correction was requested.', 'reports');
  } else if (report?.submissionStatus === 'SUBMITTED' || report?.submissionStatus === 'UNDER_REVIEW') {
    add('report-review', 'info', `${quarter} performance return awaits review`, 'Lodged by the entity and not yet decided.', 'reports');
  }

  // 2. Money
  const fin = store.getEntityFinancialSummary(entity.id, financialYear, quarter);
  if (fin.hasBudgetProfile) {
    if (fin.isOverspent) {
      add('overspent', 'critical', 'Spending is above the approved budget', `Reported spend exceeds the approved budget by ${formatZAR(fin.overspendAmount)}.`, 'finance');
    } else if (fin.projectedYearEndUtilisationPercent > 100) {
      add('projected-overspend', 'warning', 'On course to overspend', `At the current pace, year-end spend reaches ${fin.projectedYearEndUtilisationPercent.toFixed(0)}% of the approved budget.`, 'finance');
    }
    if (fin.spentAheadOfDisbursement) {
      add('ahead-of-cash', 'warning', 'Spending is ahead of funds received', `Reported spend of ${formatZAR(fin.ytdActual)} is above the ${formatZAR(fin.disbursedToDate)} disbursed.`, 'finance');
    }
    if (!fin.linesReconcile) {
      add('lines', 'warning', 'Expense lines do not add up to the approved budget', `The lines differ from the approved amount by ${formatZAR(Math.abs(fin.lineBudgetVariance))}.`, 'finance');
    }
  }
  if (fin.missingQuarters.length > 0) {
    add('missing-returns', 'critical', `Expenditure ${plural(fin.missingQuarters.length, 'return')} outstanding`, `Not lodged for ${join(fin.missingQuarters)}.`, 'finance');
  }
  if (fin.returnedQuarters.length > 0) {
    add('returned-returns', 'warning', `Expenditure ${plural(fin.returnedQuarters.length, 'return')} sent back`, `Awaiting correction for ${join(fin.returnedQuarters)}.`, 'finance');
  }

  // 3. Funding hold
  if (entity.trancheStatus === 'WITHHELD') {
    add('tranche-withheld', 'critical', 'Funding tranche withheld', entity.statutoryDefaultReason || 'A statutory hold applies to the next tranche.', 'compliance');
  } else if (entity.trancheStatus === 'CONDITIONAL_HOLD') {
    add('tranche-conditional', 'warning', 'Conditional funding hold', 'A compliance extension is running; the next tranche is on hold until it lapses or is cleared.', 'compliance');
  }

  // 4. Delivery
  const perf = calculateEntityPerformanceSummary(entity.id, financialYear, quarter, store.kpis, entity);
  if (perf.missedCount > 0) {
    add('kpis-missed', 'warning', `${plural(perf.missedCount, 'indicator')} behind target`, `Below 70% of the year-to-date target at ${quarter}.`, 'performance');
  }

  // 5. Directives
  const open = store.tasks.filter(t => t.entityId === entity.id && t.status !== 'COMPLETED');
  if (open.length > 0) {
    const overdue = open.filter(t => t.status === 'OVERDUE').length;
    add('tasks', overdue > 0 ? 'warning' : 'info', `${plural(open.length, 'open directive')}`, overdue > 0 ? `${overdue} overdue.` : 'Awaiting action from the entity.', 'compliance');
  }

  // 6. Evidence (information only: a missing upload is not, by itself, a breach)
  const evidence = getEvidenceSummary(entity.id, quarter, financialYear);
  if (evidence.missingMandatory > 0) {
    add('evidence', 'info', `${evidence.missingMandatory} of ${evidence.totalMandatory} mandatory evidence items not provided`, `${evidence.verifiedMandatory} verified for ${quarter}.`, 'compliance');
  }

  return items.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
}

/** Everything that needs attention across the portfolio, most serious first, including information-level items. */
export function getPortfolioAttention(): AttentionItem[] {
  const { financialYear, quarter } = getCurrentReportingPeriod();
  const riskOf = new Map(store.entities.map(e => [e.id, e.riskScore]));
  return store.entities
    .filter(isPortfolioMember)
    .flatMap(e => getEntityAttention(e.id, financialYear, quarter))
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || (riskOf.get(b.entityId) ?? 0) - (riskOf.get(a.entityId) ?? 0));
}

/** The critical and warning items only (what the header bell counts). */
export function getPortfolioAlerts(): AttentionItem[] {
  return getPortfolioAttention().filter(a => a.level !== 'info');
}
