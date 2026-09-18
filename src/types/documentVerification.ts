import { UserRole } from '../types';

export type ControlledDocumentType =
  | 'BANK_STATEMENT'
  | 'PERFORMANCE_REPORT'
  | 'POE'
  | 'FINANCIAL_STATEMENT'
  | 'PROOF_OF_EXPENDITURE'
  | 'ANNUAL_REPORT'
  | 'QUARTERLY_REPORT'
  | 'STRATEGIC_PLAN'
  | 'ANNUAL_PERFORMANCE_PLAN'
  | 'SUPPORTING_EVIDENCE'
  | 'GOVERNANCE_CHARTER'
  | 'TAX_CLEARANCE';

export type ControlledDocumentStatus =
  | 'UPLOADED'
  | 'VALIDATING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'MANUAL_REVIEW'
  | 'REPLACED'
  | 'ARCHIVED';

export type DocumentRequirementCategory =
  | 'FINANCIAL'
  | 'PERFORMANCE'
  | 'GOVERNANCE'
  | 'COMPLIANCE';

export interface DocumentRequirement {
  id: string;
  code: string; // e.g. 'REQ-FIN-BANK', 'REQ-PERF-POE'
  title: string;
  description: string;
  requiredDocumentType: ControlledDocumentType;
  category: DocumentRequirementCategory;
  applicableQuarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ANNUAL' | 'ALL';
  mandatory: boolean;
  minConfidenceThreshold: number; // e.g. 0.80 for auto-verify, 0.50 for manual review
  expectedCharacteristics: string[];
}

export interface FileValidationReport {
  valid: boolean;
  mimeType: string;
  fileSizeBytes: number;
  fileHash: string;
  isReadable: boolean;
  error?: string;
}

export interface ExtractedDocumentMetadata {
  detectedEntityName?: string;
  entityMatch: 'MATCH' | 'MISMATCH' | 'NOT_SPECIFIED';
  detectedPeriod?: string; // e.g. "Q3 2025/2026" or "Q1 2024"
  periodMatch: 'MATCH' | 'MISMATCH' | 'NOT_SPECIFIED';
  institutionName?: string;
  accountReference?: string;
  dateRangeFound?: string;
  totalAmountFound?: number;
  transactionCountFound?: number;
  statementDates?: string;
}

export interface DocumentVerificationResult {
  detectedDocumentType: ControlledDocumentType | 'INVOICE' | 'RECEIPT' | 'CORRESPONDENCE' | 'UNKNOWN';
  confidence: number; // 0.0 to 1.0 (e.g. 0.94)
  matchesRequiredType: boolean;
  status: 'VERIFIED' | 'REJECTED' | 'MANUAL_REVIEW';
  reasons: string[];
  missingExpectedCharacteristics: string[];
  identifiedCharacteristics: string[];
  fileValidation: FileValidationReport;
  extractedMetadata: ExtractedDocumentMetadata;
  verifiedAt: string;
  verifier: 'AUTOMATED_CLASSIFIER' | 'GEMINI_AI' | 'MANUAL_OFFICIAL';
  manualReviewNotes?: string;
  manualReviewedBy?: string;
  manualReviewedAt?: string;
}

export interface DetailedDocumentVersion {
  versionNumber: number;
  fileName: string;
  fileSizeBytes: number;
  fileHash: string;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByName: string;
  verificationResult: DocumentVerificationResult;
  status: ControlledDocumentStatus;
  textContentSample?: string;
  rejectionReason?: string;
  changeSummary?: string;
  downloadUrl?: string;
}

export interface DocumentRequirementSlot {
  requirement: DocumentRequirement;
  status: 'MISSING' | 'VALIDATING' | 'VERIFIED' | 'REJECTED' | 'MANUAL_REVIEW';
  activeDocument?: any; // EntityDocument
  activeVersion?: DetailedDocumentVersion;
  latestVerification?: DocumentVerificationResult;
  isSatisfied: boolean;
}

export interface DocumentVerificationChecklist {
  entityId: string;
  entityName: string;
  quarter: string;
  financialYear: string;
  reportId?: string;
  slots: DocumentRequirementSlot[];
  totalRequired: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  missingCount: number;
  isFullyCompliant: boolean;
  compliancePercentage: number;
}
