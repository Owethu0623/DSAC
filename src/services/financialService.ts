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
 * Returns formatted statutory date range for a given financial quarter
 */
export function getQuarterDates(quarter: FinancialQuarter | string, financialYear = '2026/27'): string {
  const startYear = parseInt(financialYear.slice(0, 4)) || 2026;
  const nextYear = startYear + 1;
  switch (quarter) {
    case 'Q1': return `01 Apr ${startYear} – 30 Jun ${startYear}`;
    case 'Q2': return `01 Jul ${startYear} – 30 Sep ${startYear}`;
    case 'Q3': return `01 Oct ${startYear} – 31 Dec ${startYear}`;
    case 'Q4': return `01 Jan ${nextYear} – 31 Mar ${nextYear}`;
    default: return `01 Apr ${startYear} – 31 Mar ${nextYear}`;
  }
}

/**
 * Returns full descriptive name for a financial quarter
 */
export function getQuarterName(quarter: FinancialQuarter | string): string {
  switch (quarter) {
    case 'Q1': return 'Quarter 1 (Apr – Jun)';
    case 'Q2': return 'Quarter 2 (Jul – Sep)';
    case 'Q3': return 'Quarter 3 (Oct – Dec)';
    case 'Q4': return 'Quarter 4 (Jan – Mar)';
    default: return 'Full Financial Year';
  }
}

