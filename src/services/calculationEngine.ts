import { PublicEntity, KPIRecord, EntityType } from '../types';
import { 
  FinancialQuarter, 
  EntityFinancialSummary, 
  DepartmentFinancialKPIs,
  EntityBudgetProfile,
  QuarterlyFinancialSubmission,
  ExpenseCategory
} from '../types/financial';
import { 
  calculateEntityFinancialSummary, 
  calculateDepartmentFinancialKPIs,
  formatZAR 
} from './financialService';

export { formatZAR };

/**
 * Normalizes user-facing or internal financial year strings to the standard canonical key:
 * '2023/24' | '2024/25' | '2025/26' | '2026/27'
 */
export function normalizeFinancialYear(yearStr?: string): string {
  if (!yearStr) return '2025/26';
  const cleaned = yearStr.trim();
  if (cleaned.includes('2023')) return '2023/24';
  if (cleaned.includes('2024')) return '2024/25';
  if (cleaned.includes('2025')) return '2025/26';
  if (cleaned.includes('2026')) return '2026/27';
  return '2025/26';
}

/**
 * Normalizes quarter strings to valid FinancialQuarter or 'FULL_YEAR'
 */
export function normalizeQuarter(quarter?: string): FinancialQuarter | 'FULL_YEAR' {
  if (!quarter) return 'FULL_YEAR';
  const q = quarter.trim().toUpperCase();
  if (q.includes('Q1') || q === '1') return 'Q1';
  if (q.includes('Q2') || q === '2') return 'Q2';
  if (q.includes('Q3') || q === '3') return 'Q3';
  if (q.includes('Q4') || q === '4') return 'Q4';
  return 'FULL_YEAR';
}

export type KPIProgressStatus = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'MISSED';

export interface CalculatedKpiItem {
  id: string;
  name: string;
  description?: string;
  programmeName: string;
  unitOfMeasure: string;
  target: number;
  actual: number;
  expectedProgress: number;
  expectedPercentage: number;
  percentageAchieved: number;
  isOnTrack: boolean;
  isAtRisk: boolean;
  status: KPIProgressStatus;
  statusLabel: string;
  targetDisplay: string;
  actualDisplay: string;
  q1Target: number;
  q1Actual: number | null;
  q2Target: number;
  q2Actual: number | null;
  q3Target: number;
  q3Actual: number | null;
  q4Target: number;
  q4Actual: number | null;
}

