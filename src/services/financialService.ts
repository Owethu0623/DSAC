import {
  ExpenseCategory,
  EntityBudgetProfile,
  QuarterlyFinancialSubmission,
  CategoryQuarterlyPerformance,
  EntityFinancialSummary,
  DepartmentFinancialKPIs,
  DisbursementRecord,
  FinancialQuarter,
  FinancialStatus,
  QuarterlyTimelinePoint,
  REPORTED_RETURN_STATUSES,
  VERIFIED_RETURN_STATUSES,
} from '../types/financial';
import { PublicEntity, KPIRecord } from '../types';
import {
  DEFAULT_REPORTING_PERIOD,
  QUARTER_ORDER,
  QuarterSelection,
  ReportingPeriod,
  financialYearStart,
  getCurrentReportingPeriod,
  isFinancialYearClosed,
  isQuarterDue,
  normalizeFinancialYear,
  pct1,
  quarterIndex,
} from './reportingPeriod';
import { calculateKpiItemProgress } from './kpiProgress';

export { QUARTER_ORDER };

export const DEFAULT_FINANCIAL_YEAR = DEFAULT_REPORTING_PERIOD.financialYear;

/** Variance tolerance band against the approved spending trajectory. */
export const OVERSPEND_PACE_THRESHOLD_PCT = 15;
export const UNDERSPEND_PACE_THRESHOLD_PCT = -25;

/** Self-registered organisations awaiting DSAC verification are not part of the monitored portfolio. */
export const isPortfolioMember = (e: PublicEntity): boolean => e.registrationStatus !== 'PENDING_VERIFICATION';

const DEFAULT_TRAJECTORY = { q1Percent: 25, q2Percent: 50, q3Percent: 75, q4Percent: 100 };

/** Returns formatted statutory date range for a given financial quarter */
export function getQuarterDates(quarter: FinancialQuarter | string, financialYear = getCurrentReportingPeriod().financialYear): string {
  const startYear = financialYearStart(financialYear);
  const nextYear = startYear + 1;
  switch (quarter) {
    case 'Q1': return `01 Apr ${startYear} – 30 Jun ${startYear}`;
    case 'Q2': return `01 Jul ${startYear} – 30 Sep ${startYear}`;
    case 'Q3': return `01 Oct ${startYear} – 31 Dec ${startYear}`;
    case 'Q4': return `01 Jan ${nextYear} – 31 Mar ${nextYear}`;
    default: return `01 Apr ${startYear} – 31 Mar ${nextYear}`;
  }
}

/** Returns full descriptive name for a financial quarter */
export function getQuarterName(quarter: FinancialQuarter | string): string {
  switch (quarter) {
    case 'Q1': return 'Quarter 1 (Apr – Jun)';
    case 'Q2': return 'Quarter 2 (Jul – Sep)';
    case 'Q3': return 'Quarter 3 (Oct – Dec)';
    case 'Q4': return 'Quarter 4 (Jan – Mar)';
    default: return 'Full Financial Year';
  }
}

