import { PublicEntity, KPIRecord, EntityType } from '../types';
import {
  DisbursementRecord,
  EntityFinancialSummary,
  EntityBudgetProfile,
  QuarterlyFinancialSubmission,
  ExpenseCategory,
} from '../types/financial';
import {
  calculateEntityFinancialSummary,
  formatZAR,
  isPortfolioMember,
} from './financialService';
import {
  CalculatedKpiItem,
  KPIProgressStatus,
  calculateKpiItemProgress,
} from './kpiProgress';
import {
  QuarterSelection,
  getCurrentReportingPeriod,
  isFinancialYearClosed,
  normalizeFinancialYear,
  normalizeQuarter,
  pct1,
} from './reportingPeriod';

export { formatZAR, normalizeFinancialYear, normalizeQuarter, calculateKpiItemProgress };
export type { CalculatedKpiItem, KPIProgressStatus };

export interface EntityPerformanceSummary {
  entityId: string;
  entityName: string;
  shortCode: string;
  financialYear: string;
  quarter: QuarterSelection;
  totalKpis: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  missedCount: number;
  completedPercent: number;
  inProgressPercent: number;
  notStartedPercent: number;
  missedPercent: number;
  /** Informational only: sums mix units (visitors + workshops + jobs), so never use as a performance measure. */
  totalTargetSum: number;
  totalActualSum: number;
  /**
   * Equal-weight average of each KPI's achievement against its year-to-date target, each capped at 100%.
   * Unit-agnostic, so a large-number KPI (visitors) cannot drown out a small-number one (workshops).
   */
  overallAchievementRate: number;
  items: CalculatedKpiItem[];
  statusDistribution: Array<{
    name: 'Completed' | 'In Progress' | 'Not Started' | 'Missed';
    value: number;
    percent: number;
    color: string;
    textColor: string;
    bgPill: string;
  }>;
}

export interface ClusterPerformance {
  cluster: string;
  entityCount: number;
  kpiCount: number;
  achievementRate: number;
}

export interface DepartmentPerformanceAggregation {
  financialYear: string;
  quarter: QuarterSelection;
  totalEntities: number;
  totalKpis: number;
  totalCompletedCount: number;
  totalInProgressCount: number;
  totalNotStartedCount: number;
  totalMissedCount: number;
  overallDeliveryPercent: number;
  onTrackEntitiesCount: number;
  laggingEntitiesCount: number;
  totalYouthJobs: number;
  overallPortfolioDeliveryRate: number;
  /** KPI counts (not entity counts): achieved / not achieved. See onTrackEntitiesCount for entities. */
  onTrackCount: number;
  laggingCount: number;
  totalKpisEvaluated: number;
  statusDistribution: Array<{
    name: 'Completed' | 'In Progress' | 'Not Started' | 'Missed';
    value: number;
    percent: number;
    color: string;
  }>;
  clusterBreakdown: ClusterPerformance[];
  entityBreakdown: Array<{
    id: string;
    name: string;
    shortName: string;
    type: EntityType;
    cluster: string;
    totalKpis: number;
    achieved: number; // percent completed (0-100)
    inProgress: number; // percent in progress (0-100)
    notAchieved: number; // percent missed / lagging (0-100)
    overallAchievementRate: number;
    completedCount: number;
    inProgressCount: number;
    missedCount: number;
    status: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
  }>;
}

