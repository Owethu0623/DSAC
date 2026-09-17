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
  EntityCluster
} from '../types';
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

const STORAGE_KEYS = {
  CURRENT_USER: 'govtrack_current_user',
  REGISTERED_USERS: 'govtrack_registered_users',
  ENTITIES: 'govtrack_entities',
  KPIS: 'govtrack_kpis',
  REPORTS: 'govtrack_reports',
  DOCUMENTS: 'govtrack_documents',
  TASKS: 'govtrack_tasks',
  RISKS: 'govtrack_risks',
  DEADLINES: 'govtrack_deadlines',
  AUDIT_LOGS: 'govtrack_audit_logs',
};

// Safe JSON parse from localStorage with fallback
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
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
  tasks: CorrectiveTask[];
  riskAlerts: RiskAlert[];
  deadlines: RegulatoryDeadline[];
  auditLogs: AuditLogEntry[];

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
    this.entities = loadedEntities;
    saveToStorage(STORAGE_KEYS.ENTITIES, this.entities);
    this.kpis = loadFromStorage<KPIRecord[]>(STORAGE_KEYS.KPIS, INITIAL_KPIS);
    this.reports = loadFromStorage<QuarterlyReport[]>(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
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
    this.tasks = loadFromStorage<CorrectiveTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    this.riskAlerts = loadFromStorage<RiskAlert[]>(STORAGE_KEYS.RISKS, INITIAL_RISK_ALERTS);
    this.deadlines = loadFromStorage<RegulatoryDeadline[]>(STORAGE_KEYS.DEADLINES, INITIAL_DEADLINES);
    this.auditLogs = loadFromStorage<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
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
    saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    saveToStorage(STORAGE_KEYS.RISKS, this.riskAlerts);
    saveToStorage(STORAGE_KEYS.DEADLINES, this.deadlines);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
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
      this.addAuditLog('REPORT_APPROVED', `Approved ${report.quarter} Report for ${report.entityName}. Decision notes: ${notes}`, report.entityName);
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

  // --- KPI PROGRESS UPDATE ---
  updateKPIValue(kpiId: string, actualValue: number, reason?: string): void {
    const kpi = this.kpis.find(k => k.id === kpiId);
    if (!kpi) return;

    kpi.currentValue = actualValue;
    kpi.percentageAchieved = Math.min(100, Math.round((actualValue / kpi.annualTarget) * 1000) / 10);
    
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

    this.recalculateEntityRisk(kpi.entityId);
    this.addAuditLog('REPORT_CREATED', `Updated KPI "${kpi.name}" actual to ${actualValue} ${kpi.unitOfMeasure} (${kpi.percentageAchieved}% of annual target). ${reason ? `Reason: ${reason}` : ''}`, kpi.entityName);
    this.persistAll();
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

    // Factors:
    // 1. Trajectory delay: average % achieved vs expected
    let avgAchievementRatio = 1.0;
    if (entityKPIs.length > 0) {
      const sum = entityKPIs.reduce((acc, k) => acc + (k.currentValue / Math.max(1, k.expectedValue)), 0);
      avgAchievementRatio = sum / entityKPIs.length;
    }

    // 2. Financial vs Output Variance
    const fundingUtilisationRate = (entity.reportedExpenditureZAR / Math.max(1, entity.transferredAmountZAR));
    const varianceGap = Math.max(0, fundingUtilisationRate - avgAchievementRatio);

    // 3. Overdue reports
    const overdueCount = entityReports.filter(r => r.submissionStatus === 'OVERDUE').length;

    // 4. Audit penalty
    let auditScoreDeduction = 0;
    if (entity.auditOutcome === 'QUALIFIED') auditScoreDeduction = 30;
    else if (entity.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS') auditScoreDeduction = 15;
    else if (entity.auditOutcome === 'DISCLAIMER') auditScoreDeduction = 50;

    // Mathematical Risk Score (0 = lowest risk, 100 = critical)
    let calculatedRisk = 0;
    calculatedRisk += Math.max(0, (1.0 - avgAchievementRatio) * 45); // up to 45 pts
    calculatedRisk += varianceGap * 25; // up to 25 pts for spending without delivering
    calculatedRisk += overdueCount * 15; // 15 pts per overdue report
    calculatedRisk += (auditScoreDeduction * 0.5); // audit quality

    calculatedRisk = Math.min(99, Math.max(5, Math.round(calculatedRisk)));
    entity.riskScore = calculatedRisk;

    if (calculatedRisk >= 75) {
      entity.riskLevel = 'CRITICAL';
    } else if (calculatedRisk >= 60) {
      entity.riskLevel = 'HIGH';
    } else if (calculatedRisk >= 35) {
      entity.riskLevel = 'MEDIUM';
    } else {
      entity.riskLevel = 'LOW';
    }

    // Update overall compliance
    entity.overallComplianceScore = Math.max(20, 100 - Math.round(calculatedRisk * 0.7));
  }

  // --- EXECUTIVE PERFORMANCE PULSE AGGREGATION ---
  getPerformancePulse() {
    const totalEntities = this.entities.length;
    const onTrackCount = this.entities.filter(e => e.riskLevel === 'LOW').length;
    const monitoringCount = this.entities.filter(e => e.riskLevel === 'MEDIUM').length;
    const interventionCount = this.entities.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL').length;
    
    const overdueReportsCount = this.reports.filter(r => r.submissionStatus === 'OVERDUE').length;
    const pendingReviewCount = this.reports.filter(r => r.submissionStatus === 'SUBMITTED' || r.submissionStatus === 'RESUBMITTED').length;
    const openTasksCount = this.tasks.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

    const totalAllocation = this.entities.reduce((acc, e) => acc + e.budgetAllocationZAR, 0);
    const totalTransferred = this.entities.reduce((acc, e) => acc + e.transferredAmountZAR, 0);
    const totalExpended = this.entities.reduce((acc, e) => acc + e.reportedExpenditureZAR, 0);
    const expenditureRate = totalTransferred > 0 ? (totalExpended / totalTransferred) * 100 : 0;

    const totalYouthJobs = this.entities.reduce((acc, e) => acc + e.jobStats.youthJobsCreated, 0);
    const totalPermanentJobs = this.entities.reduce((acc, e) => acc + e.jobStats.permanentJobs, 0);
    const totalCreativePractitioners = this.entities.reduce((acc, e) => acc + e.jobStats.creativeSectorPractitionersSupported, 0);

    const totalDocumentsCount = this.documents.length;
    const verifiedDocumentsCount = this.documents.filter(d => d.approvalStatus === 'APPROVED').length;
    const pendingDocumentsCount = this.documents.filter(d => d.approvalStatus === 'PENDING_REVIEW').length;
    const amendmentRequiredDocumentsCount = this.documents.filter(d => d.approvalStatus === 'REQUIRES_AMENDMENT').length;
    
    // Total reports submitted vs outstanding across all entities
    const entitiesWithSubmittedReports = new Set(
      this.reports
        .filter(r => r.submissionStatus === 'SUBMITTED' || r.submissionStatus === 'APPROVED' || r.submissionStatus === 'RESUBMITTED')
        .map(r => r.entityId)
    );
    const reportsSubmittedCount = entitiesWithSubmittedReports.size;
    const reportsOutstandingCount = Math.max(0, totalEntities - reportsSubmittedCount);

    return {
      totalEntities,
      onTrackCount,
      monitoringCount,
      interventionCount,
      highRiskEntitiesCount: interventionCount,
      openTasksCount,
      overdueReportsCount,
      pendingReviewCount,
      totalAllocation,
      totalTransferred,
      totalExpended,
      expenditureRate: Math.round(expenditureRate * 10) / 10,
      totalYouthJobs,
      totalPermanentJobs,
      totalCreativePractitioners,
      averageCompliance: Math.round(this.entities.reduce((acc, e) => acc + e.overallComplianceScore, 0) / Math.max(1, totalEntities)),
      totalDocumentsCount,
      verifiedDocumentsCount,
      pendingDocumentsCount,
      amendmentRequiredDocumentsCount,
      reportsSubmittedCount,
      reportsOutstandingCount,
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
}

export const store = GovTrackStore.getInstance();
