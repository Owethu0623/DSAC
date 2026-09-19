export type UserRole = 'DSAC_ADMIN' | 'ENTITY_OFFICER' | 'DSAC_MANAGEMENT';

export type EntityType = 'PUBLIC_ENTITY' | 'NPO';

export type EntityCluster = 
  | 'Heritage & Museums'
  | 'Performing Arts & Theatres'
  | 'Creative Industries & Film'
  | 'Language & Literature'
  | 'Languages, Literature & Libraries'
  | 'Sport & Recreation'
  | 'Subsidized Cultural NPOs';

export * from './types/documentVerification';
export * from './types/financial';
import { 
  ControlledDocumentType, 
  ControlledDocumentStatus, 
  DetailedDocumentVersion, 
  DocumentVerificationResult 
} from './types/documentVerification';

export type ReportStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'OVERDUE';

export type KPIStatus = 'ON_TRACK' | 'AT_RISK' | 'NOT_STARTED' | 'MISSED' | 'COMPLETED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AuditOutcome = 'CLEAN_AUDIT' | 'UNQUALIFIED_WITH_FINDINGS' | 'QUALIFIED' | 'DISCLAIMER' | 'NOT_YET_AUDITED';

/** ACTIVE = verified member of the DSAC portfolio. PENDING_VERIFICATION = self-registered, awaiting DSAC approval. */
export type RegistrationStatus = 'ACTIVE' | 'PENDING_VERIFICATION';

export type DocumentCategory = 
  | 'STRATEGIC_PLAN'
  | 'ANNUAL_PERFORMANCE_PLAN'
  | 'OPERATIONAL_PLAN'
  | 'QUARTERLY_REPORT'
  | 'ANNUAL_REPORT'
  | 'FINANCIAL_REPORT'
  | 'PORTFOLIO_OF_EVIDENCE'
  | 'GOVERNANCE_CHARTER'
  | 'TAX_AND_BANKING';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  entityId?: string; // If ENTITY_OFFICER, bound to their specific entity
  entityName?: string;
  designation: string;
  /** SHA-256 hash of the password. Plain-text passwords are never stored or compared. */
  passwordHash?: string;
  /** @deprecated legacy plain-text field, only read once to migrate old browser data to `passwordHash`. */
  password?: string;
}

export interface EntityDemographics {
  african: number; // count or percentage
  coloured: number;
  indian: number;
  white: number;
  female: number;
  male: number;
  youth: number; // under 35
  personsWithDisabilities: number;
  totalStaff: number;
}

export interface JobCreationStats {
  permanentJobs: number;
  temporaryJobs: number;
  youthJobsCreated: number;
  creativeSectorPractitionersSupported: number;
  targetJobsAnnual: number;
  youthEmployed?: number;
}

export interface PublicEntity {
  id: string;
  name: string;
  shortCode: string;
  type: EntityType;
  cluster: EntityCluster;
  /**
   * DENORMALISED READ CACHE for the current reporting period. Never write these directly: they are
   * recomputed by the store from the budget profile (approved), the disbursement ledger (disbursed) and the
   * lodged quarterly returns (expenditure), which are the single sources of truth.
   */
  budgetAllocationZAR: number;
  transferredAmountZAR: number;
  reportedExpenditureZAR: number;
  registrationStatus?: RegistrationStatus;
  /** Budget the organisation stated when self-registering. Unverified: never counted as approved. */
  declaredBudgetZAR?: number;
  auditOutcome: AuditOutcome;
  auditYear: string;
  overallComplianceScore: number; // 0-100
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  activeDeadlinesCount: number;
  overdueReportsCount: number;
  demographics: EntityDemographics;
  jobStats: JobCreationStats;
  headOfEntity: string;
  contactEmail: string;
  reportingOfficerName: string;
  // PFMA Section 38(1)(j) & Statutory Non-Submission Policy Fields
  trancheStatus?: 'RELEASED' | 'WITHHELD' | 'CONDITIONAL_HOLD' | 'UNDER_REVIEW';
  trancheAmountZAR?: number;
  statutoryDefaultStage?: 0 | 1 | 2 | 3 | 4; // 0: Compliant, 1: 7-Day Warning, 2: Tranche Freeze (PFMA Sec 38), 3: Board Censure, 4: AGSA Referral
  statutoryDefaultNoticeDate?: string;
  statutoryDefaultReason?: string;
  extensionGrantedUntil?: string;
  extensionRequestedReason?: string;
}

