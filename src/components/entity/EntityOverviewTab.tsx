import React, { useMemo } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';
import { formatZAR } from '../../services/financialService';
import { calculateEntityPerformanceSummary } from '../../services/calculationEngine';
import { getCurrentReportingPeriod, isFinancialYearClosed, normalizeFinancialYear, sameFinancialYear } from '../../services/reportingPeriod';
import { EntityTab, getEntityAttention } from '../../services/attention';
import { LEVEL_STYLE, Panel, RISK_TONE, Stat } from './parts';

interface Props {
  entity: PublicEntity;
  financialYear: string;
  onGoToTab: (tab: EntityTab) => void;
}

/**
 * First tab of the entity page: the headline numbers (all from the engines) and what needs attention.
 * Headline figures and the attention list read the same functions the portfolio dashboards read, so this page
 * can never disagree with them.
 */
export const EntityOverviewTab: React.FC<Props> = ({ entity, financialYear, onGoToTab }) => {
  const fy = normalizeFinancialYear(financialYear);
  const closed = isFinancialYearClosed(fy);
  const quarter = closed ? 'Q4' : getCurrentReportingPeriod().quarter;

  const fin = useMemo(() => store.getEntityFinancialSummary(entity.id, fy, closed ? 'FULL_YEAR' : quarter), [entity.id, fy, closed, quarter]);
  const perf = useMemo(() => calculateEntityPerformanceSummary(entity.id, fy, closed ? 'FULL_YEAR' : quarter, store.kpis, entity), [entity, fy, closed, quarter]);
  const attention = useMemo(() => getEntityAttention(entity.id, fy, quarter), [entity.id, fy, quarter]);
  const returns = store.reports.filter(r => r.entityId === entity.id && sameFinancialYear(r.financialYear, fy));
  const approved = returns.filter(r => r.submissionStatus === 'APPROVED').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Approved budget" value={formatZAR(fin.approvedAmount)} sub={fin.hasBudgetProfile ? `${fy} ${fin.budgetStatus.replace(/_/g, ' ').toLowerCase()}` : 'No approved budget on record'} />
        <Stat label="Disbursed to date" value={formatZAR(fin.disbursedToDate)} sub={`${fin.disbursementRate.toFixed(1)}% of approved • ${formatZAR(fin.undisbursedBalance)} left to disburse`} />
        <Stat label="Reported spend (year to date)" value={formatZAR(fin.ytdActual)} sub={`${formatZAR(fin.verifiedYtdActual)} verified by DSAC`} />
        <Stat
          label="Budget utilisation"
          value={`${fin.utilisationPercent.toFixed(1)}%`}
          sub={`Absorption ${fin.absorptionRate.toFixed(1)}% of funds received`}
          tone={fin.isOverspent ? 'bad' : 'default'}
        />
        <Stat
          label="Delivery against targets"
          value={perf.totalKpis > 0 ? `${perf.overallAchievementRate.toFixed(1)}%` : '—'}
          sub={`${perf.completedCount} of ${perf.totalKpis} ${perf.totalKpis === 1 ? 'indicator' : 'indicators'} achieved`}
        />
        <Stat label="Returns approved" value={`${approved} of ${returns.length}`} sub={`Performance returns for ${fy}`} />
        <Stat label="Compliance score" value={`${entity.overallComplianceScore}%`} sub={`Audit: ${entity.auditOutcome.replace(/_/g, ' ').toLowerCase()} (${entity.auditYear})`} />
        <Stat label="Risk" value={`${entity.riskLevel} • ${entity.riskScore}/100`} tone={RISK_TONE[entity.riskLevel]} sub="From returns, delivery and funding" />
      </div>

      <Panel title="Needs attention" subtitle={`Worked out from ${quarter} ${fy} returns, spending, delivery, funding and directives.`}>
        {attention.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>Nothing needs attention for this period.</span>
          </div>
        ) : (
          <ul className="space-y-2">
            {attention.map(item => {
              const s = LEVEL_STYLE[item.level];
              return (
                <li key={item.id} className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${s.box}`}>
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} aria-label={s.label} />
                    <div className="min-w-0">
                      <div className={`text-xs font-bold ${s.text}`}>{item.title}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{item.detail}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onGoToTab(item.tab)}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer capitalize"
                  >
                    <span>{item.tab}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
};
