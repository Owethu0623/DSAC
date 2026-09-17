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
  ReportItem
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

    this.registeredUsers = loadedUsers.map(u => ({
      ...u,
      password: u.password || 'Password123!',
      entityName: u.entityName || (u.role === 'ENTITY_OFFICER' ? 'Statutory Public Entity' : 'DSAC National Headquarters'),
    }));
    saveToStorage(STORAGE_KEYS.REGISTERED_USERS, this.registeredUsers);

    let loadedCurrent = loadFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    if (!loadedCurrent || loadedCurrent.email.toLowerCase() === 'n.sithole@dsac.gov.za') {
      loadedCurrent = this.registeredUsers.find(u => u.email.toLowerCase() === 'sakhilesicelo94@gmail.com') || INITIAL_USERS[0];
      saveToStorage(STORAGE_KEYS.CURRENT_USER, loadedCurrent);
    }
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
    this.documents = loadFromStorage<EntityDocument[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
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
  private persistAll(): void {
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
    initialSummary: string
  ): void {
    const entity = this.entities.find(e => e.id === entityId);
    const uploader = this.currentUser ? `${this.currentUser.name} (${this.currentUser.designation})` : 'Authorized Official';
    const newDoc: EntityDocument = {
      id: `doc-${Date.now()}`,
      entityId,
      entityName: entity ? entity.name : 'Unknown Entity',
      title,
      category,
      financialYear,
      currentVersion: 1,
      approvalStatus: 'PENDING_REVIEW',
      versions: [
        {
          versionNumber: 1,
          uploadedAt: new Date().toISOString(),
          uploadedBy: uploader,
          fileName,
          fileSizeBytes,
          changeSummary: initialSummary,
        },
      ],
      comments: [],
    };

    this.documents = [newDoc, ...this.documents];
    this.addAuditLog('DOCUMENT_UPLOADED', `Registered new statutory document "${title}" (${category}).`, newDoc.entityName);
    this.persistAll();
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
    };
  }
}

export const store = GovTrackStore.getInstance();