export interface KPIRecord {
  id: string;
  entityId: string;
  entityName: string;
  programmeName: string;
  name: string;
  description: string;
  unitOfMeasure: string;
  /**
   * How quarterly results combine into year-to-date. CUMULATIVE (default): quarters add up (beneficiaries,
   * workshops, jobs). NON_CUMULATIVE: the latest reported quarter IS the YTD result (percentages, rates,
   * "% of invoices paid in 30 days"), so summing quarters would be wrong.
   */
  calculationType?: 'CUMULATIVE' | 'NON_CUMULATIVE';
  baseline: number;
  annualTarget: number;
  q1Target: number;
  q1Actual?: number;
  q2Target: number;
  q2Actual?: number;
  q3Target: number;
  q3Actual?: number;
  q4Target: number;
  q4Actual?: number;
  currentValue: number;
  expectedValue: number;
  percentageAchieved: number;
  status: KPIStatus;
  historicalPerformance: {
    year: string;
    achieved: number;
    target: number;
  }[];
}

export interface ReportItem {
  id: string;
  kpiId: string;
  kpiName: string;
  targetToDate: number;
  actualAchieved: number;
  unit: string;
  status: KPIStatus;
  variancePercentage: number;
  varianceReason?: string;
  correctiveAction?: string;
  evidenceDocumentId?: string;
}

export interface QuarterlyReport {
  id: string;
  entityId: string;
  entityName: string;
  financialYear: string; // e.g. "2025/2026"
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  submissionStatus: ReportStatus;
  dueDate: string; // ISO date
  submittedAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  varianceExplanations?: string;
  portfolioOfEvidenceDocId?: string;
  accountingOfficerDeclaration?: boolean;
  fundsSpentThisQuarterZAR: number;
  totalFundsReceivedToDateZAR: number;
  items: ReportItem[];
}

export interface DocumentVersion {
  versionNumber: number;
  uploadedAt: string;
  uploadedBy: string;
  fileName: string;
  fileSizeBytes: number;
  changeSummary: string;
  downloadUrl?: string;
  mimeType?: string;
  contentDataUrl?: string;
}

export interface EntityDocument {
  id: string;
  entityId: string;
  entityName: string;
  title: string;
  category: DocumentCategory;
  controlledType?: ControlledDocumentType;
  verificationStatus?: ControlledDocumentStatus;
  requirementId?: string;
  reportId?: string;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  financialYear: string;
  currentVersion: number;
  versions: DocumentVersion[];
  detailedVersions?: DetailedDocumentVersion[];
  activeVerification?: DocumentVerificationResult;
  fileHash?: string;
  approvalStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REQUIRES_AMENDMENT';
  approvedAt?: string;
  approvedBy?: string;
  comments: CommentMessage[];
  fileName?: string;
  fileSize?: string;
  fileSizeBytes?: number;
  uploadedAt?: string;
  uploadedBy?: string;
  verificationSummary?: string;
  mimeType?: string;
}

export interface CommentMessage {
  id: string;
  authorName: string;
  authorRole: UserRole;
  authorEntity?: string;
  timestamp: string;
  message: string;
}

export interface CorrectiveTask {
  id: string;
  entityId: string;
  entityName: string;
  kpiId?: string;
  kpiName?: string;
  title: string;
  description: string;
  assignedToName: string;
  createdByName: string;
  createdByRole: UserRole;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  resolutionNotes?: string;
  direction: 'DSAC_TO_ENTITY' | 'ENTITY_INTERNAL' | 'ENTITY_TO_DSAC';
}

