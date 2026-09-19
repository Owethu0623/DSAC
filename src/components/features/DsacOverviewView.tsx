import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  FileText, 
  Target, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  FileCheck, 
  Calendar, 
  Sparkles, 
  AlertCircle,
  Coins,
  ChevronDown,
  Layers,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  PieChart as PieIcon,
  Users,
  Compass,
  BookOpen
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';
import { isPortfolioMember } from '../../services/financialService';
import {
  QuarterSelection,
  financialYearStart,
  getCurrentReportingPeriod,
  normalizeFinancialYear,
  pct1,
  quarterDueDate,
  quarterIndex,
  toLongFinancialYear
} from '../../services/reportingPeriod';

interface DsacOverviewViewProps {
  entities: PublicEntity[];
  reportsOutstanding: number;
  highRiskEntitiesCount: number;
  highRiskEntities: PublicEntity[];
  totalApprovedBudget: number;
  totalTransferredToDate: number;
  totalReportedExpenditure?: number;
  remainingDisbursement: number;
  transferRate: number;
  expenditureRate: number;
  formatZAR: (val: number) => string;
  onNavigate: (section: string, subtab?: string) => void;
  onInvestigateEntity?: (entityId: string) => void;
  onOpenDemo: () => void;
  onOpenGuide?: () => void;
}

