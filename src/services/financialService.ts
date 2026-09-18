import { 
  ExpenseCategory, 
  EntityBudgetProfile, 
  QuarterlyFinancialSubmission, 
  CategoryQuarterlyPerformance, 
  EntityFinancialSummary, 
  DepartmentFinancialKPIs,
  FinancialQuarter 
} from '../types/financial';
import { PublicEntity, KPIRecord } from '../types';

export const QUARTER_ORDER: FinancialQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

export const DEFAULT_FINANCIAL_YEAR = '2026/27';

/**
 * Format currency in South African Rands (ZAR)
 */
export function formatZAR(val: number, options?: { compact?: boolean }): string {
  if (val === undefined || val === null || isNaN(val)) return 'R 0';
  
  if (options?.compact) {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1000000000) {
      return `${sign}R${(abs / 1000000000).toFixed(1)}B`;
    }
    if (abs >= 1000000) {
      return `${sign}R${(abs / 1000000).toFixed(1)}M`;
    }
    if (abs >= 1000) {
      return `${sign}R${(abs / 1000).toFixed(0)}k`;
    }
    return `${sign}R${abs.toLocaleString('en-ZA')}`;
  }

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(val).replace('ZAR', 'R');
}

/**
 * Single Authoritative Financial Calculation Layer
 * Calculates the exact financial position for an entity across quarters and categories
 */
