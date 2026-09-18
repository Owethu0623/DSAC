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
  financialStatus: 'ON_TRACK' | 'REQUIRES_REVIEW' | 'OVERSPENDING' | 'UNDER_UTILISING' | 'MISSING_SUBMISSION';
  statusExplanation: string;
  
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

export interface DepartmentFinancialKPIs {
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
