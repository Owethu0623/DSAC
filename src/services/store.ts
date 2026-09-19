import { 
  PublicEntity, 
  KPIRecord, 
  QuarterlyReport, 
  EntityDocument, 
  CorrectiveTask, 
  RiskAlert, 
  RegulatoryDeadline, 
  AuditLogEntry, 
  User, 
  UserRole,
  ReportItem,
  EntityType,
  EntityCluster,
  DocumentRequirement,
  ControlledDocumentType,
  ControlledDocumentStatus,
  DocumentVerificationResult,
  DetailedDocumentVersion,
  DocumentVerificationChecklist,
  DocumentRequirementSlot,
  SupportRequest,
  SupportRequestCategory,
  SupportRequestStatus
} from '../types';
import { 
  calculateFileHash,
  validateFileLevel,
  extractDocumentContent,
  analyzeDocumentContent,
  DEMO_TEST_DOCUMENTS
} from './documentVerificationEngine';
import { 
  INITIAL_USERS, 
  INITIAL_ENTITIES, 
  INITIAL_KPIS, 
  INITIAL_REPORTS, 
  INITIAL_DOCUMENTS, 
  INITIAL_TASKS, 
  INITIAL_RISK_ALERTS, 
  INITIAL_DEADLINES, 
  INITIAL_AUDIT_LOGS 
} from '../data/initialData';
import { 
  ExpenseCategory, 
  EntityBudgetProfile, 
  QuarterlyFinancialSubmission, 
  BudgetRequestStatus, 
  QuarterlyFinancialStatus, 
  EntityFinancialSummary, 
  DepartmentFinancialKPIs,
  FinancialQuarter,
  DisbursementRecord,
  BudgetLine,
  REPORTED_RETURN_STATUSES
} from '../types/financial';
import { INITIAL_EXPENSE_CATEGORIES } from '../data/initialFinancialData';
import { getStorageAdapter } from './storageAdapter';
import { PublicUser, StateData } from '../types/sync';
import {
  SEEDED_BUDGET_PROFILES,
  SEEDED_QUARTERLY_SUBMISSIONS,
  SEEDED_DISBURSEMENTS,
  STANDARD_CATEGORY_IDS,
  STANDARD_CATEGORY_WEIGHTS,
  repairBudgetProfile
} from '../data/financialSeed';
import {
  calculateEntityFinancialSummary,
  calculateDepartmentFinancialKPIs,
  formatZAR,
  isPortfolioMember,
  returnTotal
} from './financialService';
import {
  calculateEntityPerformanceSummary,
  calculateDepartmentPerformanceAggregation,
  calculateDepartmentFinancialAggregation,
  EntityPerformanceSummary,
  DepartmentPerformanceAggregation,
  DepartmentFinancialAggregation
} from './calculationEngine';
import {
  KPI_DATA_YEAR,
  calculateKpiItemProgress,
  classifyKpiProgress,
  kpiCumulativeThrough,
  normalizeKpiRecord,
  normalizeKpiRecords
} from './kpiProgress';
import {
  QuarterSelection,
  QUARTER_ORDER,
  allocateProportionally,
  getCurrentReportingPeriod,
  normalizeFinancialYear,
  normalizeQuarter,
  pct1,
  quarterDueDate,
  quarterIndex,
  sameFinancialYear,
  toLongFinancialYear
} from './reportingPeriod';
import { checkPasswordStrength, hashPassword, verifyPassword } from './passwordHash';
import { DEMO_MODE, DEMO_PASSWORD } from '../config/demoMode';

const STORAGE_KEYS = {
  CURRENT_USER: 'govtrack_current_user',
  REGISTERED_USERS: 'govtrack_registered_users',
  ENTITIES: 'govtrack_entities',
  KPIS: 'govtrack_kpis',
  REPORTS: 'govtrack_reports',
  DOCUMENTS: 'govtrack_documents',
  DOCUMENT_REQUIREMENTS: 'govtrack_document_requirements',
  TASKS: 'govtrack_tasks',
  RISKS: 'govtrack_risks',
  DEADLINES: 'govtrack_deadlines',
  AUDIT_LOGS: 'govtrack_audit_logs',
  EXPENSE_CATEGORIES: 'govtrack_expense_categories',
  BUDGET_PROFILES: 'govtrack_budget_profiles',
  QUARTERLY_FINANCIAL_SUBMISSIONS: 'govtrack_quarterly_financial_submissions',
  SUPPORT_REQUESTS: 'govtrack_support_requests',
  DISBURSEMENTS: 'govtrack_disbursements',
  DATA_VERSION: 'govtrack_data_version',
};

/**
 * Bump whenever the shape or meaning of stored data changes. A mismatch discards stale browser data and reloads
 * the seed baseline (users are migrated, not discarded). v2 = single-source finance model + hashed passwords.
 */
const DATA_VERSION = '2';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

/** Roles allowed to approve, release, review and otherwise act with DSAC financial authority. */
const DSAC_AUTHORITY_ROLES: UserRole[] = ['DSAC_ADMIN', 'DSAC_MANAGEMENT'];
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 5 * 60 * 1000;

export const INITIAL_SUPPORT_REQUESTS: SupportRequest[] = [
  {
    id: 'req-sup-001',
    entityId: 'ent-ubuntu-arts',
    entityName: 'Ubuntu Arts NPO',
    title: 'Youth Community Arts Festival & Rural Touring Production Subvention',
    category: 'PROGRAMME_SUPPORT',
    categoryLabel: 'Programme Support',
    amountRequested: 450000,
    motivation: 'Supplemental touring subvention to extend Eastern Cape rural theatre masterclasses to 14 underserved schools in Bizana and Flagstaff.',
    linkedProgramme: 'Youth Creative Arts Expansion',
    expectedOutcome: 'Direct engagement of 450 rural youth and creation of 18 temporary arts practitioner contracts.',
    supportingDocumentation: 'Tour_Budget_And_Itinerary_Signed.pdf',
    status: 'APPROVED',
    createdAt: '2026-09-12T09:30:00.000Z',
    submittedBy: 'Lerato Phiri (Accounting Officer)',
    reviewedBy: 'usr-dsac-01',
    reviewedByName: 'Thandi Mokoena (DSAC Oversight Director)',
    reviewNotes: 'Approved under Mzansi Golden Economy provincial outreach programme.',
    updatedAt: '2026-09-13T14:20:00.000Z',
  },
  {
    id: 'req-sup-002',
    entityId: 'ent-sahra',
    entityName: 'South African Heritage Resources Agency (SAHRA)',
    title: 'SAHRIS National Heritage Geodatabase Cloud Infrastructure Upgrade',
    category: 'TECHNICAL_SUPPORT',
    categoryLabel: 'Technical Support',
    amountRequested: 1200000,
    motivation: 'High-availability server migration and GIS cloud processing modernization to prevent permitting backlogs during Section 34 & 38 development applications.',
    linkedProgramme: 'Heritage Protection & National Inventory Management',
    expectedOutcome: 'Zero downtime during statutory heritage permit evaluations and integration with provincial heritage registries.',
    supportingDocumentation: 'ICT_Steering_Committee_Approval_SAHRA.pdf',
    status: 'UNDER_REVIEW',
    createdAt: '2026-09-10T11:00:00.000Z',
    submittedBy: 'Dr. Mxolisi Dlamini (CEO)',
    updatedAt: '2026-09-10T11:00:00.000Z',
  },
  {
    id: 'req-sup-003',
    entityId: 'ent-pacofs',
    entityName: 'Performing Arts Centre of the Free State (PACOFS)',
    title: 'Internal Audit & PFMA Compliance Advisory Task Team Intervention',
    category: 'GOVERNANCE_ASSISTANCE',
    categoryLabel: 'Governance Assistance',
    amountRequested: 320000,
    motivation: 'Deployment of DSAC Oversight Directorate governance experts to address AGSA qualification findings related to asset register reconciliation.',
    linkedProgramme: 'Governance Restoration & Clean Audit Pathway',
    expectedOutcome: 'Resolution of 14 audit findings ahead of statutory tabling.',
    supportingDocumentation: 'Audit_Steering_Action_Plan_PACOFS.pdf',
    status: 'UNDER_REVIEW',
    createdAt: '2026-09-05T08:45:00.000Z',
    submittedBy: 'Kagiso Semenya (Chief Executive)',
    updatedAt: '2026-09-05T08:45:00.000Z',
  },
  {
    id: 'req-sup-004',
    entityId: 'ent-nac',
    entityName: 'National Arts Council of South Africa (NAC)',
    title: 'Grant Management Portal Verification & Adjudication Workshop',
    category: 'CAPACITY_BUILDING',
    categoryLabel: 'Capacity Building',
    amountRequested: 280000,
    motivation: 'Capacity building training for newly appointed panellists and administrative staff on electronic grant auditing and POPI Act compliance.',
    linkedProgramme: 'Grant Administration & Arts Development',
    expectedOutcome: 'Accelerated turnaround time for artist funding disbursements.',
    supportingDocumentation: 'Council_Resolution_Panellist_Training.pdf',
    status: 'APPROVED',
    createdAt: '2026-08-28T14:15:00.000Z',
    submittedBy: 'Julie Diphofa (Interim CEO)',
    reviewedBy: 'usr-dsac-01',
    reviewedByName: 'Thandi Mokoena (DSAC Oversight Director)',
    reviewNotes: 'Authorized with mandate to include regional provincial representatives.',
    updatedAt: '2026-08-30T10:00:00.000Z',
  },
  {
    id: 'req-sup-005',
    entityId: 'ent-boxing-sa',
    entityName: 'Boxing South Africa (BSA)',
    title: 'Emergency Ring Official Safety & Medical Certification Funding',
    category: 'ADDITIONAL_FUNDING',
    categoryLabel: 'Additional Funding',
    amountRequested: 420000,
    motivation: 'Urgent medical screening and neurological diagnostic equipment subsidy for licensed boxers in high-density tournament regions.',
    linkedProgramme: 'Athlete Health & Safety Standards',
    expectedOutcome: 'Mandatory ringside neurological clearances across all 9 provinces.',
    supportingDocumentation: 'Medical_Advisory_Commission_Report.pdf',
    status: 'MORE_INFORMATION_REQUIRED',
    createdAt: '2026-09-01T16:00:00.000Z',
    submittedBy: 'Sipho Sithole (Administrator)',
    reviewedBy: 'usr-dsac-01',
    reviewedByName: 'Thandi Mokoena (DSAC Oversight Director)',
    reviewNotes: 'Please provide itemized equipment quotations and provincial breakdown before final approval.',
    updatedAt: '2026-09-03T11:20:00.000Z',
  }
];

export const DEFAULT_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: 'req-q-perf-rep',
    code: 'REQ-PERF-Q-REP',
    title: 'Quarterly Performance Report',
    description: 'Statutory quarterly performance report detailing KPI targets, actual achievements, and variance explanations.',
    requiredDocumentType: 'PERFORMANCE_REPORT',
    category: 'PERFORMANCE',
    applicableQuarter: 'ALL',
    mandatory: true,
    minConfidenceThreshold: 0.80,
    expectedCharacteristics: [
      'Quarterly Performance Statutory Heading',
      'Strategic KPI & Indicator Matrix',
      'Actual vs Target Delivery Analysis',
      'Accounting Officer Sign-Off'
    ]
  },
  {
    id: 'req-poe-bundle',
    code: 'REQ-PERF-POE',
    title: 'Portfolio of Evidence (PoE)',
    description: 'Physical deliverable evidence including attendance registers, beneficiary lists, and site inspection logs.',
    requiredDocumentType: 'POE',
    category: 'PERFORMANCE',
    applicableQuarter: 'ALL',
    mandatory: true,
    minConfidenceThreshold: 0.80,
    expectedCharacteristics: [
      'Portfolio of Evidence (PoE) Statutory Framing',
      'Physical Beneficiary / Participant Attendance Log',
      'Temporal & Geographic Verification Records',
      'On-site Inspection / Photographic Deliverable Record'
    ]
  },
  {
    id: 'req-fin-bank',
    code: 'REQ-FIN-BANK',
    title: 'Statutory Bank Statement',
    description: 'Certified quarterly bank statement from a recognised commercial bank demonstrating tranche drawdown and balance progression.',
    requiredDocumentType: 'BANK_STATEMENT',
    category: 'FINANCIAL',
    applicableQuarter: 'ALL',
    mandatory: true,
    minConfidenceThreshold: 0.80,
    expectedCharacteristics: [
      'Recognised South African Financial Institution Identity',
      'Statutory Statement Period Reference',
      'Official Account & Branch Routing Details',
      'Reconciled Opening/Closing Balance Ledger'
    ]
  },
  {
    id: 'req-fin-stmt',
    code: 'REQ-FIN-STMT',
    title: 'Quarterly Financial Statement',
    description: 'Quarterly statement of financial position and financial performance compliant with GRAP/IFRS standards.',
    requiredDocumentType: 'FINANCIAL_STATEMENT',
    category: 'FINANCIAL',
    applicableQuarter: 'ALL',
    mandatory: true,
    minConfidenceThreshold: 0.80,
    expectedCharacteristics: [
      'Statement of Financial Position (Balance Sheet)',
      'Statement of Financial Performance',
      'Cash Flow & Net Asset Reconciliation',
      'GRAP/IFRS Accounting Framework Notes'
    ]
  },
  {
    id: 'req-fin-exp',
    code: 'REQ-FIN-EXP',
    title: 'Proof of Expenditure & Vouchers',
    description: 'Itemized supplier tax invoices, proof of payments, and expenditure audit vouchers matching claimed spend.',
    requiredDocumentType: 'PROOF_OF_EXPENDITURE',
    category: 'FINANCIAL',
    applicableQuarter: 'ALL',
    mandatory: true,
    minConfidenceThreshold: 0.80,
    expectedCharacteristics: [
      'Payment Execution & Remittance Confirmation',
      'Authenticated Vendor / Contractor Reference',
      'Monetary Transaction Value in ZAR',
      'Expenditure Voucher & Audit Traceability'
    ]
  }
];

