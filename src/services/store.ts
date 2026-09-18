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
  FinancialTransaction 
} from '../types/financial';
import { 
  INITIAL_EXPENSE_CATEGORIES, 
  INITIAL_BUDGET_PROFILES, 
  INITIAL_QUARTERLY_SUBMISSIONS 
} from '../data/initialFinancialData';
import { 
  calculateEntityFinancialSummary, 
  calculateDepartmentFinancialKPIs, 
  formatZAR 
} from './financialService';
import {
  generateInitialTransactions,
  filterTransactions,
  sumTransactions
} from './financialTransactionService';
import {
  calculateEntityPerformanceSummary,
  calculateDepartmentPerformanceAggregation,
  calculateDepartmentFinancialAggregation,
  normalizeFinancialYear,
  normalizeQuarter,
  EntityPerformanceSummary,
  DepartmentPerformanceAggregation,
  DepartmentFinancialAggregation
} from './calculationEngine';

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
  FINANCIAL_TRANSACTIONS: 'govtrack_financial_transactions',
};

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

// Safe JSON parse from localStorage with fallback
function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return fallback;
  }
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save to localStorage for key ${key}:`, e);
  }
}

export class GovTrackStore {
  private static instance: GovTrackStore;
  private listeners: Set<() => void> = new Set();

  currentUser: User | null;
  registeredUsers: User[];
  entities: PublicEntity[];
  kpis: KPIRecord[];
  reports: QuarterlyReport[];
  documents: EntityDocument[];
  documentRequirements: DocumentRequirement[];
  tasks: CorrectiveTask[];
  riskAlerts: RiskAlert[];
  deadlines: RegulatoryDeadline[];
  auditLogs: AuditLogEntry[];
  expenseCategories: ExpenseCategory[];
  budgetProfiles: EntityBudgetProfile[];
  quarterlyFinancialSubmissions: QuarterlyFinancialSubmission[];
  supportRequests: SupportRequest[];
  financialTransactions: FinancialTransaction[];

  private constructor() {
    let loadedUsers = loadFromStorage<User[]>(STORAGE_KEYS.REGISTERED_USERS, INITIAL_USERS);
    const hasSicelo = loadedUsers.some(u => u.email.toLowerCase() === 'sakhilesicelo94@gmail.com');
    if (!hasSicelo) {
      loadedUsers = [INITIAL_USERS[0], ...loadedUsers.filter(u => u.email.toLowerCase() !== 'n.sithole@dsac.gov.za')];
    }
    // Ensure Lerato Phiri & Thandi Mokoena exist
    INITIAL_USERS.forEach(initUser => {
      if (!loadedUsers.some(u => u.email.toLowerCase() === initUser.email.toLowerCase())) {
        loadedUsers.push(initUser);
      }
    });

    this.registeredUsers = loadedUsers.map(u => {
      const isSicelo = u.email.toLowerCase() === 'sakhilesicelo94@gmail.com';
      return {
        ...u,
        role: isSicelo ? ('DSAC_ADMIN' as UserRole) : u.role,
        password: isSicelo ? 'Mkhize@550' : (u.password || 'Password123!'),
        entityName: isSicelo ? 'DSAC National Headquarters' : (u.entityName || (u.role === 'ENTITY_OFFICER' ? 'Statutory Public Entity' : 'DSAC National Headquarters')),
      };
    });
    saveToStorage(STORAGE_KEYS.REGISTERED_USERS, this.registeredUsers);

    let loadedCurrent = loadFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    if (!loadedCurrent || loadedCurrent.email.toLowerCase() === 'n.sithole@dsac.gov.za') {
      loadedCurrent = this.registeredUsers.find(u => u.email.toLowerCase() === 'sakhilesicelo94@gmail.com') || INITIAL_USERS[0];
    }
    if (loadedCurrent && loadedCurrent.email.toLowerCase() === 'sakhilesicelo94@gmail.com') {
      loadedCurrent.password = 'Mkhize@550';
      loadedCurrent.role = 'DSAC_ADMIN';
    }
    saveToStorage(STORAGE_KEYS.CURRENT_USER, loadedCurrent);
    this.currentUser = loadedCurrent;

    let loadedEntities = loadFromStorage<PublicEntity[]>(STORAGE_KEYS.ENTITIES, INITIAL_ENTITIES);
    INITIAL_ENTITIES.forEach(initEnt => {
      if (!loadedEntities.some(e => e.id === initEnt.id)) {
        loadedEntities.push(initEnt);
      }
    });
    this.entities = loadedEntities.map(e => ({
      ...e,
      trancheAmountZAR: e.trancheAmountZAR || Math.round((e.budgetAllocationZAR || 40000000) / 4),
      trancheStatus: e.trancheStatus || (e.overdueReportsCount > 0 || e.riskLevel === 'CRITICAL' ? 'WITHHELD' : 'RELEASED'),
      statutoryDefaultStage: e.statutoryDefaultStage !== undefined ? e.statutoryDefaultStage : (e.overdueReportsCount > 0 ? 2 : 0),
      statutoryDefaultReason: e.statutoryDefaultReason || (e.overdueReportsCount > 0 ? 'Statutory Q3 Performance Return and certified PoE overdue past 30-day PFMA Section 38(1)(j) deadline.' : undefined),
      statutoryDefaultNoticeDate: e.statutoryDefaultNoticeDate || (e.overdueReportsCount > 0 ? '2026-02-01T08:00:00.000Z' : undefined)
    }));
    saveToStorage(STORAGE_KEYS.ENTITIES, this.entities);

    let loadedKpis = loadFromStorage<KPIRecord[]>(STORAGE_KEYS.KPIS, INITIAL_KPIS);
    if (!loadedKpis || loadedKpis.length < 30) {
      loadedKpis = INITIAL_KPIS;
    } else {
      INITIAL_KPIS.forEach(initK => {
        if (!loadedKpis.some(k => k.id === initK.id)) {
          loadedKpis.push(initK);
        }
      });
    }
    this.kpis = loadedKpis;
    saveToStorage(STORAGE_KEYS.KPIS, this.kpis);

    let loadedReports = loadFromStorage<QuarterlyReport[]>(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
    if (!loadedReports || loadedReports.length < 30) {
      loadedReports = INITIAL_REPORTS;
    } else {
      INITIAL_REPORTS.forEach(initR => {
        if (!loadedReports.some(r => r.id === initR.id)) {
          loadedReports.push(initR);
        }
      });
    }
    this.reports = loadedReports;
    saveToStorage(STORAGE_KEYS.REPORTS, this.reports);
    let loadedDocs = loadFromStorage<EntityDocument[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
    INITIAL_DOCUMENTS.forEach(initDoc => {
      const existing = loadedDocs.find(d => d.id === initDoc.id);
      if (!existing) {
        loadedDocs.push(initDoc);
      } else {
        // Guarantee file properties are synchronized
        existing.fileName = existing.fileName || initDoc.fileName || existing.versions?.[0]?.fileName || existing.title;
        existing.fileSize = existing.fileSize || initDoc.fileSize || (existing.fileSizeBytes ? `${(existing.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '3.5 MB');
        existing.fileSizeBytes = existing.fileSizeBytes || initDoc.fileSizeBytes;
        existing.uploadedAt = existing.uploadedAt || initDoc.uploadedAt || existing.versions?.[0]?.uploadedAt;
        existing.uploadedBy = existing.uploadedBy || initDoc.uploadedBy || existing.versions?.[0]?.uploadedBy;
      }
    });
    this.documents = loadedDocs.map(d => ({
      ...d,
      fileName: d.fileName || d.versions?.[0]?.fileName || d.title,
      fileSize: d.fileSize || (d.fileSizeBytes ? (d.fileSizeBytes < 1000000 ? `${Math.round(d.fileSizeBytes / 1024)} KB` : `${(d.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`) : '3.5 MB'),
      uploadedAt: d.uploadedAt || d.versions?.[0]?.uploadedAt || '2025-07-14T10:00:00.000Z',
      uploadedBy: d.uploadedBy || d.versions?.[0]?.uploadedBy || 'Lerato Phiri (Organisation Admin)',
    }));
    saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);

    this.documentRequirements = loadFromStorage<DocumentRequirement[]>(
      STORAGE_KEYS.DOCUMENT_REQUIREMENTS,
      DEFAULT_DOCUMENT_REQUIREMENTS
    );
    saveToStorage(STORAGE_KEYS.DOCUMENT_REQUIREMENTS, this.documentRequirements);

    this.tasks = loadFromStorage<CorrectiveTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    this.riskAlerts = loadFromStorage<RiskAlert[]>(STORAGE_KEYS.RISKS, INITIAL_RISK_ALERTS);
    this.deadlines = loadFromStorage<RegulatoryDeadline[]>(STORAGE_KEYS.DEADLINES, INITIAL_DEADLINES);
    this.auditLogs = loadFromStorage<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);

    let loadedExpenseCategories = loadFromStorage<ExpenseCategory[]>(STORAGE_KEYS.EXPENSE_CATEGORIES, INITIAL_EXPENSE_CATEGORIES);
    INITIAL_EXPENSE_CATEGORIES.forEach(initCat => {
      if (!loadedExpenseCategories.some(c => c.id === initCat.id)) {
        loadedExpenseCategories.push(initCat);
      }
    });
    this.expenseCategories = loadedExpenseCategories;
    saveToStorage(STORAGE_KEYS.EXPENSE_CATEGORIES, this.expenseCategories);

    let loadedBudgetProfiles = loadFromStorage<EntityBudgetProfile[]>(STORAGE_KEYS.BUDGET_PROFILES, INITIAL_BUDGET_PROFILES);
    INITIAL_BUDGET_PROFILES.forEach(initBp => {
      if (!loadedBudgetProfiles.some(bp => bp.id === initBp.id)) {
        loadedBudgetProfiles.push(initBp);
      }
    });
    this.budgetProfiles = loadedBudgetProfiles;
    saveToStorage(STORAGE_KEYS.BUDGET_PROFILES, this.budgetProfiles);

    let loadedQuarterlySubmissions = loadFromStorage<QuarterlyFinancialSubmission[]>(
      STORAGE_KEYS.QUARTERLY_FINANCIAL_SUBMISSIONS, 
      INITIAL_QUARTERLY_SUBMISSIONS
    );
    INITIAL_QUARTERLY_SUBMISSIONS.forEach(initQs => {
      if (!loadedQuarterlySubmissions.some(qs => qs.id === initQs.id)) {
        loadedQuarterlySubmissions.push(initQs);
      }
    });
    this.quarterlyFinancialSubmissions = loadedQuarterlySubmissions;
    saveToStorage(STORAGE_KEYS.QUARTERLY_FINANCIAL_SUBMISSIONS, this.quarterlyFinancialSubmissions);

    let loadedSupportRequests = loadFromStorage<SupportRequest[]>(
      STORAGE_KEYS.SUPPORT_REQUESTS,
      INITIAL_SUPPORT_REQUESTS
    );
    INITIAL_SUPPORT_REQUESTS.forEach(initReq => {
      if (!loadedSupportRequests.some(r => r.id === initReq.id)) {
        loadedSupportRequests.push(initReq);
      }
    });
    this.supportRequests = loadedSupportRequests;
    saveToStorage(STORAGE_KEYS.SUPPORT_REQUESTS, this.supportRequests);

    let loadedTransactions = loadFromStorage<FinancialTransaction[]>(
      STORAGE_KEYS.FINANCIAL_TRANSACTIONS, 
      []
    );
    if (!loadedTransactions || loadedTransactions.length === 0) {
      loadedTransactions = generateInitialTransactions(this.entities, this.quarterlyFinancialSubmissions);
    }
    this.financialTransactions = loadedTransactions;
    saveToStorage(STORAGE_KEYS.FINANCIAL_TRANSACTIONS, this.financialTransactions);
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
    saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
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
    saveToStorage(STORAGE_KEYS.SUPPORT_REQUESTS, this.supportRequests);
    saveToStorage(STORAGE_KEYS.FINANCIAL_TRANSACTIONS, this.financialTransactions);
    this.notify();
  }

  // --- RE-SYNCHRONIZE DEPARTMENTAL BASELINE ---
  reseedOfficialBaseline(): void {
    this.entities = JSON.parse(JSON.stringify(INITIAL_ENTITIES));
    this.kpis = JSON.parse(JSON.stringify(INITIAL_KPIS));
    this.reports = JSON.parse(JSON.stringify(INITIAL_REPORTS));
    this.documents = JSON.parse(JSON.stringify(INITIAL_DOCUMENTS));
    this.tasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
    this.riskAlerts = JSON.parse(JSON.stringify(INITIAL_RISK_ALERTS));
    this.deadlines = JSON.parse(JSON.stringify(INITIAL_DEADLINES));
    this.expenseCategories = JSON.parse(JSON.stringify(INITIAL_EXPENSE_CATEGORIES));
    this.budgetProfiles = JSON.parse(JSON.stringify(INITIAL_BUDGET_PROFILES));
    this.quarterlyFinancialSubmissions = JSON.parse(JSON.stringify(INITIAL_QUARTERLY_SUBMISSIONS));
    this.supportRequests = JSON.parse(JSON.stringify(INITIAL_SUPPORT_REQUESTS));
    this.financialTransactions = generateInitialTransactions(this.entities, this.quarterlyFinancialSubmissions);
    this.addAuditLog(
      'SYSTEM_BASELINE_SYNC',
      'Departmental statutory baseline datasets synchronized with gazetted PFMA Vote 37 appropriations.'
    );
    this.persistAll();
  }

  updateEntity(updated: PublicEntity): void {
    const idx = this.entities.findIndex(e => e.id === updated.id);
    if (idx !== -1) {
      this.entities[idx] = { ...this.entities[idx], ...updated };
      this.addAuditLog('ENTITY_RECORD_UPDATED', `Governance record updated for ${updated.name}`, updated.name);
      this.persistAll();
    }
  }

  // --- REAL AUTHENTICATION & SESSION MANAGEMENT ---
  login(email: string, password?: string): { success: boolean; message?: string } {
    const cleanEmail = email.trim().toLowerCase();

    // Specific credential check for DSAC Administrator sakhilesicelo94@gmail.com
    if (cleanEmail === 'sakhilesicelo94@gmail.com') {
      if (password !== undefined && password.trim() !== 'Mkhize@550') {
        return {
          success: false,
          message: 'Invalid official password. Please enter the designated DSAC security password (Mkhize@550).'
        };
      }
      let sicelo = this.registeredUsers.find(u => u.email.toLowerCase() === 'sakhilesicelo94@gmail.com');
      if (!sicelo) {
        sicelo = {
          id: 'user-dsac-admin',
          name: 'Sicelo Sakhile Mkhize',
          email: 'sakhilesicelo94@gmail.com',
          role: 'DSAC_ADMIN',
          designation: 'Chief Director: Public Entities Oversight & Governance',
          entityName: 'DSAC National Headquarters',
          password: 'Mkhize@550',
        };
        this.registeredUsers.unshift(sicelo);
        saveToStorage(STORAGE_KEYS.REGISTERED_USERS, this.registeredUsers);
      } else {
        sicelo.password = 'Mkhize@550';
        sicelo.role = 'DSAC_ADMIN';
      }
      this.currentUser = sicelo;
      saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
      this.addAuditLog('USER_LOGIN', `DSAC Administrator authenticated: ${sicelo.name} (${sicelo.designation})`);
      this.notify();
      return { success: true };
    }

    const existing = this.registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!existing) {
      return { 
        success: false, 
        message: 'No official credentials found for this email address. Please verify your address or register an official account.' 
      };
    }

    if (password !== undefined) {
      const userPassword = existing.password || 'Password123!';
      if (password.trim() !== userPassword) {
        return {
          success: false,
          message: 'Invalid official password entered. Please enter your correct security password.'
        };
      }
    }

    this.currentUser = existing;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    this.addAuditLog('USER_LOGIN', `Official user authenticated: ${existing.name} (${existing.designation})`);
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
    const exists = this.registeredUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { 
        success: false, 
        message: 'An official account with this government email already exists. Please sign in.' 
      };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: newUserData.name.trim(),
      email: cleanEmail,
      role: newUserData.role,
      designation: newUserData.designation.trim() || (newUserData.role === 'DSAC_ADMIN' ? 'Oversight Administrator' : 'Reporting Officer'),
      entityId: newUserData.entityId,
      entityName: newUserData.entityName,
      password: newUserData.password?.trim() || 'Password123!',
    };

    this.registeredUsers = [newUser, ...this.registeredUsers];
    this.currentUser = newUser;
    saveToStorage(STORAGE_KEYS.REGISTERED_USERS, this.registeredUsers);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    
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

  switchUserRole(role: UserRole): void {
    const user = this.registeredUsers.find(u => u.role === role) || this.registeredUsers[0];
    if (user) {
      this.currentUser = user;
      this.addAuditLog('USER_LOGIN', `Active session switched to ${user.name} (${user.designation})`);
      saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
      this.notify();
    }
  }

  setCurrentUser(user: User): void {
    this.currentUser = user;
    this.addAuditLog('USER_LOGIN', `User authenticated as ${user.name} (${user.role})`);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
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
  submitReport(reportId: string, items: ReportItem[], spentThisQuarterZAR: number): void {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return;

    const actor = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'Authorized Reporting Officer';

    report.submissionStatus = 'SUBMITTED';
    report.submittedAt = new Date().toISOString();
    report.submittedBy = actor;
    report.fundsSpentThisQuarterZAR = spentThisQuarterZAR;
    report.items = items;

    // Update entity reported expenditure
    const entity = this.entities.find(e => e.id === report.entityId);
    if (entity) {
      entity.reportedExpenditureZAR += spentThisQuarterZAR;
      // Re-evaluate risk
      this.recalculateEntityRisk(entity.id);
    }

    this.addAuditLog('REPORT_SUBMITTED', `Submitted ${report.quarter} Performance Report for ${report.entityName}. Expenditure claimed: R ${(spentThisQuarterZAR / 1_000_000).toFixed(2)}M.`, report.entityName);
    this.persistAll();
  }

  reviewReport(reportId: string, decision: 'APPROVE' | 'REQUEST_CORRECTION', notes: string): void {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return;

    const actorName = this.currentUser ? this.currentUser.name : 'DSAC Reviewer';
    const actorRole = this.currentUser ? this.currentUser.role : 'DSAC_ADMIN';
    const actorDesc = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'DSAC Oversight Reviewer';

    if (decision === 'APPROVE') {
      report.submissionStatus = 'APPROVED';
      report.reviewedAt = new Date().toISOString();
      report.reviewedBy = actorDesc;
      report.reviewNotes = notes;

      // Auto-lift statutory non-submission hold and issue clearance certificate
      const entity = this.entities.find(e => e.id === report.entityId);
      if (entity) {
        entity.overdueReportsCount = Math.max(0, (entity.overdueReportsCount || 1) - 1);
        if (entity.overdueReportsCount === 0) {
          entity.trancheStatus = 'RELEASED';
          entity.statutoryDefaultStage = 0;
          entity.statutoryDefaultReason = undefined;
          entity.statutoryDefaultNoticeDate = undefined;
        }
      }

      this.addAuditLog('REPORT_APPROVED', `Approved ${report.quarter} Report for ${report.entityName}. Statutory Tranche Clearance issued. Decision notes: ${notes}`, report.entityName);
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
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return;

    const actor = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'Ministerial Oversight Directorate';
    entity.trancheStatus = 'WITHHELD';
    entity.statutoryDefaultStage = 2; // PFMA Sec 38(1)(j) Tranche Freeze
    entity.statutoryDefaultNoticeDate = new Date().toISOString();
    entity.statutoryDefaultReason = reason;
    entity.riskLevel = 'CRITICAL';
    entity.riskScore = Math.max(entity.riskScore, 88);

    // Create high-priority corrective task
    const task: CorrectiveTask = {
      id: `task-sec38-${Date.now()}`,
      entityId: entity.id,
      entityName: entity.name,
      title: `PFMA Sec 38(1)(j) Grant Suspension: Cure Statutory Non-Submission`,
      description: `Formal ministerial withholding enforced on Vote 40 operational subsidy. Reason: "${reason}". Submit outstanding statutory returns and certified PoE to restore disbursement eligibility.`,
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
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return;

    entity.trancheStatus = 'RELEASED';
    entity.statutoryDefaultStage = 0;
    entity.statutoryDefaultReason = undefined;
    entity.statutoryDefaultNoticeDate = undefined;
    entity.riskLevel = entity.riskScore > 65 ? 'HIGH' : entity.riskScore > 40 ? 'MEDIUM' : 'LOW';

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

    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    entity.extensionGrantedUntil = expiryDate;
    entity.extensionRequestedReason = motive;
    entity.trancheStatus = 'CONDITIONAL_HOLD';

    this.addAuditLog(
      'EXTENSION_REQUESTED',
      `Statutory compliance extension granted for ${days} days until ${expiryDate.split('T')[0]}. Motive: "${motive}".`,
      entity.name
    );
    this.persistAll();
  }

  issueStatutoryNotice(entityId: string, stage: 1 | 2 | 3 | 4, reason: string): void {
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
  updateKPIValue(
    kpiId: string, 
    actualValue: number, 
    reason?: string,
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    correctiveAction?: string
  ): void {
    const kpi = this.kpis.find(k => k.id === kpiId);
    if (!kpi) return;

    if (quarter === 'Q1') {
      kpi.q1Actual = actualValue;
    } else if (quarter === 'Q2') {
      kpi.q2Actual = actualValue;
    } else if (quarter === 'Q3') {
      kpi.q3Actual = actualValue;
    } else if (quarter === 'Q4') {
      kpi.q4Actual = actualValue;
    }

    // Cumulative actual: sum of recorded quarter actuals, or fallback to actualValue
    const quarterSum = (kpi.q1Actual || 0) + (kpi.q2Actual || 0) + (kpi.q3Actual || 0) + (kpi.q4Actual || 0);
    kpi.currentValue = quarterSum > 0 ? quarterSum : actualValue;
    kpi.percentageAchieved = kpi.annualTarget > 0 
      ? Math.min(100, Math.round((kpi.currentValue / kpi.annualTarget) * 1000) / 10)
      : 100;
    
    // Status evaluation
    if (kpi.currentValue >= kpi.annualTarget) {
      kpi.status = 'COMPLETED';
    } else if (kpi.currentValue >= kpi.expectedValue * 0.9) {
      kpi.status = 'ON_TRACK';
    } else if (kpi.currentValue >= kpi.expectedValue * 0.7) {
      kpi.status = 'AT_RISK';
    } else {
      kpi.status = 'MISSED';
    }

    // Synchronize to quarterly reports if report item exists
    this.reports.forEach(r => {
      if (r.entityId === kpi.entityId && (!quarter || r.quarter === quarter)) {
        const item = r.items.find(it => it.kpiId === kpi.id);
        if (item) {
          item.actualAchieved = actualValue;
          item.status = kpi.status;
          item.variancePercentage = item.targetToDate > 0 
            ? Math.round(((actualValue - item.targetToDate) / item.targetToDate) * 100)
            : 0;
          if (reason) item.varianceReason = reason;
          if (correctiveAction) item.correctiveAction = correctiveAction;
        }
      }
    });

    this.recalculateEntityRisk(kpi.entityId);
    this.addAuditLog('REPORT_CREATED', `Updated KPI "${kpi.name}" (${quarter || 'Actual'}) to ${actualValue} ${kpi.unitOfMeasure} (${kpi.percentageAchieved}% achieved). ${reason ? `Reason: ${reason}` : ''}`, kpi.entityName);
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
    const finYear = data.financialYear || '2025/26';
    const totalActual = data.lines.reduce((sum, l) => sum + (l.quarterlyActual || 0), 0);

    const submission = this.submitQuarterlyFinancialReturn({
      entityId: data.entityId,
      entityName: data.entityName,
      financialYear: finYear,
      quarter: data.quarter,
      totalQuarterlyActual: totalActual,
      accountingOfficerAffirmation: data.accountingOfficerAffirmation ?? true,
      accountingOfficerName: data.accountingOfficerName || this.currentUser?.name,
      lines: data.lines.map(l => ({
        categoryId: l.categoryId,
        categoryName: l.categoryName,
        actualAmount: l.quarterlyActual,
        plannedAmount: Math.round((l.annualBudget || 0) * 0.25),
      })),
    });

    return submission;
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
    downloadUrl?: string
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
    this.createTask({
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
    initialSummary: string
  ): EntityDocument {
    return this.createNewDocument(
      entityId, 
      title, 
      category, 
      '2026/27', 
      fileName, 
      2.4 * 1024 * 1024, 
      initialSummary
    );
  }

  downloadDocument(docId: string): void {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return;
    const content = `Republic of South Africa - Department of Sport, Arts and Culture\nStatutory Document: ${doc.title}\nInstitution: ${doc.entityName}\nClassification: ${doc.category}\nVersion: ${doc.currentVersion}\nFile: ${doc.fileName}\nVerification Status: ${doc.approvalStatus}\nUploaded: ${doc.uploadedAt}\nUploaded By: ${doc.uploadedBy}\nSummary: ${doc.verificationSummary}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName || `${doc.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  verifyDocument(docId: string, decision: 'APPROVED' | 'REQUIRES_AMENDMENT', notes?: string): void {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return;

    const reviewer = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'DSAC National Oversight Reviewer';
    doc.approvalStatus = decision;
    if (decision === 'APPROVED') {
      doc.approvedAt = new Date().toISOString();
      doc.approvedBy = reviewer;
      
      // Also mark linked reports as approved
      const linkedReports = this.reports.filter(r => r.portfolioOfEvidenceDocId === docId || (r.entityId === doc.entityId && r.submissionStatus === 'SUBMITTED'));
      linkedReports.forEach(r => {
        r.submissionStatus = 'APPROVED';
        r.reviewedAt = new Date().toISOString();
        r.reviewedBy = reviewer;
        r.reviewedByName = reviewer;
      });

      // Boost entity compliance score upon statutory evidence verification
      const ent = this.entities.find(e => e.id === doc.entityId);
      if (ent) {
        ent.overallComplianceScore = Math.min(100, ent.overallComplianceScore + 2);
        this.recalculateEntityRisk(ent.id);
      }
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
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q3', 
    financialYear = '2025/2026'
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

        const periodMatches = (!d.quarter || d.quarter === quarter) && (!d.financialYear || d.financialYear === financialYear);
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
  }): Promise<{ document: EntityDocument; result: DocumentVerificationResult }> {
    const entity = this.entities.find(e => e.id === params.entityId);
    const requirement = this.documentRequirements.find(r => r.id === params.requirementId);
    if (!requirement) {
      throw new Error(`Document requirement ${params.requirementId} not found.`);
    }

    const uploader = params.uploaderName || (this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'Authorized Submitting Officer');
    const quarter = params.quarter || 'Q3';
    const financialYear = params.financialYear || '2025/2026';

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
      this.createTask({
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

    this.createTask({
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
    
    let report = this.reports.find(r => r.entityId === params.entityId && r.quarter === params.quarter);
    if (!report) {
      report = {
        id: `rep-${params.quarter.toLowerCase()}-${Date.now()}`,
        entityId: params.entityId,
        entityName: entity ? entity.name : 'Institutional Entity',
        quarter: params.quarter,
        financialYear: params.financialYear,
        submissionStatus: 'SUBMITTED',
        dueDate: '2025-10-31',
        submittedAt: new Date().toISOString(),
        submittedBy: actor,
        submittedByName: actor,
        fundsSpentThisQuarterZAR: params.expenditureClaimedZAR,
        totalFundsReceivedToDateZAR: entity?.transferredAmountZAR || 3500000,
        items: params.items || [],
        portfolioOfEvidenceDocId: params.poeDocId,
        varianceExplanations: params.declarationNotes,
        accountingOfficerDeclaration: true,
      };
      this.reports = [report, ...this.reports];
    } else {
      report.submissionStatus = 'SUBMITTED';
      report.submittedAt = new Date().toISOString();
      report.submittedBy = actor;
      report.submittedByName = actor;
      report.fundsSpentThisQuarterZAR = params.expenditureClaimedZAR;
      if (params.items && params.items.length > 0) report.items = params.items;
      if (params.poeDocId) report.portfolioOfEvidenceDocId = params.poeDocId;
      report.varianceExplanations = params.declarationNotes;
    }

    if (entity) {
      entity.reportedExpenditureZAR = (entity.reportedExpenditureZAR || 0) + params.expenditureClaimedZAR;
      if (entity.overdueReportsCount > 0) entity.overdueReportsCount = Math.max(0, entity.overdueReportsCount - 1);
      this.recalculateEntityRisk(entity.id);
    }

    this.createTask({
      entityId: params.entityId,
      entityName: entity ? entity.name : 'Institutional Entity',
      title: `Verify ${params.quarter} Performance Report: ${entity?.shortCode || entity?.name}`,
      description: `Formal quarterly report submitted with claimed expenditure of R ${(params.expenditureClaimedZAR / 1_000_000).toFixed(2)}M. Inspect Portfolio of Evidence and verify achievements.`,
      assignedToName: 'DSAC Oversight Directorate',
      priority: 'HIGH',
      status: 'OPEN',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      direction: 'ENTITY_TO_DSAC',
    });

    this.addAuditLog(
      'REPORT_SUBMITTED',
      `Submitted ${params.quarter} Performance Report for ${entity?.name}. Claimed expenditure: R ${(params.expenditureClaimedZAR / 1_000_000).toFixed(2)}M.`,
      entity?.name
    );
    this.persistAll();
    return report;
  }

  addDocumentComment(docId: string, message: string): void {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return;

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
  createTask(task: Omit<CorrectiveTask, 'id' | 'createdAt' | 'createdByName' | 'createdByRole'>): void {
    const newTask: CorrectiveTask = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdByName: this.currentUser ? this.currentUser.name : 'DSAC Administrator',
      createdByRole: this.currentUser ? this.currentUser.role : 'DSAC_ADMIN',
    };

    this.tasks = [newTask, ...this.tasks];
    this.addAuditLog('TASK_CREATED', `Created Corrective Task "${newTask.title}" assigned to ${newTask.assignedToName} (Priority: ${newTask.priority})`, newTask.entityName);
    this.persistAll();
  }

  resolveTask(taskId: string, resolutionNotes: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'COMPLETED';
    task.completedAt = new Date().toISOString();
    task.resolutionNotes = resolutionNotes;

    this.addAuditLog('TASK_RESOLVED', `Resolved Corrective Task "${task.title}". Notes: ${resolutionNotes}`, task.entityName);
    this.persistAll();
  }

  updateTaskStatus(taskId: string, status: CorrectiveTask['status']): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.status = status;
    this.notify();
    saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
  }

  // --- DETERMINISTIC EARLY WARNING ENGINE ---
  recalculateEntityRisk(entityId: string): void {
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return;

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
    const fundingUtilisationRate = (entity.reportedExpenditureZAR / Math.max(1, entity.transferredAmountZAR));
    const varianceGap = Math.max(0, fundingUtilisationRate - avgAchievementRatio);

    // 3. Overdue reports and non-compliance
    const overdueCount = entityReports.filter(r => r.submissionStatus === 'OVERDUE').length;
    const correctionCount = entityReports.filter(r => r.submissionStatus === 'CORRECTION_REQUIRED').length;
    entity.overdueReportsCount = overdueCount;

    // 4. AGSA Audit Outcome Penalty
    let auditScoreDeduction = 0;
    if (entity.auditOutcome === 'DISCLAIMER') auditScoreDeduction = 40;
    else if (entity.auditOutcome === 'QUALIFIED') auditScoreDeduction = 25;
    else if (entity.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS') auditScoreDeduction = 15;

    // 5. Unresolved statutory tasks penalty
    const openTaskPenalty = Math.min(15, entityTasks.length * 5);

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

    const fundingUtilisationRate = (entity.reportedExpenditureZAR / Math.max(1, entity.transferredAmountZAR));
    const varianceGap = Math.max(0, fundingUtilisationRate - avgAchievementRatio);
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
  getPerformancePulse() {
    const totalEntities = this.entities.length;
    const publicEntitiesCount = this.entities.filter(e => e.type === 'PUBLIC_ENTITY').length;
    const nposCount = this.entities.filter(e => e.type === 'NPO').length;

    const onTrackCount = this.entities.filter(e => e.riskLevel === 'LOW').length;
    const monitoringCount = this.entities.filter(e => e.riskLevel === 'MEDIUM').length;
    const highRiskCount = this.entities.filter(e => e.riskLevel === 'HIGH').length;
    const criticalRiskCount = this.entities.filter(e => e.riskLevel === 'CRITICAL').length;
    const interventionCount = highRiskCount + criticalRiskCount;

    const totalAllocation = this.entities.reduce((acc, e) => acc + (e.budgetAllocationZAR || 0), 0);
    const totalTransferred = this.entities.reduce((acc, e) => acc + (e.transferredAmountZAR || 0), 0);
    const totalExpended = this.entities.reduce((acc, e) => acc + (e.reportedExpenditureZAR || 0), 0);
    const remainingDisbursement = Math.max(0, totalAllocation - totalTransferred);

    const transferRate = totalAllocation > 0 ? (totalTransferred / totalAllocation) * 100 : 0;
    const expenditureRate = totalTransferred > 0 ? (totalExpended / totalTransferred) * 100 : 0;
    const burnRate = totalAllocation > 0 ? (totalExpended / totalAllocation) * 100 : 0;

    const totalYouthJobs = this.entities.reduce((acc, e) => acc + (e.jobStats?.youthJobsCreated || 0), 0);
    const totalPermanentJobs = this.entities.reduce((acc, e) => acc + (e.jobStats?.permanentJobs || 0), 0);
    const totalCreativePractitioners = this.entities.reduce((acc, e) => acc + (e.jobStats?.creativeSectorPractitionersSupported || 0), 0);

    const cleanAuditCount = this.entities.filter(e => e.auditOutcome === 'CLEAN_AUDIT').length;
    const cleanAuditRate = totalEntities > 0 ? Math.round((cleanAuditCount / totalEntities) * 1000) / 10 : 0;
    const averageCompliance = Math.round(this.entities.reduce((acc, e) => acc + e.overallComplianceScore, 0) / Math.max(1, totalEntities));

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

    // Reports calculations
    const totalReports = this.reports.length;
    const reportsApprovedCount = this.reports.filter(r => r.submissionStatus === 'APPROVED').length;
    const reportsSubmittedCount = this.reports.filter(r => r.submissionStatus === 'SUBMITTED' || r.submissionStatus === 'RESUBMITTED').length;
    const reportsUnderReviewCount = this.reports.filter(r => r.submissionStatus === 'UNDER_REVIEW').length;
    const reportsCorrectionRequiredCount = this.reports.filter(r => r.submissionStatus === 'CORRECTION_REQUIRED').length;
    const overdueReportsCount = this.reports.filter(r => r.submissionStatus === 'OVERDUE').length;
    const pendingReviewCount = reportsSubmittedCount + reportsUnderReviewCount;

    // Active Q3 submission stats across all 32 entities
    const q3Reports = this.reports.filter(r => r.quarter === 'Q3');
    const q3SubmittedOrApproved = q3Reports.filter(r => r.submissionStatus === 'APPROVED' || r.submissionStatus === 'SUBMITTED' || r.submissionStatus === 'UNDER_REVIEW' || r.submissionStatus === 'RESUBMITTED');
    const q3SubmittedCount = q3SubmittedOrApproved.length;
    const q3OutstandingCount = Math.max(0, totalEntities - q3SubmittedCount);

    const openTasksCount = this.tasks.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'OVERDUE').length;

    // KPI aggregations
    const totalKpis = this.kpis.length;
    const kpisOnTrack = this.kpis.filter(k => k.status === 'ON_TRACK' || k.status === 'COMPLETED').length;
    const kpisAtRisk = this.kpis.filter(k => k.status === 'AT_RISK').length;
    const kpisMissed = this.kpis.filter(k => k.status === 'MISSED').length;
    const averageKpiAchievement = totalKpis > 0 ? Math.round((this.kpis.reduce((acc, k) => acc + k.percentageAchieved, 0) / totalKpis) * 10) / 10 : 0;

    return {
      totalEntities,
      publicEntitiesCount,
      nposCount,
      onTrackCount,
      monitoringCount,
      highRiskCount,
      criticalRiskCount,
      interventionCount,
      highRiskEntitiesCount: interventionCount,
      totalAllocation,
      totalTransferred,
      totalExpended,
      remainingDisbursement,
      transferRate,
      expenditureRate,
      burnRate,
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
      q3SubmittedCount,
      q3OutstandingCount,
      reportsSubmittedCount: q3SubmittedCount,
      reportsOutstandingCount: q3OutstandingCount,
      openTasksCount,
      totalKpis,
      kpisOnTrack,
      kpisAtRisk,
      kpisMissed,
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

    // Check if entity exists or create new
    let entity = this.entities.find(e => e.name.toLowerCase() === params.entityName.trim().toLowerCase());
    if (!entity) {
      const entityId = `ent-${params.entityName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}-${Date.now().toString().slice(-4)}`;
      const shortCode = params.entityName
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 5) || 'NPO';

      const newEntity: PublicEntity = {
        id: entityId,
        name: params.entityName.trim(),
        shortCode,
        type: params.entityType,
        cluster: params.cluster,
        budgetAllocationZAR: params.allocatedBudgetZAR || 5_000_000,
        transferredAmountZAR: (params.allocatedBudgetZAR || 5_000_000) * 0.5,
        reportedExpenditureZAR: (params.allocatedBudgetZAR || 5_000_000) * 0.35,
        auditOutcome: 'CLEAN_AUDIT',
        auditYear: '2024/25',
        overallComplianceScore: 88,
        riskLevel: 'LOW',
        riskScore: 18,
        activeDeadlinesCount: 2,
        overdueReportsCount: 0,
        headOfEntity: params.accountingOfficer.trim(),
        contactEmail: cleanEmail,
        reportingOfficerName: params.accountingOfficer.trim(),
        demographics: {
          african: 80,
          coloured: 10,
          indian: 5,
          white: 5,
          female: 60,
          male: 40,
          youth: 45,
          personsWithDisabilities: 4,
          totalStaff: 28,
        },
        jobStats: {
          permanentJobs: 14,
          temporaryJobs: 32,
          youthJobsCreated: 24,
          creativeSectorPractitionersSupported: 65,
          targetJobsAnnual: 50,
        },
      };

      this.entities = [newEntity, ...this.entities];
      entity = newEntity;
      saveToStorage(STORAGE_KEYS.ENTITIES, this.entities);
    }

    // Create User
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: params.accountingOfficer.trim(),
      email: cleanEmail,
      role: 'ENTITY_OFFICER',
      designation: params.designation?.trim() || 'Organisation Administrator',
      entityId: entity.id,
      entityName: entity.name,
      password: params.password?.trim() || 'Password123!',
    };

    this.registeredUsers = [newUser, ...this.registeredUsers];
    this.currentUser = newUser;
    saveToStorage(STORAGE_KEYS.REGISTERED_USERS, this.registeredUsers);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);

    this.addAuditLog(
      'USER_REGISTRATION',
      `New Entity registered: ${entity.name} (${entity.type}) by ${newUser.name} (${newUser.email})`,
      entity.name
    );
    this.notify();
    return { success: true, entity, user: newUser };
  }

  // ==========================================
  // BUDGET & FINANCIAL UTILISATION ENGINE
  // ==========================================

  getExpenseCategories(): ExpenseCategory[] {
    return [...this.expenseCategories].sort((a, b) => a.standardSortOrder - b.standardSortOrder);
  }

  createExpenseCategory(name: string, code: string, description: string): ExpenseCategory {
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

  getBudgetProfileForEntity(entityId: string, financialYear = '2026/27'): EntityBudgetProfile | undefined {
    return this.budgetProfiles.find(
      bp => bp.entityId === entityId && bp.financialYear === financialYear
    );
  }

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
    const existingIndex = this.budgetProfiles.findIndex(
      bp => bp.entityId === data.entityId && bp.financialYear === data.financialYear
    );

    const profileId = existingIndex !== -1 
      ? this.budgetProfiles[existingIndex].id 
      : `bp-${Date.now()}`;

    const newLines = data.lines.map((l, i) => ({
      id: `bl-${profileId}-${i + 1}`,
      budgetId: profileId,
      categoryId: l.categoryId,
      categoryName: l.categoryName,
      requestedAmount: l.requestedAmount,
      annualBudget: 0,
      notes: l.notes,
    }));

    const newProfile: EntityBudgetProfile = {
      id: profileId,
      entityId: data.entityId,
      entityName: data.entityName,
      financialYear: data.financialYear,
      requestedAmount: data.requestedAmount,
      approvedAmount: 0,
      fundingGap: data.requestedAmount,
      status: 'SUBMITTED',
      requestDate: new Date().toISOString().split('T')[0],
      justification: data.justification,
      supportingDocumentId: data.supportingDocumentId,
      supportingDocumentName: data.supportingDocumentName,
      expectedSpendingTrajectory: {
        q1Percent: 25,
        q2Percent: 50,
        q3Percent: 75,
        q4Percent: 100,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: newLines,
    };

    if (existingIndex !== -1) {
      this.budgetProfiles[existingIndex] = newProfile;
    } else {
      this.budgetProfiles = [newProfile, ...this.budgetProfiles];
    }

    this.addAuditLog(
      'BUDGET_REQUEST_CREATED',
      `Budget request of ${formatZAR(data.requestedAmount)} logged for ${data.entityName} (${data.financialYear}). Justification: ${data.justification.slice(0, 80)}...`,
      data.entityName
    );

    this.persistAll();
    return newProfile;
  }

  reviewBudgetRequest(
    profileId: string,
    approvedAmount: number,
    status: BudgetRequestStatus,
    comments?: string,
    lineApprovals?: { categoryId: string; annualBudget: number }[]
  ): void {
    const profile = this.budgetProfiles.find(bp => bp.id === profileId);
    if (!profile) return;

    const reviewer = this.currentUser ? this.currentUser.name : 'DSAC National Reviewer';

    profile.status = status;
    profile.reviewedBy = this.currentUser?.id;
    profile.reviewedByName = reviewer;
    profile.reviewDate = new Date().toISOString().split('T')[0];
    profile.comments = comments;
    profile.updatedAt = new Date().toISOString();

    if (status === 'APPROVED') {
      profile.approvedAmount = approvedAmount;
      profile.fundingGap = profile.requestedAmount - approvedAmount;
      profile.approvalDate = new Date().toISOString().split('T')[0];

      // Update line amounts if provided, or distribute proportionally
      if (lineApprovals && lineApprovals.length > 0) {
        profile.lines = profile.lines.map(line => {
          const match = lineApprovals.find(la => la.categoryId === line.categoryId);
          return {
            ...line,
            annualBudget: match ? match.annualBudget : line.annualBudget,
          };
        });
      } else if (profile.lines.length > 0 && profile.requestedAmount > 0) {
        const ratio = approvedAmount / profile.requestedAmount;
        profile.lines = profile.lines.map(line => ({
          ...line,
          annualBudget: line.requestedAmount * ratio,
        }));
      }

      // Synchronize entity budgetAllocationZAR
      const entity = this.entities.find(e => e.id === profile.entityId);
      if (entity) {
        entity.budgetAllocationZAR = approvedAmount;
      }

      this.addAuditLog(
        'BUDGET_APPROVED',
        `Approved Annual Budget of ${formatZAR(approvedAmount)} (Funding gap: ${formatZAR(profile.fundingGap)}) for ${profile.entityName} (${profile.financialYear}). Decision notes: ${comments || 'Approved by DSAC CFO'}`,
        profile.entityName
      );
    } else {
      this.addAuditLog(
        'BUDGET_UPDATED',
        `Budget Request ${status} for ${profile.entityName}. Reason: ${comments || 'Awaiting revisions'}`,
        profile.entityName
      );
    }

    this.persistAll();
  }

  uploadTreasuryAllocations(
    allocations: { entityId?: string; shortCode?: string; amount: number }[],
    financialYear: string,
    sourceFileName: string
  ): { updatedCount: number; totalZAR: number } {
    let updatedCount = 0;
    let totalZAR = 0;

    allocations.forEach(alloc => {
      const entity = this.entities.find(e => 
        (alloc.entityId && e.id === alloc.entityId) ||
        (alloc.shortCode && e.shortCode.toLowerCase() === alloc.shortCode.toLowerCase())
      );

      if (entity && alloc.amount > 0) {
        entity.budgetAllocationZAR = alloc.amount;
        
        // Also synchronize existing budgetProfile for this year if exists
        const profile = this.budgetProfiles.find(p => p.entityId === entity.id && p.financialYear === financialYear);
        if (profile) {
          profile.approvedAmount = alloc.amount;
          profile.status = 'APPROVED';
          profile.fundingGap = Math.max(0, profile.requestedAmount - alloc.amount);
        }

        updatedCount++;
        totalZAR += alloc.amount;
      }
    });

    this.addAuditLog(
      'BUDGET_APPROVED',
      `Imported National Treasury Vote 37 budget allocations from "${sourceFileName}" for FY ${financialYear}. ${updatedCount} institutions updated totaling ${formatZAR(totalZAR)}.`,
      'National Treasury Import'
    );

    this.persistAll();
    return { updatedCount, totalZAR };
  }

  getQuarterlyFinancialSubmissions(): QuarterlyFinancialSubmission[] {
    return this.quarterlyFinancialSubmissions;
  }

  getQuarterlyFinancialSubmissionsForEntity(
    entityId: string,
    financialYear = '2026/27'
  ): QuarterlyFinancialSubmission[] {
    return this.quarterlyFinancialSubmissions.filter(
      qs => qs.entityId === entityId && qs.financialYear === financialYear
    );
  }

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
    const existingIndex = this.quarterlyFinancialSubmissions.findIndex(
      qs => qs.entityId === data.entityId &&
            qs.financialYear === data.financialYear &&
            qs.quarter === data.quarter
    );

    const submissionId = existingIndex !== -1 
      ? this.quarterlyFinancialSubmissions[existingIndex].id 
      : `qs-${Date.now()}`;

    const newLines = data.lines.map((l, i) => ({
      id: `qsl-${submissionId}-${i + 1}`,
      quarterlySubmissionId: submissionId,
      budgetLineId: l.budgetLineId,
      categoryId: l.categoryId,
      categoryName: l.categoryName,
      actualAmount: l.actualAmount,
      plannedAmount: l.plannedAmount,
    }));

    const newSubmission: QuarterlyFinancialSubmission = {
      id: submissionId,
      entityId: data.entityId,
      entityName: data.entityName,
      financialYear: data.financialYear,
      quarter: data.quarter,
      status: 'APPROVED', // Default to authoritative approval upon certified sign-off or SUBMITTED
      submittedAt: new Date().toISOString(),
      submittedByName: data.accountingOfficerName || this.currentUser?.name || 'Reporting Officer',
      totalQuarterlyActual: data.totalQuarterlyActual,
      supportingDocumentIds: data.supportingDocumentIds || [],
      accountingOfficerAffirmation: data.accountingOfficerAffirmation,
      accountingOfficerName: data.accountingOfficerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines: newLines,
    };

    if (existingIndex !== -1) {
      this.quarterlyFinancialSubmissions[existingIndex] = newSubmission;
    } else {
      this.quarterlyFinancialSubmissions = [newSubmission, ...this.quarterlyFinancialSubmissions];
    }

    // Update entity reported expenditure
    const entity = this.entities.find(e => e.id === data.entityId);
    if (entity) {
      const allSubmissions = this.quarterlyFinancialSubmissions.filter(
        qs => qs.entityId === data.entityId && qs.financialYear === data.financialYear
      );
      entity.reportedExpenditureZAR = allSubmissions.reduce(
        (acc, s) => acc + s.totalQuarterlyActual, 0
      );
    }

    // Synchronize transactions with unrounded precision
    this.financialTransactions = this.financialTransactions.filter(
      tx => tx.id !== `tx-exp-${submissionId}` && !tx.id.startsWith(`tx-exp-${submissionId}-`)
    );

    if (newLines.length > 0) {
      newLines.forEach((line, idx) => {
        this.financialTransactions.push({
          id: `tx-exp-${submissionId}-${idx + 1}`,
          entityId: data.entityId,
          entityName: data.entityName,
          financialYear: data.financialYear,
          quarter: data.quarter,
          type: 'EXPENDITURE',
          amount: line.actualAmount,
          transactionDate: new Date().toISOString().slice(0, 10),
          referenceNumber: `GL-EXP-${data.financialYear.replace('/', '')}-${data.quarter}-${(entity?.shortCode || 'ENT')}-${idx + 1}`,
          description: `${line.categoryName || 'Operating Expenditure'} (Quarterly Return)`,
          categoryId: line.categoryId,
          categoryName: line.categoryName,
          status: 'VERIFIED',
          verifiedBy: data.accountingOfficerName || this.currentUser?.name || 'Reporting Officer',
          createdAt: new Date().toISOString(),
        });
      });
    } else {
      this.financialTransactions.push({
        id: `tx-exp-${submissionId}`,
        entityId: data.entityId,
        entityName: data.entityName,
        financialYear: data.financialYear,
        quarter: data.quarter,
        type: 'EXPENDITURE',
        amount: data.totalQuarterlyActual,
        transactionDate: new Date().toISOString().slice(0, 10),
        referenceNumber: `GL-EXP-${data.financialYear.replace('/', '')}-${data.quarter}-${(entity?.shortCode || 'ENT')}`,
        description: 'Statutory Quarterly Operating Expenditure',
        status: 'VERIFIED',
        verifiedBy: data.accountingOfficerName || this.currentUser?.name || 'Reporting Officer',
        createdAt: new Date().toISOString(),
      });
    }

    this.addAuditLog(
      'QUARTERLY_EXPENDITURE_SUBMITTED',
      `Submitted ${data.quarter} verified actual expenditure of ${formatZAR(data.totalQuarterlyActual)} for ${data.entityName}. Affirmation certified by ${data.accountingOfficerName || 'Accounting Officer'}.`,
      data.entityName
    );

    // Re-evaluate risk rules for financial parameters
    this.recalculateFinancialRisks(data.entityId, data.financialYear);

    this.persistAll();
    return newSubmission;
  }

  reviewQuarterlyFinancialReturn(
    submissionId: string,
    decision: 'APPROVE' | 'REQUEST_CORRECTION',
    notes: string
  ): void {
    const submission = this.quarterlyFinancialSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    const reviewer = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'DSAC Oversight Reviewer';

    if (decision === 'APPROVE') {
      submission.status = 'APPROVED';
      submission.reviewedAt = new Date().toISOString();
      submission.reviewedByName = reviewer;
      submission.reviewNotes = notes;

      this.addAuditLog(
        'FINANCIAL_REPORT_APPROVED',
        `Approved ${submission.quarter} financial actual return of ${formatZAR(submission.totalQuarterlyActual)} for ${submission.entityName}. Verification note: ${notes}`,
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
        `Requested corrections for ${submission.quarter} expenditure return for ${submission.entityName}. Finding: ${notes}`,
        submission.entityName
      );
    }

    this.recalculateFinancialRisks(submission.entityId, submission.financialYear);
    this.persistAll();
  }

  getEntityFinancialSummary(
    entityId: string,
    financialYear = '2026/27',
    selectedQuarter: FinancialQuarter | 'FULL_YEAR' = 'Q3'
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
      this.financialTransactions
    );
  }

  getDepartmentFinancialKPIs(
    financialYear = '2026/27',
    selectedQuarter: FinancialQuarter | 'FULL_YEAR' = 'Q3'
  ): DepartmentFinancialKPIs {
    return calculateDepartmentFinancialKPIs(
      financialYear,
      selectedQuarter,
      this.budgetProfiles,
      this.quarterlyFinancialSubmissions,
      this.entities,
      this.expenseCategories,
      this.kpis,
      this.financialTransactions
    );
  }

  getEntityPerformanceSummary(
    entityId: string,
    financialYear = '2025/26',
    quarter: FinancialQuarter | 'FULL_YEAR' = 'FULL_YEAR'
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
    financialYear = '2025/26',
    quarter: FinancialQuarter | 'FULL_YEAR' = 'Q3',
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
    financialYear = '2025/26',
    quarter: FinancialQuarter | 'FULL_YEAR' = 'Q3',
    typeFilter: 'ALL' | 'PUBLIC_ENTITY' | 'NPO' = 'ALL'
  ): DepartmentFinancialAggregation {
    return calculateDepartmentFinancialAggregation(
      this.entities,
      this.budgetProfiles,
      this.quarterlyFinancialSubmissions,
      this.expenseCategories,
      this.kpis,
      financialYear,
      quarter,
      typeFilter,
      this.financialTransactions
    );
  }

  getFinancialTransactions(
    entityId?: string, 
    financialYear?: string, 
    quarter?: FinancialQuarter | 'FULL_YEAR'
  ): FinancialTransaction[] {
    let txs = this.financialTransactions;
    if (entityId) {
      txs = txs.filter(t => t.entityId === entityId);
    }
    if (financialYear) {
      txs = txs.filter(t => t.financialYear === financialYear);
    }
    if (quarter && (quarter as string) !== 'FULL_YEAR') {
      txs = txs.filter(t => t.quarter === quarter || (t.quarter as string) === 'FULL_YEAR');
    }
    return txs;
  }

  addFinancialTransaction(txData: Omit<FinancialTransaction, 'id' | 'createdAt'>): FinancialTransaction {
    const newTx: FinancialTransaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.financialTransactions = [newTx, ...this.financialTransactions];
    
    if (newTx.type === 'EXPENDITURE') {
      const ent = this.entities.find(e => e.id === newTx.entityId);
      if (ent) {
        const allExp = this.financialTransactions
          .filter(t => t.entityId === newTx.entityId && t.type === 'EXPENDITURE')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        ent.reportedExpenditureZAR = allExp;
      }
    } else if (newTx.type === 'TRANSFER') {
      const ent = this.entities.find(e => e.id === newTx.entityId);
      if (ent) {
        const allTrans = this.financialTransactions
          .filter(t => t.entityId === newTx.entityId && t.type === 'TRANSFER')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        ent.transferredAmountZAR = allTrans;
      }
    }

    this.addAuditLog(
      'FINANCIAL_RECORD_UPDATED',
      `Recorded ${newTx.type} transaction of ${formatZAR(newTx.amount)} (Ref: ${newTx.referenceNumber}).`,
      newTx.entityName
    );
    this.persistAll();
    return newTx;
  }

  recalculateFinancialRisks(entityId: string, financialYear = '2026/27'): void {
    const summary = this.getEntityFinancialSummary(entityId, financialYear, 'Q3');
    const entity = this.entities.find(e => e.id === entityId);
    if (!entity) return;

    // Filter existing financial risk alerts for this entity
    this.riskAlerts = this.riskAlerts.filter(
      r => !(r.entityId === entityId && (
        r.title.includes('Budget Overspend') ||
        r.title.includes('Rapid Utilisation') ||
        r.title.includes('Severe Under-Utilisation') ||
        r.title.includes('Financial & Delivery Disconnect')
      ))
    );

    // Rule 1: Overspending
    if (summary.isOverspent) {
      this.riskAlerts.unshift({
        id: `risk-fin-over-${Date.now()}`,
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
        evidenceData: {
          actualAchieved: summary.ytdActual,
          expectedTrajectory: summary.expectedYtd,
          annualTarget: summary.approvedAmount,
          financialUtilisationRate: summary.utilisationPercent,
          historicalLateReportsCount: 0,
          daysUntilDeadline: 14,
        },
        recommendedAction: 'Issue formal PFMA Section 38(1)(j) inquiry and require immediate financial reprioritisation recovery plan.',
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
      entity.riskLevel = 'CRITICAL';
      entity.riskScore = Math.max(entity.riskScore, 88);
    }
    // Rule 2: Rapid Utilisation / High Variance
    else if (summary.variancePercent > 18) {
      this.riskAlerts.unshift({
        id: `risk-fin-rapid-${Date.now()}`,
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
        evidenceData: {
          actualAchieved: summary.ytdActual,
          expectedTrajectory: summary.expectedYtd,
          annualTarget: summary.approvedAmount,
          financialUtilisationRate: summary.utilisationPercent,
          historicalLateReportsCount: 0,
          daysUntilDeadline: 21,
        },
        recommendedAction: 'Audit Q3/Q4 cash-flow run rate to ensure allocations will sustain operations through financial year-end.',
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
      if (entity.riskLevel === 'LOW') entity.riskLevel = 'MEDIUM';
    }
    // Rule 3: Severe Under-utilisation
    else if (summary.financialStatus === 'UNDER_UTILISING') {
      this.riskAlerts.unshift({
        id: `risk-fin-under-${Date.now()}`,
        entityId,
        entityName: entity.name,
        riskLevel: 'MEDIUM',
        riskScore: 56,
        title: `Under-Utilisation Warning: ${summary.utilisationPercent}% Absorbed`,
        reason: `Low financial expenditure rate (${summary.variancePercent}% variance against trajectory). Potential procurement halts or programme delays in key sub-programmes.`,
        contributingFactors: [
          `Utilisation: ${summary.utilisationPercent}%`,
          `Variance: ${summary.variancePercent}% against trajectory`,
          'Capital procurement delays or unfilled vacancies'
        ],
        evidenceData: {
          actualAchieved: summary.ytdActual,
          expectedTrajectory: summary.expectedYtd,
          annualTarget: summary.approvedAmount,
          financialUtilisationRate: summary.utilisationPercent,
          historicalLateReportsCount: 0,
          daysUntilDeadline: 30,
        },
        recommendedAction: 'Request quarterly procurement acceleration plan and audit pipeline commitments.',
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    }

    // Rule 4: Performance vs Finance Disconnect (Section 23)
    if (summary.performanceFinanceSignal?.status === 'REQUIRES_REVIEW') {
      this.riskAlerts.unshift({
        id: `risk-fin-perf-${Date.now()}`,
        entityId,
        entityName: entity.name,
        riskLevel: 'HIGH',
        riskScore: 78,
        title: `Financial & Delivery Disconnect: High Spend vs Low Output`,
        reason: summary.performanceFinanceSignal.commentary,
        contributingFactors: [
          `Financial utilisation: ${summary.utilisationPercent}%`,
          `Target achievement rate: ${summary.targetAchievementRate || 0}%`,
          'Asymmetry between resource drawdown and verifiable service delivery'
        ],
        evidenceData: {
          actualAchieved: summary.targetAchievementRate || 0,
          expectedTrajectory: 75,
          annualTarget: 100,
          financialUtilisationRate: summary.utilisationPercent,
          historicalLateReportsCount: 0,
          daysUntilDeadline: 14,
        },
        recommendedAction: 'Schedule joint governance review between DSAC Finance Directorate and Programme Performance Monitoring unit.',
        createdAt: new Date().toISOString(),
        acknowledged: false,
      });
    }
  }
}

export const store = GovTrackStore.getInstance();