export interface DepartmentFinancialAggregation {
  financialYear: string;
  quarter: QuarterSelection;
  totalApprovedBudget: number;
  totalRequestedBudget: number;
  /** Sum of RELEASED ledger tranches through the selected quarter. */
  totalTransferredToDate: number;
  /** Lodged (submitted or accepted) expenditure through the selected quarter. */
  totalReportedExpenditure: number;
  /** Portion of reported expenditure DSAC has accepted. */
  totalVerifiedExpenditure: number;
  /** Approved budget not yet transferred (approved - disbursed). This is what is left to DISBURSE. */
  remainingDisbursement: number;
  /** Approved budget not yet spent (approved - reported). This is what is left to SPEND. */
  remainingBudget: number;
  /** Cash transferred to entities but not yet spent. */
  unspentDisbursed: number;
  totalOverspend: number;
  entitiesWithOutstandingReturns: number;
  /** Disbursed / Approved, %. */
  transferRate: number;
  /** Transfer Absorption: reported expenditure / disbursed, %. */
  expenditureRate: number;
  /** Budget Utilisation: reported expenditure / approved, %. */
  utilPercent: number;
  remPercent: number;
  statusTitle: string;
  peBudget: number;
  npoBudget: number;
  peTransfer: number;
  npoTransfer: number;
  pePercentage: number;
  npoPercentage: number;
  entitySummaries: EntityFinancialSummary[];
}

