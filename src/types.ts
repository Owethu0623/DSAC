export type UserRole = 'DSAC_ADMIN' | 'ENTITY_OFFICER' | 'DSAC_MANAGEMENT';

export type EntityType = 'PUBLIC_ENTITY' | 'NPO';

export type EntityCluster = 
  | 'Heritage & Museums'
  | 'Performing Arts & Theatres'
  | 'Creative Industries & Film'
  | 'Language & Literature'
  | 'Sport & Recreation';

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

export type AuditOutcome = 'CLEAN_AUDIT' | 'UNQUALIFIED_WITH_FINDINGS' | 'QUALIFIED' | 'DISCLAIMER';

export type DocumentCategory = 
  | 'STRATEGIC_PLAN'
  | 'ANNUAL_PERFORMANCE_PLAN'
  | 'OPERATIONAL_PLAN'
  | 'QUARTERLY_REPORT'
  | 'ANNUAL_REPORT'
  | 'FINANCIAL_REPORT'
  | 'PORTFOLIO_OF_EVIDENCE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  entityId?: string; // If ENTITY_OFFICER, bound to their specific entity
  entityName?: string;
  designation: string;
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
}

export interface PublicEntity {
  id: string;
  name: string;
  shortCode: string;
  type: EntityType;
  cluster: EntityCluster;
  budgetAllocationZAR: number;
  transferredAmountZAR: number;
  reportedExpenditureZAR: number;
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
}

export interface KPIRecord {
  id: string;
  entityId: string;
  entityName: string;
  programmeName: string;
  name: string;
  description: string;
  unitOfMeasure: string;
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
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  rejectionReason?: string;
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
}

export interface EntityDocument {
  id: string;
  entityId: string;
  entityName: string;
  title: string;
  category: DocumentCategory;
  financialYear: string;
  currentVersion: number;
  versions: DocumentVersion[];
  approvalStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REQUIRES_AMENDMENT';
  approvedAt?: string;
  approvedBy?: string;
  comments: CommentMessage[];
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
  direction: 'DSAC_TO_ENTITY' | 'ENTITY_INTERNAL';
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
    | 'REPORT_RESUBMITTED'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_VERSION_INCREMENTED'
    | 'TASK_CREATED'
    | 'TASK_RESOLVED'
    | 'EARLY_WARNING_TRIGGERED'
    | 'USER_REGISTRATION'
    | 'USER_LOGOUT'
    | 'SYSTEM_BASELINE_SYNC';
  details: string;
  ipAddress?: string;
}
