export type BudgetRequestStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED';

export type BudgetProfileStatus = BudgetRequestStatus;

export type QuarterlyFinancialStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'CORRECTION_REQUIRED';

export type FinancialQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

/**
 * Returns whose figures count as "reported expenditure" on DSAC dashboards.
 * DRAFT (not yet lodged) and CORRECTION_REQUIRED (sent back to the entity) are excluded so a
 * disputed or unfinished return can never inflate portfolio totals.
 */
export const REPORTED_RETURN_STATUSES: QuarterlyFinancialStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];
/** Returns DSAC has accepted. Reported-but-not-accepted amounts are shown as "awaiting verification". */
export const VERIFIED_RETURN_STATUSES: QuarterlyFinancialStatus[] = ['APPROVED'];

export type DisbursementStatus = 'RELEASED' | 'SCHEDULED' | 'WITHHELD';

/**
 * One transfer (tranche) from DSAC to an entity. "Amount Disbursed" is ALWAYS the sum of RELEASED records,
 * never a free-standing number, so it can change by quarter and be audited.
 */
export interface DisbursementRecord {
  id: string;
  entityId: string;
  financialYear: string; // canonical "2025/26"
  tranche: FinancialQuarter; // tranche n is scheduled with quarter n
  amountZAR: number;
  status: DisbursementStatus;
  scheduledDate?: string;
  releasedAt?: string;
  releasedByName?: string;
  reference?: string;
  note?: string;
}

export interface QuarterlyTimelinePoint {
  quarter: FinancialQuarter;
  quarterName?: string;
  actualExpenditure: number;
  plannedExpenditure: number;
  cumulativeYtdExpenditure: number;
  remainingBudget: number;
  utilisationPercent: number;
  isSubmitted: boolean;
  status?: string;
  /** Tranche released for this quarter (0 if none). */
  disbursedInQuarter?: number;
  cumulativeDisbursed?: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
  standardSortOrder: number;
}

export interface BudgetLine {
  id: string;
  budgetId: string;
  categoryId: string;
  categoryName: string;
  requestedAmount: number;
  annualBudget: number; // Approved amount
  notes?: string;
}

export interface QuarterlyExpenditureLine {
  id: string;
  quarterlySubmissionId: string;
  budgetLineId?: string;
  categoryId: string;
  categoryName: string;
  actualAmount: number;
  plannedAmount: number;
  varianceReason?: string;
  correctiveMitigation?: string;
}

export interface QuarterlyFinancialSubmission {
  id: string;
  entityId: string;
  entityName: string;
  financialYear: string; // e.g. "2026/27" or "2025/2026"
  quarter: FinancialQuarter;
  status: QuarterlyFinancialStatus;
  submittedAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  correctionNotes?: string;
  lines: QuarterlyExpenditureLine[];
  totalQuarterlyActual: number;
  supportingDocumentIds: string[]; // Document IDs matching document verification system
  accountingOfficerAffirmation: boolean;
  accountingOfficerName?: string;
  createdAt: string;
  updatedAt: string;
  /** Incremented every time the entity re-lodges this quarter (resubmission after correction). */
  revision?: number;
  /** Prior lodged totals, kept so a resubmission never silently overwrites what was originally reported. */
  revisionHistory?: { at: string; totalQuarterlyActual: number; status: QuarterlyFinancialStatus }[];
}

export interface SpendingTrajectory {
  q1Percent: number; // e.g. 25 or 20
  q2Percent: number; // e.g. 50 or 45
  q3Percent: number; // e.g. 75 or 70
  q4Percent: number; // e.g. 100
}