// Safe JSON parse from the configured storage (browser localStorage by default) with fallback
function loadFromStorage<T>(key: string, fallback: T): T {
  const storage = getStorageAdapter();
  if (!storage) return fallback;
  try {
    const item = storage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  const storage = getStorageAdapter();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save to storage for key ${key}:`, e);
  }
}

async function readFileAsDataUrl(file: File): Promise<string | undefined> {
  if (typeof FileReader === 'undefined') return undefined;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined);
    reader.onerror = () => reject(new Error(`Unable to read uploaded file "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

export class GovTrackStore {
  private static instance: GovTrackStore;
  private listeners: Set<() => void> = new Set();

  currentUser: User | null;
  registeredUsers: User[];
  entities!: PublicEntity[];
  kpis!: KPIRecord[];
  reports!: QuarterlyReport[];
  documents!: EntityDocument[];
  documentRequirements!: DocumentRequirement[];
  tasks!: CorrectiveTask[];
  riskAlerts!: RiskAlert[];
  deadlines!: RegulatoryDeadline[];
  auditLogs!: AuditLogEntry[];
  expenseCategories!: ExpenseCategory[];
  budgetProfiles!: EntityBudgetProfile[];
  quarterlyFinancialSubmissions!: QuarterlyFinancialSubmission[];
  supportRequests!: SupportRequest[];
  disbursements!: DisbursementRecord[];
  private failedLogins = new Map<string, { count: number; lockedUntil: number }>();

  private constructor() {
    const versionOk = loadFromStorage<string>(STORAGE_KEYS.DATA_VERSION, '') === DATA_VERSION;

    this.registeredUsers = this.loadUsers(versionOk);

    // A visitor is NEVER signed in by default (the old build auto-selected the first user, i.e. the DSAC
    // administrator, on a fresh browser). A stored session is honoured only if it still maps to a registered account.
    const session = loadFromStorage<{ id?: string } | null>(STORAGE_KEYS.CURRENT_USER, null);
    this.currentUser = (session?.id && this.registeredUsers.find(u => u.id === session.id)) || null;

    this.loadDomainData(!versionOk);
    this.persistAll();
  }

  /** Session pointer persisted to the browser: an id only, never the account record or its hash. */
  private sessionRecord(): { id: string } | null {
    return this.currentUser ? { id: this.currentUser.id } : null;
  }

  private loadUsers(versionOk: boolean): User[] {
    const demoUsers: User[] = DEMO_MODE
      ? INITIAL_USERS.map(u => ({ ...u, passwordHash: hashPassword(DEMO_PASSWORD) }))
      : [];

    const stored = loadFromStorage<User[]>(STORAGE_KEYS.REGISTERED_USERS, []);
    // Migrate accounts saved by earlier builds: plain-text password -> salted hash, then drop the plain text.
    const migrated: User[] = stored
      .map(u => {
        const { password, ...rest } = u;
        return { ...rest, passwordHash: rest.passwordHash || (password ? hashPassword(password) : undefined) } as User;
      })
      .filter(u => !!u.passwordHash);

    const base = migrated;
    const known = new Set(base.map(u => u.email.toLowerCase()));
    demoUsers.forEach(u => {
      if (!known.has(u.email.toLowerCase())) base.push(u);
    });
    return base;
  }

  /**
   * Loads every domain collection (from browser storage, or from the seed baseline when `useSeed`) and then
   * rebuilds all derived state. Seeds are always deep-cloned: the previous code handed the module-level seed
   * arrays to the store, so edits mutated the "baseline" and a reseed did not restore it.
   */
  private loadDomainData(useSeed: boolean): void {
    const pick = <T,>(key: string, seed: T): T => (useSeed ? clone(seed) : loadFromStorage<T>(key, clone(seed)));
    const mergeById = <T extends { id: string }>(list: T[], seed: T[]): T[] => {
      if (!useSeed) {
        seed.forEach(s => {
          if (!list.some(x => x.id === s.id)) list.push(clone(s));
        });
      }
      return list;
    };

    this.entities = mergeById(pick<PublicEntity[]>(STORAGE_KEYS.ENTITIES, INITIAL_ENTITIES), INITIAL_ENTITIES).map(e => ({
      ...e,
      registrationStatus: e.registrationStatus ?? 'ACTIVE',
      trancheStatus: e.trancheStatus || (e.overdueReportsCount > 0 || e.riskLevel === 'CRITICAL' ? 'WITHHELD' : 'RELEASED'),
      statutoryDefaultStage: e.statutoryDefaultStage !== undefined ? e.statutoryDefaultStage : (e.overdueReportsCount > 0 ? 2 : 0),
      statutoryDefaultReason: e.statutoryDefaultReason || (e.overdueReportsCount > 0 ? 'Statutory Q3 Performance Return and certified PoE overdue past 30-day PFMA Section 38(1)(j) deadline.' : undefined),
      statutoryDefaultNoticeDate: e.statutoryDefaultNoticeDate || (e.overdueReportsCount > 0 ? '2026-02-01T08:00:00.000Z' : undefined),
    }));

    this.kpis = normalizeKpiRecords(mergeById(pick<KPIRecord[]>(STORAGE_KEYS.KPIS, INITIAL_KPIS), INITIAL_KPIS));
    this.reports = mergeById(pick<QuarterlyReport[]>(STORAGE_KEYS.REPORTS, INITIAL_REPORTS), INITIAL_REPORTS);

    const docs = pick<EntityDocument[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
    INITIAL_DOCUMENTS.forEach(initDoc => {
      const existing = docs.find(d => d.id === initDoc.id);
      if (!existing) {
        docs.push(clone(initDoc));
      } else {
        // Guarantee file properties are synchronized
        existing.fileName = existing.fileName || initDoc.fileName || existing.versions?.[0]?.fileName || existing.title;
        existing.fileSize = existing.fileSize || initDoc.fileSize || (existing.fileSizeBytes ? `${(existing.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '3.5 MB');
        existing.fileSizeBytes = existing.fileSizeBytes || initDoc.fileSizeBytes;
        existing.uploadedAt = existing.uploadedAt || initDoc.uploadedAt || existing.versions?.[0]?.uploadedAt;
        existing.uploadedBy = existing.uploadedBy || initDoc.uploadedBy || existing.versions?.[0]?.uploadedBy;
      }
    });
    this.documents = docs.map(d => ({
      ...d,
      fileName: d.fileName || d.versions?.[0]?.fileName || d.title,
      fileSize: d.fileSize || (d.fileSizeBytes ? (d.fileSizeBytes < 1000000 ? `${Math.round(d.fileSizeBytes / 1024)} KB` : `${(d.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`) : '3.5 MB'),
      uploadedAt: d.uploadedAt || d.versions?.[0]?.uploadedAt || '2025-07-14T10:00:00.000Z',
      uploadedBy: d.uploadedBy || d.versions?.[0]?.uploadedBy || 'Lerato Phiri (Organisation Admin)',
    }));

    this.documentRequirements = pick<DocumentRequirement[]>(STORAGE_KEYS.DOCUMENT_REQUIREMENTS, DEFAULT_DOCUMENT_REQUIREMENTS);
    this.tasks = pick<CorrectiveTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    this.riskAlerts = pick<RiskAlert[]>(STORAGE_KEYS.RISKS, INITIAL_RISK_ALERTS);
    this.deadlines = pick<RegulatoryDeadline[]>(STORAGE_KEYS.DEADLINES, INITIAL_DEADLINES);
    this.auditLogs = pick<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    this.expenseCategories = mergeById(pick<ExpenseCategory[]>(STORAGE_KEYS.EXPENSE_CATEGORIES, INITIAL_EXPENSE_CATEGORIES), INITIAL_EXPENSE_CATEGORIES);

    // Finance: the three sources of truth. Loaded records are repaired so nothing enters un-footed.
    this.budgetProfiles = mergeById(pick<EntityBudgetProfile[]>(STORAGE_KEYS.BUDGET_PROFILES, SEEDED_BUDGET_PROFILES), SEEDED_BUDGET_PROFILES)
      .map(repairBudgetProfile);
    this.quarterlyFinancialSubmissions = mergeById(
      pick<QuarterlyFinancialSubmission[]>(STORAGE_KEYS.QUARTERLY_FINANCIAL_SUBMISSIONS, SEEDED_QUARTERLY_SUBMISSIONS),
      SEEDED_QUARTERLY_SUBMISSIONS
    ).map(s => ({ ...s, totalQuarterlyActual: returnTotal(s) }));
    this.disbursements = mergeById(pick<DisbursementRecord[]>(STORAGE_KEYS.DISBURSEMENTS, SEEDED_DISBURSEMENTS), SEEDED_DISBURSEMENTS);

    this.supportRequests = mergeById(pick<SupportRequest[]>(STORAGE_KEYS.SUPPORT_REQUESTS, INITIAL_SUPPORT_REQUESTS), INITIAL_SUPPORT_REQUESTS);

    this.refreshDerivedState();
  }

  /** Rebuilds every denormalised value from the sources of truth. Safe to call at any time. */
  private refreshDerivedState(): void {
    this.entities.forEach(e => this.syncEntityFinancialCache(e.id));
    this.reconcileReportMirrors();
    this.entities.forEach(e => this.recalculateEntityRisk(e.id));
  }

  /** Blocks DSAC-only financial and statutory actions for everyone else, and records the attempt. */
  private requireDsacAuthority(action: string): boolean {
    const role = this.currentUser?.role;
    if (role && DSAC_AUTHORITY_ROLES.includes(role)) return true;
    this.addAuditLog('ACCESS_DENIED', `Blocked "${action}": the signed-in role (${role || 'not signed in'}) does not hold DSAC authority.`);
    return false;
  }

  /**
   * True when the signed-in user may act on this organisation's records: any DSAC official, or the entity officer
   * bound to that organisation. Anyone else is refused and the attempt is written to the audit trail.
   */
  private canActForEntity(entityId: string, action: string): boolean {
    const user = this.currentUser;
    if (user && (DSAC_AUTHORITY_ROLES.includes(user.role) || (user.role === 'ENTITY_OFFICER' && user.entityId === entityId))) return true;
    const entity = this.entities.find(e => e.id === entityId);
    this.addAuditLog('ACCESS_DENIED', `Blocked "${action}": the signed-in user may not act on ${entity?.name || 'this organisation'}'s records.`, entity?.name);
    return false;
  }

  /**
   * Refreshes the read-cache fields on an entity (approved / disbursed / reported for the current reporting
   * period) from the budget profile, the disbursement ledger and the lodged returns. These fields are never
   * written anywhere else, so they cannot drift from the sources of truth.
   */
  private syncEntityFinancialCache(entityId: string): void {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return;
    const { financialYear, quarter } = getCurrentReportingPeriod();
    const s = this.getEntityFinancialSummary(entityId, financialYear, quarter);
    entity.budgetAllocationZAR = s.approvedAmount;
    entity.transferredAmountZAR = s.disbursedToDate;
    entity.reportedExpenditureZAR = s.ytdActual;
    const next = this.getNextTranche(entityId, financialYear);
    entity.trancheAmountZAR = next ? next.amountZAR : 0;
  }

  /**
   * A quarterly performance report carries a copy of the quarter's expenditure and cash received. That copy is
   * derived from the finance return and the ledger so the two can never disagree.
   */
  private reconcileReportMirrors(entityId?: string): void {
    this.reports
      .filter(r => !entityId || r.entityId === entityId)
      .forEach(r => {
        const fy = normalizeFinancialYear(r.financialYear);
        const ret = this.quarterlyFinancialSubmissions.find(
          s => s.entityId === r.entityId && s.quarter === r.quarter && normalizeFinancialYear(s.financialYear) === fy && REPORTED_RETURN_STATUSES.includes(s.status)
        );
        if (ret) r.fundsSpentThisQuarterZAR = returnTotal(ret);
        else if (r.submissionStatus === 'OVERDUE' || r.submissionStatus === 'DRAFT') r.fundsSpentThisQuarterZAR = 0;
        const qi = quarterIndex(r.quarter);
        r.totalFundsReceivedToDateZAR = this.disbursements
          .filter(d => d.entityId === r.entityId && d.status === 'RELEASED' && normalizeFinancialYear(d.financialYear) === fy && quarterIndex(d.tranche) <= qi)
          .reduce((a, d) => a + d.amountZAR, 0);
      });
  }

  public static getInstance(): GovTrackStore {
    if (!GovTrackStore.instance) {
      GovTrackStore.instance = new GovTrackStore();
    }
    return GovTrackStore.instance;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  // --- PERSISTENCE HELPERS ---
  public persistAll(): void {
    saveToStorage(STORAGE_KEYS.DATA_VERSION, DATA_VERSION);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, this.sessionRecord());
    saveToStorage(STORAGE_KEYS.REGISTERED_USERS, this.registeredUsers);
    saveToStorage(STORAGE_KEYS.ENTITIES, this.entities);
    saveToStorage(STORAGE_KEYS.KPIS, this.kpis);
    saveToStorage(STORAGE_KEYS.REPORTS, this.reports);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);
    saveToStorage(STORAGE_KEYS.DOCUMENT_REQUIREMENTS, this.documentRequirements);
    saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    saveToStorage(STORAGE_KEYS.RISKS, this.riskAlerts);
    saveToStorage(STORAGE_KEYS.DEADLINES, this.deadlines);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    saveToStorage(STORAGE_KEYS.EXPENSE_CATEGORIES, this.expenseCategories);
    saveToStorage(STORAGE_KEYS.BUDGET_PROFILES, this.budgetProfiles);
    saveToStorage(STORAGE_KEYS.QUARTERLY_FINANCIAL_SUBMISSIONS, this.quarterlyFinancialSubmissions);
    saveToStorage(STORAGE_KEYS.DISBURSEMENTS, this.disbursements);
    saveToStorage(STORAGE_KEYS.SUPPORT_REQUESTS, this.supportRequests);
    this.notify();
  }

  // --- STATE SYNC (used by the API server and by the browser in connected mode) ---
  /**
   * The collections a user is entitled to see. A DSAC official sees everything. An entity officer sees only their
   * own organisation's records (plus the reference data every organisation needs), so another organisation's
   * money, returns and documents never reach their browser. Users are returned without password hashes.
   */
  exportStateFor(user: User): StateData & { user: PublicUser; users: PublicUser[] } {
    const isDsac = DSAC_AUTHORITY_ROLES.includes(user.role);
    const entityId = user.entityId;
    const own = <T extends { entityId?: string }>(xs: T[]): T[] => (isDsac ? xs : xs.filter(x => x.entityId === entityId));
    const ownEntity = this.entities.find(e => e.id === entityId);
    const publicUser = (u: User): PublicUser => {
      const { passwordHash, password, ...rest } = u;
      return rest;
    };
    const data = {
      entities: isDsac ? this.entities : this.entities.filter(e => e.id === entityId),
      kpis: own(this.kpis),
      reports: own(this.reports),
      documents: own(this.documents),
      documentRequirements: this.documentRequirements,
      tasks: own(this.tasks),
      riskAlerts: own(this.riskAlerts),
      deadlines: this.deadlines,
      auditLogs: isDsac ? this.auditLogs : this.auditLogs.filter(a => !!ownEntity && a.entityName === ownEntity.name),
      expenseCategories: this.expenseCategories,
      budgetProfiles: own(this.budgetProfiles),
      quarterlyFinancialSubmissions: own(this.quarterlyFinancialSubmissions),
      supportRequests: own(this.supportRequests),
      disbursements: own(this.disbursements),
      user: publicUser(user),
      users: (isDsac ? this.registeredUsers : this.registeredUsers.filter(u => u.id === user.id)).map(publicUser),
    };
    // Detach from the live store: the caller gets a copy it can serialise or keep.
    return JSON.parse(JSON.stringify(data));
  }

  /**
   * Replaces this store's collections with a snapshot from the server (connected mode). The browser is a cache of
   * the server's data, so nothing is written to browser storage, and derived values are rebuilt locally exactly as
   * the server rebuilt them.
   */
  applyRemoteState(snapshot: StateData & { user: PublicUser; users: PublicUser[] }): void {
    this.entities = snapshot.entities;
    this.kpis = snapshot.kpis;
    this.reports = snapshot.reports;
    this.documents = snapshot.documents;
    this.documentRequirements = snapshot.documentRequirements;
    this.tasks = snapshot.tasks;
    this.riskAlerts = snapshot.riskAlerts;
    this.deadlines = snapshot.deadlines;
    this.auditLogs = snapshot.auditLogs;
    this.expenseCategories = snapshot.expenseCategories;
    this.budgetProfiles = snapshot.budgetProfiles;
    this.quarterlyFinancialSubmissions = snapshot.quarterlyFinancialSubmissions;
    this.supportRequests = snapshot.supportRequests;
    this.disbursements = snapshot.disbursements;
    this.registeredUsers = snapshot.users as User[];
    this.currentUser = (this.registeredUsers.find(u => u.id === snapshot.user.id) ?? snapshot.user) as User;
    this.refreshDerivedState();
    this.notify();
  }

  /** Connected mode: the server ended the session, so clear the local identity and data. */
  applyRemoteSignOut(): void {
    this.currentUser = null;
    this.notify();
  }

  // --- RE-SYNCHRONIZE DEPARTMENTAL BASELINE ---
  reseedOfficialBaseline(): void {
    if (!this.requireDsacAuthority('Reseed departmental baseline')) return;
    this.loadDomainData(true);
    this.addAuditLog(
      'SYSTEM_BASELINE_SYNC',
      'Departmental statutory baseline datasets synchronized with gazetted PFMA Vote 37 appropriations.'
    );
    this.persistAll();
  }

  /**
   * Edits an organisation's profile. Only DSAC officials and that organisation's own officer may do this, and only
   * the descriptive fields below change. Risk, compliance score, audit outcome, funding status, registration status
   * and every money field are derived or are DSAC decisions, so a caller cannot overwrite them here (the previous
   * version merged the whole record, so an organisation could have marked itself low-risk with funds released).
   */
  updateEntity(updated: PublicEntity): void {
    const idx = this.entities.findIndex(e => e.id === updated.id);
    if (idx === -1) return;
    if (!this.canActForEntity(updated.id, 'Update organisation profile')) return;
    const current = this.entities[idx];
    this.entities[idx] = {
      ...current,
      headOfEntity: updated.headOfEntity ?? current.headOfEntity,
      reportingOfficerName: updated.reportingOfficerName ?? current.reportingOfficerName,
      contactEmail: updated.contactEmail ?? current.contactEmail,
      demographics: updated.demographics ?? current.demographics,
      jobStats: updated.jobStats ?? current.jobStats,
    };
    this.addAuditLog('ENTITY_RECORD_UPDATED', `Profile of ${current.name} was updated.`, current.name);
    this.persistAll();
  }

  login(email: string, password?: string): { success: boolean; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const now = Date.now();

    const lock = this.failedLogins.get(cleanEmail);
    if (lock && lock.lockedUntil > now) {
      const mins = Math.ceil((lock.lockedUntil - now) / 60000);
      return { success: false, message: `Too many failed attempts. Please try again in ${mins} minute${mins === 1 ? '' : 's'}.` };
    }
    // A password is ALWAYS required. (The previous build skipped the check whenever it was omitted.)
    if (!password) return { success: false, message: 'Please enter your password.' };

    const user = this.registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      const previous = this.failedLogins.get(cleanEmail);
      const base = previous && previous.lockedUntil > 0 && previous.lockedUntil <= now ? 0 : (previous?.count ?? 0);
      const count = base + 1;
      this.failedLogins.set(cleanEmail, { count, lockedUntil: count >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_LOCKOUT_MS : 0 });
      this.addAuditLog('LOGIN_FAILED', `Failed sign-in attempt for ${cleanEmail}.`);
      // One generic message for unknown user and wrong password, and never a hint about the expected password.
      return { success: false, message: 'Invalid email or password.' };
    }

    this.failedLogins.delete(cleanEmail);
    this.currentUser = user;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, this.sessionRecord());
    this.addAuditLog('USER_LOGIN', `Official user authenticated: ${user.name} (${user.designation})`);
    this.notify();
    return { success: true };
  }

  signUp(newUserData: {
    name: string;
    email: string;
    role: UserRole;
    designation: string;
    entityId?: string;
    entityName?: string;
    password?: string;
  }): { success: boolean; message?: string } {
    const cleanEmail = newUserData.email.trim().toLowerCase();

    if (DSAC_AUTHORITY_ROLES.includes(newUserData.role) && !DEMO_MODE) {
      return { success: false, message: 'DSAC official accounts are provisioned by the Department and cannot be self-registered.' };
    }
    if (this.registeredUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        message: 'An official account with this government email already exists. Please sign in.'
      };
    }
    const strength = checkPasswordStrength(newUserData.password?.trim() || '');
    if (!strength.ok) return { success: false, message: strength.message };

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: newUserData.name.trim(),
      email: cleanEmail,
      role: newUserData.role,
      designation: newUserData.designation.trim() || (newUserData.role === 'DSAC_ADMIN' ? 'Oversight Administrator' : 'Reporting Officer'),
      entityId: newUserData.entityId,
      entityName: newUserData.entityName,
      passwordHash: hashPassword(newUserData.password!.trim()),
    };

    this.registeredUsers = [newUser, ...this.registeredUsers];
    this.currentUser = newUser;
    saveToStorage(STORAGE_KEYS.REGISTERED_USERS, this.registeredUsers);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, this.sessionRecord());

    this.addAuditLog(
      'USER_REGISTRATION',
      `Official user account registered: ${newUser.name} as ${newUser.designation} (${newUser.entityName || 'DSAC National'})`
    );
    this.notify();
    return { success: true };
  }

  logout(): void {
    if (this.currentUser) {
      this.addAuditLog('USER_LOGOUT', `Official user signed out: ${this.currentUser.name}`);
    }
    this.currentUser = null;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, null);
    this.notify();
  }

  /**
   * Creates an account without a signed-in caller. The API server uses this once at start-up to provision the first
   * DSAC administrator from environment variables. It is deliberately NOT on the server's remote command list, so
   * no client can call it. The password must pass the same strength rules as any other.
   */
  provisionAccount(params: { name: string; email: string; role: UserRole; designation: string; password: string; entityId?: string; entityName?: string }): { success: boolean; message?: string } {
    const email = params.email.trim().toLowerCase();
    if (this.registeredUsers.some(u => u.email.toLowerCase() === email)) return { success: false, message: 'An account with this email address already exists.' };
    const strength = checkPasswordStrength(params.password.trim());
    if (!strength.ok) return { success: false, message: strength.message };
    this.registeredUsers.push({
      id: `user-${Date.now()}`,
      name: params.name.trim(),
      email,
      role: params.role,
      designation: params.designation.trim(),
      entityId: params.entityId,
      entityName: params.entityName,
      passwordHash: hashPassword(params.password.trim()),
    });
    this.addAuditLog('USER_REGISTRATION', `Account provisioned for ${params.name.trim()} (${params.designation.trim()}).`, params.entityName);
    this.persistAll();
    return { success: true };
  }

  /** Demonstration-only persona switcher. Disabled outside demo mode. */
  switchUserRole(role: UserRole): void {
    if (!DEMO_MODE) {
      this.addAuditLog('ACCESS_DENIED', 'Role switching is only available in demonstration mode.');
      return;
    }
    const user = this.registeredUsers.find(u => u.role === role) || this.registeredUsers[0];
    if (user) {
      this.currentUser = user;
      this.addAuditLog('USER_LOGIN', `Active session switched to ${user.name} (${user.designation})`);
      saveToStorage(STORAGE_KEYS.CURRENT_USER, this.sessionRecord());
      this.notify();
    }
  }

  /** Demonstration-only. Real sessions are only ever created by login() / signUp(). */
  setCurrentUser(user: User): void {
    if (!DEMO_MODE || !this.registeredUsers.some(u => u.id === user.id)) {
      this.addAuditLog('ACCESS_DENIED', 'Direct session assignment is only available in demonstration mode.');
      return;
    }
    this.currentUser = this.registeredUsers.find(u => u.id === user.id)!;
    this.addAuditLog('USER_LOGIN', `User authenticated as ${user.name} (${user.role})`);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, this.sessionRecord());
    this.notify();
  }

  // --- AUDIT LOGGING ---
  addAuditLog(action: AuditLogEntry['action'], details: string, entityName?: string): void {
    const actorName = this.currentUser ? this.currentUser.name : 'System Security Daemon';
    const actorRole = this.currentUser ? this.currentUser.role : 'DSAC_ADMIN';
    const defaultEntity = this.currentUser?.entityName || 'DSAC National Headquarters';

    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userName: actorName,
      userRole: actorRole,
      entityName: entityName || defaultEntity,
      action,
      details,
    };
    this.auditLogs = [entry, ...this.auditLogs].slice(0, 100);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // --- REPORT WORKFLOW (THE CORE GOVERNMENT LIFECYCLE) ---
  /**
   * Submits a quarterly PERFORMANCE report. The spend typed here is a claim recorded on the report only.
   * The authoritative expenditure figure is the finance return (submitQuarterlyFinancialReturn); this method
   * never touches entity or portfolio money, so a resubmission can no longer double count.
   */
  submitReport(reportId: string, items: ReportItem[], spentThisQuarterZAR: number): void {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return;

    if (report.submissionStatus === 'APPROVED' || report.submissionStatus === 'UNDER_REVIEW') {
      this.addAuditLog('ACCESS_DENIED', `Ignored resubmission of the ${report.quarter} report for ${report.entityName}: it is ${report.submissionStatus} and locked.`, report.entityName);
      return;
    }

    const actor = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'Authorized Reporting Officer';
    const claimed = Number.isFinite(spentThisQuarterZAR) && spentThisQuarterZAR > 0 ? Math.round(spentThisQuarterZAR) : 0;

    report.submissionStatus = report.submissionStatus === 'CORRECTION_REQUIRED' ? 'RESUBMITTED' : 'SUBMITTED';
    report.submittedAt = new Date().toISOString();
    report.submittedBy = actor;
    report.items = items;
    report.fundsSpentThisQuarterZAR = claimed;
    // If a finance return exists for this quarter its figure replaces the claim, so the two cannot disagree.
    this.reconcileReportMirrors(report.entityId);

    const fy = normalizeFinancialYear(report.financialYear);
    const ret = this.quarterlyFinancialSubmissions.find(
      s => s.entityId === report.entityId && s.quarter === report.quarter && normalizeFinancialYear(s.financialYear) === fy && REPORTED_RETURN_STATUSES.includes(s.status)
    );
    const reconciliation = ret
      ? (Math.abs(returnTotal(ret) - claimed) > 1
          ? ` The claim of ${formatZAR(claimed)} differs from the lodged finance return of ${formatZAR(returnTotal(ret))}; the finance return is used.`
          : '')
      : ' No finance return has been lodged for this quarter, so the claim is not counted in portfolio expenditure until it is.';

    this.recalculateEntityRisk(report.entityId);
    this.addAuditLog('REPORT_SUBMITTED', `Submitted ${report.quarter} Performance Report for ${report.entityName}. Expenditure claimed: ${formatZAR(claimed)}.${reconciliation}`, report.entityName);
    this.persistAll();
  }

  reviewReport(reportId: string, decision: 'APPROVE' | 'REQUEST_CORRECTION', notes: string): void {
    if (!this.requireDsacAuthority('Review quarterly report')) return;
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return;

    // Only a report that is actually awaiting review can be decided. (Previously any report, including an
    // already-approved one, could be "approved" again, and each approval decremented the overdue counter.)
    const reviewable: QuarterlyReport['submissionStatus'][] = ['SUBMITTED', 'RESUBMITTED', 'UNDER_REVIEW'];
    if (!reviewable.includes(report.submissionStatus)) {
      this.addAuditLog('ACCESS_DENIED', `Ignored review of the ${report.quarter} report for ${report.entityName}: it is ${report.submissionStatus}, not awaiting review.`, report.entityName);
      return;
    }

    const actorName = this.currentUser ? this.currentUser.name : 'DSAC Reviewer';
    const actorRole = this.currentUser ? this.currentUser.role : 'DSAC_ADMIN';
    const actorDesc = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'DSAC Oversight Reviewer';

    if (decision === 'APPROVE') {
      report.submissionStatus = 'APPROVED';
      report.reviewedAt = new Date().toISOString();
      report.reviewedBy = actorDesc;
      report.reviewNotes = notes;

      // The overdue counter is RECOMPUTED from report statuses (not decremented), then the statutory hold is
      // lifted only if nothing is overdue and the hold was a non-submission hold (stage 1-2). Stage 3-4
      // (censure / AGSA referral) always needs an explicit, authorised liftTrancheWithholding().
      this.recalculateEntityRisk(report.entityId);
      const entity = this.entities.find(e => e.id === report.entityId);
      let released = false;
      if (
        entity &&
        entity.overdueReportsCount === 0 &&
        (entity.trancheStatus === 'WITHHELD' || entity.trancheStatus === 'CONDITIONAL_HOLD') &&
        (entity.statutoryDefaultStage ?? 0) <= 2
      ) {
        entity.trancheStatus = 'RELEASED';
        entity.statutoryDefaultStage = 0;
        entity.statutoryDefaultReason = undefined;
        entity.statutoryDefaultNoticeDate = undefined;
        this.setNextTrancheStatus(entity.id, 'SCHEDULED');
        released = true;
      }

      this.addAuditLog('REPORT_APPROVED', `Approved ${report.quarter} Report for ${report.entityName}.${released ? ' No overdue returns remain: statutory tranche hold lifted.' : ''} Decision notes: ${notes}`, report.entityName);
    } else {
      report.submissionStatus = 'CORRECTION_REQUIRED';
      report.reviewedAt = new Date().toISOString();
      report.reviewedBy = actorDesc;
      report.reviewNotes = notes;
      report.rejectionReason = notes;

      // Automatically trigger a corrective task
      const newTask: CorrectiveTask = {
        id: `task-${Date.now()}`,
        entityId: report.entityId,
        entityName: report.entityName,
        title: `Remediate ${report.quarter} Performance Report: Required Corrections`,
        description: `Reviewer feedback from DSAC: "${notes}". Provide updated evidence and corrected KPI values within 10 working days.`,
        assignedToName: `${report.submittedBy || 'Entity Reporting Officer'}`,
        createdByName: actorName,
        createdByRole: actorRole,
        priority: 'HIGH',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        direction: 'DSAC_TO_ENTITY',
      };
      this.tasks = [newTask, ...this.tasks];

      this.addAuditLog('REPORT_CORRECTION_REQUIRED', `Requested corrections on ${report.quarter} Report for ${report.entityName}. Auto-assigned Corrective Task #${newTask.id}.`, report.entityName);
    }

    this.recalculateEntityRisk(report.entityId);
    this.persistAll();
  }

  // --- STATUTORY NON-SUBMISSION & PFMA SECTION 38(1)(j) ENFORCEMENT ---
  enforceTrancheWithholding(entityId: string, reason: string): void {
    if (!this.requireDsacAuthority('Withhold statutory tranche')) return;
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return;

    const actor = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'Ministerial Oversight Directorate';
    entity.trancheStatus = 'WITHHELD';
    entity.statutoryDefaultStage = 2; // PFMA Sec 38(1)(j) Tranche Freeze
    entity.statutoryDefaultNoticeDate = new Date().toISOString();
    entity.statutoryDefaultReason = reason;
    entity.riskLevel = 'CRITICAL';
    entity.riskScore = Math.max(entity.riskScore, 88);
    this.setNextTrancheStatus(entityId, 'WITHHELD');

    // Create high-priority corrective task
    const task: CorrectiveTask = {
      id: `task-sec38-${Date.now()}`,
      entityId: entity.id,
      entityName: entity.name,
      title: `PFMA Sec 38(1)(j) Grant Suspension: Cure Statutory Non-Submission`,
      description: `Formal ministerial withholding enforced on Vote 37 operational subsidy. Reason: "${reason}". Submit outstanding statutory returns and certified PoE to restore disbursement eligibility.`,
      assignedToName: entity.headOfEntity,
      createdByName: actor,
      createdByRole: 'DSAC_ADMIN',
      priority: 'CRITICAL',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      direction: 'DSAC_TO_ENTITY',
    };
    this.tasks = [task, ...this.tasks];

    this.addAuditLog(
      'TRANCHE_WITHHELD',
      `PFMA Section 38(1)(j) Tranche Withholding ENFORCED for ${entity.name}. Reason: ${reason}. Grant disbursement suspended on BAS.`,
      entity.name
    );
    this.persistAll();
  }

  liftTrancheWithholding(entityId: string, notes: string): void {
    if (!this.requireDsacAuthority('Lift statutory tranche withholding')) return;
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return;

    entity.trancheStatus = 'RELEASED';
    entity.statutoryDefaultStage = 0;
    entity.statutoryDefaultReason = undefined;
    entity.statutoryDefaultNoticeDate = undefined;
    entity.riskLevel = entity.riskScore > 65 ? 'HIGH' : entity.riskScore > 40 ? 'MEDIUM' : 'LOW';
    this.setNextTrancheStatus(entityId, 'SCHEDULED');

    this.addAuditLog(
      'TRANCHE_RELEASED',
      `PFMA Section 38(1)(j) Tranche Released for ${entity.name}. Statutory Clearance Certificate issued. Notes: ${notes}`,
      entity.name
    );
    this.persistAll();
  }

  requestComplianceExtension(entityId: string, days: number, motive: string): void {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return;
    const role = this.currentUser?.role;
    const ownEntity = role === 'ENTITY_OFFICER' && this.currentUser?.entityId === entityId;
    if (!ownEntity && !(role && DSAC_AUTHORITY_ROLES.includes(role))) {
      this.addAuditLog('ACCESS_DENIED', `Blocked compliance extension for ${entity.name}: caller is not that entity's officer or DSAC.`, entity.name);
      return;
    }

    const boundedDays = Math.min(30, Math.max(1, Math.round(Number.isFinite(days) ? days : 7)));
    const expiryDate = new Date(Date.now() + boundedDays * 24 * 60 * 60 * 1000).toISOString();
    entity.extensionGrantedUntil = expiryDate;
    entity.extensionRequestedReason = motive;
    entity.trancheStatus = 'CONDITIONAL_HOLD';
    this.setNextTrancheStatus(entityId, 'WITHHELD');

    this.addAuditLog(
      'EXTENSION_REQUESTED',
      `Statutory compliance extension of ${boundedDays} days until ${expiryDate.split('T')[0]}. Motive: "${motive}".`,
      entity.name
    );
    this.persistAll();
  }

  issueStatutoryNotice(entityId: string, stage: 1 | 2 | 3 | 4, reason: string): void {
    if (!this.requireDsacAuthority('Issue statutory notice')) return;
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return;

    entity.statutoryDefaultStage = stage;
    entity.statutoryDefaultNoticeDate = new Date().toISOString();
    entity.statutoryDefaultReason = reason;

    const stageTitles: Record<number, string> = {
      1: 'Stage 1: 7-Day Early Warning Notice of Impending Default',
      2: 'Stage 2: PFMA Section 38(1)(j) Formal Tranche Suspension Notice',
      3: 'Stage 3: Accounting Authority & Board Chairperson Statutory Censure',
      4: 'Stage 4: AGSA Material Irregularity & Parliamentary Tabling Referral',
    };

    this.addAuditLog(
      'STATUTORY_NOTICE_ISSUED',
      `Issued ${stageTitles[stage] || 'Statutory Non-Compliance Notice'} to ${entity.name}. Reason: ${reason}`,
      entity.name
    );
    this.persistAll();
  }

  // --- KPI PROGRESS UPDATE ---
  /**
   * Records the result for ONE quarter (`quarter` defaults to the current reporting quarter). Cumulative
   * performance, percentage achieved and status are then re-derived from the quarterly facts by the single
   * KPI rule set, so they can never disagree with each other or with the report line items.
   */
  updateKPIValue(
    kpiId: string,
    actualValue: number,
    reason?: string,
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    correctiveAction?: string
  ): void {
    const kpi = this.kpis.find(k => k.id === kpiId);
    if (!kpi) return;

    const role = this.currentUser?.role;
    if (!role || (role === 'ENTITY_OFFICER' && this.currentUser?.entityId !== kpi.entityId)) {
      this.addAuditLog('ACCESS_DENIED', `Blocked KPI update on "${kpi.name}": caller may not report for ${kpi.entityName}.`, kpi.entityName);
      return;
    }
    if (!Number.isFinite(actualValue) || actualValue < 0) {
      this.addAuditLog('ACCESS_DENIED', `Rejected KPI value "${actualValue}" for "${kpi.name}": results must be non-negative numbers.`, kpi.entityName);
      return;
    }

    const q = quarter ?? getCurrentReportingPeriod().quarter;
    const previous = q === 'Q1' ? kpi.q1Actual : q === 'Q2' ? kpi.q2Actual : q === 'Q3' ? kpi.q3Actual : kpi.q4Actual;
    if (q === 'Q1') kpi.q1Actual = actualValue;
    else if (q === 'Q2') kpi.q2Actual = actualValue;
    else if (q === 'Q3') kpi.q3Actual = actualValue;
    else kpi.q4Actual = actualValue;

    Object.assign(kpi, normalizeKpiRecord(kpi));

    // Keep the matching report's line item in step, on the same cumulative basis as its target.
    this.reports.forEach(r => {
      if (r.entityId === kpi.entityId && r.quarter === q && sameFinancialYear(r.financialYear, KPI_DATA_YEAR)) {
        const item = r.items.find(it => it.kpiId === kpi.id);
        if (item) {
          const cumulative = kpiCumulativeThrough(kpi, q);
          item.targetToDate = cumulative.target;
          item.actualAchieved = cumulative.actual;
          item.status = kpi.status;
          item.variancePercentage = cumulative.target > 0
            ? Math.round(((cumulative.actual - cumulative.target) / cumulative.target) * 1000) / 10
            : 0;
          if (reason) item.varianceReason = reason;
          if (correctiveAction) item.correctiveAction = correctiveAction;
        }
      }
    });

    this.recalculateEntityRisk(kpi.entityId);
    this.addAuditLog(
      'KPI_ACTUAL_UPDATED',
      `Updated KPI "${kpi.name}" ${q} result ${previous === undefined ? '(first entry)' : `from ${previous}`} to ${actualValue} ${kpi.unitOfMeasure}; year-to-date ${kpi.currentValue} (${kpi.percentageAchieved}% of annual target). ${reason ? `Reason: ${reason}` : ''}`,
      kpi.entityName
    );
    this.persistAll();
  }

  // --- SUPPORT REQUESTS MANAGEMENT (Section 19) ---
  getSupportRequests(entityId?: string): SupportRequest[] {
    if (!entityId) return [...this.supportRequests];
    return this.supportRequests.filter(r => r.entityId === entityId);
  }

  submitSupportRequest(data: {
    entityId: string;
    entityName: string;
    title: string;
    category: SupportRequestCategory;
    amountRequested?: number;
    motivation: string;
    linkedProgramme?: string;
    expectedOutcome: string;
    supportingDocumentation?: string;
  }): SupportRequest {
    const categoryLabels: Record<SupportRequestCategory, string> = {
      BUDGET_REQUEST: 'Budget Request',
      ADDITIONAL_FUNDING: 'Additional Funding',
      TECHNICAL_SUPPORT: 'Technical Support',
      GOVERNANCE_ASSISTANCE: 'Governance Assistance',
      PROGRAMME_SUPPORT: 'Programme Support',
      CAPACITY_BUILDING: 'Capacity Building',
    };

    const newRequest: SupportRequest = {
      id: `req-sup-${Date.now()}`,
      entityId: data.entityId,
      entityName: data.entityName,
      title: data.title,
      category: data.category,
      categoryLabel: categoryLabels[data.category] || data.category,
      amountRequested: data.amountRequested,
      motivation: data.motivation,
      linkedProgramme: data.linkedProgramme,
      expectedOutcome: data.expectedOutcome,
      supportingDocumentation: data.supportingDocumentation,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      submittedBy: this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'Institutional Officer',
      updatedAt: new Date().toISOString(),
    };

    this.supportRequests = [newRequest, ...this.supportRequests];

    this.addAuditLog(
      'SUPPORT_REQUEST_CREATED',
      `Submitted ${newRequest.categoryLabel} of ${newRequest.amountRequested ? formatZAR(newRequest.amountRequested) : 'assistance'} for ${newRequest.entityName}: "${newRequest.title}"`,
      newRequest.entityName
    );

    this.persistAll();
    return newRequest;
  }

  reviewSupportRequest(
    requestId: string,
    status: SupportRequestStatus,
    notes?: string
  ): void {
    const req = this.supportRequests.find(r => r.id === requestId);
    if (!req) return;

    req.status = status;
    req.reviewedBy = this.currentUser?.id;
    req.reviewedByName = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'DSAC Oversight Reviewer';
    req.reviewNotes = notes;
    req.updatedAt = new Date().toISOString();

    this.addAuditLog(
      'SUPPORT_REQUEST_REVIEWED',
      `Updated support request "${req.title}" status to ${status}. Notes: ${notes || 'Updated by DSAC Oversight Directorate.'}`,
      req.entityName
    );

    this.persistAll();
  }

  captureQuarterlyExpenditure(data: {
    entityId: string;
    entityName: string;
    quarter: FinancialQuarter;
    financialYear?: string;
    lines: { categoryId: string; categoryName: string; quarterlyActual: number; annualBudget?: number }[];
    accountingOfficerAffirmation?: boolean;
    accountingOfficerName?: string;
  }): QuarterlyFinancialSubmission {
    const fy = normalizeFinancialYear(data.financialYear, getCurrentReportingPeriod().financialYear);
    const profile = this.getBudgetProfileForEntity(data.entityId, fy);
    const t = profile?.expectedSpendingTrajectory || { q1Percent: 25, q2Percent: 50, q3Percent: 75, q4Percent: 100 };
    const points = [t.q1Percent, t.q2Percent, t.q3Percent, t.q4Percent];
    const qi = quarterIndex(data.quarter);
    const share = (points[qi - 1] - (qi > 1 ? points[qi - 2] : 0)) / 100;
    const totalActual = data.lines.reduce((sum, l) => sum + (l.quarterlyActual || 0), 0);

    return this.submitQuarterlyFinancialReturn({
      entityId: data.entityId,
      entityName: data.entityName,
      financialYear: fy,
      quarter: data.quarter,
      totalQuarterlyActual: totalActual,
      // The certification is a legal declaration and must be given explicitly (it used to default to true).
      accountingOfficerAffirmation: data.accountingOfficerAffirmation === true,
      accountingOfficerName: data.accountingOfficerName || this.currentUser?.name,
      lines: data.lines.map(l => {
        const budgetLine = profile?.lines.find(b => b.categoryId === l.categoryId);
        const budget = budgetLine?.annualBudget ?? l.annualBudget ?? 0;
        return {
          categoryId: l.categoryId,
          categoryName: l.categoryName,
          actualAmount: l.quarterlyActual,
          plannedAmount: Math.round(budget * share),
          budgetLineId: budgetLine?.id,
        };
      }),
    });
  }

  // --- DOCUMENT VERSIONING ---
  uploadDocumentVersion(docId: string, fileName: string, fileSizeBytes: number, changeSummary: string): void {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return;

    const newVersionNum = doc.currentVersion + 1;
    const newVersion = {
      versionNumber: newVersionNum,
      uploadedAt: new Date().toISOString(),
      uploadedBy: this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'Statutory Officer',
      fileName,
      fileSizeBytes,
      changeSummary,
    };

    doc.versions.push(newVersion);
    doc.currentVersion = newVersionNum;
    doc.approvalStatus = 'PENDING_REVIEW';

    this.addAuditLog(
      'DOCUMENT_VERSION_INCREMENTED',
      `Uploaded Version ${newVersionNum} for document "${doc.title}". File: ${fileName}. Summary: ${changeSummary}`,
      doc.entityName
    );
    this.persistAll();
  }

  createNewDocument(
    entityId: string,
    title: string,
    category: EntityDocument['category'],
    financialYear: string,
    fileName: string,
    fileSizeBytes: number,
    initialSummary: string,
    downloadUrl?: string,
    mimeType?: string,
    contentDataUrl?: string
  ): EntityDocument {
    const entity = this.entities.find(e => e.id === entityId);
    const uploader = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'Authorized Official';
    const newDoc: EntityDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityId,
      entityName: entity ? entity.name : 'Unknown Entity',
      title,
      category,
      financialYear,
      currentVersion: 1,
      approvalStatus: 'PENDING_REVIEW',
      fileName,
      fileSize: `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`,
      fileSizeBytes,
      mimeType,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploader,
      verificationSummary: initialSummary,
      versions: [
        {
          versionNumber: 1,
          uploadedAt: new Date().toISOString(),
          uploadedBy: uploader,
          fileName,
          fileSizeBytes,
          changeSummary: initialSummary,
          downloadUrl,
          mimeType,
          contentDataUrl,
        },
      ],
      comments: [],
    };

    this.documents = [newDoc, ...this.documents];

    // If it's a PoE or Quarterly Report, automatically register or link in this.reports
    if (category === 'PORTFOLIO_OF_EVIDENCE' || category === 'QUARTERLY_REPORT') {
      const existingReport = this.reports.find(r => r.entityId === entityId && r.quarter === 'Q2');
      if (existingReport) {
        existingReport.portfolioOfEvidenceDocId = newDoc.id;
        existingReport.submissionStatus = 'SUBMITTED';
      } else {
        const newRep: QuarterlyReport = {
          id: `rep-q2-${Date.now()}`,
          entityId,
          entityName: entity ? entity.name : 'Institutional Entity',
          financialYear,
          quarter: 'Q2',
          submissionStatus: 'SUBMITTED',
          dueDate: '2025-10-31',
          submittedAt: new Date().toISOString(),
          submittedByName: uploader,
          submittedBy: uploader,
          fundsSpentThisQuarterZAR: 1200000,
          totalFundsReceivedToDateZAR: entity?.transferredAmountZAR || 3500000,
          items: [],
          portfolioOfEvidenceDocId: newDoc.id,
          varianceExplanations: initialSummary,
          accountingOfficerDeclaration: true,
        };
        this.reports = [newRep, ...this.reports];
      }
    }

    // Automatically create a verification task for DSAC National Oversight
    this.addTask({
      entityId,
      entityName: entity ? entity.name : 'Institutional Entity',
      title: `Verify Statutory Evidence: ${fileName} (${entity?.shortCode || entity?.name})`,
      description: `New Section 38 audit verification document "${title}" uploaded by ${uploader}. Inspect and approve or request amendments.`,
      assignedToName: 'DSAC Oversight Directorate',
      priority: category === 'PORTFOLIO_OF_EVIDENCE' ? 'HIGH' : 'MEDIUM',
      status: 'OPEN',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      direction: 'ENTITY_TO_DSAC',
    });

    this.addAuditLog('DOCUMENT_UPLOADED', `Registered new statutory document "${title}" (${category}) for ${newDoc.entityName}. Submitted for DSAC Section 38 verification.`, newDoc.entityName);
    this.persistAll();
    return newDoc;
  }

  uploadDocument(
    entityId: string, 
    title: string, 
    category: EntityDocument['category'], 
    fileName: string, 
    initialSummary: string,
    file?: { size: number; type: string; dataUrl: string }
  ): EntityDocument {
    const document = this.createNewDocument(
      entityId, 
      title, 
      category, 
      '2026/27', 
      fileName, 
      file?.size ?? 2.4 * 1024 * 1024, 
      initialSummary,
      undefined,
      file?.type,
      file?.dataUrl
    );
    return document;
  }

  downloadDocument(docId: string): void {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return;
    const content = `Republic of South Africa - Department of Sport, Arts and Culture\nStatutory Document: ${doc.title}\nInstitution: ${doc.entityName}\nClassification: ${doc.category}\nVersion: ${doc.currentVersion}\nFile: ${doc.fileName}\nVerification Status: ${doc.approvalStatus}\nUploaded: ${doc.uploadedAt}\nUploaded By: ${doc.uploadedBy}\nSummary: ${doc.verificationSummary}`;
    const version = doc.versions.find(item => item.versionNumber === doc.currentVersion) ?? doc.versions[doc.versions.length - 1];
    if (version?.contentDataUrl) {
      const a = document.createElement('a');
      // Data URLs preserve the original uploaded bytes and MIME type.
      a.href = version.contentDataUrl;
      a.download = doc.fileName || version.fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName || `${doc.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * DSAC decision on an evidence document. Verifying a document says only that THIS document is acceptable. It no
   * longer approves the entity's reports (the previous build approved every SUBMITTED report of the entity as a
   * side effect, bypassing report review) and no longer adds an invented +2 to the compliance score, which is a
   * derived value.
   */
  verifyDocument(docId: string, decision: 'APPROVED' | 'REQUIRES_AMENDMENT', notes?: string): void {
    if (!this.requireDsacAuthority('Verify statutory document')) return;
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return;

    const reviewer = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'DSAC National Oversight Reviewer';
    doc.approvalStatus = decision;
    if (decision === 'APPROVED') {
      doc.approvedAt = new Date().toISOString();
      doc.approvedBy = reviewer;
    }

    if (notes) {
      doc.comments.push({
        id: `cmt-${Date.now()}`,
        authorName: this.currentUser?.name || 'DSAC Reviewer',
        authorRole: this.currentUser?.role || 'DSAC_ADMIN',
        authorEntity: 'DSAC National',
        timestamp: new Date().toISOString(),
        message: notes,
      });
    }

    this.recalculateEntityRisk(doc.entityId);
    this.addAuditLog(
      decision === 'APPROVED' ? 'REPORT_VERIFIED' : 'REPORT_REVISION_REQUESTED',
      `Statutory document "${doc.title}" was ${decision === 'APPROVED' ? 'formally approved and verified' : 'flagged for amendment'}. Reviewer: ${reviewer}. ${notes ? `Note: ${notes}` : ''}`,
      doc.entityName
    );
    this.persistAll();
  }

  deleteEntityDocument(docId: string): void {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return;
    const role = this.currentUser?.role;
    const ownDocument = role === 'ENTITY_OFFICER' && this.currentUser?.entityId === doc.entityId;
    if (!ownDocument && !(role && DSAC_AUTHORITY_ROLES.includes(role))) {
      this.addAuditLog('ACCESS_DENIED', `Blocked archiving of "${doc.title}": caller may not change ${doc.entityName}'s documents.`, doc.entityName);
      return;
    }
    this.documents = this.documents.filter(d => d.id !== docId);
    this.addAuditLog('DOCUMENT_DELETED', `Archived statutory document "${doc.title}"`, doc.entityName);
    this.persistAll();
  }

  // --- DOCUMENT VERIFICATION & SUBMISSION SYSTEM METHODS ---
  getDocumentRequirements(quarter?: string): DocumentRequirement[] {
    if (!quarter || quarter === 'ALL') {
      return this.documentRequirements;
    }
    return this.documentRequirements.filter(
      r => !r.applicableQuarter || r.applicableQuarter === 'ALL' || r.applicableQuarter === quarter
    );
  }

  addDocumentRequirement(requirement: DocumentRequirement): void {
    const exists = this.documentRequirements.some(r => r.id === requirement.id);
    if (!exists) {
      this.documentRequirements.push(requirement);
      this.addAuditLog('DOCUMENT_REQUIRED', `Created new statutory requirement: ${requirement.title} (${requirement.code})`);
      this.persistAll();
    }
  }

  updateDocumentRequirement(requirement: DocumentRequirement): void {
    const idx = this.documentRequirements.findIndex(r => r.id === requirement.id);
    if (idx !== -1) {
      this.documentRequirements[idx] = requirement;
      this.addAuditLog('DOCUMENT_REQUIRED', `Updated statutory requirement parameters: ${requirement.title} (${requirement.code})`);
      this.persistAll();
    }
  }

  getEntityDocumentChecklist(
    entityId: string,
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = getCurrentReportingPeriod().quarter,
    financialYear = toLongFinancialYear(getCurrentReportingPeriod().financialYear)
  ): DocumentVerificationChecklist {
    const entity = this.entities.find(e => e.id === entityId);
    const requirements = this.getDocumentRequirements(quarter);
    const entityDocs = this.documents.filter(d => d.entityId === entityId);

    const slots: DocumentRequirementSlot[] = requirements.map(req => {
      // Find matching document for this requirement/type and period
      const match = entityDocs.find(d => {
        const matchesRequirement = d.requirementId === req.id;
        const matchesType = d.controlledType === req.requiredDocumentType;
        const matchesLegacyCategory = 
          (req.requiredDocumentType === 'POE' && d.category === 'PORTFOLIO_OF_EVIDENCE') ||
          (req.requiredDocumentType === 'BANK_STATEMENT' && d.category === 'TAX_AND_BANKING') ||
          (req.requiredDocumentType === 'PERFORMANCE_REPORT' && d.category === 'QUARTERLY_REPORT') ||
          (req.requiredDocumentType === 'FINANCIAL_STATEMENT' && d.category === 'FINANCIAL_REPORT') ||
          (req.requiredDocumentType === 'PROOF_OF_EXPENDITURE' && d.category === 'FINANCIAL_REPORT');

        const periodMatches = (!d.quarter || d.quarter === quarter) && (!d.financialYear || sameFinancialYear(d.financialYear, financialYear));
        return (matchesRequirement || matchesType || matchesLegacyCategory) && periodMatches;
      });

      let status: DocumentRequirementSlot['status'] = 'MISSING';
      if (match) {
        if (match.verificationStatus) {
          status = match.verificationStatus as any;
        } else if (match.approvalStatus === 'APPROVED') {
          status = 'VERIFIED';
        } else if (match.approvalStatus === 'REQUIRES_AMENDMENT') {
          status = 'REJECTED';
        } else {
          status = 'MANUAL_REVIEW';
        }
      }

      return {
        requirement: req,
        status,
        activeDocument: match,
        activeVersion: match?.detailedVersions && match.detailedVersions.length > 0 
          ? match.detailedVersions[match.detailedVersions.length - 1] 
          : undefined,
        latestVerification: match?.activeVerification,
        isSatisfied: status === 'VERIFIED',
      };
    });

    const totalRequired = slots.filter(s => s.requirement.mandatory).length;
    const verifiedCount = slots.filter(s => s.requirement.mandatory && s.status === 'VERIFIED').length;
    const rejectedCount = slots.filter(s => s.status === 'REJECTED').length;
    const pendingCount = slots.filter(s => s.status === 'MANUAL_REVIEW' || s.status === 'VALIDATING').length;
    const missingCount = slots.filter(s => s.requirement.mandatory && s.status === 'MISSING').length;
    const isFullyCompliant = verifiedCount === totalRequired && totalRequired > 0;
    const compliancePercentage = totalRequired > 0 ? Math.round((verifiedCount / totalRequired) * 100) : 100;

    return {
      entityId,
      entityName: entity?.name || 'Institutional Entity',
      quarter,
      financialYear,
      slots,
      totalRequired,
      verifiedCount,
      pendingCount,
      rejectedCount,
      missingCount,
      isFullyCompliant,
      compliancePercentage,
    };
  }

  async submitDocumentForRequirement(params: {
    entityId: string;
    requirementId: string;
    reportId?: string;
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    financialYear?: string;
    file: File | { name: string; size: number; type?: string; content?: string };
    simulatedContent?: string;
    uploaderName?: string;
    uploaderRole?: UserRole;
    changeSummary?: string;
    contentDataUrl?: string;
  }): Promise<{ document: EntityDocument; result: DocumentVerificationResult }> {
    const entity = this.entities.find(e => e.id === params.entityId);
    const requirement = this.documentRequirements.find(r => r.id === params.requirementId);
    if (!requirement) {
      throw new Error(`Document requirement ${params.requirementId} not found.`);
    }

    const uploader = params.uploaderName || (this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'Authorized Submitting Officer');
    const quarter = params.quarter || getCurrentReportingPeriod().quarter;
    const financialYear = params.financialYear || toLongFinancialYear(getCurrentReportingPeriod().financialYear);

    // 1. Audit log: Upload initiated
    this.addAuditLog(
      'DOCUMENT_UPLOADED',
      `Uploaded file "${params.file.name}" for requirement "${requirement.title}" (${requirement.code})`,
      entity?.name
    );
    this.addAuditLog(
      'DOCUMENT_VALIDATION_STARTED',
      `Initiated automated content extraction and multi-indicator verification for "${params.file.name}". Required: ${requirement.requiredDocumentType}`,
      entity?.name
    );

    // 2. Compute file hash
    const fileHash = await calculateFileHash(params.file instanceof File ? params.file : (params.simulatedContent || params.file.name));
    const storedContentDataUrl = params.contentDataUrl || (
      params.file instanceof File ? await readFileAsDataUrl(params.file) : undefined
    );

    // 3. File-level validation
    const fileValidation = validateFileLevel(params.file, fileHash);

    // 4. Content extraction
    const { text } = await extractDocumentContent(params.file, params.simulatedContent);

    // 5. Multi-characteristic content classification
    const result = await analyzeDocumentContent(
      text,
      requirement.requiredDocumentType,
      entity ? entity.name : 'Institutional Entity',
      `${quarter} ${financialYear}`,
      fileValidation
    );

    // 6. Map verification status
    const controlledStatus: ControlledDocumentStatus = result.status;
    const legacyApproval: 'APPROVED' | 'PENDING_REVIEW' | 'REQUIRES_AMENDMENT' = 
      result.status === 'VERIFIED' ? 'APPROVED' :
      result.status === 'MANUAL_REVIEW' ? 'PENDING_REVIEW' : 'REQUIRES_AMENDMENT';

    // Find if a document already exists for this requirement/entity/quarter
    let doc = this.documents.find(d => 
      d.entityId === params.entityId && 
      (d.requirementId === requirement.id || d.controlledType === requirement.requiredDocumentType) &&
      d.quarter === quarter
    );

    const versionRecord: DetailedDocumentVersion = {
      versionNumber: doc ? doc.currentVersion + 1 : 1,
      fileName: params.file.name,
      fileSizeBytes: params.file.size,
      fileHash,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploader,
      uploadedByName: uploader,
      verificationResult: result,
      status: controlledStatus,
      textContentSample: text.substring(0, 300),
      rejectionReason: result.status === 'REJECTED' ? result.reasons.join(' ') : undefined,
      changeSummary: params.changeSummary || (doc ? `Version ${doc.currentVersion + 1} resubmission` : 'Initial requirement submission'),
      mimeType: params.file.type,
      contentDataUrl: storedContentDataUrl,
    };

    if (doc) {
      // Increment version and maintain version history
      doc.currentVersion += 1;
      doc.versions.push({
        versionNumber: doc.currentVersion,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploader,
        fileName: params.file.name,
        fileSizeBytes: params.file.size,
        changeSummary: versionRecord.changeSummary || 'Replacement submission',
        mimeType: params.file.type,
        contentDataUrl: storedContentDataUrl,
      });
      doc.detailedVersions = doc.detailedVersions || [];
      doc.detailedVersions.push(versionRecord);
      doc.activeVerification = result;
      doc.verificationStatus = controlledStatus;
      doc.approvalStatus = legacyApproval;
      doc.fileName = params.file.name;
      doc.fileSizeBytes = params.file.size;
      doc.fileSize = `${(params.file.size / (1024 * 1024)).toFixed(1)} MB`;
      doc.fileHash = fileHash;
      doc.uploadedAt = new Date().toISOString();
      doc.uploadedBy = uploader;
      doc.controlledType = requirement.requiredDocumentType;
      doc.verificationSummary = result.reasons[0] || 'Verification completed';
    } else {
      const categoryMapping: Record<ControlledDocumentType, EntityDocument['category']> = {
        BANK_STATEMENT: 'TAX_AND_BANKING',
        PERFORMANCE_REPORT: 'QUARTERLY_REPORT',
        POE: 'PORTFOLIO_OF_EVIDENCE',
        FINANCIAL_STATEMENT: 'FINANCIAL_REPORT',
        PROOF_OF_EXPENDITURE: 'FINANCIAL_REPORT',
        ANNUAL_REPORT: 'ANNUAL_REPORT',
        QUARTERLY_REPORT: 'QUARTERLY_REPORT',
        STRATEGIC_PLAN: 'STRATEGIC_PLAN',
        ANNUAL_PERFORMANCE_PLAN: 'ANNUAL_PERFORMANCE_PLAN',
        SUPPORTING_EVIDENCE: 'PORTFOLIO_OF_EVIDENCE',
        GOVERNANCE_CHARTER: 'GOVERNANCE_CHARTER',
        TAX_CLEARANCE: 'TAX_AND_BANKING',
      };

      doc = {
        id: `doc-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        entityId: params.entityId,
        entityName: entity ? entity.name : 'Institutional Entity',
        title: `${requirement.title} (${quarter} ${financialYear})`,
        category: categoryMapping[requirement.requiredDocumentType] || 'PORTFOLIO_OF_EVIDENCE',
        controlledType: requirement.requiredDocumentType,
        verificationStatus: controlledStatus,
        requirementId: requirement.id,
        reportId: params.reportId,
        quarter,
        financialYear,
        currentVersion: 1,
        approvalStatus: legacyApproval,
        fileName: params.file.name,
        fileSize: `${(params.file.size / (1024 * 1024)).toFixed(1)} MB`,
        fileSizeBytes: params.file.size,
        fileHash,
        mimeType: params.file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploader,
        verificationSummary: result.reasons[0] || 'Automated verification check',
        versions: [
          {
            versionNumber: 1,
            uploadedAt: new Date().toISOString(),
            uploadedBy: uploader,
            fileName: params.file.name,
            fileSizeBytes: params.file.size,
            changeSummary: 'Initial requirement submission',
            mimeType: params.file.type,
            contentDataUrl: storedContentDataUrl,
          },
        ],
        detailedVersions: [versionRecord],
        activeVerification: result,
        comments: [],
      };
      this.documents = [doc, ...this.documents];
    }

    // Record verification audit action
    const auditAction = 
      result.status === 'VERIFIED' ? 'DOCUMENT_VERIFIED' :
      result.status === 'MANUAL_REVIEW' ? 'DOCUMENT_SENT_FOR_MANUAL_REVIEW' : 'DOCUMENT_REJECTED';

    this.addAuditLog(
      auditAction,
      `Verification result for "${params.file.name}" against ${requirement.code}: ${result.status}. Detected: ${result.detectedDocumentType} (${Math.round(result.confidence * 100)}% confidence). ${result.reasons.join(' | ')}`,
      entity?.name
    );

    // If verified PoE, link to quarter report
    if (doc.controlledType === 'POE') {
      const report = this.reports.find(r => r.entityId === params.entityId && r.quarter === quarter);
      if (report) {
        report.portfolioOfEvidenceDocId = doc.id;
      }
    }

    // If rejected, create an automated corrective task
    if (result.status === 'REJECTED') {
      this.addTask({
        entityId: params.entityId,
        entityName: entity ? entity.name : 'Institutional Entity',
        title: `Re-submit Required Evidence: ${requirement.title} (${quarter})`,
        description: `Automated verification rejected "${params.file.name}". Reason: ${result.reasons.join(' ')}. Please upload a valid ${requirement.requiredDocumentType}.`,
        assignedToName: entity ? (entity.reportingOfficerName || entity.headOfEntity) : 'Entity Officer',
        priority: 'HIGH',
        status: 'OPEN',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        direction: 'DSAC_TO_ENTITY',
      });
    }

    // Recalculate entity risk
    if (entity) {
      this.recalculateEntityRisk(entity.id);
    }

    this.persistAll();
    return { document: doc, result };
  }

  async replaceRejectedDocument(params: {
    docId: string;
    file: File | { name: string; size: number; type?: string; content?: string };
    simulatedContent?: string;
    changeSummary: string;
  }): Promise<{ document: EntityDocument; result: DocumentVerificationResult }> {
    const doc = this.documents.find(d => d.id === params.docId);
    if (!doc) throw new Error(`Document ${params.docId} not found.`);

    const requirement = this.documentRequirements.find(r => r.id === doc.requirementId) ||
      this.documentRequirements.find(r => r.requiredDocumentType === doc.controlledType) ||
      this.documentRequirements[0];

    this.addAuditLog(
      'DOCUMENT_REPLACED',
      `Submitted replacement version for document "${doc.title}". New file: ${params.file.name}. Summary: ${params.changeSummary}`,
      doc.entityName
    );

    return this.submitDocumentForRequirement({
      entityId: doc.entityId,
      requirementId: requirement.id,
      reportId: doc.reportId,
      quarter: doc.quarter || 'Q3',
      financialYear: doc.financialYear || '2025/2026',
      file: params.file,
      simulatedContent: params.simulatedContent,
      changeSummary: params.changeSummary,
    });
  }

  manualReviewDocument(params: {
    docId: string;
    decision: 'VERIFIED' | 'REJECTED';
    reviewerName: string;
    reviewerRole: UserRole;
    notes: string;
  }): void {
    const doc = this.documents.find(d => d.id === params.docId);
    if (!doc) return;

    doc.verificationStatus = params.decision;
    doc.approvalStatus = params.decision === 'VERIFIED' ? 'APPROVED' : 'REQUIRES_AMENDMENT';
    if (params.decision === 'VERIFIED') {
      doc.approvedAt = new Date().toISOString();
      doc.approvedBy = `${params.reviewerName} (${params.reviewerRole})`;
    }

    if (doc.activeVerification) {
      doc.activeVerification.status = params.decision;
      doc.activeVerification.manualReviewNotes = params.notes;
      doc.activeVerification.manualReviewedBy = params.reviewerName;
      doc.activeVerification.manualReviewedAt = new Date().toISOString();
      doc.activeVerification.verifier = 'MANUAL_OFFICIAL';
    }

    doc.comments.push({
      id: `cmt-${Date.now()}`,
      authorName: params.reviewerName,
      authorRole: params.reviewerRole,
      authorEntity: 'DSAC National Reviewer',
      timestamp: new Date().toISOString(),
      message: `[MANUAL REVIEW DECISION: ${params.decision}] ${params.notes}`,
    });

    const action = params.decision === 'VERIFIED' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED';
    this.addAuditLog(
      action,
      `Manual review conducted by ${params.reviewerName}: Document "${doc.title}" was ${params.decision}. Review Notes: ${params.notes}`,
      doc.entityName
    );

    this.recalculateEntityRisk(doc.entityId);
    this.persistAll();
  }

  requestDocumentReplacement(params: {
    docId: string;
    reviewerName: string;
    reason: string;
  }): void {
    const doc = this.documents.find(d => d.id === params.docId);
    if (!doc) return;

    doc.verificationStatus = 'REJECTED';
    doc.approvalStatus = 'REQUIRES_AMENDMENT';

    doc.comments.push({
      id: `cmt-${Date.now()}`,
      authorName: params.reviewerName,
      authorRole: 'DSAC_ADMIN',
      authorEntity: 'DSAC National Oversight',
      timestamp: new Date().toISOString(),
      message: `[AMENDMENT DIRECTIVE] Replacement document required: ${params.reason}`,
    });

    this.addTask({
      entityId: doc.entityId,
      entityName: doc.entityName,
      title: `Upload Replacement Dossier: ${doc.title}`,
      description: `DSAC Reviewer ${params.reviewerName} requested document replacement. Reason: ${params.reason}`,
      assignedToName: doc.uploadedBy || 'Entity Accounting Officer',
      priority: 'HIGH',
      status: 'OPEN',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      direction: 'DSAC_TO_ENTITY',
    });

    this.addAuditLog(
      'DOCUMENT_REJECTED',
      `Formal amendment directive issued for "${doc.title}". Reviewer requested replacement. Reason: ${params.reason}`,
      doc.entityName
    );

    this.recalculateEntityRisk(doc.entityId);
    this.persistAll();
  }

  /**
   * Submits a quarterly performance report together with a spend claim. The claim is recorded on the report
   * only: the authoritative expenditure is the finance return. (The previous build added the claim to the
   * entity's cumulative spend on every call, matched the report by quarter alone so a new year overwrote the old
   * one, hard-coded the due date to 2025-10-31 and decremented the overdue counter regardless of what was overdue.)
   */
  submitQuarterlyReport(params: {
    entityId: string;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    financialYear: string;
    expenditureClaimedZAR: number;
    declarationNotes: string;
    poeDocId?: string;
    items?: ReportItem[];
  }): QuarterlyReport {
    const entity = this.entities.find(e => e.id === params.entityId);
    const actor = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'Authorized Reporting Officer';
    const fy = normalizeFinancialYear(params.financialYear);
    const claimed = Number.isFinite(params.expenditureClaimedZAR) && params.expenditureClaimedZAR > 0 ? Math.round(params.expenditureClaimedZAR) : 0;

    let report = this.reports.find(r => r.entityId === params.entityId && r.quarter === params.quarter && sameFinancialYear(r.financialYear, fy));
    if (report && (report.submissionStatus === 'APPROVED' || report.submissionStatus === 'UNDER_REVIEW')) {
      this.addAuditLog('ACCESS_DENIED', `Ignored resubmission of the ${params.quarter} report for ${report.entityName}: it is ${report.submissionStatus} and locked.`, report.entityName);
      return report;
    }

    if (!report) {
      report = {
        id: `rep-${params.quarter.toLowerCase()}-${Date.now()}`,
        entityId: params.entityId,
        entityName: entity ? entity.name : 'Institutional Entity',
        quarter: params.quarter,
        financialYear: toLongFinancialYear(fy),
        submissionStatus: 'SUBMITTED',
        dueDate: quarterDueDate(fy, params.quarter),
        submittedAt: new Date().toISOString(),
        submittedBy: actor,
        submittedByName: actor,
        fundsSpentThisQuarterZAR: claimed,
        totalFundsReceivedToDateZAR: 0,
        items: params.items || [],
        portfolioOfEvidenceDocId: params.poeDocId,
        varianceExplanations: params.declarationNotes,
        accountingOfficerDeclaration: true,
      };
      this.reports = [report, ...this.reports];
    } else {
      report.submissionStatus = report.submissionStatus === 'CORRECTION_REQUIRED' ? 'RESUBMITTED' : 'SUBMITTED';
      report.submittedAt = new Date().toISOString();
      report.submittedBy = actor;
      report.submittedByName = actor;
      report.fundsSpentThisQuarterZAR = claimed;
      if (params.items && params.items.length > 0) report.items = params.items;
      if (params.poeDocId) report.portfolioOfEvidenceDocId = params.poeDocId;
      report.varianceExplanations = params.declarationNotes;
    }

    // The finance return (when present) replaces the claim; cash received always comes from the ledger.
    this.reconcileReportMirrors(params.entityId);
    if (entity) this.recalculateEntityRisk(entity.id);

    this.addTask({
      entityId: params.entityId,
      entityName: entity ? entity.name : 'Institutional Entity',
      title: `Verify ${params.quarter} Performance Report: ${entity?.shortCode || entity?.name}`,
      description: `Formal quarterly report submitted with claimed expenditure of ${formatZAR(claimed)}. Inspect Portfolio of Evidence and verify achievements.`,
      assignedToName: 'DSAC Oversight Directorate',
      priority: 'HIGH',
      status: 'OPEN',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      direction: 'ENTITY_TO_DSAC',
    });

    this.addAuditLog(
      'REPORT_SUBMITTED',
      `Submitted ${params.quarter} Performance Report for ${entity?.name}. Claimed expenditure: ${formatZAR(claimed)}.`,
      entity?.name
    );
    this.persistAll();
    return report;
  }

  addDocumentComment(docId: string, message: string): void {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc || !message.trim()) return;
    if (!this.canActForEntity(doc.entityId, 'Comment on document')) return;

    doc.comments.push({
      id: `cmt-${Date.now()}`,
      authorName: this.currentUser ? this.currentUser.name : 'Government Official',
      authorRole: this.currentUser ? this.currentUser.role : 'DSAC_ADMIN',
      authorEntity: this.currentUser?.entityName || 'DSAC National',
      timestamp: new Date().toISOString(),
      message,
    });

    this.notify();
    saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);
  }

  // --- TASK MANAGEMENT ---
  /** A task the system raises itself as a side effect of a workflow (a rejected upload, a returned report). */
  private addTask(task: Omit<CorrectiveTask, 'id' | 'createdAt' | 'createdByName' | 'createdByRole'>): void {
    const newTask: CorrectiveTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      createdByName: this.currentUser ? this.currentUser.name : 'DSAC Administrator',
      createdByRole: this.currentUser ? this.currentUser.role : 'DSAC_ADMIN',
    };

    this.tasks = [newTask, ...this.tasks];
    this.addAuditLog('TASK_CREATED', `Created Corrective Task "${newTask.title}" assigned to ${newTask.assignedToName} (Priority: ${newTask.priority})`, newTask.entityName);
    this.persistAll();
  }

  /**
   * A task raised by a person. DSAC officials may raise any task. An entity officer may raise tasks for their own
   * organisation only, and never a DSAC directive (a directive must come from DSAC).
   */
  createTask(task: Omit<CorrectiveTask, 'id' | 'createdAt' | 'createdByName' | 'createdByRole'>): void {
    if (!this.canActForEntity(task.entityId, 'Create task')) return;
    const isDsac = !!this.currentUser && DSAC_AUTHORITY_ROLES.includes(this.currentUser.role);
    if (!isDsac && task.direction === 'DSAC_TO_ENTITY') {
      this.addAuditLog('ACCESS_DENIED', 'Blocked "Create task": only DSAC officials can issue a DSAC directive.', task.entityName);
      return;
    }
    this.addTask(task);
  }

  resolveTask(taskId: string, resolutionNotes: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    const notes = resolutionNotes.trim();
    if (!task || task.status === 'COMPLETED' || !notes) return;
    if (!this.canActForEntity(task.entityId, 'Resolve task')) return;

    task.status = 'COMPLETED';
    task.completedAt = new Date().toISOString();
    task.resolutionNotes = notes;

    this.addAuditLog('TASK_RESOLVED', `Resolved Corrective Task "${task.title}". Notes: ${notes}`, task.entityName);
    this.persistAll();
  }

  updateTaskStatus(taskId: string, status: CorrectiveTask['status']): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    if (!this.canActForEntity(task.entityId, 'Update task status')) return;
    task.status = status;
    this.notify();
    saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
  }

  // --- DETERMINISTIC EARLY WARNING ENGINE ---
  recalculateEntityRisk(entityId: string): void {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity || entity.registrationStatus === 'PENDING_VERIFICATION') return;

    const entityKPIs = this.kpis.filter(k => k.entityId === entityId);
    const entityReports = this.reports.filter(r => r.entityId === entityId);
    const entityTasks = this.tasks.filter(t => t.entityId === entityId && (t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'OVERDUE'));

    // 1. KPI Trajectory Achievement
    let avgAchievementRatio = 1.0;
    if (entityKPIs.length > 0) {
      const sum = entityKPIs.reduce((acc, k) => {
        const exp = Math.max(1, k.expectedValue || (k.q1Target + k.q2Target + k.q3Target));
        const act = k.currentValue;
        return acc + Math.min(1.2, act / exp);
      }, 0);
      avgAchievementRatio = sum / entityKPIs.length;
    }

    // 2. Financial vs Output Variance (PFMA delivery lag)
    const fundingUtilisationRate = entity.transferredAmountZAR > 0 ? entity.reportedExpenditureZAR / entity.transferredAmountZAR : 0;
    const varianceGap = Math.min(1, Math.max(0, fundingUtilisationRate - avgAchievementRatio));

    // 3. Overdue reports and non-compliance
    const overdueCount = entityReports.filter(r => r.submissionStatus === 'OVERDUE').length;
    const correctionCount = entityReports.filter(r => r.submissionStatus === 'CORRECTION_REQUIRED').length;
    entity.overdueReportsCount = overdueCount;

    // Deterministic Risk Score calculation (0 to 100)
    let calculatedRisk = 0;
    // KPI trajectory lag: up to 50 points
    calculatedRisk += Math.max(0, (1.0 - avgAchievementRatio) * 50);
    // Financial variance gap: up to 40 points
    calculatedRisk += Math.max(0, varianceGap * 40);
    // Overdue reports: 25 points per overdue report
    calculatedRisk += overdueCount * 25;
    // Correction required: 12 points per rejected report
    calculatedRisk += correctionCount * 12;
    // Rejected document evidence penalty: 10 points per rejected statutory document
    const entityDocs = this.documents.filter(d => d.entityId === entityId);
    const rejectedDocCount = entityDocs.filter(d => d.verificationStatus === 'REJECTED' || d.approvalStatus === 'REQUIRES_AMENDMENT').length;
    calculatedRisk += Math.min(20, rejectedDocCount * 10);
    // Audit outcome penalty
    if (entity.auditOutcome === 'DISCLAIMER') calculatedRisk += 45;
    else if (entity.auditOutcome === 'QUALIFIED') calculatedRisk += 30;
    else if (entity.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS') calculatedRisk += 15;
    // Open tasks penalty: up to 20 points
    calculatedRisk += Math.min(20, entityTasks.length * 5);

    calculatedRisk = Math.min(98, Math.max(8, Math.round(calculatedRisk)));
    entity.riskScore = calculatedRisk;

    if (calculatedRisk >= 85) {
      entity.riskLevel = 'CRITICAL';
    } else if (calculatedRisk >= 55) {
      entity.riskLevel = 'HIGH';
    } else if (calculatedRisk >= 35) {
      entity.riskLevel = 'MEDIUM';
    } else {
      entity.riskLevel = 'LOW';
    }

    // Mathematically coherent compliance score (100 - risk adjusted)
    entity.overallComplianceScore = Math.min(98, Math.max(18, 100 - Math.round(calculatedRisk * 0.75)));
  }

  explainEntityRisk(entityId: string) {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return null;

    const entityKPIs = this.kpis.filter(k => k.entityId === entityId);
    const entityReports = this.reports.filter(r => r.entityId === entityId);
    const entityTasks = this.tasks.filter(t => t.entityId === entityId && (t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'OVERDUE'));

    let avgAchievementRatio = 1.0;
    if (entityKPIs.length > 0) {
      const sum = entityKPIs.reduce((acc, k) => {
        const exp = Math.max(1, k.expectedValue || (k.q1Target + k.q2Target + k.q3Target));
        return acc + Math.min(1.2, k.currentValue / exp);
      }, 0);
      avgAchievementRatio = sum / entityKPIs.length;
    }

    const fundingUtilisationRate = entity.transferredAmountZAR > 0 ? entity.reportedExpenditureZAR / entity.transferredAmountZAR : 0;
    const varianceGap = Math.min(1, Math.max(0, fundingUtilisationRate - avgAchievementRatio));
    const overdueCount = entityReports.filter(r => r.submissionStatus === 'OVERDUE').length;
    const correctionCount = entityReports.filter(r => r.submissionStatus === 'CORRECTION_REQUIRED').length;

    const factors: { name: string; scoreContribution: number; description: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[] = [];

    if (avgAchievementRatio < 0.9) {
      const lag = Math.round((1.0 - avgAchievementRatio) * 100);
      factors.push({
        name: 'KPI Trajectory Delivery Lag',
        scoreContribution: Math.round(Math.max(0, (1.0 - avgAchievementRatio) * 40)),
        description: `Average target delivery is lagging ${lag}% behind expected quarterly milestones across ${entityKPIs.length} statutory indicators.`,
        severity: avgAchievementRatio < 0.6 ? 'CRITICAL' : avgAchievementRatio < 0.8 ? 'HIGH' : 'MEDIUM',
      });
    }

    if (varianceGap > 0.1) {
      const gapPct = Math.round(varianceGap * 100);
      factors.push({
        name: 'PFMA Financial vs Output Variance Anomaly',
        scoreContribution: Math.round(varianceGap * 30),
        description: `Disbursement expenditure rate (${Math.round(fundingUtilisationRate * 100)}%) is disproportionately outstripping output delivery (${Math.round(avgAchievementRatio * 100)}%) by ${gapPct}%.`,
        severity: varianceGap > 0.3 ? 'CRITICAL' : 'HIGH',
      });
    }

    if (overdueCount > 0) {
      factors.push({
        name: 'Statutory Reporting Non-Compliance',
        scoreContribution: overdueCount * 20,
        description: `${overdueCount} quarterly statutory return(s) have passed their statutory reporting deadline without Accounting Officer submission.`,
        severity: 'CRITICAL',
      });
    }

    if (correctionCount > 0) {
      factors.push({
        name: 'Portfolio of Evidence Correction Required',
        scoreContribution: correctionCount * 10,
        description: `${correctionCount} submitted quarterly return(s) flagged with deficient evidence or unverified audit schedules by DSAC Oversight.`,
        severity: 'MEDIUM',
      });
    }

    if (entity.auditOutcome !== 'CLEAN_AUDIT') {
      const label = entity.auditOutcome === 'DISCLAIMER' ? 'Disclaimer of Opinion' : entity.auditOutcome === 'QUALIFIED' ? 'Qualified Audit Opinion' : 'Unqualified with Findings';
      const pts = entity.auditOutcome === 'DISCLAIMER' ? 40 : entity.auditOutcome === 'QUALIFIED' ? 25 : 15;
      factors.push({
        name: `Auditor-General Findings: ${label}`,
        scoreContribution: pts,
        description: `Entity received a ${label} in the latest statutory audit cycle from the Auditor-General of South Africa.`,
        severity: entity.auditOutcome === 'DISCLAIMER' ? 'CRITICAL' : entity.auditOutcome === 'QUALIFIED' ? 'HIGH' : 'MEDIUM',
      });
    }

    if (entityTasks.length > 0) {
      factors.push({
        name: 'Unresolved DSAC Corrective Directives',
        scoreContribution: Math.min(15, entityTasks.length * 5),
        description: `${entityTasks.length} formal remedial task(s) currently open or overdue on the monitoring register.`,
        severity: entityTasks.length >= 2 ? 'HIGH' : 'MEDIUM',
      });
    }

    const entityDocs = this.documents.filter(d => d.entityId === entityId);
    const rejectedDocCount = entityDocs.filter(d => d.verificationStatus === 'REJECTED' || d.approvalStatus === 'REQUIRES_AMENDMENT').length;
    if (rejectedDocCount > 0) {
      factors.push({
        name: 'Statutory Document Verification Failure',
        scoreContribution: Math.min(20, rejectedDocCount * 10),
        description: `${rejectedDocCount} statutory document(s) failed automated content classification or were formally rejected by DSAC Reviewers.`,
        severity: rejectedDocCount >= 2 ? 'HIGH' : 'MEDIUM',
      });
    }

    return {
      entityId: entity.id,
      entityName: entity.name,
      riskScore: entity.riskScore,
      riskLevel: entity.riskLevel,
      complianceScore: entity.overallComplianceScore,
      factors,
      recommendedIntervention: entity.riskLevel === 'CRITICAL'
        ? 'Convene emergency Ministerial and Board oversight session; withhold subsequent grant tranches pending physical verification.'
        : entity.riskLevel === 'HIGH'
        ? 'Dispatch DSAC Governance Task Team; issue PFMA Section 38 remedial directive within 14 working days.'
        : entity.riskLevel === 'MEDIUM'
        ? 'Monitor Q4 operational delivery trajectory closely; verify revised Portfolio of Evidence before sign-off.'
        : 'Maintain standard quarterly monitoring cycle in accordance with statutory reporting framework.',
    };
  }

  // --- EXECUTIVE PERFORMANCE PULSE AGGREGATION ---
  /**
   * Portfolio headline numbers. Every money and KPI figure is read from the same read-model the finance and
   * performance screens use (getDepartmentFinancialAggregation / getDepartmentPerformanceAggregation) for the
   * current reporting period, so the dashboards cannot disagree with each other or with the entity pages.
   */
  getPerformancePulse() {
    const { financialYear, quarter } = getCurrentReportingPeriod();
    const members = this.entities.filter(isPortfolioMember);
    const memberIds = new Set(members.map(m => m.id));

    const totalEntities = members.length;
    const publicEntitiesCount = members.filter(e => e.type === 'PUBLIC_ENTITY').length;
    const nposCount = members.filter(e => e.type === 'NPO').length;
    const pendingRegistrationsCount = this.entities.length - totalEntities;

    const onTrackCount = members.filter(e => e.riskLevel === 'LOW').length;
    const monitoringCount = members.filter(e => e.riskLevel === 'MEDIUM').length;
    const highRiskCount = members.filter(e => e.riskLevel === 'HIGH').length;
    const criticalRiskCount = members.filter(e => e.riskLevel === 'CRITICAL').length;
    const interventionCount = highRiskCount + criticalRiskCount;

    // --- Money: from the engine, never from the read-cache fields on the entity ---
    const fin = this.getDepartmentFinancialAggregation(financialYear, quarter);
    const totalAllocation = fin.totalApprovedBudget;
    const totalTransferred = fin.totalTransferredToDate;
    const totalExpended = fin.totalReportedExpenditure;
    const totalVerifiedExpenditure = fin.totalVerifiedExpenditure;
    // What is left to DISBURSE (approved - disbursed). The engine also exposes remainingBudget (left to SPEND).
    const remainingDisbursement = fin.remainingDisbursement;
    const remainingBudget = fin.remainingBudget;
    const unspentDisbursed = fin.unspentDisbursed;
    const transferRate = fin.transferRate; // disbursed / approved
    const expenditureRate = fin.expenditureRate; // Transfer Absorption: reported / disbursed
    const burnRate = fin.utilPercent; // Budget Utilisation: reported / approved
    const entitiesWithOutstandingReturns = fin.entitiesWithOutstandingReturns;

    const totalYouthJobs = members.reduce((acc, e) => acc + (e.jobStats?.youthJobsCreated || 0), 0);
    const totalPermanentJobs = members.reduce((acc, e) => acc + (e.jobStats?.permanentJobs || 0), 0);
    const totalCreativePractitioners = members.reduce((acc, e) => acc + (e.jobStats?.creativeSectorPractitionersSupported || 0), 0);

    const audited = members.filter(e => e.auditOutcome !== 'NOT_YET_AUDITED');
    const cleanAuditCount = audited.filter(e => e.auditOutcome === 'CLEAN_AUDIT').length;
    const cleanAuditRate = audited.length > 0 ? Math.round((cleanAuditCount / audited.length) * 1000) / 10 : 0;
    const averageCompliance = Math.round(members.reduce((acc, e) => acc + e.overallComplianceScore, 0) / Math.max(1, totalEntities));

    const totalDocumentsCount = this.documents.length;
    const verifiedDocumentsCount = this.documents.filter(d => d.verificationStatus === 'VERIFIED' || d.approvalStatus === 'APPROVED').length;
    const pendingDocumentsCount = this.documents.filter(d => d.approvalStatus === 'PENDING_REVIEW' && d.verificationStatus !== 'REJECTED').length;
    const amendmentRequiredDocumentsCount = this.documents.filter(d => d.verificationStatus === 'REJECTED' || d.approvalStatus === 'REQUIRES_AMENDMENT').length;
    const rejectedDocumentsCount = amendmentRequiredDocumentsCount;
    const manualReviewCount = this.documents.filter(d => d.verificationStatus === 'MANUAL_REVIEW').length;
    const entitiesWithRejectedEvidenceCount = new Set(
      this.documents
        .filter(d => d.verificationStatus === 'REJECTED' || d.approvalStatus === 'REQUIRES_AMENDMENT')
        .map(d => d.entityId)
    ).size;
    const documentComplianceRate = totalDocumentsCount > 0
      ? Math.round((verifiedDocumentsCount / totalDocumentsCount) * 1000) / 10
      : 100;

    // --- Reports (all periods) ---
    const memberReports = this.reports.filter(r => memberIds.has(r.entityId));
    const totalReports = memberReports.length;
    const reportsApprovedCount = memberReports.filter(r => r.submissionStatus === 'APPROVED').length;
    const reportsSubmittedCount = memberReports.filter(r => r.submissionStatus === 'SUBMITTED' || r.submissionStatus === 'RESUBMITTED').length;
    const reportsUnderReviewCount = memberReports.filter(r => r.submissionStatus === 'UNDER_REVIEW').length;
    const reportsCorrectionRequiredCount = memberReports.filter(r => r.submissionStatus === 'CORRECTION_REQUIRED').length;
    const overdueReportsCount = memberReports.filter(r => r.submissionStatus === 'OVERDUE').length;
    const pendingReviewCount = reportsSubmittedCount + reportsUnderReviewCount;

    // --- Reports for the CURRENT reporting period (quarter comes from the period service, not a literal) ---
    const periodReports = memberReports.filter(r => sameFinancialYear(r.financialYear, financialYear) && r.quarter === quarter);
    const lodgedStatuses: QuarterlyReport['submissionStatus'][] = ['APPROVED', 'SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'];
    const currentQuarterSubmittedCount = periodReports.filter(r => lodgedStatuses.includes(r.submissionStatus)).length;
    const currentQuarterOutstandingCount = Math.max(0, totalEntities - currentQuarterSubmittedCount);
    const currentQuarterOverdueCount = periodReports.filter(r => r.submissionStatus === 'OVERDUE').length;
    const currentQuarterReturnedCount = periodReports.filter(r => r.submissionStatus === 'CORRECTION_REQUIRED').length;

    const openTasksCount = this.tasks.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'OVERDUE').length;

    // --- KPIs: one rule set, year-to-date at the current period ---
    const kpiItems = members.flatMap(m => this.kpis.filter(k => k.entityId === m.id).map(k => calculateKpiItemProgress(k, financialYear, quarter)));
    const totalKpis = kpiItems.length;
    const kpisOnTrack = kpiItems.filter(i => i.kpiStatus === 'COMPLETED' || i.kpiStatus === 'ON_TRACK').length;
    const kpisAtRisk = kpiItems.filter(i => i.kpiStatus === 'AT_RISK').length;
    const kpisMissed = kpiItems.filter(i => i.kpiStatus === 'MISSED').length;
    const kpisNotStarted = kpiItems.filter(i => i.kpiStatus === 'NOT_STARTED').length;
    const perf = this.getDepartmentPerformanceAggregation(financialYear, quarter, 'ALL');
    const averageKpiAchievement = perf.overallDeliveryPercent;

    return {
      reportingPeriod: { financialYear, quarter },
      totalEntities,
      publicEntitiesCount,
      nposCount,
      pendingRegistrationsCount,
      onTrackCount,
      monitoringCount,
      highRiskCount,
      criticalRiskCount,
      interventionCount,
      highRiskEntitiesCount: interventionCount,
      totalAllocation,
      totalTransferred,
      totalExpended,
      totalVerifiedExpenditure,
      remainingDisbursement,
      remainingBudget,
      unspentDisbursed,
      transferRate,
      expenditureRate,
      burnRate,
      entitiesWithOutstandingReturns,
      totalYouthJobs,
      totalPermanentJobs,
      totalCreativePractitioners,
      cleanAuditCount,
      cleanAuditRate,
      averageCompliance,
      totalDocumentsCount,
      verifiedDocumentsCount,
      pendingDocumentsCount,
      amendmentRequiredDocumentsCount,
      rejectedDocumentsCount,
      manualReviewCount,
      entitiesWithRejectedEvidenceCount,
      documentComplianceRate,
      totalReports,
      reportsApprovedCount,
      allSubmittedReportsCount: reportsSubmittedCount,
      reportsUnderReviewCount,
      reportsCorrectionRequiredCount,
      overdueReportsCount,
      pendingReviewCount,
      currentQuarterSubmittedCount,
      currentQuarterOutstandingCount,
      currentQuarterOverdueCount,
      currentQuarterReturnedCount,
      // Legacy names kept for existing screens. They now describe the CURRENT reporting quarter.
      q3SubmittedCount: currentQuarterSubmittedCount,
      q3OutstandingCount: currentQuarterOutstandingCount,
      reportsSubmittedCount: currentQuarterSubmittedCount,
      reportsOutstandingCount: currentQuarterOutstandingCount,
      openTasksCount,
      totalKpis,
      kpisOnTrack,
      kpisAtRisk,
      kpisMissed,
      kpisNotStarted,
      averageKpiAchievement,
    };
  }

  registerEntityAndUser(params: {
    entityName: string;
    entityType: EntityType;
    cluster: EntityCluster;
    cipcNumber: string;
    accountingOfficer: string;
    email: string;
    password?: string;
    contactNumber?: string;
    province?: string;
    allocatedBudgetZAR?: number;
    designation?: string;
  }): { success: boolean; message?: string; entity?: PublicEntity; user?: User } {
    const cleanEmail = params.email.trim().toLowerCase();
    if (this.registeredUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'An account with this email address already exists. Please log in.' };
    }
    const strength = checkPasswordStrength(params.password?.trim() || '');
    if (!strength.ok) return { success: false, message: strength.message };

    const name = params.entityName.trim();
    // Registering against an organisation that already exists would hand its data to whoever registers first.
    if (this.entities.some(e => e.name.toLowerCase() === name.toLowerCase())) {
      return {
        success: false,
        message: 'An organisation with this name is already registered. Ask your organisation\'s administrator to add you as a user.',
      };
    }

    const declared = Number.isFinite(params.allocatedBudgetZAR) && (params.allocatedBudgetZAR as number) > 0
      ? Math.round(params.allocatedBudgetZAR as number)
      : 0;

    const entityId = `ent-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}-${Date.now().toString().slice(-4)}`;
    const shortCode = name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 5) || 'NPO';

    // A self-registered organisation is NOT part of the monitored portfolio until DSAC verifies it. It starts with
    // zero approved, disbursed and reported money (the previous build invented 50% disbursed and 35% spent from
    // the figure the applicant typed), no audit outcome and no demographics.
    const newEntity: PublicEntity = {
      id: entityId,
      name,
      shortCode,
      type: params.entityType,
      cluster: params.cluster,
      budgetAllocationZAR: 0,
      transferredAmountZAR: 0,
      reportedExpenditureZAR: 0,
      registrationStatus: 'PENDING_VERIFICATION',
      declaredBudgetZAR: declared,
      auditOutcome: 'NOT_YET_AUDITED',
      auditYear: '-',
      overallComplianceScore: 0,
      riskLevel: 'LOW',
      riskScore: 0,
      activeDeadlinesCount: 0,
      overdueReportsCount: 0,
      headOfEntity: params.accountingOfficer.trim(),
      contactEmail: cleanEmail,
      reportingOfficerName: params.accountingOfficer.trim(),
      demographics: { african: 0, coloured: 0, indian: 0, white: 0, female: 0, male: 0, youth: 0, personsWithDisabilities: 0, totalStaff: 0 },
      jobStats: { permanentJobs: 0, temporaryJobs: 0, youthJobsCreated: 0, creativeSectorPractitionersSupported: 0, targetJobsAnnual: 0 },
      trancheStatus: 'UNDER_REVIEW',
      trancheAmountZAR: 0,
      statutoryDefaultStage: 0,
    };

    this.entities = [newEntity, ...this.entities];

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: params.accountingOfficer.trim(),
      email: cleanEmail,
      role: 'ENTITY_OFFICER',
      designation: params.designation?.trim() || 'Organisation Administrator',
      entityId: newEntity.id,
      entityName: newEntity.name,
      passwordHash: hashPassword(params.password!.trim()),
    };
    this.registeredUsers = [newUser, ...this.registeredUsers];
    this.currentUser = newUser;

    // The stated budget becomes a REQUEST for DSAC to review, not an approved allocation.
    if (declared > 0) {
      try {
        this.submitBudgetRequest({
          entityId: newEntity.id,
          entityName: newEntity.name,
          financialYear: getCurrentReportingPeriod().financialYear,
          requestedAmount: declared,
          justification: 'Budget stated at self-registration; awaiting DSAC verification of the organisation.',
          lines: this.standardBudgetLines(declared).map(l => ({ categoryId: l.categoryId, categoryName: l.categoryName, requestedAmount: l.requestedAmount })),
        });
      } catch {
        // A malformed stated budget must not block registration; DSAC can capture the request later.
      }
    }

    this.addAuditLog(
      'USER_REGISTRATION',
      `New Entity registered (pending DSAC verification): ${newEntity.name} (${newEntity.type}) by ${newUser.name} (${newUser.email})`,
      newEntity.name
    );
    this.persistAll();
    return { success: true, entity: newEntity, user: newUser };
  }

  /** Standard chart-of-accounts split used when a budget line breakdown has not been supplied. */
  private standardBudgetLines(total: number): { categoryId: string; categoryName: string; requestedAmount: number }[] {
    const ids = STANDARD_CATEGORY_IDS.filter((_, i) => STANDARD_CATEGORY_WEIGHTS[i] > 0);
    const weights = STANDARD_CATEGORY_WEIGHTS.filter(w => w > 0);
    const parts = allocateProportionally(total, weights);
    return ids.map((id, i) => ({
      categoryId: id,
      categoryName: this.expenseCategories.find(c => c.id === id)?.name || id,
      requestedAmount: parts[i],
    }));
  }

  // ==========================================
  // BUDGET & FINANCIAL UTILISATION ENGINE
  // ==========================================

  getExpenseCategories(): ExpenseCategory[] {
    return [...this.expenseCategories].sort((a, b) => a.standardSortOrder - b.standardSortOrder);
  }

  createExpenseCategory(name: string, code: string, description: string): ExpenseCategory {
    if (!this.requireDsacAuthority('Create expense category')) throw new Error('Only DSAC officials can change the chart of accounts.');
    const newCat: ExpenseCategory = {
      id: `cat-custom-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      active: true,
      standardSortOrder: this.expenseCategories.length + 1,
    };
    this.expenseCategories = [...this.expenseCategories, newCat];
    this.addAuditLog(
      'FINANCIAL_RECORD_UPDATED',
      `Created new expenditure category: ${newCat.name} (${newCat.code})`,
      'Departmental Financial Chart of Accounts'
    );
    this.persistAll();
    return newCat;
  }

  toggleExpenseCategory(categoryId: string, active: boolean): void {
    if (!this.requireDsacAuthority('Change expense category')) return;
    const cat = this.expenseCategories.find(c => c.id === categoryId);
    if (!cat) return;
    cat.active = active;
    this.addAuditLog(
      'FINANCIAL_RECORD_UPDATED',
      `${active ? 'Activated' : 'Deactivated'} expense category: ${cat.name}`,
      'Departmental Financial Chart of Accounts'
    );
    this.persistAll();
  }

  getBudgetProfiles(): EntityBudgetProfile[] {
    return this.budgetProfiles;
  }

  getBudgetProfileForEntity(entityId: string, financialYear = getCurrentReportingPeriod().financialYear): EntityBudgetProfile | undefined {
    return this.budgetProfiles.find(
      bp => bp.entityId === entityId && sameFinancialYear(bp.financialYear, financialYear)
    );
  }

  /**
   * Lodges (or revises) a budget request. Every request must foot: the expense lines must add up to the amount
   * requested. Re-submitting over an approved profile records a REVISION REQUEST: the existing approval and its
   * line allocations stand until DSAC decides (the previous build wiped them).
   */
  submitBudgetRequest(data: {
    entityId: string;
    entityName: string;
    financialYear: string;
    requestedAmount: number;
    justification: string;
    lines: {
      categoryId: string;
      categoryName: string;
      requestedAmount: number;
      notes?: string;
    }[];
    supportingDocumentId?: string;
    supportingDocumentName?: string;
  }): EntityBudgetProfile {
    const role = this.currentUser?.role;
    if (!role || (role === 'ENTITY_OFFICER' && this.currentUser?.entityId !== data.entityId)) {
      throw new Error('You are not authorised to submit a budget request for this organisation.');
    }

    const fy = normalizeFinancialYear(data.financialYear);
    const requested = Math.round(Number(data.requestedAmount));
    if (!Number.isFinite(requested) || requested <= 0) throw new Error('The requested amount must be greater than zero.');

    const cleanLines = data.lines
      .map(l => ({ ...l, requestedAmount: Math.round(Number(l.requestedAmount) || 0) }))
      .filter(l => l.requestedAmount > 0);
    if (cleanLines.length === 0) throw new Error('Add at least one expense line to the budget request.');
    const lineSum = cleanLines.reduce((a, l) => a + l.requestedAmount, 0);
    if (lineSum !== requested) {
      throw new Error(`The expense lines total ${formatZAR(lineSum)} but the request is for ${formatZAR(requested)}. The lines must add up to the request.`);
    }

    const existing = this.budgetProfiles.find(bp => bp.entityId === data.entityId && sameFinancialYear(bp.financialYear, fy));
    const profileId = existing ? existing.id : `bp-${Date.now()}`;
    const now = new Date().toISOString();

    // Merge lines: requested amounts come from the request; approved allocations already granted are kept.
    const merged: BudgetLine[] = cleanLines.map((l, i) => ({
      id: existing?.lines.find(x => x.categoryId === l.categoryId)?.id || `bl-${profileId}-${i + 1}`,
      budgetId: profileId,
      categoryId: l.categoryId,
      categoryName: l.categoryName,
      requestedAmount: l.requestedAmount,
      annualBudget: existing?.lines.find(x => x.categoryId === l.categoryId)?.annualBudget ?? 0,
      notes: l.notes,
    }));
    (existing?.lines || []).forEach(prev => {
      if (!merged.some(m => m.categoryId === prev.categoryId)) merged.push({ ...prev, requestedAmount: 0 });
    });

    const approvedSoFar = existing?.approvedAmount ?? 0;
    const newProfile: EntityBudgetProfile = {
      ...(existing || {}),
      id: profileId,
      entityId: data.entityId,
      entityName: data.entityName,
      financialYear: fy,
      requestedAmount: requested,
      approvedAmount: approvedSoFar,
      fundingGap: Math.max(0, requested - approvedSoFar),
      status: 'SUBMITTED',
      requestDate: now.split('T')[0],
      justification: data.justification,
      supportingDocumentId: data.supportingDocumentId ?? existing?.supportingDocumentId,
      supportingDocumentName: data.supportingDocumentName ?? existing?.supportingDocumentName,
      expectedSpendingTrajectory: existing?.expectedSpendingTrajectory || { q1Percent: 25, q2Percent: 50, q3Percent: 75, q4Percent: 100 },
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      lines: merged,
    };

    if (existing) {
      this.budgetProfiles = this.budgetProfiles.map(bp => (bp.id === profileId ? newProfile : bp));
    } else {
      this.budgetProfiles = [newProfile, ...this.budgetProfiles];
    }

    this.addAuditLog(
      'BUDGET_REQUEST_CREATED',
      `${existing && approvedSoFar > 0 ? 'Revision request' : 'Budget request'} of ${formatZAR(requested)} logged for ${data.entityName} (${fy})${approvedSoFar > 0 ? `; the existing approval of ${formatZAR(approvedSoFar)} stands until DSAC decides` : ''}. Justification: ${data.justification.slice(0, 80)}...`,
      data.entityName
    );

    this.persistAll();
    return newProfile;
  }

  /**
   * DSAC decision on a budget request. An approval (full or partial) sets the approved amount and allocates it
   * across the expense lines so the lines ALWAYS add up to the approved amount (largest-remainder rounding).
   * It affects only the financial year of the profile: approving next year's budget no longer overwrites this
   * year's allocation.
   */
  reviewBudgetRequest(
    profileId: string,
    approvedAmount: number,
    status: BudgetRequestStatus,
    comments?: string,
    lineApprovals?: { categoryId: string; annualBudget: number }[]
  ): { success: boolean; message?: string } {
    if (!this.requireDsacAuthority('Decide budget request')) {
      return { success: false, message: 'Only DSAC officials can decide on budget requests.' };
    }
    const profile = this.budgetProfiles.find(bp => bp.id === profileId);
    if (!profile) return { success: false, message: 'Budget request not found.' };

    const reviewer = this.currentUser ? this.currentUser.name : 'DSAC National Reviewer';
    const approving = status === 'APPROVED' || status === 'PARTIALLY_APPROVED';

    if (approving) {
      const amount = Math.round(Number(approvedAmount));
      if (!Number.isFinite(amount) || amount <= 0) return { success: false, message: 'The approved amount must be greater than zero.' };
      if (amount > profile.requestedAmount) {
        return { success: false, message: `The approved amount ${formatZAR(amount)} exceeds the amount requested ${formatZAR(profile.requestedAmount)}.` };
      }

      let allocated: number[];
      if (lineApprovals && lineApprovals.length > 0) {
        const total = lineApprovals.reduce((a, l) => a + Math.round(l.annualBudget), 0);
        if (total !== amount) {
          return { success: false, message: `The line approvals total ${formatZAR(total)} but the approved amount is ${formatZAR(amount)}. They must be equal.` };
        }
        allocated = profile.lines.map(l => Math.round(lineApprovals.find(la => la.categoryId === l.categoryId)?.annualBudget ?? 0));
      } else if (profile.lines.length > 0) {
        const weights = profile.lines.map(l => l.requestedAmount);
        allocated = allocateProportionally(amount, weights.some(w => w > 0) ? weights : profile.lines.map(() => 1));
      } else {
        allocated = [];
      }

      profile.lines = profile.lines.length > 0
        ? profile.lines.map((l, i) => ({ ...l, annualBudget: allocated[i] }))
        : this.standardBudgetLines(amount).map((l, i) => ({
            id: `bl-${profile.id}-${i + 1}`,
            budgetId: profile.id,
            categoryId: l.categoryId,
            categoryName: l.categoryName,
            requestedAmount: l.requestedAmount,
            annualBudget: l.requestedAmount,
          }));

      profile.approvedAmount = amount;
      profile.fundingGap = Math.max(0, profile.requestedAmount - amount);
      profile.approvalDate = new Date().toISOString().split('T')[0];
      profile.status = amount < profile.requestedAmount ? 'PARTIALLY_APPROVED' : 'APPROVED';
    } else if (status === 'REJECTED' && profile.approvedAmount > 0) {
      // A declined REVISION leaves the existing approval standing.
      profile.status = 'APPROVED';
      comments = `Revision request declined; the existing approval of ${formatZAR(profile.approvedAmount)} stands. ${comments || ''}`.trim();
    } else {
      profile.status = status;
    }

    profile.reviewedBy = this.currentUser?.id;
    profile.reviewedByName = reviewer;
    profile.reviewDate = new Date().toISOString().split('T')[0];
    profile.comments = comments;
    profile.updatedAt = new Date().toISOString();

    this.syncEntityFinancialCache(profile.entityId);
    this.recalculateFinancialRisks(profile.entityId);

    this.addAuditLog(
      approving ? 'BUDGET_APPROVED' : 'BUDGET_UPDATED',
      approving
        ? `${profile.status === 'PARTIALLY_APPROVED' ? 'Partially approved' : 'Approved'} annual budget of ${formatZAR(profile.approvedAmount)} of ${formatZAR(profile.requestedAmount)} requested (funding gap ${formatZAR(profile.fundingGap)}) for ${profile.entityName} (${profile.financialYear}). Decision notes: ${comments || 'Approved by DSAC CFO'}`
        : `Budget Request ${status} for ${profile.entityName} (${profile.financialYear}). Reason: ${comments || 'Awaiting revisions'}`,
      profile.entityName
    );

    this.persistAll();
    return { success: true };
  }

  /**
   * Imports gazetted allocations for ONE financial year. Duplicates in the file are collapsed (last row wins) and
   * counted once; expense lines are re-allocated so they add up to the imported amount.
   */
  uploadTreasuryAllocations(
    allocations: { entityId?: string; shortCode?: string; amount: number }[],
    financialYear: string,
    sourceFileName: string
  ): { updatedCount: number; totalZAR: number; skipped: string[] } {
    if (!this.requireDsacAuthority('Import Treasury allocations')) return { updatedCount: 0, totalZAR: 0, skipped: ['Only DSAC officials can import allocations.'] };

    const fy = normalizeFinancialYear(financialYear);
    const skipped: string[] = [];
    const byEntity = new Map<string, number>();

    allocations.forEach(alloc => {
      const entity = this.entities.find(e =>
        (alloc.entityId && e.id === alloc.entityId) ||
        (alloc.shortCode && e.shortCode.toLowerCase() === alloc.shortCode.toLowerCase())
      );
      const amount = Math.round(Number(alloc.amount));
      if (!entity) { skipped.push(`${alloc.entityId || alloc.shortCode || '(blank)'}: organisation not found`); return; }
      if (!Number.isFinite(amount) || amount <= 0) { skipped.push(`${entity.shortCode}: invalid amount`); return; }
      byEntity.set(entity.id, amount);
    });

    let totalZAR = 0;
    byEntity.forEach((amount, entityId) => {
      const entity = this.entities.find(e => e.id === entityId)!;
      let profile = this.budgetProfiles.find(p => p.entityId === entityId && sameFinancialYear(p.financialYear, fy));
      if (profile) {
        const weights = profile.lines.map(l => l.annualBudget || l.requestedAmount);
        const parts = profile.lines.length > 0 ? allocateProportionally(amount, weights.some(w => w > 0) ? weights : weights.map(() => 1)) : [];
        profile.lines = profile.lines.length > 0
          ? profile.lines.map((l, i) => ({ ...l, annualBudget: parts[i] }))
          : this.standardBudgetLines(amount).map((l, i) => ({ id: `bl-${profile!.id}-${i + 1}`, budgetId: profile!.id, categoryId: l.categoryId, categoryName: l.categoryName, requestedAmount: l.requestedAmount, annualBudget: l.requestedAmount }));
        profile.approvedAmount = amount;
        profile.status = 'APPROVED';
        profile.fundingGap = Math.max(0, profile.requestedAmount - amount);
        profile.updatedAt = new Date().toISOString();
      } else {
        const id = `bp-${Date.now()}-${entityId}`;
        const std = this.standardBudgetLines(amount);
        profile = {
          id,
          entityId,
          entityName: entity.name,
          financialYear: fy,
          requestedAmount: amount,
          approvedAmount: amount,
          fundingGap: 0,
          status: 'APPROVED',
          requestDate: new Date().toISOString().split('T')[0],
          approvalDate: new Date().toISOString().split('T')[0],
          justification: `Imported from ${sourceFileName}.`,
          expectedSpendingTrajectory: { q1Percent: 25, q2Percent: 50, q3Percent: 75, q4Percent: 100 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lines: std.map((l, i) => ({ id: `bl-${id}-${i + 1}`, budgetId: id, categoryId: l.categoryId, categoryName: l.categoryName, requestedAmount: l.requestedAmount, annualBudget: l.requestedAmount })),
        };
        this.budgetProfiles = [profile, ...this.budgetProfiles];
      }
      totalZAR += amount;
      this.syncEntityFinancialCache(entityId);
    });

    this.addAuditLog(
      'BUDGET_APPROVED',
      `Imported National Treasury Vote 37 budget allocations from "${sourceFileName}" for FY ${fy}. ${byEntity.size} institutions updated totaling ${formatZAR(totalZAR)}.${skipped.length ? ` ${skipped.length} row(s) skipped.` : ''}`,
      'National Treasury Import'
    );

    this.persistAll();
    return { updatedCount: byEntity.size, totalZAR, skipped };
  }

  getQuarterlyFinancialSubmissions(): QuarterlyFinancialSubmission[] {
    return this.quarterlyFinancialSubmissions;
  }

  getQuarterlyFinancialSubmissionsForEntity(
    entityId: string,
    financialYear = getCurrentReportingPeriod().financialYear
  ): QuarterlyFinancialSubmission[] {
    return this.quarterlyFinancialSubmissions.filter(
      qs => qs.entityId === entityId && sameFinancialYear(qs.financialYear, financialYear)
    );
  }

  // --- DISBURSEMENT LEDGER ---
  getDisbursements(entityId?: string, financialYear?: string): DisbursementRecord[] {
    return this.disbursements.filter(
      d => (!entityId || d.entityId === entityId) && (!financialYear || sameFinancialYear(d.financialYear, financialYear))
    );
  }

  /** The next tranche still to be paid (scheduled or withheld) for a financial year. */
  getNextTranche(entityId: string, financialYear = getCurrentReportingPeriod().financialYear): DisbursementRecord | undefined {
    return this.disbursements
      .filter(d => d.entityId === entityId && sameFinancialYear(d.financialYear, financialYear) && d.status !== 'RELEASED')
      .sort((a, b) => quarterIndex(a.tranche) - quarterIndex(b.tranche))[0];
  }

  private setNextTrancheStatus(entityId: string, status: 'SCHEDULED' | 'WITHHELD'): void {
    const next = this.getNextTranche(entityId);
    if (next) next.status = status;
    this.syncEntityFinancialCache(entityId);
  }

  /**
   * Releases a funding tranche. Disbursed is the sum of released ledger entries, so this is the ONLY way the
   * amount disbursed can rise. Tranches must go in order, cannot be released while a statutory hold applies and
   * can never take the total disbursed above the approved budget.
   */
  releaseTranche(entityId: string, financialYear: string, tranche: FinancialQuarter, note?: string): { success: boolean; message?: string } {
    if (!this.requireDsacAuthority('Release funding tranche')) return { success: false, message: 'Only DSAC officials can release a tranche.' };
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return { success: false, message: 'Organisation not found.' };
    const fy = normalizeFinancialYear(financialYear);

    const rec = this.disbursements.find(d => d.entityId === entityId && sameFinancialYear(d.financialYear, fy) && d.tranche === tranche);
    if (!rec) return { success: false, message: `No ${tranche} tranche is scheduled for ${fy}.` };
    if (rec.status === 'RELEASED') return { success: false, message: `The ${tranche} tranche has already been released.` };
    if (this.disbursements.some(d => d.entityId === entityId && sameFinancialYear(d.financialYear, fy) && quarterIndex(d.tranche) < quarterIndex(tranche) && d.status !== 'RELEASED')) {
      return { success: false, message: 'Earlier tranches must be released first.' };
    }
    if (rec.status === 'WITHHELD' || entity.trancheStatus === 'WITHHELD' || entity.trancheStatus === 'CONDITIONAL_HOLD') {
      return { success: false, message: 'This tranche is withheld under PFMA Section 38(1)(j). Lift the statutory hold first.' };
    }
    const profile = this.getBudgetProfileForEntity(entityId, fy);
    const releasedSoFar = this.disbursements.filter(d => d.entityId === entityId && sameFinancialYear(d.financialYear, fy) && d.status === 'RELEASED').reduce((a, d) => a + d.amountZAR, 0);
    if (!profile || releasedSoFar + rec.amountZAR > profile.approvedAmount) {
      return { success: false, message: 'Releasing this tranche would take total disbursements above the approved budget.' };
    }

    rec.status = 'RELEASED';
    rec.releasedAt = new Date().toISOString();
    rec.releasedByName = this.currentUser?.name;
    if (note) rec.note = note;

    this.syncEntityFinancialCache(entityId);
    this.reconcileReportMirrors(entityId);
    this.addAuditLog('TRANCHE_DISBURSED', `Released ${tranche} tranche of ${formatZAR(rec.amountZAR)} to ${entity.name} for ${fy}.${note ? ` Note: ${note}` : ''}`, entity.name);
    this.persistAll();
    return { success: true };
  }

  /**
   * Lodges a quarterly expenditure return. This is the ONLY way expenditure enters the system.
   *  - The quarter total is always the sum of its expense lines.
   *  - A return without the Accounting Officer's certification is kept as a DRAFT and does not count.
   *  - A certified return is SUBMITTED for DSAC review (it counts as reported, not yet verified). The previous
   *    build hard-coded every return to APPROVED, so entities approved their own figures and the DSAC review
   *    queue could never fill.
   *  - An accepted (APPROVED) return is locked; DSAC must reopen it. A resubmission keeps a revision history.
   * Throws an Error with a user-readable message when the return is invalid.
   */
  submitQuarterlyFinancialReturn(data: {
    entityId: string;
    entityName: string;
    financialYear: string;
    quarter: FinancialQuarter;
    totalQuarterlyActual: number;
    lines: {
      categoryId: string;
      categoryName: string;
      actualAmount: number;
      plannedAmount: number;
      budgetLineId?: string;
    }[];
    supportingDocumentIds?: string[];
    accountingOfficerAffirmation: boolean;
    accountingOfficerName?: string;
  }): QuarterlyFinancialSubmission {
    const role = this.currentUser?.role;
    if (!role || (role === 'ENTITY_OFFICER' && this.currentUser?.entityId !== data.entityId)) {
      throw new Error('You are not authorised to lodge a return for this organisation.');
    }

    const fy = normalizeFinancialYear(data.financialYear);
    const cleanLines = data.lines.map(l => {
      const amount = Number(l.actualAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`Invalid amount for ${l.categoryName}: expenditure must be a non-negative number.`);
      }
      return { ...l, actualAmount: Math.round(amount) };
    });

    const existing = this.quarterlyFinancialSubmissions.find(
      qs => qs.entityId === data.entityId && sameFinancialYear(qs.financialYear, fy) && qs.quarter === data.quarter
    );
    if (existing?.status === 'APPROVED') {
      throw new Error(`The ${data.quarter} return for ${fy} has been accepted by DSAC and is locked. Ask DSAC to reopen it if a correction is needed.`);
    }
    if (existing?.status === 'UNDER_REVIEW') {
      throw new Error(`The ${data.quarter} return for ${fy} is under DSAC review and cannot be changed until DSAC responds.`);
    }

    const submissionId = existing ? existing.id : `qs-${Date.now()}`;
    const now = new Date().toISOString();
    const lines = cleanLines.map((l, i) => ({
      id: `qsl-${submissionId}-${i + 1}`,
      quarterlySubmissionId: submissionId,
      budgetLineId: l.budgetLineId,
      categoryId: l.categoryId,
      categoryName: l.categoryName,
      actualAmount: l.actualAmount,
      plannedAmount: l.plannedAmount,
    }));
    const total = lines.reduce((a, l) => a + l.actualAmount, 0);
    const affirmed = !!data.accountingOfficerAffirmation;

    const newSubmission: QuarterlyFinancialSubmission = {
      id: submissionId,
      entityId: data.entityId,
      entityName: data.entityName,
      financialYear: fy,
      quarter: data.quarter,
      status: affirmed ? 'SUBMITTED' : 'DRAFT',
      submittedAt: affirmed ? now : undefined,
      submittedByName: data.accountingOfficerName || this.currentUser?.name || 'Reporting Officer',
      totalQuarterlyActual: total,
      supportingDocumentIds: data.supportingDocumentIds || [],
      accountingOfficerAffirmation: affirmed,
      accountingOfficerName: data.accountingOfficerName,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      lines,
      revision: (existing?.revision ?? 0) + (existing ? 1 : 0),
      revisionHistory: existing
        ? [...(existing.revisionHistory || []), { at: existing.updatedAt, totalQuarterlyActual: returnTotal(existing), status: existing.status }]
        : [],
    };

    if (existing) {
      this.quarterlyFinancialSubmissions = this.quarterlyFinancialSubmissions.map(qs => (qs.id === submissionId ? newSubmission : qs));
    } else {
      this.quarterlyFinancialSubmissions = [newSubmission, ...this.quarterlyFinancialSubmissions];
    }

    const profile = this.getBudgetProfileForEntity(data.entityId, fy);
    const unbudgeted = lines.filter(l => l.actualAmount > 0 && !(profile?.lines || []).some(b => b.categoryId === l.categoryId && b.annualBudget > 0));

    this.syncEntityFinancialCache(data.entityId);
    this.reconcileReportMirrors(data.entityId);

    this.addAuditLog(
      'QUARTERLY_EXPENDITURE_SUBMITTED',
      `${affirmed ? 'Submitted' : 'Saved as draft'} ${data.quarter} expenditure of ${formatZAR(total)} for ${data.entityName} (${fy})${existing ? `, replacing ${formatZAR(returnTotal(existing))} (${existing.status})` : ''}. ${affirmed ? `Affirmation certified by ${data.accountingOfficerName || 'Accounting Officer'}; awaiting DSAC verification.` : 'Not certified, so not counted in reported totals.'}${unbudgeted.length ? ` WARNING: spend on lines with no approved budget: ${unbudgeted.map(l => `${l.categoryName} ${formatZAR(l.actualAmount)}`).join(', ')}.` : ''}`,
      data.entityName
    );

    // Re-evaluate risk rules for financial parameters
    this.recalculateFinancialRisks(data.entityId, fy);

    this.persistAll();
    return newSubmission;
  }

  /** Reviewer decision on a lodged return. Only returns awaiting review can be accepted. */
  reviewQuarterlyFinancialReturn(
    submissionId: string,
    decision: 'APPROVE' | 'REQUEST_CORRECTION',
    notes: string
  ): void {
    if (!this.requireDsacAuthority('Review quarterly financial return')) return;
    const submission = this.quarterlyFinancialSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    const awaiting = submission.status === 'SUBMITTED' || submission.status === 'UNDER_REVIEW';
    if (decision === 'APPROVE' && !awaiting) {
      this.addAuditLog('ACCESS_DENIED', `Ignored approval of the ${submission.quarter} return for ${submission.entityName}: it is ${submission.status}, not awaiting review.`, submission.entityName);
      return;
    }
    if (decision === 'REQUEST_CORRECTION' && !awaiting && submission.status !== 'APPROVED') {
      return;
    }

    const reviewer = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'DSAC Oversight Reviewer';

    if (decision === 'APPROVE') {
      submission.status = 'APPROVED';
      submission.reviewedAt = new Date().toISOString();
      submission.reviewedByName = reviewer;
      submission.reviewNotes = notes;

      this.addAuditLog(
        'FINANCIAL_REPORT_APPROVED',
        `Approved ${submission.quarter} financial actual return of ${formatZAR(returnTotal(submission))} for ${submission.entityName}. Verification note: ${notes}`,
        submission.entityName
      );
    } else {
      submission.status = 'CORRECTION_REQUIRED';
      submission.reviewedAt = new Date().toISOString();
      submission.reviewedByName = reviewer;
      submission.reviewNotes = notes;

      // Automatically trigger a corrective task for financial rectification
      const newTask: CorrectiveTask = {
        id: `task-fin-${Date.now()}`,
        entityId: submission.entityId,
        entityName: submission.entityName,
        title: `Remediate ${submission.quarter} Financial Return: ${notes.slice(0, 50)}...`,
        description: `DSAC Financial Review finding: "${notes}". Re-verify expense vouchers and resubmit within 7 working days.`,
        assignedToName: `${submission.submittedByName || 'Chief Financial Officer'}`,
        createdByName: this.currentUser?.name || 'DSAC Finance Specialist',
        createdByRole: this.currentUser?.role || 'DSAC_ADMIN',
        priority: 'HIGH',
        status: 'OPEN',
        direction: 'DSAC_TO_ENTITY',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      this.tasks = [newTask, ...this.tasks];

      this.addAuditLog(
        'FINANCIAL_REPORT_CORRECTION_REQUESTED',
        `Requested corrections for ${submission.quarter} expenditure return for ${submission.entityName}. Finding: ${notes}. The return is excluded from reported totals until resubmitted.`,
        submission.entityName
      );
    }

    this.syncEntityFinancialCache(submission.entityId);
    this.reconcileReportMirrors(submission.entityId);
    this.recalculateFinancialRisks(submission.entityId, submission.financialYear);
    this.persistAll();
  }

  getEntityFinancialSummary(
    entityId: string,
    financialYear = getCurrentReportingPeriod().financialYear,
    selectedQuarter: QuarterSelection = getCurrentReportingPeriod().quarter
  ): EntityFinancialSummary {
    const entityMeta = this.entities.find(e => e.id === entityId);
    return calculateEntityFinancialSummary(
      entityId,
      financialYear,
      selectedQuarter,
      this.budgetProfiles,
      this.quarterlyFinancialSubmissions,
      this.expenseCategories,
      entityMeta,
      this.kpis,
      this.disbursements
    );
  }

  getDepartmentFinancialKPIs(
    financialYear = getCurrentReportingPeriod().financialYear,
    selectedQuarter: QuarterSelection = getCurrentReportingPeriod().quarter
  ): DepartmentFinancialKPIs {
    return calculateDepartmentFinancialKPIs(
      financialYear,
      selectedQuarter,
      this.budgetProfiles,
      this.quarterlyFinancialSubmissions,
      this.entities,
      this.expenseCategories,
      this.kpis,
      this.disbursements
    );
  }

  getEntityPerformanceSummary(
    entityId: string,
    financialYear = getCurrentReportingPeriod().financialYear,
    quarter: QuarterSelection = 'FULL_YEAR'
  ): EntityPerformanceSummary {
    const entityMeta = this.entities.find(e => e.id === entityId);
    return calculateEntityPerformanceSummary(
      entityId,
      financialYear,
      quarter,
      this.kpis,
      entityMeta
    );
  }

  getDepartmentPerformanceAggregation(
    financialYear = getCurrentReportingPeriod().financialYear,
    quarter: QuarterSelection = getCurrentReportingPeriod().quarter,
    typeFilter: 'ALL' | 'PUBLIC_ENTITY' | 'NPO' = 'ALL'
  ): DepartmentPerformanceAggregation {
    return calculateDepartmentPerformanceAggregation(
      this.entities,
      this.kpis,
      financialYear,
      quarter,
      typeFilter
    );
  }

  getDepartmentFinancialAggregation(
    financialYear = getCurrentReportingPeriod().financialYear,
    quarter: QuarterSelection = getCurrentReportingPeriod().quarter,
    typeFilter: 'ALL' | 'PUBLIC_ENTITY' | 'NPO' = 'ALL'
  ): DepartmentFinancialAggregation {
    return calculateDepartmentFinancialAggregation(
      this.entities,
      this.budgetProfiles,
      this.quarterlyFinancialSubmissions,
      this.expenseCategories,
      this.kpis,
      this.disbursements,
      financialYear,
      quarter,
      typeFilter
    );
  }

  private daysToNextStatutoryDeadline(): number {
    const now = Date.now();
    const upcoming = this.deadlines
      .map(d => new Date(d.dueDate).getTime())
      .filter(t => t > now)
      .sort((a, b) => a - b)[0];
    return upcoming ? Math.max(0, Math.ceil((upcoming - now) / 86400000)) : 0;
  }

  /**
   * Financial early-warning rules for an entity, evaluated for the CURRENT reporting period (the previous build
   * hard-coded 'Q3' and gave every alert an invented "days until deadline").
   */
  recalculateFinancialRisks(entityId: string, financialYear?: string): void {
    const period = getCurrentReportingPeriod();
    // Alerts describe the current reporting period; a return for another year does not raise or clear them.
    if (financialYear && !sameFinancialYear(financialYear, period.financialYear)) return;

    const entity = this.entities.find(e => e.id === entityId);
    if (!entity || !isPortfolioMember(entity)) return;
    const summary = this.getEntityFinancialSummary(entityId, period.financialYear, period.quarter);

    // Clear this entity's previous financial alerts, then re-evaluate.
    this.riskAlerts = this.riskAlerts.filter(
      r => !(r.entityId === entityId && (
        r.title.includes('Budget Overspend') ||
        r.title.includes('Rapid Utilisation') ||
        r.title.includes('Severe Under-Utilisation') ||
        r.title.includes('Under-Utilisation Warning') ||
        r.title.includes('Projected Year-End Overspend') ||
        r.title.includes('Financial & Delivery Disconnect')
      ))
    );

    // The formula-based score first; financial alerts may then only raise it.
    this.recalculateEntityRisk(entityId);

    const lateReports = this.reports.filter(r => r.entityId === entityId && r.submissionStatus === 'OVERDUE').length;
    const days = this.daysToNextStatutoryDeadline();
    const evidence = (over: Partial<RiskAlert['evidenceData']> = {}): RiskAlert['evidenceData'] => ({
      actualAchieved: summary.ytdActual,
      expectedTrajectory: summary.expectedYtd,
      annualTarget: summary.approvedAmount,
      financialUtilisationRate: summary.utilisationPercent,
      historicalLateReportsCount: lateReports,
      daysUntilDeadline: days,
      ...over,
    });
    const stamp = new Date().toISOString();

    if (summary.isOverspent) {
      this.riskAlerts.unshift({
        id: `risk-fin-over-${entityId}`,
        entityId,
        entityName: entity.name,
        riskLevel: 'CRITICAL',
        riskScore: 92,
        title: `Budget Overspend Detected: ${formatZAR(summary.overspendAmount)} Over Allocation`,
        reason: `Cumulative YTD expenditure reaches ${formatZAR(summary.ytdActual)} exceeding approved annual budget of ${formatZAR(summary.approvedAmount)} (${summary.utilisationPercent}% utilisation). Immediate PFMA Section 38 intervention required.`,
        contributingFactors: [
          `Approved Budget: ${formatZAR(summary.approvedAmount)}`,
          `Actual Expenditure to date: ${formatZAR(summary.ytdActual)}`,
          `Net Deficit / Overspend: ${formatZAR(summary.overspendAmount)}`,
          'PFMA Section 38 compliance alert'
        ],
        evidenceData: evidence(),
        recommendedAction: 'Issue formal PFMA Section 38(1)(j) inquiry and require immediate financial reprioritisation recovery plan.',
        createdAt: stamp,
        acknowledged: false,
      });
      entity.riskLevel = 'CRITICAL';
      entity.riskScore = Math.max(entity.riskScore, 88);
    } else if (summary.financialStatus === 'REQUIRES_REVIEW') {
      this.riskAlerts.unshift({
        id: `risk-fin-rapid-${entityId}`,
        entityId,
        entityName: entity.name,
        riskLevel: 'HIGH',
        riskScore: 74,
        title: `Rapid Utilisation Rate: +${summary.variancePercent}% Above Trajectory`,
        reason: `Entity expenditure pace is accelerating significantly faster than approved quarterly benchmark trajectory. Expected YTD was ${formatZAR(summary.expectedYtd)}, actual is ${formatZAR(summary.ytdActual)}.`,
        contributingFactors: [
          `Variance against trajectory: +${summary.variancePercent}%`,
          `Actual spend: ${formatZAR(summary.ytdActual)} vs expected ${formatZAR(summary.expectedYtd)}`,
          'Risk of exhaustion prior to Q4 closeout'
        ],
        evidenceData: evidence(),
        recommendedAction: 'Audit the cash-flow run rate to ensure allocations will sustain operations through financial year-end.',
        createdAt: stamp,
        acknowledged: false,
      });
      if (entity.riskLevel === 'LOW') entity.riskLevel = 'MEDIUM';
    } else if (summary.financialStatus === 'UNDER_UTILISING') {
      this.riskAlerts.unshift({
        id: `risk-fin-under-${entityId}`,
        entityId,
        entityName: entity.name,
        riskLevel: 'MEDIUM',
        riskScore: 56,
        title: `Under-Utilisation Warning: ${summary.utilisationPercent}% Absorbed`,
        reason: `Low financial expenditure rate (${summary.variancePercent}% variance against trajectory). Potential procurement halts or programme delays in key sub-programmes.`,
        contributingFactors: [
          `Budget utilisation: ${summary.utilisationPercent}% of approved; absorption of transfers: ${summary.absorptionRate}%`,
          `Variance: ${summary.variancePercent}% against trajectory`,
          'Capital procurement delays or unfilled vacancies'
        ],
        evidenceData: evidence(),
        recommendedAction: 'Request quarterly procurement acceleration plan and audit pipeline commitments.',
        createdAt: stamp,
        acknowledged: false,
      });
    }

    // Forecast rule: not yet overspent, but the current run-rate lands above the approved budget at year end.
    if (!summary.isOverspent && summary.approvedAmount > 0 && summary.projectedYearEndUtilisationPercent > 105) {
      this.riskAlerts.unshift({
        id: `risk-fin-proj-${entityId}`,
        entityId,
        entityName: entity.name,
        riskLevel: 'HIGH',
        riskScore: 70,
        title: `Projected Year-End Overspend: ${summary.projectedYearEndUtilisationPercent}% of Budget`,
        reason: `At the current run-rate (${formatZAR(summary.ytdActual)} over ${summary.dueQuarters.length - summary.missingQuarters.length} reported quarter(s)) expenditure is projected to reach ${formatZAR(summary.projectedYearEndSpend)} against an approved budget of ${formatZAR(summary.approvedAmount)}.`,
        contributingFactors: [
          `Projected year-end spend: ${formatZAR(summary.projectedYearEndSpend)}`,
          `Approved budget: ${formatZAR(summary.approvedAmount)}`,
          'Linear run-rate projection; seasonality not modelled',
        ],
        evidenceData: evidence({ actualAchieved: summary.projectedYearEndSpend, expectedTrajectory: summary.approvedAmount }),
        recommendedAction: 'Ask the Accounting Officer for a recovery plan or a budget adjustment request before the overspend materialises.',
        createdAt: stamp,
        acknowledged: false,
      });
      if (entity.riskLevel === 'LOW') entity.riskLevel = 'MEDIUM';
    }

    // Performance vs Finance Disconnect (Section 23)
    if (summary.performanceFinanceSignal?.status === 'REQUIRES_REVIEW') {
      this.riskAlerts.unshift({
        id: `risk-fin-perf-${entityId}`,
        entityId,
        entityName: entity.name,
        riskLevel: 'HIGH',
        riskScore: 78,
        title: `Financial & Delivery Disconnect: High Spend vs Low Output`,
        reason: summary.performanceFinanceSignal.commentary,
        contributingFactors: [
          `Budget utilisation: ${summary.utilisationPercent}%`,
          `Target achievement rate: ${summary.targetAchievementRate || 0}%`,
          'Asymmetry between resource drawdown and verifiable service delivery'
        ],
        evidenceData: evidence({ actualAchieved: summary.targetAchievementRate || 0, expectedTrajectory: 100, annualTarget: 100 }),
        recommendedAction: 'Schedule joint governance review between DSAC Finance Directorate and Programme Performance Monitoring unit.',
        createdAt: stamp,
        acknowledged: false,
      });
    }
  }
}

export const store = GovTrackStore.getInstance();
