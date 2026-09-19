import { store } from './store';
import { formatZAR, isPortfolioMember } from './financialService';
import { calculateKpiItemProgress, projectKpiAnnualAttainment } from './kpiProgress';
import { getCurrentReportingPeriod, pct1, toLongFinancialYear } from './reportingPeriod';
import { PublicEntity } from '../types';

export interface AIAnalysisResponse {
  answer: string;
  sourceEntities: string[];
  groundedMetrics: {
    label: string;
    value: string;
  }[];
  recommendedActions: string[];
  responsibleAIDisclaimer: string;
}

/**
 * PERFORMANCE ANALYST (rule-based).
 *
 * Every figure below is computed at the moment of the question from the same engines the dashboards use, for the
 * current reporting period. Nothing is typed in. It does not use a language model: it selects and phrases results
 * by rules, and it says so. (The previous version returned canned paragraphs with invented numbers, for example
 * "NAC has spent 89.5%" when the data said 62.6%, while claiming to be "strictly from current store data".)
 */
const DISCLAIMER =
  'Rule-based analysis computed from the platform\'s current data for the stated period. It does not use a language model. Projections are simple run-rates and do not model seasonality. Advisory only: all sanctions or financial decisions require formal departmental authorisation.';

const compact = (n: number) => formatZAR(n, { compact: true });