export interface EntityBudgetProfile {
  id: string;
  entityId: string;
  entityName: string;
  financialYear: string; // e.g. "2026/27"
  requestedAmount: number;
  approvedAmount: number;
  fundingGap: number; // requestedAmount - approvedAmount
  status: BudgetRequestStatus;
  requestDate: string;
  approvalDate?: string;
  justification: string;
  supportingDocumentId?: string;
  supportingDocumentName?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewDate?: string;
  comments?: string;
  lines: BudgetLine[];
  expectedSpendingTrajectory: SpendingTrajectory;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryQuarterlyPerformance {
  categoryId: string;
  categoryName: string;
  /** Spend reported against a line that has no approved budget (irregular / unauthorised until proven otherwise). */
  isUnbudgeted?: boolean;
  annualBudget: number;
  q1Actual: number;
  q2Actual: number;
  q3Actual: number;
  q4Actual: number;
  ytdActual: number;
  remaining: number;
  remainingBudget: number;
  utilisationPercent: number;
  plannedYtd: number;
  variance: number;
  isOverspent: boolean;
  overspendAmount: number;
}

export interface EntityFinancialSummary {
  entityId: string;
  entityName: string;
  shortCode: string;
  entityType?: 'PUBLIC_ENTITY' | 'NPO';
  financialYear: string;
  budgetProfileId?: string;
  requestedAmount: number;
  approvedAmount: number;
  fundingGap: number;
  budgetStatus: BudgetRequestStatus;
  
  // Quarterly actuals
  q1Actual: number;
  q2Actual: number;
  q3Actual: number;
  q4Actual: number;
  q1Submitted: boolean;
  q2Submitted: boolean;
  q3Submitted: boolean;
  q4Submitted: boolean;
  
  // Selected quarter evaluation
  selectedQuarter: FinancialQuarter | 'FULL_YEAR';
  ytdActual: number;
  fullYearActual: number;
  expectedYtd: number;
  remainingBudget: number;
  utilisationPercent: number;
  variance: number; // Actual YTD - Expected YTD
  absoluteVariance: number;
  variancePercent: number;
  targetTrajectoryPercent?: number;
  
  // Overspending flags
  isOverspent: boolean;
  overspendAmount: number;
  
  // Trajectory analysis
  financialStatus: FinancialStatus;
  statusExplanation: string;

  // Disbursement & absorption. Utilisation above is Budget Utilisation (YTD / Approved).
  // Absorption is the separate, explicitly named metric YTD / Disbursed.
  hasBudgetProfile: boolean;
  disbursedToDate: number;
  disbursementRate: number; // disbursed / approved, %
  absorptionRate: number; // YTD actual / disbursed, %
  undisbursedBalance: number; // approved - disbursed
  unspentDisbursed: number; // disbursed - YTD actual (never negative)
  spentAheadOfDisbursement: boolean; // YTD actual exceeds cash received

  // Verification: reported = lodged returns; verified = accepted by DSAC
  verifiedYtdActual: number;
  unverifiedYtdActual: number;
  dueQuarters: FinancialQuarter[];
  missingQuarters: FinancialQuarter[];
  returnedQuarters: FinancialQuarter[];

  // Forecast (run-rate): where year-end spend lands if the current pace continues
  projectedYearEndSpend: number;
  projectedYearEndUtilisationPercent: number;

  // Integrity flags
  lineBudgetTotal: number; // sum of expense-line budgets
  lineBudgetVariance: number; // approved - line budget total (must be 0)
  linesReconcile: boolean;

  // Performance and Finance connection
  targetAchievementRate?: number; // e.g. 48%
  performanceFinanceSignal?: {
    status: 'ALIGNED' | 'REQUIRES_REVIEW' | 'DISCONNECTED' | 'COMMENDABLE';
    commentary: string;
  };
  
  // Quarterly timeline progression
  quarterlyTimeline: QuarterlyTimelinePoint[];

  // Category breakdown
  categories: CategoryQuarterlyPerformance[];
}

export type FinancialStatus =
  | 'ON_TRACK'
  | 'REQUIRES_REVIEW'
  | 'OVERSPENDING'
  | 'UNDER_UTILISING'
  | 'MISSING_SUBMISSION'
  | 'NOT_DUE';

export interface DepartmentFinancialKPIs {
  totalDisbursed: number;
  totalVerifiedActual: number;
  totalRequested: number;
  totalApproved: number;
  totalActualExpenditure: number;
  totalActualYTD: number;
  totalRemaining: number;
  overallUtilisationPercent: number;
  departmentUtilisationPercent: number;
  targetTrajectoryPercent: number;
  entitiesOverspendingCount: number;
  overspendingEntitiesCount: number;
  entitiesUnderUtilisingCount: number;
  underUtilisingEntitiesCount: number;
  entitiesOnTrackCount: number;
  entitiesMissingSubmissionCount: number;
  budgetRequestsPendingCount: number;
  pendingSubmissionsCount: number;
  totalFundingGap: number;
}
