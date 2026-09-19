import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PublicEntity } from '../../types';
import { StatutoryNonSubmissionPolicyCard } from '../StatutoryNonSubmissionPolicyCard';
import { getCurrentReportingPeriod, isFinancialYearClosed, normalizeFinancialYear } from '../../services/reportingPeriod';
import { getEvidenceSummary } from '../../services/evidenceStatus';
import { Panel } from './parts';

interface Props {
  entity: PublicEntity;
  financialYear: string;
  isDsac: boolean;
  /** Document verification, the archive and directives, which the page controller owns. */
  children?: React.ReactNode;
}

const SLOT_STYLE: Record<string, { label: string; cls: string }> = {
  VERIFIED: { label: 'Verified', cls: 'text-emerald-800 bg-emerald-100' },
  MANUAL_REVIEW: { label: 'Under review', cls: 'text-amber-800 bg-amber-100' },
  VALIDATING: { label: 'Validating', cls: 'text-amber-800 bg-amber-100' },
  REJECTED: { label: 'Rejected', cls: 'text-rose-800 bg-rose-100' },
  MISSING: { label: 'Missing', cls: 'text-rose-800 bg-rose-100' },
};

/**
 * Statutory standing: funding hold and notice stage (PFMA Section 38(1)(j)), and the evidence required for the
 * period. Two requirements (performance report, financial statement) are satisfied by the system's own returns,
 * so they show the return's status rather than "missing" for want of an uploaded file.
 */
export const EntityComplianceTab: React.FC<Props> = ({ entity, financialYear, isDsac, children }) => {
  const fy = normalizeFinancialYear(financialYear);
  const quarter = isFinancialYearClosed(fy) ? 'Q4' : getCurrentReportingPeriod().quarter;
  const evidence = getEvidenceSummary(entity.id, quarter, fy);

  return (
    <div className="space-y-5">
      <StatutoryNonSubmissionPolicyCard entity={entity} isDsacOfficer={isDsac} />

      <Panel
        title={`Evidence required for ${quarter} ${fy}`}
        subtitle="Mandatory items must be verified before the period is complete."
        right={
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${evidence.verifiedMandatory === evidence.totalMandatory && evidence.totalMandatory > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {evidence.verifiedMandatory} of {evidence.totalMandatory} mandatory verified
          </span>
        }
      >
        <ul className="space-y-2 text-xs">
          {evidence.slots.map(slot => {
            const badge = slot.status === 'MISSING' && !slot.mandatory ? { label: 'Not provided', cls: 'text-slate-600 bg-slate-100' } : SLOT_STYLE[slot.status];
            return (
              <li key={slot.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-2 min-w-0 text-slate-700">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${slot.status === 'VERIFIED' ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{slot.title}</span>
                    {slot.detail && <span className="block text-[10px] text-slate-400 truncate">{slot.detail}</span>}
                  </span>
                  {slot.mandatory && <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Mandatory</span>}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>{badge.label}</span>
              </li>
            );
          })}
          {evidence.slots.length === 0 && <li className="text-slate-400">No evidence requirements are defined for this period.</li>}
        </ul>
      </Panel>

      {children}
    </div>
  );
};
