import React from 'react';
import { Coins, Wallet, ArrowDownRight, ShieldCheck, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { formatZAR } from '../../services/financialService';

interface FinancialSummaryCardProps {
  approvedBudget: number;
  transferredAmount: number;
  reportedExpenditure: number;
  remainingAmount: number;
  utilizationRate: number;
  financialYear?: string;
  trancheStatus?: 'RELEASED' | 'WITHHELD' | 'CONDITIONAL_HOLD';
  onCaptureExpenditure?: () => void;
  onViewDetails?: () => void;
  entityName?: string;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  approvedBudget,
  transferredAmount,
  reportedExpenditure,
  remainingAmount,
  utilizationRate,
  financialYear = '2025/26',
  trancheStatus = 'RELEASED',
  onCaptureExpenditure,
  onViewDetails,
  entityName,
}) => {
  const cappedUtil = Math.min(utilizationRate, 100);
  
  const trancheBadge = {
    RELEASED: { text: 'Tranche Released', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    WITHHELD: { text: 'Tranche Withheld', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
    CONDITIONAL_HOLD: { text: 'Conditional Hold', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  }[trancheStatus] || { text: 'Tranche Released', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              PFMA Budget &amp; Utilisation
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              FY {financialYear}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${trancheBadge.bg}`}>
              {trancheBadge.text}
            </span>
          </div>
          {entityName && (
            <h4 className="text-sm font-black text-slate-900 mt-1">{entityName}</h4>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCaptureExpenditure && (
            <button
              onClick={onCaptureExpenditure}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Capture Spend</span>
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Utilisation Metric */}
      <div className="py-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">
            Utilised: <strong className="text-slate-900 font-black">{formatZAR(reportedExpenditure)}</strong> of {formatZAR(approvedBudget)}
          </span>
          <span className="font-black text-emerald-700 text-sm">{utilizationRate}%</span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
            style={{ width: `${cappedUtil}%` }}
          />
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <div className="flex items-center justify-center text-slate-400 mb-1">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs sm:text-sm font-black text-slate-900">{formatZAR(approvedBudget)}</div>
          <div className="text-[10px] text-slate-500 font-medium">Approved Budget</div>
        </div>

        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
          <div className="flex items-center justify-center text-blue-600 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs sm:text-sm font-black text-blue-900">{formatZAR(transferredAmount)}</div>
          <div className="text-[10px] text-blue-700 font-medium">Disbursed</div>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
          <div className="flex items-center justify-center text-emerald-600 mb-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs sm:text-sm font-black text-emerald-900">{formatZAR(remainingAmount)}</div>
          <div className="text-[10px] text-emerald-700 font-medium">Remaining</div>
        </div>
      </div>
    </div>
  );
};
