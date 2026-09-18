import React, { useState } from 'react';
import { X, Coins, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { FinancialQuarter } from '../../types';
import { store } from '../../services/store';
import { formatZAR } from '../../services/financialService';

interface CaptureExpenditureModalProps {
  entityId: string;
  entityName: string;
  annualBudget: number;
  financialYear?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CaptureExpenditureModal: React.FC<CaptureExpenditureModalProps> = ({
  entityId,
  entityName,
  annualBudget,
  financialYear = '2025/26',
  onClose,
  onSuccess,
}) => {
  const [quarter, setQuarter] = useState<FinancialQuarter>('Q3');
  const [lines, setLines] = useState([
    {
      categoryId: 'cat-comp',
      categoryName: 'Compensation of Employees / Personnel',
      quarterlyActual: Math.round(annualBudget * 0.45 * 0.25),
      annualBudget: Math.round(annualBudget * 0.45),
    },
    {
      categoryId: 'cat-prog',
      categoryName: 'Programme & Community Arts Delivery',
      quarterlyActual: Math.round(annualBudget * 0.35 * 0.25),
      annualBudget: Math.round(annualBudget * 0.35),
    },
    {
      categoryId: 'cat-admin',
      categoryName: 'Operational & Administrative Overheads',
      quarterlyActual: Math.round(annualBudget * 0.15 * 0.25),
      annualBudget: Math.round(annualBudget * 0.15),
    },
    {
      categoryId: 'cat-capex',
      categoryName: 'Capital Assets, Equipment & Facilities',
      quarterlyActual: Math.round(annualBudget * 0.05 * 0.25),
      annualBudget: Math.round(annualBudget * 0.05),
    },
  ]);

  const [accountingOfficerName, setAccountingOfficerName] = useState(
    store.currentUser?.name || 'Chief Financial Officer'
  );
  const [affirmed, setAffirmed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalActual = lines.reduce((sum, l) => sum + (l.quarterlyActual || 0), 0);
  const quarterBenchmark = Math.round(annualBudget * 0.25);
  const varianceFromBenchmark = totalActual - quarterBenchmark;

  const handleLineAmountChange = (index: number, val: number) => {
    const updated = [...lines];
    updated[index].quarterlyActual = Math.max(0, val);
    setLines(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!affirmed) return;

    setIsSubmitting(true);
    try {
      store.captureQuarterlyExpenditure({
        entityId,
        entityName,
        quarter,
        financialYear,
        accountingOfficerAffirmation: affirmed,
        accountingOfficerName,
        lines,
      });

      setSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to capture quarterly expenditure', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Capture Quarterly Expenditure Return</h3>
              <p className="text-[11px] text-slate-500">{entityName} • Vote 40 BAS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Quarter selection */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Select Quarter</label>
            <div className="flex items-center gap-1.5">
              {(['Q1', 'Q2', 'Q3', 'Q4'] as FinancialQuarter[]).map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuarter(q)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    quarter === q
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Expenditure Breakdown by Category */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Verified Actual Expenditure by Category (ZAR)
            </label>
            {lines.map((line, idx) => (
              <div key={line.categoryId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800">{line.categoryName}</span>
                  <span className="text-slate-500 font-medium">Budget: {formatZAR(line.annualBudget)}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">R</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={line.quarterlyActual}
                    onChange={(e) => handleLineAmountChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Total {quarter} Claimed Expenditure:</span>
              <span className="font-black text-emerald-800 text-sm">{formatZAR(totalActual)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Quarterly Planned Benchmark: {formatZAR(quarterBenchmark)}</span>
              <span className={varianceFromBenchmark > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                {varianceFromBenchmark >= 0 ? `+${formatZAR(varianceFromBenchmark)}` : `-${formatZAR(Math.abs(varianceFromBenchmark))}`} vs benchmark
              </span>
            </div>
          </div>

          {/* Accounting Officer Affirmation */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-slate-900">
                PFMA Section 38(1)(j) Accounting Officer Affirmation
              </span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Authorized Signatory Name
              </label>
              <input
                type="text"
                required
                value={accountingOfficerName}
                onChange={(e) => setAccountingOfficerName(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="expenditureAffirm"
                checked={affirmed}
                onChange={(e) => setAffirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="expenditureAffirm" className="text-[11px] text-slate-700 cursor-pointer select-none leading-tight">
                I hereby certify that the expenditure amounts declared above have been audited, supported by valid vouchers, and spent solely for approved public mandate activities.
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !affirmed}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Submitted &amp; Synced!</span>
                </>
              ) : isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <span>Submit &amp; Sync with DSAC</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
