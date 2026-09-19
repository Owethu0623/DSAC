import React, { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';
import { formatZAR } from '../../services/financialService';
import { getCurrentReportingPeriod, normalizeFinancialYear, pct1, sameFinancialYear } from '../../services/reportingPeriod';
import { EntityFinancialView } from '../features/EntityFinancialView';
import { Panel, fmtDate } from './parts';

interface Props {
  entity: PublicEntity;
  financialYear: string;
  /** DSAC officials release tranches and decide on returns; an entity officer only sees them. */
  isDsac: boolean;
}

const MONTHS: Record<string, string> = { Q1: 'Apr–Jun', Q2: 'Jul–Sep', Q3: 'Oct–Dec', Q4: 'Jan–Mar' };

const LEDGER_STYLE = {
  RELEASED: { label: 'Disbursed', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  SCHEDULED: { label: 'Scheduled', cls: 'bg-sky-100 text-sky-800 border-sky-300' },
  WITHHELD: { label: 'Withheld', cls: 'bg-rose-100 text-rose-800 border-rose-300' },
} as const;

/**
 * Money for one organisation: the funding tranches (from the disbursement ledger, the only place "disbursed" can
 * change), the returns waiting for a DSAC decision, and the full expenditure view that foots to the approved budget.
 */
export const EntityFinanceTab: React.FC<Props> = ({ entity, financialYear, isDsac }) => {
  const fy = normalizeFinancialYear(financialYear);
  const isCurrentYear = sameFinancialYear(fy, getCurrentReportingPeriod().financialYear);
  const [note, setNote] = useState('');
  const [returnNote, setReturnNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const say = (ok: boolean, text: string) => {
    setMessage({ ok, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const ledger = store.getDisbursements(entity.id, fy).slice().sort((a, b) => a.tranche.localeCompare(b.tranche));
  const next = isCurrentYear ? store.getNextTranche(entity.id, fy) : undefined;
  const approved = store.getBudgetProfileForEntity(entity.id, fy)?.approvedAmount ?? 0;
  const awaiting = isDsac
    ? store.quarterlyFinancialSubmissions.filter(s => s.entityId === entity.id && sameFinancialYear(s.financialYear, fy) && (s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW'))
    : [];

  const release = () => {
    if (!next) return;
    const result = store.releaseTranche(entity.id, fy, next.tranche, note.trim() || undefined);
    if (result.success) {
      setNote('');
      say(true, `${next.tranche} tranche of ${formatZAR(next.amountZAR)} released to ${entity.shortCode}.`);
    } else {
      say(false, result.message || 'The tranche could not be released.');
    }
  };

  const decide = (id: string, quarter: string, decision: 'APPROVE' | 'REQUEST_CORRECTION') => {
    const text = (returnNote[id] || '').trim();
    if (decision === 'REQUEST_CORRECTION' && !text) {
      say(false, 'Enter the correction required before returning it.');
      return;
    }
    store.reviewQuarterlyFinancialReturn(id, decision, text || 'Approved by DSAC.');
    setReturnNote(n => ({ ...n, [id]: '' }));
    say(true, decision === 'APPROVE' ? `${quarter} expenditure return approved.` : `${quarter} expenditure return sent back to ${entity.shortCode}.`);
  };

  return (
    <div className="space-y-5">
      {message && (
        <div role="status" className={`px-3 py-2 rounded-lg border text-xs font-semibold ${message.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      <Panel
        title={`Funding tranches (${fy})`}
        subtitle="Disbursed is the sum of released tranches. Tranches are paid in order and never above the approved budget."
        right={<span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{ledger.filter(d => d.status === 'RELEASED').length} of {ledger.length} released</span>}
      >
        {ledger.length === 0 ? (
          <p className="text-sm text-slate-500">No tranches are scheduled for this financial year.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {ledger.map(d => {
              const s = LEDGER_STYLE[d.status];
              return (
                <div key={d.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{d.tranche} • {MONTHS[d.tranche]}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${s.cls}`}>{s.label}</span>
                  </div>
                  <div className="text-base font-black text-slate-900 mt-1">{formatZAR(d.amountZAR)}</div>
                  <div className="text-[10px] text-slate-500">
                    {pct1(d.amountZAR, approved)}% of approved{d.releasedAt ? ` • paid ${fmtDate(d.releasedAt)}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isDsac && next && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Reference or note (optional)"
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={release}
              disabled={next.status === 'WITHHELD'}
              title={next.status === 'WITHHELD' ? 'Withheld under PFMA Section 38(1)(j)' : undefined}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shadow-xs disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              Release {next.tranche} tranche ({formatZAR(next.amountZAR)})
            </button>
          </div>
        )}
        {isDsac && next?.status === 'WITHHELD' && (
          <p className="mt-2 text-[11px] text-rose-700">This tranche is withheld under PFMA Section 38(1)(j). Clear the hold on the Compliance tab before releasing it.</p>
        )}
      </Panel>

      {awaiting.length > 0 && (
        <Panel title="Expenditure returns awaiting a DSAC decision" subtitle="Counted as reported, but not verified, until approved.">
          <ul className="space-y-3">
            {awaiting.map(s => (
              <li key={s.id} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs">
                    <strong className="text-slate-900">{s.quarter} {fy}</strong>
                    <span className="text-slate-600"> • {formatZAR(s.totalQuarterlyActual)} • lodged {fmtDate(s.submittedAt)} by {s.submittedByName || s.submittedBy || 'the entity'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => decide(s.id, s.quarter, 'APPROVE')} className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => decide(s.id, s.quarter, 'REQUEST_CORRECTION')} className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                      <RotateCcw className="w-3.5 h-3.5" /> Return
                    </button>
                  </div>
                </div>
                <input
                  value={returnNote[s.id] || ''}
                  onChange={e => setReturnNote(n => ({ ...n, [s.id]: e.target.value }))}
                  placeholder="Reviewer note (required when returning)"
                  className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <EntityFinancialView entityId={entity.id} financialYear={fy} readOnly={isDsac} />
    </div>
  );
};