export interface RiskAlert {
  id: string;
  entityId: string;
  entityName: string;
  kpiId?: string;
  kpiName?: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  title: string;
  reason: string;
  contributingFactors: string[];
  evidenceData: {
    actualAchieved: number;
    expectedTrajectory: number;
    annualTarget: number;
    financialUtilisationRate: number;
    historicalLateReportsCount: number;
    daysUntilDeadline: number;
  };
  recommendedAction: string;
  createdAt: string;
  acknowledged: boolean;
}

export interface RegulatoryDeadline {
  id: string;
  title: string;
  financialYear: string;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  entityType?: EntityType | 'ALL';
  dueDate: string; // ISO string
  description: string;
  isStatutory: boolean; // PFMA statutory deadline
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  entityName?: string;
  action: 
    | 'USER_LOGIN'
    | 'REPORT_CREATED'
    | 'REPORT_SUBMITTED'
    | 'REPORT_UNDER_REVIEW'
    | 'REPORT_APPROVED'
    | 'REPORT_CORRECTION_REQUIRED'
    | 'REPORT_REVISION_REQUESTED'
    | 'REPORT_VERIFIED'
    | 'REPORT_RESUBMITTED'
    | 'DOCUMENT_REQUIRED'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_VALIDATION_STARTED'
    | 'DOCUMENT_VERIFIED'
    | 'DOCUMENT_REJECTED'
    | 'DOCUMENT_SENT_FOR_MANUAL_REVIEW'
    | 'DOCUMENT_APPROVED'
    | 'DOCUMENT_REPLACED'
    | 'DOCUMENT_ARCHIVED'
    | 'DOCUMENT_VERSION_INCREMENTED'
    | 'DOCUMENT_DELETED'
    | 'TASK_CREATED'
    | 'TASK_RESOLVED'
    | 'EARLY_WARNING_TRIGGERED'
    | 'USER_REGISTRATION'
    | 'USER_LOGOUT'
    | 'SYSTEM_BASELINE_SYNC'
    | 'ENTITY_RECORD_UPDATED'
    | 'BUDGET_REQUEST_CREATED'
    | 'BUDGET_APPROVED'
    | 'BUDGET_UPDATED'
    | 'QUARTERLY_EXPENDITURE_SUBMITTED'
    | 'EXPENDITURE_UPDATED'
    | 'FINANCIAL_REPORT_APPROVED'
    | 'FINANCIAL_REPORT_CORRECTION_REQUESTED'
    | 'FINANCIAL_RECORD_UPDATED'
    | 'TRANCHE_WITHHELD'
    | 'TRANCHE_RELEASED'
    | 'EXTENSION_REQUESTED'
    | 'STATUTORY_NOTICE_ISSUED'
    | 'SUPPORT_REQUEST_CREATED'
    | 'SUPPORT_REQUEST_REVIEWED'
    | 'ACCESS_DENIED'
    | 'KPI_ACTUAL_UPDATED'
    | 'LOGIN_FAILED'
    | 'TRANCHE_DISBURSED';
  details: string;
  ipAddress?: string;
}

export type SupportRequestCategory = 
  | 'BUDGET_REQUEST' 
  | 'ADDITIONAL_FUNDING' 
  | 'TECHNICAL_SUPPORT' 
  | 'GOVERNANCE_ASSISTANCE' 
  | 'PROGRAMME_SUPPORT' 
  | 'CAPACITY_BUILDING';

export type SupportRequestStatus = 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'DECLINED' 
  | 'MORE_INFORMATION_REQUIRED' 
  | 'COMPLETED';

export interface SupportRequest {
  id: string;
  entityId: string;
  entityName: string;
  title: string;
  category: SupportRequestCategory;
  categoryLabel?: string;
  amountRequested?: number;
  motivation: string;
  linkedProgramme?: string;
  expectedOutcome: string;
  supportingDocumentation?: string;
  status: SupportRequestStatus;
  createdAt: string;
  submittedBy: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  updatedAt: string;
}