/** Returns visual badge styling and label for financial status */
export function getFinancialStatusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case 'ON_TRACK':
      return { label: 'On Track', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'REQUIRES_REVIEW':
      return { label: 'Requires Review', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'OVERSPENDING':
      return { label: 'Overspending', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    case 'UNDER_UTILISING':
      return { label: 'Under-Utilising', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    case 'MISSING_SUBMISSION':
      return { label: 'Return Outstanding', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    case 'NOT_DUE':
      return { label: 'Not Yet Due', color: 'bg-sky-50 text-sky-700 border-sky-200' };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

/** Format currency in South African Rands (ZAR) */
export function formatZAR(val: number, options?: { compact?: boolean }): string {
  if (val === undefined || val === null || !Number.isFinite(val)) return 'R 0';

  if (options?.compact) {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1000000000) return `${sign}R${(abs / 1000000000).toFixed(1)}B`;
    if (abs >= 1000000) return `${sign}R${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${sign}R${(abs / 1000).toFixed(0)}k`;
    return `${sign}R${abs.toLocaleString('en-ZA')}`;
  }

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(val).replace('ZAR', 'R');
}

function latestSubmission(subs: QuarterlyFinancialSubmission[]): QuarterlyFinancialSubmission | undefined {
  return subs.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0];
}

/** A return's amount is ALWAYS the sum of its expense lines, so line totals can never disagree with the quarter total. */
export function returnTotal(s: QuarterlyFinancialSubmission): number {
  return s.lines && s.lines.length > 0
    ? s.lines.reduce((sum, l) => sum + (l.actualAmount || 0), 0)
    : s.totalQuarterlyActual || 0;
}

/**
 * Single Authoritative Financial Calculation Layer.
 *
 * Inputs are the three sources of truth: the approved budget profile, the lodged quarterly returns, and the
 * disbursement ledger. Nothing is inferred or back-filled: a missing return is reported as missing, not
 * synthesised from another field, and a budget is only "approved" when a real approval says so.
 */
export function calculateEntityFinancialSummary(
  entityId: string,
  financialYear: string,
  selectedQuarter: QuarterSelection,
  budgetProfiles: EntityBudgetProfile[],
  quarterlySubmissions: QuarterlyFinancialSubmission[],
  categories: ExpenseCategory[],
  entityMeta?: PublicEntity,
  kpiRecords?: KPIRecord[],
  disbursements: DisbursementRecord[] = [],
  period: ReportingPeriod = getCurrentReportingPeriod()
): EntityFinancialSummary {
  const fy = normalizeFinancialYear(financialYear);
  const qi = quarterIndex(selectedQuarter);
  const upto = QUARTER_ORDER.slice(0, qi);

  const profile = budgetProfiles.find(bp => bp.entityId === entityId && normalizeFinancialYear(bp.financialYear) === fy);
  const entityName = profile?.entityName || entityMeta?.name || 'Public Entity';
  const shortCode = entityMeta?.shortCode || entityName.slice(0, 4).toUpperCase();

  // Approved budget exists ONLY through an approval. No legacy fallback, no synthesised history.
  const approvedAmount = profile ? Math.max(0, profile.approvedAmount || 0) : 0;
  const requestedAmount = profile?.requestedAmount || 0;
  const fundingGap = requestedAmount > 0 ? requestedAmount - approvedAmount : 0;
  const budgetStatus = profile?.status ?? 'DRAFT';

  // --- Quarterly returns ------------------------------------------------------------------------
  const entitySubs = quarterlySubmissions.filter(s => s.entityId === entityId && normalizeFinancialYear(s.financialYear) === fy);
  const sub: Partial<Record<FinancialQuarter, QuarterlyFinancialSubmission>> = {};
  QUARTER_ORDER.forEach(q => { sub[q] = latestSubmission(entitySubs.filter(s => s.quarter === q)); });

  const isCounted = (s?: QuarterlyFinancialSubmission) => !!s && REPORTED_RETURN_STATUSES.includes(s.status);
  const isVerified = (s?: QuarterlyFinancialSubmission) => !!s && VERIFIED_RETURN_STATUSES.includes(s.status);

  const qActual: Record<FinancialQuarter, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  const qVerified: Record<FinancialQuarter, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  QUARTER_ORDER.forEach(q => {
    const s = sub[q];
    if (isCounted(s)) qActual[q] = returnTotal(s!);
    if (isVerified(s)) qVerified[q] = returnTotal(s!);
  });

  const ytdActual = upto.reduce((acc, q) => acc + qActual[q], 0);
  const verifiedYtdActual = upto.reduce((acc, q) => acc + qVerified[q], 0);
  const fullYearActual = QUARTER_ORDER.reduce((acc, q) => acc + qActual[q], 0);

  const dueQuarters = upto.filter(q => isQuarterDue(fy, q, period));
  const missingQuarters = dueQuarters.filter(q => !isCounted(sub[q]));
  const returnedQuarters = dueQuarters.filter(q => sub[q]?.status === 'CORRECTION_REQUIRED');

  // --- Disbursements (ledger) -------------------------------------------------------------------
  const released = disbursements.filter(d => d.entityId === entityId && normalizeFinancialYear(d.financialYear) === fy && d.status === 'RELEASED');
  const disbursedInQuarter = (q: FinancialQuarter) => released.filter(d => d.tranche === q).reduce((a, d) => a + d.amountZAR, 0);
  // Cash already paid is disbursed "as at now" even if it was scheduled for a later quarter (an early tranche).
  // Looking back at an earlier quarter, only the tranches due by then count.
  const asAtNow = fy === period.financialYear && qi >= quarterIndex(period.quarter);
  const disbursedToDate = asAtNow
    ? released.reduce((acc, d) => acc + d.amountZAR, 0)
    : upto.reduce((acc, q) => acc + disbursedInQuarter(q), 0);

  // --- Budget position --------------------------------------------------------------------------
  const remainingBudget = approvedAmount - ytdActual;
  const isOverspent = ytdActual > approvedAmount;
  const overspendAmount = isOverspent ? ytdActual - approvedAmount : 0;
  // NOT capped at 100% so overspend stays visible (e.g. 105%)
  const utilisationPercent = pct1(ytdActual, approvedAmount);

  const trajectory = profile?.expectedSpendingTrajectory || DEFAULT_TRAJECTORY;
  const trajectoryPct = [trajectory.q1Percent, trajectory.q2Percent, trajectory.q3Percent, trajectory.q4Percent];
  const expectedPercent = trajectoryPct[qi - 1];
  const expectedYtd = (approvedAmount * expectedPercent) / 100;
  const variance = ytdActual - expectedYtd;
  const variancePercent = expectedYtd > 0 ? Math.round((variance / expectedYtd) * 1000) / 10 : 0;

  // --- Status -----------------------------------------------------------------------------------
  const closed = isFinancialYearClosed(fy, period);
  let financialStatus: FinancialStatus = 'ON_TRACK';
  let statusExplanation = `Expenditure is within the +${OVERSPEND_PACE_THRESHOLD_PCT}% / ${UNDERSPEND_PACE_THRESHOLD_PCT}% tolerance band of the approved spending trajectory.`;

  if (isOverspent) {
    financialStatus = 'OVERSPENDING';
    statusExplanation = approvedAmount > 0
      ? `Reported cumulative expenditure exceeds the approved annual budget by ${formatZAR(overspendAmount)} (${utilisationPercent}% utilisation).`
      : `Expenditure of ${formatZAR(ytdActual)} has been reported with no approved budget on record for ${fy}.`;
  } else if (missingQuarters.length > 0) {
    financialStatus = 'MISSING_SUBMISSION';
    const returned = missingQuarters.filter(q => returnedQuarters.includes(q));
    const notLodged = missingQuarters.filter(q => !returnedQuarters.includes(q));
    const parts: string[] = [];
    if (notLodged.length) parts.push(`${notLodged.join(', ')} return not yet lodged by the Accounting Officer`);
    if (returned.length) parts.push(`${returned.join(', ')} return sent back for correction and excluded from reported totals until resubmitted`);
    statusExplanation = parts.join('; ') + '.';
  } else if (closed) {
    statusExplanation = `Financial year ${fy} is closed: ${utilisationPercent}% of the approved budget was utilised.`;
  } else if (dueQuarters.length === 0) {
    financialStatus = 'NOT_DUE';
    statusExplanation = `Reporting for ${fy} has not yet opened.`;
  } else if (variancePercent > OVERSPEND_PACE_THRESHOLD_PCT) {
    financialStatus = 'REQUIRES_REVIEW';
    statusExplanation = `Expenditure pace (+${variancePercent}%) is running materially ahead of the approved quarterly trajectory.`;
  } else if (variancePercent < UNDERSPEND_PACE_THRESHOLD_PCT) {
    financialStatus = 'UNDER_UTILISING';
    statusExplanation = `Low absorption of the approved budget (${variancePercent}% against trajectory). Possible procurement bottlenecks or programme execution lag.`;
  }

  // --- Expense-line breakdown -------------------------------------------------------------------
  const catNames = new Map<string, string>();
  categories.forEach(c => catNames.set(c.id, c.name));
  profile?.lines.forEach(l => { if (!catNames.has(l.categoryId)) catNames.set(l.categoryId, l.categoryName); });
  QUARTER_ORDER.forEach(q => {
    if (isCounted(sub[q])) sub[q]!.lines.forEach(l => { if (!catNames.has(l.categoryId)) catNames.set(l.categoryId, l.categoryName); });
  });

  const categoryBreakdown: CategoryQuarterlyPerformance[] = [...catNames.entries()].map(([catId, catName]) => {
    const catAnnualBudget = (profile?.lines || []).filter(l => l.categoryId === catId).reduce((a, l) => a + (l.annualBudget || 0), 0);
    const catQ = (q: FinancialQuarter) =>
      isCounted(sub[q]) ? sub[q]!.lines.filter(l => l.categoryId === catId).reduce((a, l) => a + (l.actualAmount || 0), 0) : 0;
    const cQ: Record<FinancialQuarter, number> = { Q1: catQ('Q1'), Q2: catQ('Q2'), Q3: catQ('Q3'), Q4: catQ('Q4') };
    const cYtd = upto.reduce((acc, q) => acc + cQ[q], 0);
    const cPlannedYtd = (catAnnualBudget * expectedPercent) / 100;
    const cRemaining = catAnnualBudget - cYtd;
    const isUnbudgeted = catAnnualBudget === 0 && cYtd > 0;
    const cIsOverspent = isUnbudgeted || (catAnnualBudget > 0 && cYtd > catAnnualBudget);
    return {
      categoryId: catId,
      categoryName: catName,
      isUnbudgeted,
      annualBudget: catAnnualBudget,
      q1Actual: cQ.Q1,
      q2Actual: cQ.Q2,
      q3Actual: cQ.Q3,
      q4Actual: cQ.Q4,
      ytdActual: cYtd,
      remaining: cRemaining,
      remainingBudget: cRemaining,
      utilisationPercent: pct1(cYtd, catAnnualBudget),
      plannedYtd: cPlannedYtd,
      variance: cYtd - cPlannedYtd,
      isOverspent: cIsOverspent,
      overspendAmount: isUnbudgeted ? cYtd : cIsOverspent ? cYtd - catAnnualBudget : 0,
    };
  }).filter(c => c.annualBudget > 0 || c.ytdActual > 0);

  // --- Integrity ---------------------------------------------------------------------------------
  const lineBudgetTotal = (profile?.lines || []).reduce((a, l) => a + (l.annualBudget || 0), 0);
  const lineBudgetVariance = profile ? approvedAmount - lineBudgetTotal : 0;
  const categoryYtdTotal = categoryBreakdown.reduce((a, c) => a + c.ytdActual, 0);
  const linesReconcile = lineBudgetVariance === 0 && categoryYtdTotal === ytdActual;

  // --- Forecast: run-rate of reported quarters projected to year end -----------------------------
  const reportedCount = upto.filter(q => isCounted(sub[q])).length;
  const projectedYearEndSpend = closed
    ? fullYearActual
    : reportedCount > 0 ? Math.round((ytdActual / reportedCount) * 4) : 0;

  // --- Link to performance: is delivery keeping pace with spend? ---------------------------------
  let targetAchievementRate: number | undefined;
  let performanceFinanceSignal: EntityFinancialSummary['performanceFinanceSignal'];
  if (kpiRecords && kpiRecords.length > 0) {
    const items = kpiRecords.filter(k => k.entityId === entityId).map(k => calculateKpiItemProgress(k, fy, selectedQuarter));
    if (items.length > 0) {
      const avgAchieved = Math.round(items.reduce((acc, i) => acc + i.cappedPercentage, 0) / items.length);
      targetAchievementRate = avgAchieved;
      // Both measures are expressed against the year-to-date PLAN, so they are comparable.
      const spendVsPlan = expectedYtd > 0 ? Math.round((ytdActual / expectedYtd) * 100) : 0;
      const gap = spendVsPlan - avgAchieved;
      if (ytdActual > 0 && gap > 20) {
        performanceFinanceSignal = {
          status: 'REQUIRES_REVIEW',
          commentary: `Spend is at ${spendVsPlan}% of the year-to-date plan while delivery is only at ${avgAchieved}% of year-to-date targets. Review expenditure and performance evidence for this period.`,
        };
      } else if (ytdActual > 0 && gap < -20) {
        performanceFinanceSignal = {
          status: 'COMMENDABLE',
          commentary: `Delivery (${avgAchieved}% of year-to-date targets) is running ahead of spend (${spendVsPlan}% of plan).`,
        };
      } else {
        performanceFinanceSignal = {
          status: 'ALIGNED',
          commentary: `Spend (${spendVsPlan}% of year-to-date plan) corresponds proportionally with delivery (${avgAchieved}% of year-to-date targets).`,
        };
      }
    }
  }

  // --- Quarterly timeline ------------------------------------------------------------------------
  let cumulativeYtd = 0;
  let cumulativeDisbursed = 0;
  const quarterlyTimeline: QuarterlyTimelinePoint[] = QUARTER_ORDER.map((q, i) => {
    cumulativeYtd += qActual[q];
    const dq = disbursedInQuarter(q);
    cumulativeDisbursed += dq;
    const planned = (approvedAmount * (trajectoryPct[i] - (i > 0 ? trajectoryPct[i - 1] : 0))) / 100;
    return {
      quarter: q,
      quarterName: getQuarterName(q),
      actualExpenditure: qActual[q],
      plannedExpenditure: planned,
      cumulativeYtdExpenditure: cumulativeYtd,
      remainingBudget: approvedAmount - cumulativeYtd,
      utilisationPercent: pct1(cumulativeYtd, approvedAmount),
      isSubmitted: isCounted(sub[q]),
      status: sub[q]?.status,
      disbursedInQuarter: dq,
      cumulativeDisbursed,
    };
  });

  return {
    entityId,
    entityName,
    shortCode,
    entityType: entityMeta?.type || 'PUBLIC_ENTITY',
    financialYear: fy,
    budgetProfileId: profile?.id,
    requestedAmount,
    approvedAmount,
    fundingGap,
    budgetStatus,
    q1Actual: qActual.Q1,
    q2Actual: qActual.Q2,
    q3Actual: qActual.Q3,
    q4Actual: qActual.Q4,
    q1Submitted: isCounted(sub.Q1),
    q2Submitted: isCounted(sub.Q2),
    q3Submitted: isCounted(sub.Q3),
    q4Submitted: isCounted(sub.Q4),
    selectedQuarter,
    ytdActual,
    fullYearActual,
    expectedYtd,
    remainingBudget,
    utilisationPercent,
    variance,
    absoluteVariance: Math.abs(variance),
    variancePercent,
    targetTrajectoryPercent: expectedPercent,
    isOverspent,
    overspendAmount,
    financialStatus,
    statusExplanation,
    hasBudgetProfile: !!profile,
    disbursedToDate,
    disbursementRate: pct1(disbursedToDate, approvedAmount),
    absorptionRate: pct1(ytdActual, disbursedToDate),
    undisbursedBalance: approvedAmount - disbursedToDate,
    unspentDisbursed: Math.max(0, disbursedToDate - ytdActual),
    spentAheadOfDisbursement: ytdActual > disbursedToDate,
    verifiedYtdActual,
    unverifiedYtdActual: ytdActual - verifiedYtdActual,
    dueQuarters,
    missingQuarters,
    returnedQuarters,
    projectedYearEndSpend,
    projectedYearEndUtilisationPercent: pct1(projectedYearEndSpend, approvedAmount),
    lineBudgetTotal,
    lineBudgetVariance,
    linesReconcile,
    targetAchievementRate,
    performanceFinanceSignal,
    quarterlyTimeline,
    categories: categoryBreakdown,
  };
}

/** Department-level aggregate KPI computation over portfolio members only. */
export function calculateDepartmentFinancialKPIs(
  financialYear: string,
  selectedQuarter: QuarterSelection,
  budgetProfiles: EntityBudgetProfile[],
  quarterlySubmissions: QuarterlyFinancialSubmission[],
  entities: PublicEntity[],
  categories: ExpenseCategory[],
  kpis?: KPIRecord[],
  disbursements: DisbursementRecord[] = []
): DepartmentFinancialKPIs {
  const fy = normalizeFinancialYear(financialYear);
  const members = entities.filter(isPortfolioMember);
  const summaries = members.map(entity =>
    calculateEntityFinancialSummary(entity.id, fy, selectedQuarter, budgetProfiles, quarterlySubmissions, categories, entity, kpis, disbursements)
  );
  const memberIds = new Set(members.map(m => m.id));

  const totalRequested = summaries.reduce((acc, s) => acc + s.requestedAmount, 0);
  const totalApproved = summaries.reduce((acc, s) => acc + s.approvedAmount, 0);
  const totalActualExpenditure = summaries.reduce((acc, s) => acc + s.ytdActual, 0);
  const totalDisbursed = summaries.reduce((acc, s) => acc + s.disbursedToDate, 0);
  const totalVerifiedActual = summaries.reduce((acc, s) => acc + s.verifiedYtdActual, 0);
  const totalRemaining = totalApproved - totalActualExpenditure;
  const overallUtilisationPercent = pct1(totalActualExpenditure, totalApproved);

  const entitiesOverspendingCount = summaries.filter(s => s.isOverspent).length;
  const entitiesUnderUtilisingCount = summaries.filter(s => s.financialStatus === 'UNDER_UTILISING').length;
  const entitiesOnTrackCount = summaries.filter(s => s.financialStatus === 'ON_TRACK').length;
  const entitiesMissingSubmissionCount = summaries.filter(s => s.financialStatus === 'MISSING_SUBMISSION').length;

  const budgetRequestsPendingCount = budgetProfiles.filter(
    bp => memberIds.has(bp.entityId) && (bp.status === 'SUBMITTED' || bp.status === 'UNDER_REVIEW')
  ).length;
  const pendingSubmissionsCount = quarterlySubmissions.filter(
    s => memberIds.has(s.entityId) && normalizeFinancialYear(s.financialYear) === fy && (s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW')
  ).length;

  const targetTrajectoryPercent = selectedQuarter === 'FULL_YEAR' ? 100 : quarterIndex(selectedQuarter) * 25;

  return {
    totalDisbursed,
    totalVerifiedActual,
    totalRequested,
    totalApproved,
    totalActualExpenditure,
    totalActualYTD: totalActualExpenditure,
    totalRemaining,
    overallUtilisationPercent,
    departmentUtilisationPercent: overallUtilisationPercent,
    targetTrajectoryPercent,
    entitiesOverspendingCount,
    overspendingEntitiesCount: entitiesOverspendingCount,
    entitiesUnderUtilisingCount,
    underUtilisingEntitiesCount: entitiesUnderUtilisingCount,
    entitiesOnTrackCount,
    entitiesMissingSubmissionCount,
    budgetRequestsPendingCount,
    pendingSubmissionsCount,
    totalFundingGap: totalRequested - totalApproved,
  };
}

/** Escapes a text cell and neutralises spreadsheet formula injection (=, +, -, @ prefixes). */
function csvText(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Generates an export-ready CSV string adhering to Section 33 of the User Request */
export function generateFinancialExportCSV(summaries: EntityFinancialSummary[], financialYear: string): string {
  const headers = [
    'Entity',
    'Short Code',
    'Financial Year',
    'Budget Requested (ZAR)',
    'Approved Budget (ZAR)',
    'Funding Gap (ZAR)',
    'Disbursed to Date (ZAR)',
    'Q1 Actual (ZAR)',
    'Q2 Actual (ZAR)',
    'Q3 Actual (ZAR)',
    'Q4 Actual (ZAR)',
    'YTD Actual Reported (ZAR)',
    'YTD Verified by DSAC (ZAR)',
    'Remaining Budget (ZAR)',
    'Budget Utilisation % (YTD / Approved)',
    'Transfer Absorption % (YTD / Disbursed)',
    'Expected YTD (ZAR)',
    'Variance (ZAR)',
    'Financial Status',
    'Overspent Flag',
  ];

  const rows = summaries.map(s => [
    csvText(s.entityName),
    csvText(s.shortCode),
    csvText(s.financialYear || normalizeFinancialYear(financialYear)),
    s.requestedAmount,
    s.approvedAmount,
    s.fundingGap,
    s.disbursedToDate,
    s.q1Actual,
    s.q2Actual,
    s.q3Actual,
    s.q4Actual,
    s.ytdActual,
    s.verifiedYtdActual,
    s.remainingBudget,
    `${s.utilisationPercent}%`,
    `${s.absorptionRate}%`,
    s.expectedYtd,
    s.variance,
    csvText(s.financialStatus),
    s.isOverspent ? 'YES' : 'NO',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
