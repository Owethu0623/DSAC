import {
  AuditLogEntry,
  CorrectiveTask,
  DocumentRequirement,
  EntityDocument,
  KPIRecord,
  PublicEntity,
  QuarterlyReport,
  RegulatoryDeadline,
  RiskAlert,
  SupportRequest,
  User,
} from '../types';
import { DisbursementRecord, EntityBudgetProfile, ExpenseCategory, QuarterlyFinancialSubmission } from './financial';

/** A user as the browser may see them: never with a password or its hash. */
export type PublicUser = Omit<User, 'passwordHash' | 'password'>;

/** Every collection the store holds, exactly as the store holds it. */
export interface StateData {
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
  disbursements: DisbursementRecord[];
}

/** What the server sends a signed-in user: the collections they may see, and who they are. */
export interface StateSnapshot extends StateData {
  /** Increases by one every time the server's data changes. */
  version: number;
  user: PublicUser;
  users: PublicUser[];
}