/** "Name (CODE)" without repeating the code when the registered name already ends with it. */
const label = (e: PublicEntity) => (e.name.includes(`(${e.shortCode})`) ? e.name : `${e.name} (${e.shortCode})`);

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function askAIPerformanceAnalyst(query: string): Promise<AIAnalysisResponse> {
  const period = getCurrentReportingPeriod();
  const fy = period.financialYear;
  const periodLabel = `${toLongFinancialYear(fy)} ${period.quarter}`;
  const members = store.entities.filter(isPortfolioMember);
  const pulse = store.getPerformancePulse();

  const finOf = (e: PublicEntity) => store.getEntityFinancialSummary(e.id, fy, period.quarter);
  const perfOf = (e: PublicEntity) => store.getEntityPerformanceSummary(e.id, fy, period.quarter);
  const q = query.toLowerCase();

  // ---------------------------------------------------------------------------------------------
  // A specific organisation was named
  // ---------------------------------------------------------------------------------------------
  const named = members.find(e =>
    new RegExp(`\\b${escapeRegExp(e.shortCode)}\\b`, 'i').test(query) ||
    q.includes(e.name.toLowerCase().replace(/\s*\(.*\)\s*$/, ''))
  );
  if (named) {
    const fin = finOf(named);
    const perf = perfOf(named);
    const worst = perf.items.slice().sort((a, b) => a.percentageAchieved - b.percentageAchieved).slice(0, 3);
    const overdue = store.reports.filter(r => r.entityId === named.id && r.submissionStatus === 'OVERDUE');
    const lines: string[] = [
      `**${label(named)} — ${periodLabel}**`,
      `• **Risk:** ${named.riskLevel} (score ${named.riskScore}/100); compliance score ${named.overallComplianceScore}%.`,
      `• **Budget:** ${formatZAR(fin.approvedAmount)} approved; ${formatZAR(fin.disbursedToDate)} disbursed; ${formatZAR(fin.ytdActual)} reported to date (${fin.utilisationPercent}% of budget, ${fin.absorptionRate}% of funds received).`,
      `• **Year-end outlook:** at the current run-rate spend reaches ${formatZAR(fin.projectedYearEndSpend)} (${fin.projectedYearEndUtilisationPercent}% of budget).`,
    ];
    if (fin.missingQuarters.length > 0) lines.push(`• **Finance return outstanding:** ${fin.missingQuarters.join(', ')}. ${fin.statusExplanation}`);
    if (overdue.length > 0) lines.push(`• **Statutory reports overdue:** ${overdue.map(r => r.quarter).join(', ')}.`);
    if (named.trancheStatus === 'WITHHELD') lines.push(`• **Funding:** the next tranche is withheld (${named.statutoryDefaultReason || 'statutory non-submission'}).`);
    lines.push(
      `• **Performance:** ${perf.completedCount} of ${perf.totalKpis} indicators achieved to date; average achievement ${perf.overallAchievementRate}% of year-to-date targets.`
    );
    worst.forEach(i => lines.push(`   – ${i.name}: ${i.actualDisplay} vs ${i.targetDisplay} year-to-date (${i.percentageAchieved}%).`));

    const actions: string[] = [];
    if (overdue.length > 0 || fin.missingQuarters.length > 0) actions.push(`Obtain the outstanding ${[...overdue.map(r => r.quarter), ...fin.missingQuarters].filter((v, i, a) => a.indexOf(v) === i).join(', ')} return(s) from ${named.headOfEntity}.`);
    if (fin.performanceFinanceSignal?.status === 'REQUIRES_REVIEW') actions.push('Review expenditure against delivery evidence before the next tranche is released.');
    if (fin.isOverspent) actions.push('Issue a Section 38 inquiry into the overspend and require a recovery plan.');
    if (fin.projectedYearEndUtilisationPercent > 105 && !fin.isOverspent) actions.push('Request a cash-flow recovery plan: projected year-end spend exceeds the approved budget.');
    if (actions.length === 0) actions.push('No intervention indicated by the current data; continue routine monitoring.');

    return {
      answer: lines.join('\n'),
      sourceEntities: [named.name],
      groundedMetrics: [
        { label: 'Budget Utilisation', value: `${fin.utilisationPercent}%` },
        { label: 'Transfer Absorption', value: `${fin.absorptionRate}%` },
        { label: 'Indicators Achieved', value: `${perf.completedCount} of ${perf.totalKpis}` },
      ],
      recommendedActions: actions,
      responsibleAIDisclaimer: DISCLAIMER,
    };
  }

  // ---------------------------------------------------------------------------------------------
  // Attention / risk / intervention
  // ---------------------------------------------------------------------------------------------
  if (/attention|risk|intervention|flag|priority|worst/.test(q)) {
    const flagged = members.slice().sort((a, b) => b.riskScore - a.riskScore).filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL' || e.riskLevel === 'MEDIUM').slice(0, 5);
    if (flagged.length === 0) {
      return {
        answer: `No institution is rated MEDIUM or above for ${periodLabel}.`,
        sourceEntities: [],
        groundedMetrics: [{ label: 'Entities Requiring Intervention', value: `0 of ${pulse.totalEntities}` }],
        recommendedActions: ['Continue routine quarterly monitoring.'],
        responsibleAIDisclaimer: DISCLAIMER,
      };
    }
    const blocks = flagged.map((e, i) => {
      const fin = finOf(e);
      const perf = perfOf(e);
      const worst = perf.items.slice().sort((a, b) => a.percentageAchieved - b.percentageAchieved)[0];
      const overdue = store.reports.filter(r => r.entityId === e.id && r.submissionStatus === 'OVERDUE').length;
      const facts: string[] = [];
      if (overdue > 0) facts.push(`${overdue} statutory report${overdue === 1 ? '' : 's'} overdue`);
      if (fin.missingQuarters.length > 0) facts.push(`${fin.missingQuarters.join(', ')} finance return outstanding`);
      if (worst) facts.push(`weakest indicator "${worst.name}" at ${worst.percentageAchieved}% of its year-to-date target`);
      facts.push(`${fin.absorptionRate}% of funds received spent`);
      if (e.trancheStatus === 'WITHHELD') facts.push('next tranche withheld');
      return `${i + 1}. **${label(e)} — ${e.riskLevel}, score ${e.riskScore}/100**\n   - ${facts.join('; ')}.`;
    });

    return {
      answer: `Based on ${periodLabel} reporting, **${pulse.interventionCount} institution${pulse.interventionCount === 1 ? '' : 's'}** are rated HIGH or CRITICAL and ${flagged.length} are listed below by risk score:\n\n${blocks.join('\n\n')}`,
      sourceEntities: flagged.map(label),
      groundedMetrics: [
        { label: 'Entities Requiring Intervention', value: `${pulse.interventionCount} of ${pulse.totalEntities}` },
        { label: 'Overdue Statutory Reports', value: `${pulse.overdueReportsCount}` },
        { label: 'Finance Returns Outstanding', value: `${pulse.entitiesWithOutstandingReturns} entities` },
      ],
      recommendedActions: flagged
        .filter(e => e.riskLevel === 'CRITICAL' || e.riskLevel === 'HIGH')
        .map(e => `Convene a compliance review with the Accounting Authority of ${e.shortCode}${e.trancheStatus === 'WITHHELD' ? ' before the withheld tranche is reconsidered' : ''}.`)
        .concat(['Confirm outstanding returns are lodged before the next statutory deadline.']),
      responsibleAIDisclaimer: DISCLAIMER,
    };
  }

  // ---------------------------------------------------------------------------------------------
  // Indicators / targets / trends
  // ---------------------------------------------------------------------------------------------
  if (/kpi|indicator|declin|target|trend|delivery|perform/.test(q)) {
    const rows = members.flatMap(e =>
      store.kpis
        .filter(k => k.entityId === e.id)
        .map(k => ({ e, k, item: calculateKpiItemProgress(k, fy, period.quarter), proj: projectKpiAnnualAttainment(k, period.quarter) }))
    );
    const lagging = rows
      .filter(r => r.item.kpiStatus === 'AT_RISK' || r.item.kpiStatus === 'MISSED')
      .sort((a, b) => a.item.percentageAchieved - b.item.percentageAchieved);
    const top = lagging.slice(0, 5);
    const body = top.length
      ? top.map(r => `• **${r.item.name} (${r.e.shortCode})**: ${r.item.actualDisplay} vs ${r.item.targetDisplay} year-to-date (${r.item.percentageAchieved}%). At this pace the year ends at about ${r.proj.projected.toLocaleString()} against an annual target of ${r.proj.annualTarget.toLocaleString()} (${r.proj.percentage}%).`).join('\n')
      : 'No indicator is currently behind target.';

    return {
      answer: `${pulse.kpisAtRisk + pulse.kpisMissed} of ${pulse.totalKpis} indicators are At Risk or Not Achieved for ${periodLabel}:\n\n${body}`,
      sourceEntities: Array.from(new Set(top.map(r => r.e.name))),
      groundedMetrics: [
        { label: 'Achieved / On Track', value: `${pulse.kpisOnTrack} of ${pulse.totalKpis}` },
        { label: 'At Risk', value: `${pulse.kpisAtRisk}` },
        { label: 'Not Achieved', value: `${pulse.kpisMissed}` },
        { label: 'Average Achievement (year-to-date)', value: `${pulse.averageKpiAchievement}%` },
      ],
      recommendedActions: top.slice(0, 3).map(r => `Ask ${r.e.shortCode} for a corrective action plan on "${r.item.name}".`),
      responsibleAIDisclaimer: DISCLAIMER,
    };
  }

  // ---------------------------------------------------------------------------------------------
  // Money
  // ---------------------------------------------------------------------------------------------
  if (/financ|budget|spend|spending|variance|money|fund|forecast|project|utilis|absor/.test(q)) {
    const sums = members.map(e => ({ e, s: finOf(e) }));
    const disconnect = sums.filter(x => x.s.performanceFinanceSignal?.status === 'REQUIRES_REVIEW');
    const overProjected = sums.filter(x => !x.s.isOverspent && x.s.projectedYearEndUtilisationPercent > 105);
    const idleCash = sums.slice().sort((a, b) => b.s.unspentDisbursed - a.s.unspentDisbursed).slice(0, 3);

    const lines = [
      `**Financial position — ${periodLabel}**`,
      `• **Approved budget:** ${compact(pulse.totalAllocation)}; **disbursed:** ${compact(pulse.totalTransferred)} (${pulse.transferRate}% of approved); **still to disburse:** ${compact(pulse.remainingDisbursement)}.`,
      `• **Reported expenditure:** ${compact(pulse.totalExpended)} — ${pulse.burnRate}% of the approved budget and ${pulse.expenditureRate}% of funds received. ${compact(pulse.totalVerifiedExpenditure)} has been verified by DSAC.`,
      `• **Cash held by entities but unspent:** ${compact(pulse.unspentDisbursed)}.`,
    ];
    if (idleCash.length) lines.push(`   – Largest balances: ${idleCash.map(x => `${x.e.shortCode} ${compact(x.s.unspentDisbursed)}`).join(', ')}.`);
    if (disconnect.length) {
      lines.push(`• **Spend running ahead of delivery:** ${disconnect.map(x => `${x.e.shortCode} (spend ${x.s.utilisationPercent}% of budget, delivery ${x.s.targetAchievementRate ?? 0}% of targets)`).join('; ')}.`);
    }
    if (overProjected.length) {
      lines.push(`• **Projected to exceed budget by year end (run-rate):** ${overProjected.map(x => `${x.e.shortCode} ${x.s.projectedYearEndUtilisationPercent}%`).join(', ')}.`);
    }
    if (pulse.entitiesWithOutstandingReturns > 0) lines.push(`• **${pulse.entitiesWithOutstandingReturns} entit${pulse.entitiesWithOutstandingReturns === 1 ? 'y has' : 'ies have'} a finance return outstanding**, so their spend is understated until lodged.`);

    return {
      answer: lines.join('\n'),
      sourceEntities: Array.from(new Set([...disconnect, ...overProjected, ...idleCash].map(x => x.e.name))),
      groundedMetrics: [
        { label: 'Total Budget Monitored', value: compact(pulse.totalAllocation) },
        { label: 'Budget Utilisation', value: `${pulse.burnRate}%` },
        { label: 'Transfer Absorption', value: `${pulse.expenditureRate}%` },
        { label: 'Unspent Disbursed Cash', value: compact(pulse.unspentDisbursed) },
      ],
      recommendedActions: [
        ...disconnect.slice(0, 2).map(x => `Review ${x.e.shortCode}'s expenditure against delivery evidence before further tranches.`),
        ...overProjected.slice(0, 2).map(x => `Ask ${x.e.shortCode} for a recovery plan: projected year-end spend is ${x.s.projectedYearEndUtilisationPercent}% of budget.`),
        'Require quarterly reconciliation of grant commitments against actual payments.',
      ],
      responsibleAIDisclaimer: DISCLAIMER,
    };
  }

  // ---------------------------------------------------------------------------------------------
  // Default overview
  // ---------------------------------------------------------------------------------------------
  const watch = members.slice().sort((a, b) => b.riskScore - a.riskScore).filter(e => e.riskLevel !== 'LOW').slice(0, 3);
  return {
    answer: [
      `**GovTrack SA briefing — ${periodLabel}**`,
      `• **Portfolio:** ${pulse.totalEntities} funded institutions (${pulse.publicEntitiesCount} Public Entities and ${pulse.nposCount} NPOs).`,
      `• **Risk:** ${pulse.onTrackCount} low risk, ${pulse.monitoringCount} under monitoring, ${pulse.interventionCount} requiring intervention.`,
      `• **Reports this quarter:** ${pulse.currentQuarterSubmittedCount} of ${pulse.totalEntities} lodged; ${pulse.currentQuarterOverdueCount} overdue and ${pulse.currentQuarterReturnedCount} returned for correction.`,
      `• **Money:** ${compact(pulse.totalExpended)} reported against ${compact(pulse.totalTransferred)} disbursed (${pulse.expenditureRate}% absorption) and ${compact(pulse.totalAllocation)} approved (${pulse.burnRate}% utilisation).`,
      `• **Delivery:** ${pulse.kpisOnTrack} of ${pulse.totalKpis} indicators achieved or on track; average achievement ${pulse.averageKpiAchievement}% of year-to-date targets.`,
      `• **Employment impact:** ${pulse.totalYouthJobs.toLocaleString()} youth jobs and ${pulse.totalCreativePractitioners.toLocaleString()} cultural practitioners supported.`,
      watch.length ? `• **Watch:** ${watch.map(e => `${e.shortCode} (${e.riskLevel})`).join(', ')}.` : '• **Watch:** no institution rated MEDIUM or above.',
    ].join('\n'),
    sourceEntities: watch.map(e => e.name),
    groundedMetrics: [
      { label: 'Compliance Health Average', value: `${pulse.averageCompliance}%` },
      { label: 'Verified Youth Jobs Created', value: pulse.totalYouthJobs.toLocaleString() },
      { label: 'Entities On Track', value: `${pulse.onTrackCount} of ${pulse.totalEntities}` },
    ],
    recommendedActions: [
      ...(pulse.currentQuarterOverdueCount > 0 ? [`Chase the ${pulse.currentQuarterOverdueCount} overdue ${period.quarter} report(s).`] : []),
      ...(pulse.currentQuarterReturnedCount > 0 ? [`Follow up the ${pulse.currentQuarterReturnedCount} report(s) returned for correction.`] : []),
      ...watch.map(e => `Review the risk profile of ${e.shortCode}.`),
    ],
    responsibleAIDisclaimer: DISCLAIMER,
  };
}
