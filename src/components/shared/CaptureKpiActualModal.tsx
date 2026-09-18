import React, { useState } from 'react';
import { X, Target, TrendingUp, TrendingDown, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { KPIRecord, FinancialQuarter } from '../../types';
import { store } from '../../services/store';

interface CaptureKpiActualModalProps {
  kpi: KPIRecord;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CaptureKpiActualModal: React.FC<CaptureKpiActualModalProps> = ({
  kpi,
  onClose,
  onSuccess,
}) => {
  const [quarter, setQuarter] = useState<FinancialQuarter>('Q3');
  const [actualValue, setActualValue] = useState<number>(() => {
    if (quarter === 'Q1') return kpi.q1Actual ?? 0;
    if (quarter === 'Q2') return kpi.q2Actual ?? 0;
    if (quarter === 'Q3') return kpi.q3Actual ?? 0;
    return kpi.q4Actual ?? 0;
  });
  const [varianceReason, setVarianceReason] = useState<string>('');
  const [correctiveAction, setCorrectiveAction] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Target for current selected quarter
  const quarterTarget = quarter === 'Q1' ? (kpi.q1Target ?? Math.round(kpi.annualTarget * 0.25))
    : quarter === 'Q2' ? (kpi.q2Target ?? Math.round(kpi.annualTarget * 0.25))
    : quarter === 'Q3' ? (kpi.q3Target ?? Math.round(kpi.annualTarget * 0.25))
    : (kpi.q4Target ?? Math.round(kpi.annualTarget * 0.25));

  const handleQuarterChange = (newQ: FinancialQuarter) => {
    setQuarter(newQ);
    if (newQ === 'Q1') setActualValue(kpi.q1Actual ?? 0);
    else if (newQ === 'Q2') setActualValue(kpi.q2Actual ?? 0);
    else if (newQ === 'Q3') setActualValue(kpi.q3Actual ?? 0);
    else setActualValue(kpi.q4Actual ?? 0);
  };

  const variance = actualValue - quarterTarget;
  const percentAchieved = quarterTarget > 0 ? Math.round((actualValue / quarterTarget) * 100) : 0;
  const isLagging = percentAchieved < 80;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      store.updateKPIValue(
        kpi.id,
        actualValue,
        varianceReason || undefined,
        quarter,
        correctiveAction || undefined
      );

      setSavedSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update KPI', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Capture Performance Actual</h3>
              <p className="text-[11px] text-slate-500">{kpi.id.slice(-6).toUpperCase()} • {kpi.entityName || 'Entity'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Indicator Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="font-bold text-slate-900 leading-snug">{kpi.name}</div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-slate-600">
              <span>Annual Target: <strong className="text-slate-900">{kpi.annualTarget.toLocaleString()}</strong> {kpi.unitOfMeasure}</span>
              <span>Cumulative to Date: <strong className="text-teal-700">{kpi.currentValue.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Quarter Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Reporting Quarter</label>
            <div className="grid grid-cols-4 gap-2">
              {(['Q1', 'Q2', 'Q3', 'Q4'] as FinancialQuarter[]).map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuarterChange(q)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    quarter === q
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Actual Value Input */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <label>Quarter {quarter} Actual Achieved ({kpi.unitOfMeasure})</label>
              <span className="text-slate-500 font-normal">Target: <strong>{quarterTarget.toLocaleString()}</strong></span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={actualValue}
                onChange={(e) => setActualValue(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Live Calculation Preview */}
            <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
              <span className="text-slate-600">Achievement Rate:</span>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${percentAchieved >= 90 ? 'text-emerald-700' : percentAchieved >= 60 ? 'text-amber-700' : 'text-rose-600'}`}>
                  {percentAchieved}%
                </span>
                <span className="text-slate-400">•</span>
                <span className={`flex items-center gap-0.5 font-medium ${variance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {variance >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {variance >= 0 ? `+${variance.toLocaleString()}` : variance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Variance Reason if Lagging */}
          {isLagging && (
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
              <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                <span>Statutory Variance Note Required (Achievement &lt; 80%)</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Reason for Variance</label>
                <input
                  type="text"
                  value={varianceReason}
                  onChange={(e) => setVarianceReason(e.target.value)}
                  placeholder="e.g. Supply chain delay / venue renovations"
                  className="w-full p-2 text-xs bg-white border border-amber-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  required={isLagging}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Proposed Corrective Action</label>
                <input
                  type="text"
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="e.g. Accelerated workshops planned for Q4"
                  className="w-full p-2 text-xs bg-white border border-amber-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  required={isLagging}
                />
              </div>
            </div>
          )}

          {/* Notice */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>Saving this actual will immediately update the entity KPI trajectory, recalculate portfolio risk, and synchronize with the Department Oversight Dashboard.</span>
          </div>

          {/* Footer Actions */}
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
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : isSaving ? (
                <span>Updating...</span>
              ) : (
                <span>Save Actual</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