const STATUS_STYLE = {
  Completed: { color: '#059669', textColor: 'text-emerald-700', bgPill: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  'In Progress': { color: '#2563eb', textColor: 'text-blue-700', bgPill: 'bg-blue-50 border-blue-200 text-blue-800' },
  'Not Started': { color: '#64748b', textColor: 'text-slate-600', bgPill: 'bg-slate-50 border-slate-200 text-slate-700' },
  Missed: { color: '#e11d48', textColor: 'text-rose-700', bgPill: 'bg-rose-50 border-rose-200 text-rose-800' },
} as const;

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** AUTHORITATIVE ENTITY PERFORMANCE SUMMARY */
export function calculateEntityPerformanceSummary(
  entityId: string,
  financialYear: string = getCurrentReportingPeriod().financialYear,
  quarter: QuarterSelection = 'FULL_YEAR',
  allKpis: KPIRecord[],
  entityMeta?: PublicEntity
): EntityPerformanceSummary {
  const normYear = normalizeFinancialYear(financialYear);
  const normQuarter = normalizeQuarter(quarter);

  const entityKpis = allKpis.filter(k => k.entityId === entityId);
  const items = entityKpis.map(k => calculateKpiItemProgress(k, normYear, normQuarter));

  const count = (s: KPIProgressStatus) => items.filter(i => i.status === s).length;
  const completedCount = count('COMPLETED');
  const inProgressCount = count('IN_PROGRESS');
  const notStartedCount = count('NOT_STARTED');
  const missedCount = count('MISSED');
  const totalKpis = items.length;
  const p = (n: number) => (totalKpis > 0 ? Math.round((n / totalKpis) * 100) : 0);

  const distribution = (name: keyof typeof STATUS_STYLE, value: number) => ({
    name,
    value,
    percent: p(value),
    ...STATUS_STYLE[name],
  });

  return {
    entityId,
    entityName: entityMeta?.name || entityKpis[0]?.entityName || 'Public Entity',
    shortCode: entityMeta?.shortCode || 'ENT',
    financialYear: normYear,
    quarter: normQuarter,
    totalKpis,
    completedCount,
    inProgressCount,
    notStartedCount,
    missedCount,
    completedPercent: p(completedCount),
    inProgressPercent: p(inProgressCount),
    notStartedPercent: p(notStartedCount),
    missedPercent: p(missedCount),
    totalTargetSum: items.reduce((a, i) => a + i.target, 0),
    totalActualSum: items.reduce((a, i) => a + i.actual, 0),
    overallAchievementRate: Math.round(mean(items.map(i => i.cappedPercentage)) * 10) / 10,
    items,
    statusDistribution: [
      distribution('Completed', completedCount),
      distribution('In Progress', inProgressCount),
      distribution('Not Started', notStartedCount),
      distribution('Missed', missedCount),
    ],
  };
}

/** AUTHORITATIVE DEPARTMENT PERFORMANCE AGGREGATION */
export function calculateDepartmentPerformanceAggregation(
  entities: PublicEntity[],
  allKpis: KPIRecord[],
  financialYear: string = getCurrentReportingPeriod().financialYear,
  quarter: QuarterSelection = getCurrentReportingPeriod().quarter,
  typeFilter: 'ALL' | 'PUBLIC_ENTITY' | 'NPO' = 'ALL'
): DepartmentPerformanceAggregation {
  const normYear = normalizeFinancialYear(financialYear);
  const normQuarter = normalizeQuarter(quarter);

  const filteredEntities = entities.filter(e => isPortfolioMember(e) && (typeFilter === 'ALL' || e.type === typeFilter));
  const entitySummaries = filteredEntities.map(e => calculateEntityPerformanceSummary(e.id, normYear, normQuarter, allKpis, e));

  const totalKpis = entitySummaries.reduce((a, s) => a + s.totalKpis, 0);
  const totalCompletedCount = entitySummaries.reduce((a, s) => a + s.completedCount, 0);
  const totalInProgressCount = entitySummaries.reduce((a, s) => a + s.inProgressCount, 0);
  const totalNotStartedCount = entitySummaries.reduce((a, s) => a + s.notStartedCount, 0);
  const totalMissedCount = entitySummaries.reduce((a, s) => a + s.missedCount, 0);

  // Equal weight per KPI across the whole portfolio.
  const allCapped = entitySummaries.flatMap(s => s.items.map(i => i.cappedPercentage));
  const overallDeliveryPercent = Math.round(mean(allCapped) * 10) / 10;

  const entityBreakdown = filteredEntities.map((entity, idx) => {
    const summary = entitySummaries[idx];
    let status: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL' = 'ON_TRACK';
    if (summary.overallAchievementRate < 50 || summary.missedPercent > 30) status = 'CRITICAL';
    else if (summary.overallAchievementRate < 75 || summary.missedPercent > 15) status = 'AT_RISK';
    return {
      id: entity.id,
      name: entity.name,
      shortName: entity.shortCode,
      type: entity.type,
      cluster: entity.cluster,
      totalKpis: summary.totalKpis,
      achieved: summary.completedPercent,
      inProgress: summary.inProgressPercent,
      notAchieved: summary.missedPercent,
      overallAchievementRate: summary.overallAchievementRate,
      completedCount: summary.completedCount,
      inProgressCount: summary.inProgressCount,
      missedCount: summary.missedCount,
      status,
    };
  });

  const clusterMap = new Map<string, { entities: number; capped: number[] }>();
  filteredEntities.forEach((entity, idx) => {
    const c = clusterMap.get(entity.cluster) || { entities: 0, capped: [] };
    c.entities += 1;
    c.capped.push(...entitySummaries[idx].items.map(i => i.cappedPercentage));
    clusterMap.set(entity.cluster, c);
  });
  const clusterBreakdown: ClusterPerformance[] = [...clusterMap.entries()]
    .map(([cluster, c]) => ({ cluster, entityCount: c.entities, kpiCount: c.capped.length, achievementRate: Math.round(mean(c.capped) * 10) / 10 }))
    .sort((a, b) => b.achievementRate - a.achievementRate);

  const dist = (name: keyof typeof STATUS_STYLE, value: number) => ({
    name,
    value,
    percent: totalKpis > 0 ? Math.round((value / totalKpis) * 100) : 0,
    color: STATUS_STYLE[name].color,
  });

  return {
    financialYear: normYear,
    quarter: normQuarter,
    totalEntities: filteredEntities.length,
    totalKpis,
    totalCompletedCount,
    totalInProgressCount,
    totalNotStartedCount,
    totalMissedCount,
    overallDeliveryPercent,
    onTrackEntitiesCount: entityBreakdown.filter(e => e.status === 'ON_TRACK').length,
    laggingEntitiesCount: entityBreakdown.filter(e => e.status !== 'ON_TRACK').length,
    totalYouthJobs: filteredEntities.reduce((sum, e) => sum + (e.jobStats?.youthJobsCreated || 0), 0),
    overallPortfolioDeliveryRate: overallDeliveryPercent,
    onTrackCount: totalCompletedCount,
    laggingCount: totalMissedCount,
    totalKpisEvaluated: totalKpis,
    statusDistribution: [
      dist('Completed', totalCompletedCount),
      dist('In Progress', totalInProgressCount),
      dist('Not Started', totalNotStartedCount),
      dist('Missed', totalMissedCount),
    ],
    clusterBreakdown,
    entityBreakdown,
  };
}

/** AUTHORITATIVE DEPARTMENT FINANCIAL AGGREGATION: every figure is a sum of per-entity summaries. */
export function calculateDepartmentFinancialAggregation(
  entities: PublicEntity[],
  budgetProfiles: EntityBudgetProfile[],
  quarterlySubmissions: QuarterlyFinancialSubmission[],
  categories: ExpenseCategory[],
  allKpis: KPIRecord[],
  disbursements: DisbursementRecord[],
  financialYear: string = getCurrentReportingPeriod().financialYear,
  quarter: QuarterSelection = getCurrentReportingPeriod().quarter,
  typeFilter: 'ALL' | 'PUBLIC_ENTITY' | 'NPO' = 'ALL'
): DepartmentFinancialAggregation {
  const normYear = normalizeFinancialYear(financialYear);
  const normQuarter = normalizeQuarter(quarter);

  const filteredEntities = entities.filter(e => isPortfolioMember(e) && (typeFilter === 'ALL' || e.type === typeFilter));

  const entitySummaries = filteredEntities.map(e =>
    calculateEntityFinancialSummary(e.id, normYear, normQuarter, budgetProfiles, quarterlySubmissions, categories, e, allKpis, disbursements)
  );

  const sum = (f: (s: EntityFinancialSummary) => number, list = entitySummaries) => list.reduce((acc, s) => acc + f(s), 0);

  const totalApprovedBudget = sum(s => s.approvedAmount);
  const totalRequestedBudget = sum(s => s.requestedAmount);
  const totalReportedExpenditure = sum(s => s.ytdActual);
  const totalVerifiedExpenditure = sum(s => s.verifiedYtdActual);
  const totalTransferredToDate = sum(s => s.disbursedToDate);

  const utilPercent = pct1(totalReportedExpenditure, totalApprovedBudget);

  const pe = entitySummaries.filter(s => s.entityType === 'PUBLIC_ENTITY');
  const npo = entitySummaries.filter(s => s.entityType === 'NPO');
  const peBudget = sum(s => s.approvedAmount, pe);
  const npoBudget = sum(s => s.approvedAmount, npo);

  let statusTitle = 'Transferred & Expended to Date';
  if (isFinancialYearClosed(normYear)) statusTitle = `Year-End Expenditure (${normYear})`;
  else if (normQuarter !== 'FULL_YEAR') statusTitle = `Cumulative YTD Expenditure through ${normQuarter}`;

  return {
    financialYear: normYear,
    quarter: normQuarter,
    totalApprovedBudget,
    totalRequestedBudget,
    totalTransferredToDate,
    totalReportedExpenditure,
    totalVerifiedExpenditure,
    remainingDisbursement: Math.max(0, totalApprovedBudget - totalTransferredToDate),
    remainingBudget: totalApprovedBudget - totalReportedExpenditure,
    unspentDisbursed: sum(s => s.unspentDisbursed),
    totalOverspend: sum(s => s.overspendAmount),
    entitiesWithOutstandingReturns: entitySummaries.filter(s => s.missingQuarters.length > 0).length,
    transferRate: pct1(totalTransferredToDate, totalApprovedBudget),
    expenditureRate: pct1(totalReportedExpenditure, totalTransferredToDate),
    utilPercent,
    remPercent: Math.max(0, Math.round((100 - utilPercent) * 10) / 10),
    statusTitle,
    peBudget,
    npoBudget,
    peTransfer: sum(s => s.disbursedToDate, pe),
    npoTransfer: sum(s => s.disbursedToDate, npo),
    pePercentage: pct1(peBudget, totalApprovedBudget),
    npoPercentage: pct1(npoBudget, totalApprovedBudget),
    entitySummaries,
  };
}