export function calculateEntityFinancialSummary(
  entityId: string,
  financialYear: string,
  selectedQuarter: FinancialQuarter | 'FULL_YEAR',
  budgetProfiles: EntityBudgetProfile[],
  quarterlySubmissions: QuarterlyFinancialSubmission[],
  categories: ExpenseCategory[],
  entityMeta?: PublicEntity,
  kpiRecords?: KPIRecord[]
): EntityFinancialSummary {
  const profile = budgetProfiles.find(
    bp => bp.entityId === entityId && bp.financialYear === financialYear
  );

  const entityName = profile?.entityName || entityMeta?.name || 'Public Entity';
  const shortCode = entityMeta?.shortCode || entityName.slice(0, 4).toUpperCase();
  const requestedAmount = profile?.requestedAmount || entityMeta?.budgetAllocationZAR || 0;
  const approvedAmount = profile?.approvedAmount || entityMeta?.budgetAllocationZAR || 0;
  const fundingGap = requestedAmount - approvedAmount;
  const budgetStatus = profile?.status || 'APPROVED';

  // Find all quarterly submissions for this entity and financial year
  const entitySubmissions = quarterlySubmissions.filter(
    qs => qs.entityId === entityId && qs.financialYear === financialYear
  );

  const q1Sub = entitySubmissions.find(s => s.quarter === 'Q1');
  const q2Sub = entitySubmissions.find(s => s.quarter === 'Q2');
  const q3Sub = entitySubmissions.find(s => s.quarter === 'Q3');
  const q4Sub = entitySubmissions.find(s => s.quarter === 'Q4');

  const q1Actual = q1Sub?.totalQuarterlyActual || 0;
  const q2Actual = q2Sub?.totalQuarterlyActual || 0;
  const q3Actual = q3Sub?.totalQuarterlyActual || 0;
  const q4Actual = q4Sub?.totalQuarterlyActual || 0;

  const q1Submitted = !!q1Sub;
  const q2Submitted = !!q2Sub;
  const q3Submitted = !!q3Sub;
  const q4Submitted = !!q4Sub;

  // Cumulative YTD calculations strictly up to selected quarter
  let ytdActual = 0;
  if (selectedQuarter === 'Q1') {
    ytdActual = q1Actual;
  } else if (selectedQuarter === 'Q2') {
    ytdActual = q1Actual + q2Actual;
  } else if (selectedQuarter === 'Q3') {
    ytdActual = q1Actual + q2Actual + q3Actual;
  } else {
    // Q4 or FULL_YEAR
    ytdActual = q1Actual + q2Actual + q3Actual + q4Actual;
  }

  const fullYearActual = q1Actual + q2Actual + q3Actual + q4Actual;

  // Remaining budget & utilisation
  // Remaining Budget = Approved Budget - YTD Actual Expenditure
  const remainingBudget = approvedAmount - ytdActual;
  const isOverspent = ytdActual > approvedAmount && approvedAmount > 0;
  const overspendAmount = isOverspent ? ytdActual - approvedAmount : 0;

  // Utilisation % = (YTD Actual / Approved Annual Budget) * 100
  // NOT capped at 100% so overspend is visible (e.g. 105%)
  const utilisationPercent = approvedAmount > 0 
    ? Math.round((ytdActual / approvedAmount) * 1000) / 10 
    : 0;

  // Trajectory benchmark
  const trajectory = profile?.expectedSpendingTrajectory || {
    q1Percent: 25,
    q2Percent: 50,
    q3Percent: 75,
    q4Percent: 100,
  };

  let expectedPercent = 100;
  if (selectedQuarter === 'Q1') expectedPercent = trajectory.q1Percent;
  else if (selectedQuarter === 'Q2') expectedPercent = trajectory.q2Percent;
  else if (selectedQuarter === 'Q3') expectedPercent = trajectory.q3Percent;
  else expectedPercent = trajectory.q4Percent;

  const expectedYtd = (approvedAmount * expectedPercent) / 100;
  // Variance = Actual - Planned (Expected)
  const variance = ytdActual - expectedYtd;
  const absoluteVariance = Math.abs(variance);
  const variancePercent = expectedYtd > 0 
    ? Math.round((variance / expectedYtd) * 1000) / 10 
    : 0;

  // Determine financial status & explanation
  let financialStatus: 'ON_TRACK' | 'REQUIRES_REVIEW' | 'OVERSPENDING' | 'UNDER_UTILISING' | 'MISSING_SUBMISSION' = 'ON_TRACK';
  let statusExplanation = 'Expenditure aligns within statutory variance tolerance (±10%) against approved trajectory.';

  if (isOverspent) {
    financialStatus = 'OVERSPENDING';
    statusExplanation = `Actual cumulative expenditure exceeds approved annual budget by ${formatZAR(overspendAmount)} (${utilisationPercent}% utilisation).`;
  } else if (
    (selectedQuarter === 'Q2' && !q2Submitted) ||
    (selectedQuarter === 'Q3' && !q3Submitted) ||
    (selectedQuarter === 'Q4' && !q4Submitted)
  ) {
    financialStatus = 'MISSING_SUBMISSION';
    statusExplanation = `Statutory expenditure return for ${selectedQuarter} has not been lodged by the Accounting Officer.`;
  } else if (variancePercent > 15) {
    financialStatus = 'REQUIRES_REVIEW';
    statusExplanation = `Expenditure pace (+${variancePercent}%) is accelerating materially faster than approved quarterly trajectory.`;
  } else if (variancePercent < -25) {
    financialStatus = 'UNDER_UTILISING';
    statusExplanation = `Low financial absorption rate (${variancePercent}% below trajectory). Potential procurement bottlenecks or programme execution lag.`;
  }

  // Category breakdown calculation
  const categoryBreakdown: CategoryQuarterlyPerformance[] = categories.map(cat => {
    // Budget line for this category
    const budgetLine = profile?.lines.find(l => l.categoryId === cat.id);
    const catAnnualBudget = budgetLine?.annualBudget || 0;

    // Actuals from each quarter
    const getCatActual = (submission?: QuarterlyFinancialSubmission) => {
      if (!submission) return 0;
      const line = submission.lines.find(l => l.categoryId === cat.id);
      return line?.actualAmount || 0;
    };

    const cQ1 = getCatActual(q1Sub);
    const cQ2 = getCatActual(q2Sub);
    const cQ3 = getCatActual(q3Sub);
    const cQ4 = getCatActual(q4Sub);

    let cYtd = 0;
    if (selectedQuarter === 'Q1') cYtd = cQ1;
    else if (selectedQuarter === 'Q2') cYtd = cQ1 + cQ2;
    else if (selectedQuarter === 'Q3') cYtd = cQ1 + cQ2 + cQ3;
    else cYtd = cQ1 + cQ2 + cQ3 + cQ4;

    const cPlannedYtd = (catAnnualBudget * expectedPercent) / 100;
    const cRemaining = catAnnualBudget - cYtd;
    const cIsOverspent = cYtd > catAnnualBudget && catAnnualBudget > 0;
    const cOverspendAmount = cIsOverspent ? cYtd - catAnnualBudget : 0;
    const cUtilisation = catAnnualBudget > 0 
      ? Math.round((cYtd / catAnnualBudget) * 1000) / 10 
      : 0;
    const cVariance = cYtd - cPlannedYtd;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      annualBudget: catAnnualBudget,
      q1Actual: cQ1,
      q2Actual: cQ2,
      q3Actual: cQ3,
      q4Actual: cQ4,
      ytdActual: cYtd,
      remaining: cRemaining,
      utilisationPercent: cUtilisation,
      plannedYtd: cPlannedYtd,
      variance: cVariance,
      isOverspent: cIsOverspent,
      overspendAmount: cOverspendAmount,
    };
  });

  // Calculate Performance Achievement Rate connection
  let targetAchievementRate: number | undefined;
  let performanceFinanceSignal: { status: 'ALIGNED' | 'REQUIRES_REVIEW' | 'DISCONNECTED'; commentary: string } | undefined;

  if (kpiRecords && kpiRecords.length > 0) {
    const entityKpis = kpiRecords.filter(k => k.entityId === entityId);
    if (entityKpis.length > 0) {
      const avgAchieved = Math.round(
        entityKpis.reduce((acc, k) => acc + (k.percentageAchieved || 0), 0) / entityKpis.length
      );
      targetAchievementRate = avgAchieved;

      // Section 23: Connect financial information to performance
      // If budget utilisation is high (e.g. >70%) but target achievement is low (e.g. <50%)
      if (utilisationPercent >= 70 && avgAchieved <= 50) {
        performanceFinanceSignal = {
          status: 'REQUIRES_REVIEW',
          commentary: `Budget utilisation (${utilisationPercent}%) is substantially ahead of reported target achievement (${avgAchieved}%). Review expenditure and performance evidence for this reporting period.`
        };
      } else if (Math.abs(utilisationPercent - avgAchieved) <= 20) {
        performanceFinanceSignal = {
          status: 'ALIGNED',
          commentary: `Financial absorption (${utilisationPercent}%) corresponds proportionally with operational delivery achievement (${avgAchieved}%).`
        };
      } else {
        performanceFinanceSignal = {
          status: 'REQUIRES_REVIEW',
          commentary: `Financial utilisation is at ${utilisationPercent}% while operational delivery reflects ${avgAchieved}%. Monitor milestone progression.`
        };
      }
    }
  }

  return {
    entityId,
    entityName,
    shortCode,
    financialYear,
    budgetProfileId: profile?.id,
    requestedAmount,
    approvedAmount,
    fundingGap,
    budgetStatus,
    q1Actual,
    q2Actual,
    q3Actual,
    q4Actual,
    q1Submitted,
    q2Submitted,
    q3Submitted,
    q4Submitted,
    selectedQuarter,
    ytdActual,
    fullYearActual,
    expectedYtd,
    remainingBudget,
    utilisationPercent,
    variance,
    absoluteVariance,
    variancePercent,
    isOverspent,
    overspendAmount,
    financialStatus,
    statusExplanation,
    targetAchievementRate,
    performanceFinanceSignal,
    categories: categoryBreakdown.filter(c => c.annualBudget > 0 || c.ytdActual > 0),
  };
}