export const DsacOverviewView: React.FC<DsacOverviewViewProps> = ({
  entities,
  reportsOutstanding,
  highRiskEntitiesCount,
  highRiskEntities,
  totalApprovedBudget: propTotalApproved,
  totalTransferredToDate: propTotalTransferred,
  totalReportedExpenditure: propTotalExpended,
  remainingDisbursement,
  transferRate,
  expenditureRate,
  formatZAR,
  onNavigate,
  onInvestigateEntity,
  onOpenDemo,
  onOpenGuide
}) => {
  const [tick, setTick] = useState(0);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const period = getCurrentReportingPeriod();
  const [selectedFinancialPeriod, setSelectedFinancialPeriod] = useState<string>(period.financialYear);
  const [chartViewMode, setChartViewMode] = useState<'EXECUTION' | 'SECTORS'>('EXECUTION');

  // Current financial year plus the two before it, generated from the reporting period (never typed).
  const periodOptions = useMemo(() => {
    const start = financialYearStart(period.financialYear);
    return [0, 1, 2].map(i => {
      const fy = `${start - i}/${String((start - i + 1) % 100).padStart(2, '0')}`;
      return {
        value: fy,
        label: i === 0 ? 'This Financial Year' : `${fy} Financial Year`,
        headerLabel: `${toLongFinancialYear(fy)} (${i === 0 ? 'Current' : 'Closed'})`,
      };
    });
  }, [period.financialYear]);

  // Handle financial period selection change across all components
  const handlePeriodChange = (fy: string) => {
    setSelectedFinancialPeriod(fy);
  };
  // Compact currency formatter matching South African National Treasury reporting standards (e.g., R 2.12B, R 1.59B, R 529.5M)
  const formatCompactZAR = (val: number): string => {
    if (val === undefined || val === null || isNaN(val)) return 'R 0';
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1_000_000_000) {
      const num = abs / 1_000_000_000;
      return `${sign}R ${num.toFixed(2)}B`;
    }
    if (abs >= 1_000_000) {
      const num = abs / 1_000_000;
      return `${sign}R ${num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)}M`;
    }
    if (abs >= 1_000) {
      return `${sign}R ${(abs / 1_000).toFixed(0)}k`;
    }
    return `${sign}R ${abs.toLocaleString('en-ZA')}`;
  };

  // Real-time synchronization whenever any entity or NPO submits financial data or KPI actuals
  useEffect(() => {
    const unsub = store.subscribe(() => {
      setTick(t => t + 1);
    });
    return () => unsub();
  }, []);

  const isCurrentYear = normalizeFinancialYear(selectedFinancialPeriod) === period.financialYear;
  const quarterForSelection: QuarterSelection = isCurrentYear ? period.quarter : 'FULL_YEAR';

  // Every figure on this dashboard comes from the same read-model as the finance and entity pages.
  // Nothing is typed in: change any return, disbursement or KPI and these cards move with it.
  const dynamicAgg = useMemo(
    () => store.getDepartmentFinancialAggregation(selectedFinancialPeriod, quarterForSelection),
    [selectedFinancialPeriod, quarterForSelection, tick]
  );
  const perfAgg = useMemo(
    () => store.getDepartmentPerformanceAggregation(selectedFinancialPeriod, quarterForSelection),
    [selectedFinancialPeriod, quarterForSelection, tick]
  );
  const pulse = useMemo(() => store.getPerformancePulse(), [tick, entities]);

  const totalApprovedBudget = dynamicAgg.totalApprovedBudget;
  const totalAmountDisbursedToDate = dynamicAgg.totalTransferredToDate;
  const totalAmountUtilisedToDate = dynamicAgg.totalReportedExpenditure;
  const undisbursedAllocation = dynamicAgg.remainingDisbursement; // approved - disbursed
  const disbursedUnutilised = dynamicAgg.unspentDisbursed; // disbursed - spent

  const totalInstitutions = pulse.totalEntities;
  const reportsSubmittedCount = pulse.currentQuarterSubmittedCount;
  const reportsOutstandingCount = pulse.currentQuarterOutstandingCount;
  const submissionRate = totalInstitutions > 0 ? Math.round((reportsSubmittedCount / totalInstitutions) * 100) : 0;

  // Authoritative financial overview aggregation synchronized with the selected financial period
  const finSummary = useMemo(() => {
    const spent = dynamicAgg.totalReportedExpenditure;
    const transferred = dynamicAgg.totalTransferredToDate;
    const approved = dynamicAgg.totalApprovedBudget;
    const unspentDisbursed = dynamicAgg.unspentDisbursed;
    const balance = dynamicAgg.remainingDisbursement;

    // Tranches released so far, counted from the disbursement ledger (not typed).
    const upTo = quarterIndex(quarterForSelection);
    const perEntity = new Map<string, number>();
    store
      .getDisbursements(undefined, selectedFinancialPeriod)
      .filter(d => d.status === 'RELEASED' && (isCurrentYear || quarterIndex(d.tranche) <= upTo))
      .forEach(d => perEntity.set(d.entityId, (perEntity.get(d.entityId) || 0) + 1));
    const tranchesReleased = Math.max(0, ...perEntity.values());

    return {
      periodLabel: isCurrentYear ? 'THIS FINANCIAL YEAR' : `${selectedFinancialPeriod} FINANCIAL YEAR`,
      approved,
      transferred,
      spent,
      unspentDisbursed,
      // Transfer Absorption: spent as a % of what has been disbursed.
      burnRate: dynamicAgg.expenditureRate,
      // Budget Utilisation: spent as a % of the approved annual budget.
      budgetUtilisation: dynamicAgg.utilPercent,
      unspentPct: transferred > 0 ? pct1(unspentDisbursed, transferred) : 0,
      balance,
      disbursedPct: dynamicAgg.transferRate,
      balancePct: pct1(balance, approved),
      peApproved: dynamicAgg.peBudget,
      npoApproved: dynamicAgg.npoBudget,
      pePct: dynamicAgg.pePercentage,
      npoPct: dynamicAgg.npoPercentage,
      tranchesReleased,
      tranchePaidText: tranchesReleased > 0 ? `Q1-Q${tranchesReleased} Paid (${formatCompactZAR(transferred)})` : 'No tranche released',
      trancheBalText: balance > 0 ? `Q${Math.min(4, tranchesReleased + 1)} Bal (${formatCompactZAR(balance)})` : 'Fully disbursed',
      pieData: [
        { name: 'Total Spent to Date', value: spent, color: '#059669', desc: 'Expenditure reported by entity accounting officers' },
        { name: 'Unspent Disbursed Balance', value: unspentDisbursed, color: '#0284c7', desc: 'Disbursed funds held by entities and not yet spent' },
      ].filter(d => d.value > 0),
    };
  }, [dynamicAgg, selectedFinancialPeriod, quarterForSelection, isCurrentYear, tick]);

  // Sector breakdown, from the same per-entity summaries as everything else on this page.
  const sectorFinancialData = useMemo(() => {
    const palette: Record<string, { name: string; color: string }> = {
      'Performing Arts & Theatres': { name: 'Performing Arts & Theatres', color: '#0d9488' },
      'Heritage & Museums': { name: 'Heritage & Museums', color: '#0284c7' },
      'Subsidized Cultural NPOs': { name: 'Subsidized Cultural NPOs', color: '#ec4899' },
      'Creative Industries & Film': { name: 'Creative & Film', color: '#8b5cf6' },
      'Sport & Recreation': { name: 'Sport & Recreation', color: '#f59e0b' },
    };
    const clusterMap: Record<string, { name: string; approved: number; disbursed: number; utilised: number; count: number; color: string }> = {};
    dynamicAgg.entitySummaries.forEach(s => {
      const ent = entities.find(e => e.id === s.entityId);
      const key = ent?.cluster || 'Heritage & Museums';
      if (!clusterMap[key]) clusterMap[key] = { name: palette[key]?.name || key, approved: 0, disbursed: 0, utilised: 0, count: 0, color: palette[key]?.color || '#64748b' };
      clusterMap[key].count += 1;
      clusterMap[key].approved += s.approvedAmount;
      clusterMap[key].disbursed += s.disbursedToDate;
      clusterMap[key].utilised += s.ytdActual;
    });
    return Object.values(clusterMap);
  }, [entities, dynamicAgg]);

  // Priority watchlist: the highest-risk institutions, with facts drawn from the engines.
  const watchlist = useMemo(() => {
    return store.entities
      .filter(isPortfolioMember)
      .slice()
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3)
      .map(e => {
        const fin = dynamicAgg.entitySummaries.find(s => s.entityId === e.id);
        const perf = store.getEntityPerformanceSummary(e.id, selectedFinancialPeriod, quarterForSelection);
        const worst = perf.items.slice().sort((a, b) => a.percentageAchieved - b.percentageAchieved)[0];
        const overdue = store.reports.filter(r => r.entityId === e.id && r.submissionStatus === 'OVERDUE').length;
        const facts: string[] = [];
        if (overdue > 0) facts.push(`${overdue} statutory report${overdue === 1 ? '' : 's'} overdue`);
        if (fin && fin.missingQuarters.length > 0) facts.push(`${fin.missingQuarters.join(', ')} finance return outstanding`);
        if (fin && fin.isOverspent) facts.push(`overspent by ${formatCompactZAR(fin.overspendAmount)}`);
        else if (fin && fin.disbursedToDate > 0) facts.push(`${fin.absorptionRate}% of funds received spent`);
        if (e.trancheStatus === 'WITHHELD') facts.push('next tranche withheld under PFMA s38(1)(j)');
        return { entity: e, fin, worst, facts };
      });
  }, [tick, dynamicAgg, selectedFinancialPeriod, quarterForSelection]);

  // Recent statutory activity: the real audit trail, newest first.
  const recentActivity = useMemo(() => store.auditLogs.slice(0, 3), [tick]);

  const timeAgo = (iso: string): string => {
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const aiInsight = useMemo(() => {
    const top = watchlist.filter(w => w.entity.riskLevel === 'HIGH' || w.entity.riskLevel === 'CRITICAL').slice(0, 2);
    const base = `Portfolio milestone attainment averages ${perfAgg.overallDeliveryPercent}% of year-to-date targets, with ${perfAgg.onTrackEntitiesCount} of ${perfAgg.totalEntities} institutions on track.`;
    return { base, top };
  }, [watchlist, perfAgg]);

  const launchAnalystQuery = (query: string) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('dsac_analyst_query', query);
    }
    onNavigate('ai');
  };

  // Chart data for Budget Execution Donut / Pie
  const executionChartData = useMemo(() => [
    { 
      name: 'Total Amount Utilised to Date', 
      value: totalAmountUtilisedToDate, 
      color: '#059669', 
      desc: 'Verified expenditure reported by entities' 
    },
    { 
      name: 'Disbursed Balance (Unutilised)', 
      value: disbursedUnutilised, 
      color: '#4f46e5', 
      desc: 'Transferred funds held by entities and not yet spent' 
    },
    { 
      name: 'Undisbursed Approved Allocation', 
      value: undisbursedAllocation, 
      color: '#94a3b8', 
      desc: 'Approved allocation not yet transferred to entities' 
    },
  ].filter(d => d.value > 0), [totalAmountUtilisedToDate, disbursedUnutilised, undisbursedAllocation]);

  // Chart data for Sector Utilisation Distribution
  const sectorChartData = useMemo(() => sectorFinancialData.map(s => ({
    name: s.name,
    value: s.utilised > 0 ? s.utilised : s.approved,
    color: s.color,
    count: s.count,
    approved: s.approved,
    utilised: s.utilised,
    desc: `${s.count} institutions • ${formatZAR(s.utilised)} utilised`
  })), [sectorFinancialData, formatZAR]);

  // Custom Tooltip for Recharts Pie
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isDisbursedContext = data.name === 'Total Spent to Date' || data.name === 'Unspent Disbursed Balance';
      const total = isDisbursedContext
        ? finSummary.transferred
        : chartViewMode === 'EXECUTION' 
        ? totalApprovedBudget 
        : sectorChartData.reduce((acc, curr) => acc + curr.value, 0);
      const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';

      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs max-w-xs z-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-xs truncate">{data.name}</span>
          </div>
          <div className="text-emerald-400 font-mono font-black text-sm mt-1">
            {formatZAR(data.value)}
          </div>
          <div className="text-slate-300 text-[11px] mt-0.5">
            {pct}% of {isDisbursedContext ? 'Disbursed Total' : chartViewMode === 'EXECUTION' ? 'Approved Budget' : 'Sector Expenditure'}
          </div>
          {data.desc && (
            <div className="text-slate-400 text-[10px] mt-1 pt-1 border-t border-slate-800 leading-snug">
              {data.desc}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 w-full max-w-7xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                South Africa
              </span>
              <span className="text-xs font-semibold text-slate-500">
                DSAC portfolio overview
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
              Department Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {toLongFinancialYear(period.financialYear)} • {period.quarter} reporting cycle
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <select
              value={selectedFinancialPeriod}
              onChange={(e) => handlePeriodChange(e.target.value as any)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
            >
              {periodOptions.map(o => (
                <option key={o.value} value={o.value}>{o.headerLabel}</option>
              ))}
            </select>

            <button
              onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <span>{showWorkflowGuide ? 'Hide details' : 'Quick view'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showWorkflowGuide ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {showWorkflowGuide && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button onClick={() => onNavigate('reports')} className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left cursor-pointer">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Reports</div>
                <div className="font-black text-xs text-slate-900 mt-1">Submitted</div>
              </button>
              <button onClick={() => onNavigate('performance')} className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left cursor-pointer">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Performance</div>
                <div className="font-black text-xs text-slate-900 mt-1">On track</div>
              </button>
              <button onClick={() => onNavigate('risks')} className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-left cursor-pointer">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Risk</div>
                <div className="font-black text-xs text-slate-900 mt-1">High risk</div>
              </button>
              <button onClick={() => onNavigate('tasks')} className="p-3 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-left cursor-pointer">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Action</div>
                <div className="font-black text-xs text-slate-900 mt-1">Directives</div>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-7 gap-3">
        {[
          { label: 'Total Entities', value: totalInstitutions, icon: Building2, color: 'bg-teal-50 text-teal-700', action: () => onNavigate('entities') },
          { label: 'Submitted', value: reportsSubmittedCount, icon: FileCheck, color: 'bg-emerald-50 text-emerald-700', action: () => onNavigate('reports') },
          { label: 'Pending Verification', value: reportsOutstandingCount, icon: Clock, color: 'bg-amber-50 text-amber-700', action: () => onNavigate('risks') },
          { label: 'Corrections Required', value: pulse.currentQuarterReturnedCount, icon: AlertTriangle, color: 'bg-rose-50 text-rose-700', action: () => onNavigate('tasks') },
          { label: 'High Risk', value: highRiskEntitiesCount, icon: ShieldCheck, color: 'bg-violet-50 text-violet-700', action: () => onNavigate('risks') },
          { label: 'Compliance', value: `${Math.min(100, Math.round((reportsSubmittedCount / Math.max(totalInstitutions, 1)) * 100))}%`, icon: CheckCircle2, color: 'bg-indigo-50 text-indigo-700', action: () => onNavigate('performance') },
          { label: 'Budget Utilised', value: `${Math.round(expenditureRate)}%`, icon: Coins, color: 'bg-sky-50 text-sky-700', action: () => onNavigate('financials') },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={card.action}
              className="bg-white border border-slate-200 rounded-2xl p-3 text-left hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="mt-4 text-2xl font-black text-slate-900 tracking-tight">{card.value}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-tight">{card.label}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Financial overview</div>
              <h2 className="text-lg font-black text-slate-900 mt-1">Budget utilisation</h2>
            </div>
            <button onClick={() => onNavigate('financials')} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer">
              View details
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Approved</div>
              <div className="text-xl font-black mt-1 text-slate-900">{formatCompactZAR(totalApprovedBudget)}</div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200">
              <div className="text-[10px] uppercase tracking-wider text-emerald-700">Utilised</div>
              <div className="text-xl font-black mt-1 text-emerald-800">{formatCompactZAR(totalAmountUtilisedToDate)}</div>
            </div>
            <div className="rounded-xl bg-sky-50 p-3 border border-sky-200">
              <div className="text-[10px] uppercase tracking-wider text-sky-700">Remaining</div>
              <div className="text-xl font-black mt-1 text-sky-800">{formatCompactZAR(remainingDisbursement)}</div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700">Utilisation</span>
                <span className="font-black text-slate-900">{Math.round(expenditureRate)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${Math.min(100, Math.max(0, expenditureRate))}%` }} className="h-full bg-emerald-600 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700">Transfer rate</span>
                <span className="font-black text-slate-900">{Math.round(transferRate)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${Math.min(100, Math.max(0, transferRate))}%` }} className="h-full bg-sky-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Performance</div>
              <h2 className="text-lg font-black text-slate-900 mt-1">Portfolio status</h2>
            </div>
            <button onClick={() => onNavigate('performance')} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer">
              Open KPI view
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
              <div className="text-[10px] uppercase tracking-wider text-emerald-700">Overall achievement</div>
              <div className="text-3xl font-black text-emerald-800 mt-1">{perfAgg.overallDeliveryPercent}%</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                <div className="text-emerald-700 text-lg font-black">✓</div>
                <div className="text-[10px] text-slate-500">On track</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                <div className="text-amber-700 text-lg font-black">⚠</div>
                <div className="text-[10px] text-slate-500">At risk</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                <div className="text-rose-700 text-lg font-black">✕</div>
                <div className="text-[10px] text-slate-500">Missed</div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Verification</div>
              <div className="mt-2 flex items-center justify-between text-sm font-bold text-slate-800">
                <span>Pending</span>
                <span>{reportsOutstandingCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm font-bold text-slate-800">
                <span>Verified</span>
                <span>{reportsSubmittedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FINANCIAL OVERVIEW DISPLAY (MATCHING SPECIFICATION & REFERENCE LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: BUDGET UTILIZATION CARD WITH PIE/DONUT CHART */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Budget Utilization
                  </h3>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase">
                    Vote 37
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Absorption (spent vs. disbursed) • {finSummary.budgetUtilisation}% of approved budget utilised
                </p>
              </div>

              {/* Financial Period Dropdown with Arrow */}
              <div className="relative inline-block shrink-0">
                <select
                  value={selectedFinancialPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value as any)}
                  className="appearance-none cursor-pointer pl-3 pr-7 py-1.5 text-xs font-bold text-emerald-700 bg-white border border-emerald-500 rounded-lg hover:bg-emerald-50/50 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-colors shadow-xs"
                >
                  {periodOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-600 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Pie / Donut Chart with burn rate percentage and comparison inside */}
            <div className="relative flex items-center justify-center my-3 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finSummary.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={66}
                    outerRadius={92}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={finSummary.unspentDisbursed > 0 ? 3 : 0}
                    dataKey="value"
                  >
                    {finSummary.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Inside the Pie Chart: Text + Amount + Percentage */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-10">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                  {finSummary.periodLabel}
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none mt-0.5">
                  {formatCompactZAR(finSummary.spent)}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Total Spent to Date
                </span>
                <span className="mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                  ({finSummary.burnRate}%)
                </span>
              </div>
            </div>

            {/* 3 Progress Bars / Lines Underneath: Burn Out Rate Compared to Disbursed Total */}
            <div className="space-y-2.5 pt-2">
              {/* Line 1: Disbursed Total (Baseline 100%) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                    {formatCompactZAR(finSummary.transferred)} Disbursed Total
                  </span>
                  <span className="font-bold text-slate-700 font-mono">100%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: '100%' }} className="h-full bg-slate-400 rounded-full" />
                </div>
              </div>

              {/* Line 2: Total Spent to Date (Burn Rate) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    {formatCompactZAR(finSummary.spent)} Total Spent to Date
                  </span>
                  <span className="font-bold text-emerald-700 font-mono">{finSummary.burnRate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${finSummary.burnRate}%` }} className="h-full bg-emerald-600 rounded-full" />
                </div>
              </div>

              {/* Line 3: Unspent Disbursed Balance */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                    {formatCompactZAR(finSummary.unspentDisbursed)} Unspent Balance
                  </span>
                  <span className="font-bold text-sky-700 font-mono">{finSummary.unspentPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${finSummary.unspentPct}%` }} className="h-full bg-sky-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Entity Expenditure Absorption</span>
            <span className="font-bold text-emerald-800">PFMA Sec 38 Burn Rate</span>
          </div>
        </div>

        {/* RIGHT COLUMN: APPROVED BUDGET TAB + DISBURSED TAB */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-4">
          
          {/* Tab 1: Total Approved Budget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-base sm:text-lg font-bold text-indigo-600">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-[15px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  Total Approved Budget
                </span>
              </div>

              <div className="mt-3 font-bold">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {formatCompactZAR(finSummary.approved)}
                </div>
                
                <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                  All {pulse.publicEntitiesCount} PEs &amp; {pulse.nposCount} Subsidized NPOs
                </div>
              </div>

              {/* Dual bar split */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                  <span className="flex items-center gap-1 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    {pulse.publicEntitiesCount} PEs ({finSummary.pePct}%)
                  </span>
                  <span className="flex items-center gap-1 text-sky-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                    {pulse.nposCount} NPOs ({finSummary.npoPct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div style={{ width: `${finSummary.pePct}%` }} className="h-full bg-emerald-600" />
                  <div style={{ width: `${finSummary.npoPct}%` }} className="h-full bg-sky-500" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>PEs: {formatCompactZAR(finSummary.peApproved)}</span>
                  <span>NPOs: {formatCompactZAR(finSummary.npoApproved)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab 2: Disbursed / Transfer to Date (Overall) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[15px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Total Disbursed
                </span>
              </div>

              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {formatCompactZAR(finSummary.transferred)}{' '}
                  <span className="text-base sm:text-lg font-bold text-indigo-600">
                    ({finSummary.disbursedPct}%)
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800 mt-1">
                  Transfer to Date (Overall)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Combined Disbursed Tranches
                </div>
              </div>

              {/* Tranche Milestones */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-bold text-slate-700">Tranche Milestones</span>
                  <span className="font-bold text-indigo-700 font-mono">
                    {finSummary.tranchesReleased} of 4 Released
                  </span>
                </div>
                {/* 4 Segmented Pills */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map(trancheNum => (
                    <div
                      key={trancheNum}
                      className={`h-2 rounded-full ${
                        trancheNum <= finSummary.tranchesReleased
                          ? 'bg-indigo-600'
                          : 'bg-indigo-100'
                      }`}
                      title={`Tranche ${trancheNum}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>{finSummary.tranchePaidText}</span>
                  <span>{finSummary.trancheBalText}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. MILESTONE DELIVERY & ATTAINMENT: computed from the KPI engine (no typed figures) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">Milestone Delivery &amp; Attainment</h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                {isCurrentYear ? `${period.quarter} Year-to-Date` : 'Full Year'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Annual Performance Plan (APP) target delivery across {perfAgg.totalEntities} institutions and {perfAgg.totalKpis} indicators
            </p>
          </div>

          <button
            onClick={() => onNavigate('performance')}
            className="py-1.5 px-3 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Performance Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Delivery Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-700">Portfolio Target Delivery Rate <span className="font-medium text-slate-400">(average achievement vs year-to-date target)</span></span>
            <span className="font-black text-slate-900 font-mono text-sm">{perfAgg.overallDeliveryPercent}%</span>
          </div>
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {perfAgg.statusDistribution.map(seg => (
              <div
                key={seg.name}
                style={{ width: `${perfAgg.totalKpis > 0 ? (seg.value / perfAgg.totalKpis) * 100 : 0}%`, backgroundColor: seg.color }}
                className="h-full"
                title={`${seg.name} (${seg.percent}%)`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium flex-wrap gap-2">
            {perfAgg.statusDistribution.map(seg => (
              <span key={seg.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }}></span>
                {seg.name === 'Completed' ? 'Achieved' : seg.name === 'Missed' ? 'Not Achieved' : seg.name} ({seg.percent}% • {seg.value} Indicators)
              </span>
            ))}
          </div>
        </div>

        {/* Sector Attainment Breakdown */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
            Attainment Rate by Cluster:
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {perfAgg.clusterBreakdown.map(c => {
              const tone = c.achievementRate >= 75 ? 'emerald' : c.achievementRate >= 60 ? 'amber' : 'rose';
              return (
                <div key={c.cluster} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex justify-between text-slate-800 mb-1 font-semibold">
                    <span>{c.cluster} ({c.entityCount})</span>
                    <span className={`font-bold font-mono ${tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-rose-700'}`}>
                      {c.achievementRate}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, c.achievementRate)}%` }}
                      className={`h-full rounded-full ${tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}
                    />
                  </div>
                </div>
              );
            })}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Statutory Cut-Off</span>
                <span className="text-xs font-black text-slate-800">
                  {new Date(quarterDueDate(period.financialYear, period.quarter)).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })} ({period.quarter} Clearance)
                </span>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                Active Cycle
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PRIORITY ATTENTION WATCHLIST: highest-risk institutions, computed */}
      <div className="bg-white border border-rose-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Needs attention</h2>
                <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                  {pulse.interventionCount} to review
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Organisations with the clearest delivery, finance, or reporting concerns
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('risks')}
            className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
          >
            <span>See all risks</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {watchlist.map(({ entity, worst, facts }) => {
            const critical = entity.riskLevel === 'CRITICAL';
            const high = entity.riskLevel === 'HIGH';
            const border = critical ? 'border-rose-200 bg-rose-50/30' : high ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-slate-50/50';
            const pill = critical ? 'bg-rose-100 text-rose-800' : high ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700';
            const label = critical ? 'Critical Risk' : high ? 'High Risk' : entity.riskLevel === 'MEDIUM' ? 'Monitor' : 'Low Risk';
            return (
              <div key={entity.id} className={`border rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition-shadow ${border}`}>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{entity.cluster}</span>
                      <h3 className="text-sm font-black text-slate-900 mt-0.5">{entity.name}</h3>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded shrink-0 ${pill}`}>
                        {label} · {entity.riskScore}/100
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                        <span className="text-[11px] font-bold text-slate-900 block">Main gap</span>
                        <p className="text-slate-800 font-medium leading-snug mt-0.5">
                        {worst
                            ? `${worst.percentageAchieved}% delivered against the year-to-date target for ${worst.name}.`
                          : 'No indicators reported for this period.'}
                      </p>
                    </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 leading-snug">
                        <span className="font-bold text-slate-900">Why review it:</span>{' '}
                        {facts.length > 0 ? facts.slice(0, 2).join(' • ') : 'No statutory or expenditure exceptions recorded.'}
                        {facts.length > 2 && <span className="text-slate-500"> + {facts.length - 2} more issue{facts.length - 2 === 1 ? '' : 's'}</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('risks')}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-center transition-colors cursor-pointer"
                  >
                    View details
                  </button>
                  <button
                    onClick={() => onNavigate('tasks')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-white text-center transition-colors cursor-pointer ${critical ? 'bg-rose-600 hover:bg-rose-700' : high ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                  >
                    Take action
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. RECENT STATUTORY ACTIVITY & AI EXECUTIVE INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Recent Activity Feed (lg:col-span-7), read from the real audit trail */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Recent Statutory Activity</h3>
                <p className="text-xs text-slate-500 mt-0.5">Submissions, department reviews, and ministerial directives</p>
              </div>
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Audit Trail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {recentActivity.length === 0 && (
                <p className="text-xs text-slate-500 p-3">No activity has been recorded yet.</p>
              )}
              {recentActivity.map(entry => {
                const negative = /CORRECTION|REJECTED|WITHHELD|NOTICE|DENIED|FAILED|DELETED/.test(entry.action);
                const positive = /APPROVED|VERIFIED|RELEASED|DISBURSED/.test(entry.action);
                const tone = negative ? 'rose' : positive ? 'emerald' : 'blue';
                const Icon = negative ? AlertCircle : positive ? CheckCircle2 : FileText;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${tone === 'rose' ? 'bg-rose-50/40 border-rose-100' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${tone === 'rose' ? 'bg-rose-100 text-rose-700' : tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 truncate">{entry.entityName || 'DSAC National Headquarters'}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(entry.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{entry.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">All actions logged under PFMA Section 38 compliance</span>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-emerald-800 hover:text-emerald-900 font-bold text-xs cursor-pointer flex items-center gap-1"
            >
              <span>Action Centre</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Analyst Insights (lg:col-span-5). Rule-based, generated from the same figures as above. */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#044332] to-[#02281e] text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-700/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Performance Analyst</h3>
                  <p className="text-[11px] text-emerald-200/70">Cross-Portfolio Intelligence (rule-based)</p>
                </div>
              </div>
              <button
                onClick={() => launchAnalystQuery('Which public entities currently require urgent management attention?')}
                className="text-xs text-emerald-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Launch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/40 text-xs text-emerald-100 leading-relaxed">
              {aiInsight.base}{' '}
              {aiInsight.top.length > 0 ? (
                <>
                  Early departmental intervention is recommended for{' '}
                  {aiInsight.top.map((w, i) => (
                    <React.Fragment key={w.entity.id}>
                      {i > 0 && ' and '}
                      <strong className="text-white">{w.entity.name}</strong>
                    </React.Fragment>
                  ))}.
                </>
              ) : (
                'No institution currently requires intervention.'
              )}
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">Suggested Inquiries:</span>
              <div className="space-y-1.5">
                <button
                  onClick={() => launchAnalystQuery('Which public entities currently require urgent management attention?')}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer truncate"
                >
                  → Which entities require immediate intervention?
                </button>
                {watchlist[0] && (
                  <button
                    onClick={() => launchAnalystQuery(`Why is ${watchlist[0].entity.shortCode} flagged?`)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer truncate"
                  >
                    → Why is {watchlist[0].entity.shortCode} flagged?
                  </button>
                )}
                <button
                  onClick={() => launchAnalystQuery('Analyse funding expenditure versus service delivery output variance')}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer truncate"
                >
                  → Compare spending against delivery
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-700/60 text-[11px] text-emerald-300/80 flex items-center justify-between">
            <span>Continuous statutory data correlation</span>
            <span className="text-emerald-300 font-bold">Live Synced</span>
          </div>
        </div>
      </div>

    </div>
  );
};