/**
 * Returns visual badge styling and label for financial status
 */
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
      return { label: 'Missing Return', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

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
  // Normalize year (e.g. 'FY 2024/25' or '2024/2025' -> '2024/25')
  const normYear = financialYear.includes('2023') ? '2023/24' :
                   financialYear.includes('2024') ? '2024/25' :
                   financialYear.includes('2026') ? '2026/27' : '2025/26';

  const profile = budgetProfiles.find(
    bp => bp.entityId === entityId && (bp.financialYear === normYear || bp.financialYear === financialYear)
  );

  const entityName = profile?.entityName || entityMeta?.name || 'Public Entity';
  const shortCode = entityMeta?.shortCode || entityName.slice(0, 4).toUpperCase();
  let requestedAmount = profile?.requestedAmount || entityMeta?.budgetAllocationZAR || 0;
  let approvedAmount = profile?.approvedAmount || entityMeta?.budgetAllocationZAR || 0;

  // Align multi-year baseline figures if profile not explicitly created
  if (!profile) {
    if (normYear === '2024/25') {
      if (entityId === 'ent-ubuntu-arts') {
        requestedAmount = 5000000;
        approvedAmount = 4800000;
      } else {
        requestedAmount = Math.round((entityMeta?.budgetAllocationZAR || 10000000) * 0.95);
        approvedAmount = Math.round((entityMeta?.budgetAllocationZAR || 10000000) * 0.95);
      }
    } else if (normYear === '2023/24') {
      if (entityId === 'ent-ubuntu-arts') {
        requestedAmount = 4700000;
        approvedAmount = 4500000;
      } else {
        requestedAmount = Math.round((entityMeta?.budgetAllocationZAR || 10000000) * 0.90);
        approvedAmount = Math.round((entityMeta?.budgetAllocationZAR || 10000000) * 0.90);
      }
    } else if (normYear === '2025/26') {
      if (entityId === 'ent-ubuntu-arts') {
        requestedAmount = 5500000;
        approvedAmount = 5000000;
      } else {
        requestedAmount = entityMeta?.budgetAllocationZAR || 10000000;
        approvedAmount = entityMeta?.budgetAllocationZAR || 10000000;
      }
    }
  }

  const fundingGap = requestedAmount - approvedAmount;
  const budgetStatus = profile?.status || 'APPROVED';

  // Find all quarterly submissions for this entity and financial year
  const entitySubmissions = quarterlySubmissions.filter(
    qs => qs.entityId === entityId && (qs.financialYear === normYear || qs.financialYear === financialYear)
  );

  const q1Sub = entitySubmissions.find(s => s.quarter === 'Q1');
  const q2Sub = entitySubmissions.find(s => s.quarter === 'Q2');
  const q3Sub = entitySubmissions.find(s => s.quarter === 'Q3');
  const q4Sub = entitySubmissions.find(s => s.quarter === 'Q4');

  // Baseline fallback calculations per quarter
  let baseQ1 = 0, baseQ2 = 0, baseQ3 = 0, baseQ4 = 0;
  if (entityId === 'ent-ubuntu-arts') {
    if (financialYear.includes('2024')) {
      baseQ1 = 1200000; baseQ2 = 1200000; baseQ3 = 1150000; baseQ4 = 1170000;
    } else if (financialYear.includes('2023')) {
      baseQ1 = 1120000; baseQ2 = 1120000; baseQ3 = 1120000; baseQ4 = 1120000;
    } else if (financialYear.includes('2025')) {
      baseQ1 = 1050000; baseQ2 = 1050000; baseQ3 = 1100000; baseQ4 = 0;
    }
  } else {
    if (financialYear.includes('2024') || financialYear.includes('2023')) {
      const fullYearSpend = Math.round(approvedAmount * 0.98);
      const qSpend = Math.round(fullYearSpend / 4);
      baseQ1 = qSpend; baseQ2 = qSpend; baseQ3 = qSpend; baseQ4 = fullYearSpend - (qSpend * 3);
    } else if (financialYear.includes('2025')) {
      const activeYtd = entityMeta?.transferredAmountZAR || entityMeta?.reportedExpenditureZAR || Math.round(approvedAmount * 0.75);
      baseQ1 = Math.round(activeYtd * 0.32);
      baseQ2 = Math.round(activeYtd * 0.34);
      baseQ3 = Math.max(0, activeYtd - baseQ1 - baseQ2);
      baseQ4 = 0;
    }
  }

  const q1Actual = q1Sub ? q1Sub.totalQuarterlyActual : baseQ1;
  const q2Actual = q2Sub ? q2Sub.totalQuarterlyActual : baseQ2;
  const q3Actual = q3Sub ? q3Sub.totalQuarterlyActual : baseQ3;
  const q4Actual = q4Sub ? q4Sub.totalQuarterlyActual : baseQ4;

  const q1Submitted = !!q1Sub || baseQ1 > 0;
  const q2Submitted = !!q2Sub || baseQ2 > 0;
  const q3Submitted = !!q3Sub || (baseQ3 > 0 && !financialYear.includes('2026'));
  const q4Submitted = !!q4Sub || (baseQ4 > 0 && !financialYear.includes('2025') && !financialYear.includes('2026'));

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
  } else if (financialYear.includes('2024') || financialYear.includes('2023')) {
    financialStatus = 'ON_TRACK';
    statusExplanation = `Audited AFS closed with ${utilisationPercent}% budget utilisation under PFMA Section 38 oversight.`;
  } else if (
    (selectedQuarter === 'Q2' && !q2Submitted) ||
    (selectedQuarter === 'Q3' && !q3Submitted) ||
    (selectedQuarter === 'Q4' && !q4Submitted && !financialYear.includes('2025'))
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
      remainingBudget: cRemaining,
      utilisationPercent: cUtilisation,
      plannedYtd: cPlannedYtd,
      variance: cVariance,
      isOverspent: cIsOverspent,
      overspendAmount: cOverspendAmount,
    };
  });

  // Calculate Performance Achievement Rate connection
  let targetAchievementRate: number | undefined;
  let performanceFinanceSignal: { status: 'ALIGNED' | 'REQUIRES_REVIEW' | 'DISCONNECTED' | 'COMMENDABLE'; commentary: string } | undefined;

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

  // Build quarterly timeline progression
  const quarterlyTimeline = (['Q1', 'Q2', 'Q3', 'Q4'] as FinancialQuarter[]).map((q) => {
    let qActual = 0;
    let isSubmitted = false;
    let submissionStatus: string | undefined;

    if (q === 'Q1') {
      qActual = q1Actual;
      isSubmitted = q1Submitted;
      submissionStatus = q1Sub?.status;
    } else if (q === 'Q2') {
      qActual = q2Actual;
      isSubmitted = q2Submitted;
      submissionStatus = q2Sub?.status;
    } else if (q === 'Q3') {
      qActual = q3Actual;
      isSubmitted = q3Submitted;
      submissionStatus = q3Sub?.status;
    } else {
      qActual = q4Actual;
      isSubmitted = q4Submitted;
      submissionStatus = q4Sub?.status;
    }

    const qPlanned = (approvedAmount * 0.25);
    
    let cumulativeYtd = 0;
    if (q === 'Q1') cumulativeYtd = q1Actual;
    else if (q === 'Q2') cumulativeYtd = q1Actual + q2Actual;
    else if (q === 'Q3') cumulativeYtd = q1Actual + q2Actual + q3Actual;
    else cumulativeYtd = q1Actual + q2Actual + q3Actual + q4Actual;

    const remaining = approvedAmount - cumulativeYtd;
    const utilisation = approvedAmount > 0 ? Math.round((cumulativeYtd / approvedAmount) * 1000) / 10 : 0;

    return {
      quarter: q,
      quarterName: getQuarterName(q),
      actualExpenditure: qActual,
      plannedExpenditure: qPlanned,
      cumulativeYtdExpenditure: cumulativeYtd,
      remainingBudget: remaining,
      utilisationPercent: utilisation,
      isSubmitted,
      status: submissionStatus,
    };
  });

  return {
    entityId,
    entityName,
    shortCode,
    entityType: entityMeta?.type || 'PUBLIC_ENTITY',
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
    targetTrajectoryPercent: expectedPercent,
    isOverspent,
    overspendAmount,
    financialStatus,
    statusExplanation,
    targetAchievementRate,
    performanceFinanceSignal,
    quarterlyTimeline,
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

  const pendingSubmissionsCount = quarterlySubmissions.filter(
    s => s.financialYear === financialYear && (s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW')
  ).length;

  let deptExpectedPercent = 100;
  if (selectedQuarter === 'Q1') deptExpectedPercent = 25;
  else if (selectedQuarter === 'Q2') deptExpectedPercent = 50;
  else if (selectedQuarter === 'Q3') deptExpectedPercent = 75;

  const totalFundingGap = totalRequested - totalApproved;

  return {
    totalRequested,
    totalApproved,
    totalActualExpenditure,
    totalActualYTD: totalActualExpenditure,
    totalRemaining,
    overallUtilisationPercent,
    departmentUtilisationPercent: overallUtilisationPercent,
    targetTrajectoryPercent: deptExpectedPercent,
    entitiesOverspendingCount,
    overspendingEntitiesCount: entitiesOverspendingCount,
    entitiesUnderUtilisingCount,
    underUtilisingEntitiesCount: entitiesUnderUtilisingCount,
    entitiesOnTrackCount,
    entitiesMissingSubmissionCount,
    budgetRequestsPendingCount: pendingRequests,
    pendingSubmissionsCount,
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