/**
 * Department-level aggregate KPI computation
 */
export function calculateDepartmentFinancialKPIs(
  financialYear: string,
  selectedQuarter: FinancialQuarter | 'FULL_YEAR',
  budgetProfiles: EntityBudgetProfile[],
  quarterlySubmissions: QuarterlyFinancialSubmission[],
  entities: PublicEntity[],
  categories: ExpenseCategory[],
  kpis?: KPIRecord[]
): DepartmentFinancialKPIs {
  const summaries = entities.map(entity => 
    calculateEntityFinancialSummary(
      entity.id,
      financialYear,
      selectedQuarter,
      budgetProfiles,
      quarterlySubmissions,
      categories,
      entity,
      kpis
    )
  );

  const totalRequested = summaries.reduce((acc, s) => acc + s.requestedAmount, 0);
  const totalApproved = summaries.reduce((acc, s) => acc + s.approvedAmount, 0);
  const totalActualExpenditure = summaries.reduce((acc, s) => acc + s.ytdActual, 0);
  const totalRemaining = totalApproved - totalActualExpenditure;
  const overallUtilisationPercent = totalApproved > 0 
    ? Math.round((totalActualExpenditure / totalApproved) * 1000) / 10 
    : 0;

  const entitiesOverspendingCount = summaries.filter(s => s.isOverspent).length;
  const entitiesUnderUtilisingCount = summaries.filter(s => s.financialStatus === 'UNDER_UTILISING').length;
  const entitiesOnTrackCount = summaries.filter(s => s.financialStatus === 'ON_TRACK').length;
  const entitiesMissingSubmissionCount = summaries.filter(s => s.financialStatus === 'MISSING_SUBMISSION').length;

  const pendingRequests = budgetProfiles.filter(
    bp => bp.status === 'SUBMITTED' || bp.status === 'UNDER_REVIEW'
  ).length;

  const totalFundingGap = totalRequested - totalApproved;

  return {
    totalRequested,
    totalApproved,
    totalActualExpenditure,
    totalRemaining,
    overallUtilisationPercent,
    entitiesOverspendingCount,
    entitiesUnderUtilisingCount,
    entitiesOnTrackCount,
    entitiesMissingSubmissionCount,
    budgetRequestsPendingCount: pendingRequests,
    totalFundingGap,
  };
}

/**
 * Generates an export-ready CSV string adhering to Section 33 of User Request
 */
export function generateFinancialExportCSV(
  summaries: EntityFinancialSummary[],
  financialYear: string
): string {
  const headers = [
    'Entity',
    'Short Code',
    'Financial Year',
    'Budget Requested (ZAR)',
    'Approved Budget (ZAR)',
    'Funding Gap (ZAR)',
    'Q1 Actual (ZAR)',
    'Q2 Actual (ZAR)',
    'Q3 Actual (ZAR)',
    'Q4 Actual (ZAR)',
    'YTD Actual (ZAR)',
    'Remaining Budget (ZAR)',
    'Utilisation %',
    'Expected YTD (ZAR)',
    'Variance (ZAR)',
    'Financial Status',
    'Overspent Flag'
  ];

  const rows = summaries.map(s => [
    `"${s.entityName.replace(/"/g, '""')}"`,
    `"${s.shortCode}"`,
    `"${s.financialYear}"`,
    s.requestedAmount,
    s.approvedAmount,
    s.fundingGap,
    s.q1Actual,
    s.q2Actual,
    s.q3Actual,
    s.q4Actual,
    s.ytdActual,
    s.remainingBudget,
    `${s.utilisationPercent}%`,
    s.expectedYtd,
    s.variance,
    `"${s.financialStatus}"`,
    s.isOverspent ? 'YES' : 'NO'
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
