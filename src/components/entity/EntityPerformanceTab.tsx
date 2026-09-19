import React, { useMemo } from 'react';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';
import { calculateEntityPerformanceSummary } from '../../services/calculationEngine';
import { getCurrentReportingPeriod, isFinancialYearClosed, normalizeFinancialYear } from '../../services/reportingPeriod';
import { KPI_STYLE, Panel, Stat } from './parts';

interface Props {
  entity: PublicEntity;
  financialYear: string;
}

const num = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toLocaleString('en-ZA'));

/**
 * Agreed indicators and how they are tracking. Every figure comes from the KPI engine: the status is the single
 * rule set (90% achieved/on track, 70% at risk) applied to the year-to-date target for the period.
 */
export const EntityPerformanceTab: React.FC<Props> = ({ entity, financialYear }) => {
  const fy = normalizeFinancialYear(financialYear);
  const closed = isFinancialYearClosed(fy);
  const quarter = closed ? 'FULL_YEAR' : getCurrentReportingPeriod().quarter;
  const perf = useMemo(() => calculateEntityPerformanceSummary(entity.id, fy, quarter, store.kpis, entity), [entity, fy, quarter]);
  const records = new Map(store.kpis.filter(k => k.entityId === entity.id).map(k => [k.id, k]));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Indicators" value={perf.totalKpis} sub={`Agreed in the Annual Performance Plan for ${fy}`} />
        <Stat label="Achieved" value={perf.completedCount} tone="good" sub={`${perf.completedPercent}% of indicators`} />
        <Stat label="Not achieved" value={perf.missedCount} tone={perf.missedCount > 0 ? 'bad' : 'default'} sub={`${perf.missedPercent}% of indicators`} />
        <Stat label="Average achievement" value={perf.totalKpis > 0 ? `${perf.overallAchievementRate.toFixed(1)}%` : '—'} sub={`Each indicator capped at 100%, at ${quarter === 'FULL_YEAR' ? 'year end' : quarter}`} />
      </div>

      <Panel title="Indicators and quarterly milestones" subtitle="Targets and actuals as reported by the entity. Status is measured against the year-to-date target.">
        {perf.items.length === 0 ? (
          <p className="text-sm text-slate-500">No indicators have been agreed for this organisation yet.</p>
        ) : (
          <div className="space-y-4">
            {perf.items.map(item => {
              const style = KPI_STYLE[item.kpiStatus];
              const record = records.get(item.id);
              const width = Math.max(0, Math.min(100, item.percentageAchieved));
              return (
                <article key={item.id} className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.programmeName}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1.5">{item.name}</h3>
                      {item.description && <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded text-xs font-bold border self-start whitespace-nowrap ${style.pill}`}>
                      {style.label} • {item.percentageAchieved.toFixed(0)}%
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-600 font-mono">
                      <span>Actual to date: <strong>{item.actualDisplay}</strong></span>
                      <span>Year-to-date target: <strong>{item.targetDisplay}</strong></span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-1" role="progressbar" aria-valuenow={Math.round(width)} aria-valuemin={0} aria-valuemax={100}>
                      <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${width}%` }} />
                    </div>
                    {record && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        Annual target {num(record.annualTarget)} {item.unitOfMeasure} • baseline {num(record.baseline)}
                        {record.calculationType === 'NON_CUMULATIVE' ? ' • latest quarter is the year-to-date result' : ''}
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="py-1 pr-3 font-bold">&nbsp;</th>
                          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => <th key={q} className="py-1 px-3 font-bold text-right">{q}</th>)}
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        <tr className="border-t border-slate-200">
                          <td className="py-1 pr-3 text-slate-500 font-sans">Target</td>
                          {[item.q1Target, item.q2Target, item.q3Target, item.q4Target].map((v, i) => <td key={i} className="py-1 px-3 text-right">{num(v)}</td>)}
                        </tr>
                        <tr className="border-t border-slate-100">
                          <td className="py-1 pr-3 text-slate-500 font-sans">Actual</td>
                          {[item.q1Actual, item.q2Actual, item.q3Actual, item.q4Actual].map((v, i) => <td key={i} className="py-1 px-3 text-right font-bold">{num(v)}</td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {record && record.historicalPerformance.length > 0 && (
                    <div className="pt-3 border-t border-slate-200 text-xs">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Previous years (achieved / target)</div>
                      <div className="flex flex-wrap items-center gap-2">
                        {record.historicalPerformance.map(h => (
                          <div key={h.year} className="px-3 py-1 bg-white rounded border border-slate-200 font-mono text-[11px]">
                            <span className="text-slate-500">{h.year}:</span> <strong className="text-slate-800">{num(h.achieved)}/{num(h.target)}</strong>
                            {h.target > 0 && <span className="text-slate-500"> ({Math.round((h.achieved / h.target) * 100)}%)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
};
