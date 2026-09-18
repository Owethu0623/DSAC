import React from 'react';
import { Target, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, XCircle, Clock, Edit3 } from 'lucide-react';
import { KPIRecord } from '../../types';

interface KpiProgressCardProps {
  kpi: KPIRecord;
  onUpdateActual?: (kpi: KPIRecord) => void;
  showQuarterBreakdown?: boolean;
  compact?: boolean;
}

export const KpiProgressCard: React.FC<KpiProgressCardProps> = ({
  kpi,
  onUpdateActual,
  showQuarterBreakdown = true,
  compact = false,
}) => {
  const percent = kpi.annualTarget > 0 
    ? Math.min(100, Math.round(((kpi.currentValue || 0) / kpi.annualTarget) * 100))
    : 0;

  const expected = kpi.expectedValue || Math.round(kpi.annualTarget * 0.75);
  const variance = (kpi.currentValue || 0) - expected;
  const isPositiveVariance = variance >= 0;

  const statusConfig = {
    COMPLETED: {
      label: 'Target Met',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      barColor: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    ON_TRACK: {
      label: 'On Track',
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      barColor: 'bg-teal-500',
      icon: TrendingUp,
    },
    AT_RISK: {
      label: 'At Risk',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      barColor: 'bg-amber-500',
      icon: AlertTriangle,
    },
    MISSED: {
      label: 'Lagging',
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      barColor: 'bg-rose-500',
      icon: XCircle,
    },
    NOT_STARTED: {
      label: 'Pending',
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      barColor: 'bg-slate-400',
      icon: Clock,
    },
  }[kpi.status || 'ON_TRACK'] || {
    label: 'On Track',
    bg: 'bg-teal-50 text-teal-800 border-teal-200',
    barColor: 'bg-teal-500',
    icon: TrendingUp,
  };

  const StatusIcon = statusConfig.icon;

  if (compact) {
    return (
      <div className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {kpi.id.slice(-6).toUpperCase()}
            </span>
            <span className="text-xs font-bold text-slate-800 truncate">{kpi.name}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
            <span>Actual: <strong className="text-slate-800">{kpi.currentValue.toLocaleString()}</strong> / {kpi.annualTarget.toLocaleString()} {kpi.unitOfMeasure}</span>
            <span className="font-semibold text-teal-700">{percent}% achieved</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusConfig.bg}`}>
            {statusConfig.label}
          </span>
          {onUpdateActual && (
            <button
              onClick={() => onUpdateActual(kpi)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
              title="Capture actual"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {kpi.id.slice(-6).toUpperCase()}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.bg}`}>
              <StatusIcon className="w-3 h-3" />
              <span>{statusConfig.label}</span>
            </span>
            {kpi.entityName && (
              <span className="text-[10px] text-slate-400 truncate font-medium">
                {kpi.entityName}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-900 leading-snug">{kpi.name}</h4>
          {kpi.description && (
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{kpi.description}</p>
          )}
        </div>

        {onUpdateActual && (
          <button
            onClick={() => onUpdateActual(kpi)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>Update</span>
          </button>
        )}
      </div>

      {/* Metric Progress Bar */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">
            Actual to Date: <strong className="text-slate-900 font-bold">{kpi.currentValue.toLocaleString()}</strong> {kpi.unitOfMeasure}
          </span>
          <span className="text-slate-600">
            Target: <strong className="text-slate-900 font-bold">{kpi.annualTarget.toLocaleString()}</strong> {kpi.unitOfMeasure}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${statusConfig.barColor}`} 
            style={{ width: `${Math.min(percent, 100)}%` }} 
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span className="font-semibold text-teal-800">{percent}% achieved</span>
          <span className={`font-medium flex items-center gap-0.5 ${isPositiveVariance ? 'text-emerald-700' : 'text-rose-600'}`}>
            {isPositiveVariance ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositiveVariance ? `+${variance.toLocaleString()}` : `${variance.toLocaleString()}`} vs expected
          </span>
        </div>
      </div>

      {/* Quarterly Trajectory Breakdown */}
      {showQuarterBreakdown && (
        <div className="grid grid-cols-4 gap-2 pt-3 mt-3 border-t border-slate-100 text-center">
          {[
            { q: 'Q1', target: kpi.q1Target, actual: kpi.q1Actual },
            { q: 'Q2', target: kpi.q2Target, actual: kpi.q2Actual },
            { q: 'Q3', target: kpi.q3Target, actual: kpi.q3Actual },
            { q: 'Q4', target: kpi.q4Target, actual: kpi.q4Actual },
          ].map((item, idx) => (
            <div key={idx} className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-[10px] font-bold text-slate-500">{item.q}</div>
              <div className="text-xs font-black text-slate-800 mt-0.5">
                {item.actual !== undefined && item.actual !== null ? item.actual.toLocaleString() : '—'}
              </div>
              <div className="text-[9px] text-slate-400">
                Tgt: {item.target !== undefined ? item.target.toLocaleString() : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