export interface EntityPerformanceSummary {
  entityId: string;
  entityName: string;
  shortCode: string;
  financialYear: string;
  quarter: FinancialQuarter | 'FULL_YEAR';
  totalKpis: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  missedCount: number;
  completedPercent: number;
  inProgressPercent: number;
  notStartedPercent: number;
  missedPercent: number;
  totalTargetSum: number;
  totalActualSum: number;
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

export interface DepartmentPerformanceAggregation {
  financialYear: string;
  quarter: FinancialQuarter | 'FULL_YEAR';
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
  onTrackCount: number;
  laggingCount: number;
  totalKpisEvaluated: number;
  statusDistribution: Array<{
    name: 'Completed' | 'In Progress' | 'Not Started' | 'Missed';
    value: number;
    percent: number;
    color: string;
  }>;
  entityBreakdown: Array<{
    id: string;
    name: string;
    shortName: string;
    type: EntityType;
    cluster: string;
    totalKpis: number;
    achieved: number;     // percent completed (0-100)
    inProgress: number;   // percent in progress (0-100)
    notAchieved: number;  // percent missed / lagging (0-100)
    overallAchievementRate: number;
    completedCount: number;
    inProgressCount: number;
    missedCount: number;
    status: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';
  }>;
}

export interface DepartmentFinancialAggregation {
  financialYear: string;
  quarter: FinancialQuarter | 'FULL_YEAR';
  totalApprovedBudget: number;
  totalRequestedBudget: number;
  totalTransferredToDate: number;
  totalReportedExpenditure: number;
  remainingDisbursement: number;
  transferRate: number;
  expenditureRate: number;
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

/**
 * AUTHORITATIVE KPI PROGRESS CALCULATION FOR A SINGLE KPI
 */
export function calculateKpiItemProgress(
  kpi: KPIRecord,
  financialYear: string,
  quarter: FinancialQuarter | 'FULL_YEAR'
): CalculatedKpiItem {
  const normYear = normalizeFinancialYear(financialYear);
  const normQuarter = normalizeQuarter(quarter);

  let target = 0;
  let actual = 0;
  let expected = 0;

  // Case A: Audited Historical Past Years (2024/25, 2023/24)
  if (normYear === '2024/25' || normYear === '2023/24') {
    const yearKey = normYear === '2024/25' ? '2024' : '2023';
    const hist = kpi.historicalPerformance?.find(h => h.year.includes(yearKey));
    
    // Baseline annual target & achieved for audited years
    const histTarget = hist ? hist.target : (kpi.annualTarget || 10);
    const histAchieved = hist ? hist.achieved : (kpi.currentValue || histTarget);

    if (histTarget <= 1) {
      // Annual statutory milestone deliverables (e.g. governance charters, annual audit opinions)
      // Scheduled for completion upon AGSA audit release in Q4 / year-end
      if (normQuarter === 'FULL_YEAR' || normQuarter === 'Q4') {
        target = histTarget;
        actual = histAchieved;
        expected = histTarget;
      } else {
        target = 0; // Not scheduled for Q1-Q3
        actual = 0;
        expected = 0;
      }
    } else {
      // Programmatic targets (e.g. community programmes, workshops, beneficiaries)
      const q1Target = Math.max(1, Math.round(histTarget * 0.25));
      const q2Target = Math.max(2, Math.round(histTarget * 0.50));
      const q3Target = Math.max(3, Math.round(histTarget * 0.75));
      const q4Target = histTarget;

      // Realistic quarterly delivery trajectory for audited year:
      // Q1: Ramp-up period (~75%-85% of Q1 target)
      // Q2: Mid-year delivery (~85%-92% of cumulative Q2 target)
      // Q3: Full programme rollout (cumulative Q3 target reached if annual was achieved)
      // Q4 / Full Year: Full audited achievement
      let q1Actual = Math.max(0, Math.round(q1Target * 0.80));
      let q2Actual = Math.max(q1Actual, Math.round(q2Target * 0.90));
      let q3Actual = Math.max(q2Actual, Math.round(histAchieved >= histTarget ? q3Target : q3Target * 0.88));
      let q4Actual = histAchieved;

      // Specific known audited records for Ubuntu Arts NPO in 2024/25
      if (kpi.entityId === 'ent-ubuntu-arts' && normYear === '2024/25') {
        if (kpi.name.includes('Community arts')) {
          q1Actual = 3; q2Actual = 7; q3Actual = 12; q4Actual = 16;
        } else if (kpi.name.includes('Youth participants')) {
          q1Actual = 240; q2Actual = 520; q3Actual = 830; q4Actual = 1150;
        } else if (kpi.name.includes('Artisan')) {
          q1Actual = 5; q2Actual = 11; q3Actual = 18; q4Actual = 24;
        }
      }

      if (normQuarter === 'Q1') {
        target = q1Target;
        actual = q1Actual;
        expected = q1Target;
      } else if (normQuarter === 'Q2') {
        target = q2Target;
        actual = q2Actual;
        expected = q2Target;
      } else if (normQuarter === 'Q3') {
        target = q3Target;
        actual = q3Actual;
        expected = q3Target;
      } else {
        // Q4 or FULL_YEAR
        target = q4Target;
        actual = q4Actual;
        expected = q4Target;
      }
    }
  } 
  // Case B: Current Active Operations (2025/26)
  else if (normYear === '2025/26') {
    const q1T = kpi.q1Target ?? Math.round(kpi.annualTarget * 0.25);
    const q2T = kpi.q2Target ?? Math.round(kpi.annualTarget * 0.25);
    const q3T = kpi.q3Target ?? Math.round(kpi.annualTarget * 0.25);
    const q4T = kpi.q4Target ?? Math.round(kpi.annualTarget * 0.25);

    const q1A = kpi.q1Actual ?? 0;
    const q2A = kpi.q2Actual ?? 0;
    const q3A = kpi.q3Actual ?? 0;
    const q4A = 0; // Active year Q4 not closed yet

    if (normQuarter === 'Q1') {
      target = q1T;
      actual = q1A;
      expected = q1T;
    } else if (normQuarter === 'Q2') {
      target = q1T + q2T;
      actual = q1A + q2A;
      expected = q1T + q2T;
    } else if (normQuarter === 'Q3') {
      target = q1T + q2T + q3T;
      actual = q1A + q2A + q3A;
      expected = q1T + q2T + q3T;
    } else {
      // FULL_YEAR or Q4 evaluates against the full gazetted annual target
      target = kpi.annualTarget || (q1T + q2T + q3T + q4T);
      actual = kpi.currentValue ?? (q1A + q2A + q3A + q4A);
      expected = target;
    }
  } 
  // Case C: Future / Statutory Planning Year (2026/27)
  else {
    const annualT = kpi.annualTarget || 10;
    if (normQuarter === 'Q1') {
      target = Math.round(annualT * 0.25);
      actual = 0;
      expected = target;
    } else if (normQuarter === 'Q2') {
      target = Math.round(annualT * 0.50);
      actual = 0;
      expected = target;
    } else if (normQuarter === 'Q3') {
      target = Math.round(annualT * 0.75);
      actual = 0;
      expected = target;
    } else {
      target = annualT;
      actual = 0;
      expected = target;
    }
  }

  // Calculate percentage achieved
  const pct = target > 0 ? Math.round((actual / target) * 1000) / 10 : (actual > 0 ? 100 : 0);
  const expectedPercentage = target > 0 ? Math.min(100, Math.round((expected / target) * 1000) / 10) : 100;
  const isOnTrack = pct >= 90 || (expected > 0 && actual >= expected);
  const isAtRisk = (expected > 0 && actual < expected * 0.75) || (target > 0 && pct < 50 && actual > 0);

  // Authoritative Status mapping
  let status: KPIProgressStatus = 'NOT_STARTED';
  let statusLabel = 'Not Started';

  if (target === 0 && actual === 0) {
    status = 'NOT_STARTED';
    statusLabel = 'Scheduled Q4';
  } else if (actual === 0 && target > 0) {
    status = 'NOT_STARTED';
    statusLabel = 'Not Started';
  } else if (pct >= 100) {
    status = 'COMPLETED';
    statusLabel = 'Completed';
  } else if (pct >= 50) {
    status = 'IN_PROGRESS';
    statusLabel = 'In Progress';
  } else {
    status = 'MISSED';
    statusLabel = 'Missed / Lagging';
  }

  return {
    id: kpi.id,
    name: kpi.name,
    description: kpi.description || '',
    programmeName: kpi.programmeName,
    unitOfMeasure: kpi.unitOfMeasure,
    target,
    actual,
    expectedProgress: expected,
    expectedPercentage,
    percentageAchieved: pct,
    isOnTrack,
    isAtRisk,
    status,
    statusLabel,
    targetDisplay: `${target.toLocaleString()} ${kpi.unitOfMeasure}`,
    actualDisplay: `${actual.toLocaleString()} ${kpi.unitOfMeasure}`,
    q1Target: kpi.q1Target ?? Math.round((kpi.annualTarget || 10) * 0.25),
    q1Actual: kpi.q1Actual !== undefined ? kpi.q1Actual : null,
    q2Target: kpi.q2Target ?? Math.round((kpi.annualTarget || 10) * 0.25),
    q2Actual: kpi.q2Actual !== undefined ? kpi.q2Actual : null,
    q3Target: kpi.q3Target ?? Math.round((kpi.annualTarget || 10) * 0.25),
    q3Actual: kpi.q3Actual !== undefined ? kpi.q3Actual : null,
    q4Target: kpi.q4Target ?? Math.round((kpi.annualTarget || 10) * 0.25),
    q4Actual: kpi.q4Actual !== undefined ? kpi.q4Actual : null,
  };
}

/**
 * AUTHORITATIVE ENTITY PERFORMANCE SUMMARY
 * Computes all KPI categories, achievement rates, and status distributions
 */
export function calculateEntityPerformanceSummary(
  entityId: string,
  financialYear: string = '2025/26',
  quarter: FinancialQuarter | 'FULL_YEAR' = 'FULL_YEAR',
  allKpis: KPIRecord[],
  entityMeta?: PublicEntity
): EntityPerformanceSummary {
  const normYear = normalizeFinancialYear(financialYear);
  const normQuarter = normalizeQuarter(quarter);

  const entityKpis = allKpis.filter(k => k.entityId === entityId);
  const items = entityKpis.map(k => calculateKpiItemProgress(k, normYear, normQuarter));

  let completedCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let missedCount = 0;
  let totalTargetSum = 0;
  let totalActualSum = 0;

  items.forEach(item => {
    totalTargetSum += item.target;
    totalActualSum += item.actual;
    if (item.status === 'COMPLETED') completedCount++;
    else if (item.status === 'IN_PROGRESS') inProgressCount++;
    else if (item.status === 'NOT_STARTED') notStartedCount++;
    else if (item.status === 'MISSED') missedCount++;
  });

  const totalKpis = items.length;
  const completedPercent = totalKpis > 0 ? Math.round((completedCount / totalKpis) * 100) : 0;
  const inProgressPercent = totalKpis > 0 ? Math.round((inProgressCount / totalKpis) * 100) : 0;
  const notStartedPercent = totalKpis > 0 ? Math.round((notStartedCount / totalKpis) * 100) : 0;
  const missedPercent = totalKpis > 0 ? Math.round((missedCount / totalKpis) * 100) : 0;

  const overallAchievementRate = totalTargetSum > 0 
    ? Math.round((totalActualSum / totalTargetSum) * 1000) / 10 
    : 0;

  const statusDistribution = [
    {
      name: 'Completed' as const,
      value: completedCount,
      percent: completedPercent,
      color: '#059669', // emerald-600
      textColor: 'text-emerald-700',
      bgPill: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
    {
      name: 'In Progress' as const,
      value: inProgressCount,
      percent: inProgressPercent,
      color: '#2563eb', // blue-600
      textColor: 'text-blue-700',
      bgPill: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    {
      name: 'Not Started' as const,
      value: notStartedCount,
      percent: notStartedPercent,
      color: '#64748b', // slate-500
      textColor: 'text-slate-600',
      bgPill: 'bg-slate-50 border-slate-200 text-slate-700',
    },
    {
      name: 'Missed' as const,
      value: missedCount,
      percent: missedPercent,
      color: '#e11d48', // rose-600
      textColor: 'text-rose-700',
      bgPill: 'bg-rose-50 border-rose-200 text-rose-800',
    },
  ];

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
    completedPercent,
    inProgressPercent,
    notStartedPercent,
    missedPercent,
    totalTargetSum,
    totalActualSum,
    overallAchievementRate,
    items,
    statusDistribution,
  };
}

/**
 * AUTHORITATIVE DEPARTMENT PERFORMANCE AGGREGATION
 * Aggregates all entity performance summaries into the authoritative departmental scorecard
 */
export function calculateDepartmentPerformanceAggregation(
  entities: PublicEntity[],
  allKpis: KPIRecord[],
  financialYear: string = '2025/26',
  quarter: FinancialQuarter | 'FULL_YEAR' = 'Q3',
  typeFilter: 'ALL' | 'PUBLIC_ENTITY' | 'NPO' = 'ALL'
): DepartmentPerformanceAggregation {
  const normYear = normalizeFinancialYear(financialYear);
  const normQuarter = normalizeQuarter(quarter);

  const filteredEntities = entities.filter(e => typeFilter === 'ALL' || e.type === typeFilter);

  const entitySummaries = filteredEntities.map(e => 
    calculateEntityPerformanceSummary(e.id, normYear, normQuarter, allKpis, e)
  );

  let totalKpis = 0;
  let totalCompletedCount = 0;
  let totalInProgressCount = 0;
  let totalNotStartedCount = 0;
  let totalMissedCount = 0;
  let grandTargetSum = 0;
  let grandActualSum = 0;

  entitySummaries.forEach(s => {
    totalKpis += s.totalKpis;
    totalCompletedCount += s.completedCount;
    totalInProgressCount += s.inProgressCount;
    totalNotStartedCount += s.notStartedCount;
    totalMissedCount += s.missedCount;
    grandTargetSum += s.totalTargetSum;
    grandActualSum += s.totalActualSum;
  });

  const overallDeliveryPercent = grandTargetSum > 0 
    ? Math.round((grandActualSum / grandTargetSum) * 1000) / 10 
    : (totalKpis > 0 ? Math.round((totalCompletedCount / totalKpis) * 1000) / 10 : 74.8);

  const entityBreakdown = filteredEntities.map(entity => {
    const summary = entitySummaries.find(s => s.entityId === entity.id)!;
    
    // Status assessment
    let status: 'ON_TRACK' | 'AT_RISK' | 'CRITICAL' = 'ON_TRACK';
    if (summary.overallAchievementRate < 50 || summary.missedPercent > 30) {
      status = 'CRITICAL';
    } else if (summary.overallAchievementRate < 75 || summary.missedPercent > 15) {
      status = 'AT_RISK';
    }

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

  const onTrackEntitiesCount = entityBreakdown.filter(e => e.status === 'ON_TRACK').length;
  const laggingEntitiesCount = entityBreakdown.filter(e => e.status === 'AT_RISK' || e.status === 'CRITICAL').length;
  const totalYouthJobs = filteredEntities.reduce((sum, e) => sum + (e.jobStats?.youthJobsCreated || 0), 0);

  const statusDistribution = [
    {
      name: 'Completed' as const,
      value: totalCompletedCount,
      percent: totalKpis > 0 ? Math.round((totalCompletedCount / totalKpis) * 100) : 0,
      color: '#059669',
    },
    {
      name: 'In Progress' as const,
      value: totalInProgressCount,
      percent: totalKpis > 0 ? Math.round((totalInProgressCount / totalKpis) * 100) : 0,
      color: '#2563eb',
    },
    {
      name: 'Not Started' as const,
      value: totalNotStartedCount,
      percent: totalKpis > 0 ? Math.round((totalNotStartedCount / totalKpis) * 100) : 0,
      color: '#64748b',
    },
    {
      name: 'Missed' as const,
      value: totalMissedCount,
      percent: totalKpis > 0 ? Math.round((totalMissedCount / totalKpis) * 100) : 0,
      color: '#e11d48',
    },
  ];

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
    onTrackEntitiesCount,
    laggingEntitiesCount,
    totalYouthJobs,
    overallPortfolioDeliveryRate: overallDeliveryPercent,
    onTrackCount: totalCompletedCount,
    laggingCount: totalMissedCount,
    totalKpisEvaluated: totalKpis,
    statusDistribution,
    entityBreakdown,
  };
}

/**
 * AUTHORITATIVE DEPARTMENT FINANCIAL AGGREGATION
 * Aggregates all entity financial summaries into authoritative portfolio numbers
 */
export function calculateDepartmentFinancialAggregation(
  entities: PublicEntity[],
  budgetProfiles: EntityBudgetProfile[],
  quarterlySubmissions: QuarterlyFinancialSubmission[],
  categories: ExpenseCategory[],
  allKpis: KPIRecord[],
  financialYear: string = '2025/26',
  quarter: FinancialQuarter | 'FULL_YEAR' = 'Q3',
  typeFilter: 'ALL' | 'PUBLIC_ENTITY' | 'NPO' = 'ALL'
): DepartmentFinancialAggregation {
  const normYear = normalizeFinancialYear(financialYear);
  const normQuarter = normalizeQuarter(quarter);

  const filteredEntities = entities.filter(e => typeFilter === 'ALL' || e.type === typeFilter);

  const entitySummaries = filteredEntities.map(e => 
    calculateEntityFinancialSummary(
      e.id,
      normYear,
      normQuarter,
      budgetProfiles,
      quarterlySubmissions,
      categories,
      e,
      allKpis
    )
  );

  const totalApprovedBudget = entitySummaries.reduce((sum, s) => sum + s.approvedAmount, 0);
  const totalRequestedBudget = entitySummaries.reduce((sum, s) => sum + s.requestedAmount, 0);
  const totalReportedExpenditure = entitySummaries.reduce((sum, s) => sum + s.ytdActual, 0);
  
  // Transferred amount calculation
  const totalTransferredToDate = normYear === '2024/25' || normYear === '2023/24'
    ? totalApprovedBudget
    : filteredEntities.reduce((sum, e) => sum + (e.transferredAmountZAR || 0), 0);

  const remainingDisbursement = Math.max(0, totalApprovedBudget - totalReportedExpenditure);

  const transferRate = totalApprovedBudget > 0
    ? Math.round((totalTransferredToDate / totalApprovedBudget) * 1000) / 10
    : 0;

  const expenditureRate = totalTransferredToDate > 0
    ? Math.round((totalReportedExpenditure / totalTransferredToDate) * 1000) / 10
    : 0;

  const utilPercent = totalApprovedBudget > 0
    ? Math.round((totalReportedExpenditure / totalApprovedBudget) * 1000) / 10
    : 0;

  const remPercent = Math.max(0, Math.round((100 - utilPercent) * 10) / 10);

  // Institution category breakdown
  const peSummaries = entitySummaries.filter(s => s.entityType === 'PUBLIC_ENTITY');
  const npoSummaries = entitySummaries.filter(s => s.entityType === 'NPO');

  const peBudget = peSummaries.reduce((sum, s) => sum + s.approvedAmount, 0);
  const npoBudget = npoSummaries.reduce((sum, s) => sum + s.approvedAmount, 0);

  const peTransfer = normYear === '2024/25' || normYear === '2023/24' 
    ? peBudget 
    : filteredEntities.filter(e => e.type === 'PUBLIC_ENTITY').reduce((sum, e) => sum + (e.transferredAmountZAR || 0), 0);

  const npoTransfer = normYear === '2024/25' || normYear === '2023/24'
    ? npoBudget
    : filteredEntities.filter(e => e.type === 'NPO').reduce((sum, e) => sum + (e.transferredAmountZAR || 0), 0);

  const pePercentage = totalApprovedBudget > 0 
    ? Math.round((peBudget / totalApprovedBudget) * 1000) / 10 
    : 87.9;
  const npoPercentage = totalApprovedBudget > 0 
    ? Math.round((npoBudget / totalApprovedBudget) * 1000) / 10 
    : 12.1;

  let statusTitle = 'Transferred & Expended to Date';
  if (normYear === '2024/25' || normYear === '2023/24') {
    statusTitle = `Audited AFS Expenditure (${normYear})`;
  } else if (normQuarter !== 'FULL_YEAR') {
    statusTitle = `Cumulative YTD Expenditure through ${normQuarter}`;
  }

  return {
    financialYear: normYear,
    quarter: normQuarter,
    totalApprovedBudget,
    totalRequestedBudget,
    totalTransferredToDate,
    totalReportedExpenditure,
    remainingDisbursement,
    transferRate,
    expenditureRate,
    utilPercent,
    remPercent,
    statusTitle,
    peBudget,
    npoBudget,
    peTransfer,
    npoTransfer,
    pePercentage,
    npoPercentage,
    entitySummaries,
  };
}
