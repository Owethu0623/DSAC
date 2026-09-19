import { store } from './store';
import { sameFinancialYear, toLongFinancialYear } from './reportingPeriod';
import { DocumentRequirementSlot } from '../types/documentVerification';

/**
 * Evidence status for one statutory requirement in one period.
 *
 * The document workflow only knows about uploaded files, but two requirements are satisfied by the system's own
 * structured returns: the Quarterly Performance Report (the performance return) and the Quarterly Financial
 * Statement (the expenditure return). Reading only documents made every entity look "Missing" for those two
 * even where the return had been submitted and approved. This overlay reports what actually happened, and says
 * where the evidence came from, so the screens never have to guess.
 */
export type EvidenceStatus = DocumentRequirementSlot['status'];

export interface EvidenceSlot {
  id: string;
  code: string;
  title: string;
  mandatory: boolean;
  status: EvidenceStatus;
  source: 'DOCUMENT' | 'RETURN' | 'NONE';
  /** Short note for the UI, e.g. "Return submitted 22 Jan 2026". */
  detail?: string;
}

export interface EvidenceSummary {
  entityId: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  financialYear: string;
  slots: EvidenceSlot[];
  totalMandatory: number;
  verifiedMandatory: number;
  pending: number;
  rejected: number;
  missingMandatory: number;
  /** verified ÷ mandatory, as a whole percentage; 100 when nothing is mandatory. */
  completionPercent: number;
}

const RETURN_STATUS_TO_EVIDENCE: Record<string, EvidenceStatus> = {
  APPROVED: 'VERIFIED',
  SUBMITTED: 'MANUAL_REVIEW',
  UNDER_REVIEW: 'MANUAL_REVIEW',
  CORRECTION_REQUIRED: 'REJECTED',
};

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : undefined;

export function getEvidenceSummary(
  entityId: string,
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
  financialYear: string
): EvidenceSummary {
  const longYear = toLongFinancialYear(financialYear);
  const checklist = store.getEntityDocumentChecklist(entityId, quarter, longYear);

  const performanceReturn = store.reports.find(
    r => r.entityId === entityId && r.quarter === quarter && sameFinancialYear(r.financialYear, financialYear)
  );
  const financialReturn = store.quarterlyFinancialSubmissions.find(
    s => s.entityId === entityId && s.quarter === quarter && sameFinancialYear(s.financialYear, financialYear)
  );

  const slots: EvidenceSlot[] = checklist.slots.map(slot => {
    const req = slot.requirement;
    let status: EvidenceStatus = slot.status;
    let source: EvidenceSlot['source'] = slot.activeDocument ? 'DOCUMENT' : 'NONE';
    let detail: string | undefined = slot.activeDocument ? `Uploaded ${fmt(slot.activeDocument.uploadedAt) ?? ''}`.trim() : undefined;

    // A document that was uploaded always wins. Otherwise the matching structured return stands in for it.
    if (!slot.activeDocument) {
      const ret =
        req.requiredDocumentType === 'PERFORMANCE_REPORT'
          ? performanceReturn && { status: performanceReturn.submissionStatus, at: performanceReturn.submittedAt, label: 'Performance return' }
          : req.requiredDocumentType === 'FINANCIAL_STATEMENT'
            ? financialReturn && { status: financialReturn.status, at: financialReturn.submittedAt, label: 'Expenditure return' }
            : undefined;
      const mapped = ret ? RETURN_STATUS_TO_EVIDENCE[ret.status] : undefined;
      if (ret && mapped) {
        status = mapped;
        source = 'RETURN';
        detail = `${ret.label} ${ret.status.replace(/_/g, ' ').toLowerCase()}${ret.at ? `, lodged ${fmt(ret.at)}` : ''}`;
      }
    }

    return {
      id: req.id,
      code: req.code,
      title: req.title,
      mandatory: req.mandatory,
      status,
      source,
      detail,
    };
  });

  const mandatory = slots.filter(s => s.mandatory);
  const verifiedMandatory = mandatory.filter(s => s.status === 'VERIFIED').length;
  return {
    entityId,
    quarter,
    financialYear: longYear,
    slots,
    totalMandatory: mandatory.length,
    verifiedMandatory,
    pending: slots.filter(s => s.status === 'MANUAL_REVIEW' || s.status === 'VALIDATING').length,
    rejected: slots.filter(s => s.status === 'REJECTED').length,
    missingMandatory: mandatory.filter(s => s.status === 'MISSING').length,
    completionPercent: mandatory.length > 0 ? Math.round((verifiedMandatory / mandatory.length) * 100) : 100,
  };
}
