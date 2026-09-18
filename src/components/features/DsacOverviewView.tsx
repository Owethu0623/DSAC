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
  const [selectedYear, setSelectedYear] = useState('2025/2026 (Current)');
  const [selectedFinancialPeriod, setSelectedFinancialPeriod] = useState<'2025/26' | '2024/25' | '2023/24'>('2025/26');
  const [chartViewMode, setChartViewMode] = useState<'EXECUTION' | 'SECTORS'>('EXECUTION');

  // Handle financial period selection change across all components
  const handlePeriodChange = (period: '2025/26' | '2024/25' | '2023/24') => {
    setSelectedFinancialPeriod(period);
    if (period === '2025/26') {
      setSelectedYear('2025/2026 (Current)');
    } else if (period === '2024/25') {
      setSelectedYear('2024/2025 (Audited)');
    } else {
      setSelectedYear('2023/2024 (Prior)');
    }
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

  const normYear = selectedYear.includes('2024') 
    ? '2024/25' 
    : selectedYear.includes('2023') 
    ? '2023/24' 
    : '2025/26';

  // Dynamic financial aggregation recalculated automatically from all entities and NPOs
  const dynamicAgg = useMemo(() => {
    return store.getDepartmentFinancialAggregation(normYear, normYear === '2025/26' ? 'Q3' : 'FULL_YEAR');
  }, [normYear, tick, propTotalApproved, propTotalTransferred, propTotalExpended]);

  // The 4 Core Figures updated automatically
  const totalApprovedBudget = dynamicAgg.totalApprovedBudget || propTotalApproved || 0;
  const totalAmountDisbursedToDate = dynamicAgg.totalTransferredToDate || propTotalTransferred || 0;
  const totalAmountUtilisedToDate = dynamicAgg.totalReportedExpenditure || 0;
  
  const overallUtilisationPercentage = totalApprovedBudget > 0
    ? ((totalAmountUtilisedToDate / totalApprovedBudget) * 100).toFixed(1)
    : '0.0';

  const burnRateOfDisbursed = totalAmountDisbursedToDate > 0
    ? ((totalAmountUtilisedToDate / totalAmountDisbursedToDate) * 100).toFixed(1)
    : '0.0';

  const disbursementRate = totalApprovedBudget > 0
    ? ((totalAmountDisbursedToDate / totalApprovedBudget) * 100).toFixed(1)
    : '0.0';

  const undisbursedAllocation = Math.max(0, totalApprovedBudget - totalAmountDisbursedToDate);
  const disbursedUnutilised = Math.max(0, totalAmountDisbursedToDate - totalAmountUtilisedToDate);

  // Pulse metrics for the 3 top enhanced tabs
  const pulse = useMemo(() => {
    return store.getPerformancePulse();
  }, [tick, entities]);

  const reportsSubmittedCount = pulse.q3SubmittedCount || (32 - reportsOutstanding);
  const totalInstitutions = entities.length || 32;
  const submissionRate = Math.round((reportsSubmittedCount / totalInstitutions) * 100);

  // Authoritative financial overview aggregation synchronized with the selected financial period
  const finSummary = useMemo(() => {
    const periodAgg = store.getDepartmentFinancialAggregation(
      selectedFinancialPeriod,
      selectedFinancialPeriod === '2025/26' ? 'Q3' : 'FULL_YEAR'
    );

    const approved = periodAgg.totalApprovedBudget;
    const transferred = periodAgg.totalTransferredToDate;
    const spent = periodAgg.totalReportedExpenditure;
    const unspentDisbursed = Math.max(0, transferred - spent);
    const burnRate = transferred > 0 ? (spent / transferred) * 100 : 0;
    const unspentPct = Math.max(0, 100 - burnRate);
    const balance = Math.max(0, approved - transferred);
    const disbursedPct = approved > 0 ? (transferred / approved) * 100 : 0;
    const balancePct = Math.max(0, 100 - disbursedPct);
    const pe = periodAgg.peBudget;
    const npo = periodAgg.npoBudget;
    const pePct = periodAgg.pePercentage;
    const npoPct = Math.max(0, 100 - pePct);

    if (selectedFinancialPeriod === '2024/25') {
      return {
        periodLabel: '2024/25 FINANCIAL YEAR',
        dropdownLabel: '2024/25 Financial Year',
        approved,
        transferred,
        spent,
        unspentDisbursed,
        burnRate,
        unspentPct,
        balance,
        disbursedPct: 100,
        balancePct: 0,
        peApproved: pe,
        npoApproved: npo,
        pePct,
        npoPct,
        tranchesReleased: 4,
        tranchePaidText: `Q1-Q4 Paid (${formatCompactZAR(transferred)})`,
        trancheBalText: 'Audited Clearance (R 0)',
        pieData: [
          { name: 'Total Spent to Date', value: spent, color: '#059669', desc: 'Verified entity operational expenditure' },
          { name: 'Unspent Disbursed Balance', value: unspentDisbursed, color: '#0284c7', desc: 'Surplus/retention cleared in audited financials' }
        ]
      };
    } else if (selectedFinancialPeriod === '2023/24') {
      return {
        periodLabel: '2023/24 FINANCIAL YEAR',
        dropdownLabel: '2023/24 Financial Year',
        approved,
        transferred,
        spent,
        unspentDisbursed,
        burnRate,
        unspentPct,
        balance,
        disbursedPct: 100,
        balancePct: 0,
        peApproved: pe,
        npoApproved: npo,
        pePct,
        npoPct,
        tranchesReleased: 4,
        tranchePaidText: `Q1-Q4 Paid (${formatCompactZAR(transferred)})`,
        trancheBalText: 'Audited Clearance (R 0)',
        pieData: [
          { name: 'Total Spent to Date', value: spent, color: '#059669', desc: 'Verified entity operational expenditure' },
          { name: 'Unspent Disbursed Balance', value: unspentDisbursed, color: '#0284c7', desc: 'Surplus/retention cleared in audited financials' }
        ]
      };
    } else {
      // 2025/26 (Current)
      return {
        periodLabel: 'THIS FINANCIAL YEAR',
        dropdownLabel: 'This Financial Year',
        approved,
        transferred,
        spent,
        unspentDisbursed,
        burnRate,
        unspentPct,
        balance,
        disbursedPct,
        balancePct,
        peApproved: pe,
        npoApproved: npo,
        pePct,
        npoPct,
        tranchesReleased: 3,
        tranchePaidText: `Q1-Q3 Paid (${formatCompactZAR(transferred)})`,
        trancheBalText: `Q4 Bal (${formatCompactZAR(balance)})`,
        pieData: [
          { name: 'Total Spent to Date', value: spent, color: '#059669', desc: 'Expenditure verified by entity accounting officers' },
          { name: 'Unspent Disbursed Balance', value: unspentDisbursed, color: '#0284c7', desc: 'Disbursed funds in entity accounts for Q3-Q4 operations' }
        ]
      };
    }
  }, [selectedFinancialPeriod, tick, entities]);

  // Sector breakdown data for Pie Chart mode
  const sectorFinancialData = useMemo(() => {
    const clusterMap: Record<string, { name: string; approved: number; disbursed: number; utilised: number; count: number; color: string }> = {
      'Performing Arts & Theatres': { name: 'Performing Arts & Theatres', approved: 0, disbursed: 0, utilised: 0, count: 0, color: '#0d9488' },
      'Heritage & Museums': { name: 'Heritage & Museums', approved: 0, disbursed: 0, utilised: 0, count: 0, color: '#0284c7' },
      'Subsidized Cultural NPOs': { name: 'Subsidized Cultural NPOs', approved: 0, disbursed: 0, utilised: 0, count: 0, color: '#ec4899' },
      'Creative Industries & Film': { name: 'Creative & Film', approved: 0, disbursed: 0, utilised: 0, count: 0, color: '#8b5cf6' },
      'Sport & Recreation': { name: 'Sport & Recreation', approved: 0, disbursed: 0, utilised: 0, count: 0, color: '#f59e0b' },
    };

    entities.forEach(ent => {
      const clusterKey = ent.cluster || 'Heritage & Museums';
      if (!clusterMap[clusterKey]) {
        clusterMap[clusterKey] = { name: clusterKey, approved: 0, disbursed: 0, utilised: 0, count: 0, color: '#64748b' };
      }
      clusterMap[clusterKey].count += 1;
      clusterMap[clusterKey].approved += ent.budgetAllocationZAR || 0;
      clusterMap[clusterKey].disbursed += ent.transferredAmountZAR || 0;
      clusterMap[clusterKey].utilised += ent.reportedExpenditureZAR || 0;
    });

    return Object.values(clusterMap);
  }, [entities, tick]);

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
      desc: 'Transferred funds held by entities awaiting Q3 execution' 
    },
    { 
      name: 'Undisbursed Approved Allocation', 
      value: undisbursedAllocation, 
      color: '#94a3b8', 
      desc: 'Remaining DSAC Vote 40 allocation for Q4 release' 
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
      
      {/* 1. TOP STATUTORY BANNER & QUICK WORKFLOW BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Republic of South Africa
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Department of Sport, Arts and Culture • Vote 40
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-700">
                2025/2026 Q3 Statutory Cycle
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Executive Portfolio Oversight Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory monitoring, milestone verification, and early risk detection across all 32 institutions
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Year Selector */}
            <select
              value={selectedFinancialPeriod}
              onChange={(e) => handlePeriodChange(e.target.value as any)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option value="2025/26">2025/2026 (Current)</option>
              <option value="2024/25">2024/2025 (Audited)</option>
              <option value="2023/24">2023/2024 (Prior)</option>
            </select>

            {/* Toggleable Oversight Lifecycle */}
            <button
              onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <span>{showWorkflowGuide ? 'Hide Cycle' : 'Oversight Cycle'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showWorkflowGuide ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expandable Statutory Cycle Strip */}
        {showWorkflowGuide && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div 
                onClick={() => onNavigate('reports')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 group-hover:text-emerald-700">Submissions</span>
                </div>
                <div className="font-black text-xs text-slate-900 mt-1 flex items-center justify-between">
                  <span>1. REPORT</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Entities submit quarterly KPI data, expenditure and PoEs.</p>
              </div>

              <div 
                onClick={() => onNavigate('performance')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 group-hover:text-emerald-700">Tracking</span>
                </div>
                <div className="font-black text-xs text-slate-900 mt-1 flex items-center justify-between">
                  <span>2. MONITOR</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Live tracking of milestone delivery and Vote 40 transfers.</p>
              </div>

              <div 
                onClick={() => onNavigate('risks')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-300 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 group-hover:text-amber-700">Radar</span>
                </div>
                <div className="font-black text-xs text-slate-900 mt-1 flex items-center justify-between">
                  <span>3. IDENTIFY</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">System flags delivery variances and governance risks early.</p>
              </div>

              <div 
                onClick={() => onNavigate('tasks')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200/80 hover:border-rose-300 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 group-hover:text-rose-700">Action</span>
                </div>
                <div className="font-black text-xs text-slate-900 mt-1 flex items-center justify-between">
                  <span>4. ACT</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Issue formal directives, remedial tasks and PFMA resolutions.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. THE 3 ENHANCED TABS ON TOP OF THE FINANCIAL OVERVIEW DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tab 1: Number of Entities */}
        <div 
          onClick={() => onNavigate('entities')}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-teal-500 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-13 h-13 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-teal-100">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              PFMA 3A &amp; Subsidized
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                {totalInstitutions}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Total Organisations
              </span>
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1.5">
              Number of Entities
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              26 Public Entities • 6 Cultural Non-Profits (NPOs)
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-800">
            <span>View Entities Tab</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tab 2: Reports Submitted */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-13 h-13 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
              <FileCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              {submissionRate}% Compliant
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none font-mono">
                {reportsSubmittedCount}
              </span>
              <span className="text-sm font-black text-emerald-700 font-mono">
                / {totalInstitutions}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1.5">
              Reports Submitted
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              This Quarter ({submissionRate}%) • {reportsOutstanding} Clearance Required
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
            <span>Side View</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tab 3: Alerts on Overdue and High Risks */}
        <div 
          onClick={() => onNavigate('risks')}
          className="bg-white border border-rose-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-rose-500 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-13 h-13 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
              Action Required
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-rose-700 tracking-tight leading-none">
                {reportsOutstanding + highRiskEntitiesCount}
              </span>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">
                {reportsOutstanding} Overdue • {highRiskEntitiesCount} High Risk
              </span>
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1.5">
              Alerts on Overdue &amp; High Risks
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Statutory non-submissions &amp; Section 38 risk classifications
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700 group-hover:text-rose-800">
            <span>Side View</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                    Vote 40
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Burn rate of total money spent vs. disbursed total
                </p>
              </div>

              {/* Financial Period Dropdown with Arrow */}
              <div className="relative inline-block shrink-0">
                <select
                  value={selectedFinancialPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value as any)}
                  className="appearance-none cursor-pointer pl-3 pr-7 py-1.5 text-xs font-bold text-emerald-700 bg-white border border-emerald-500 rounded-lg hover:bg-emerald-50/50 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-colors shadow-xs"
                >
                  <option value="2025/26">This Financial Year</option>
                  <option value="2024/25">2024/25 Financial Year</option>
                  <option value="2023/24">2023/24 Financial Year</option>
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {finSummary.periodLabel}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-0.5">
                  {formatCompactZAR(finSummary.spent)}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Total Spent to Date
                </span>
                <span className="mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                  ({finSummary.burnRate.toFixed(1)}%)
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
                  <span className="font-bold text-emerald-700 font-mono">{finSummary.burnRate.toFixed(1)}%</span>
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
                  <span className="font-bold text-sky-700 font-mono">{finSummary.unspentPct.toFixed(1)}%</span>
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
                  All 26 PEs &amp; 6 Subsidized NPOs
                </div>
              </div>

              {/* Dual bar split */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                  <span className="flex items-center gap-1 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    26 PEs ({finSummary.pePct.toFixed(1)}%)
                  </span>
                  <span className="flex items-center gap-1 text-sky-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                    6 NPOs ({finSummary.npoPct.toFixed(1)}%)
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
                    ({finSummary.disbursedPct.toFixed(1)}%)
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

      {/* 4. MILESTONE DELIVERY & ATTAINMENT (UNDER FINANCIALS, ABOVE PRIORITY WATCHLIST) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">Milestone Delivery &amp; Attainment</h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                Q3 Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Annual Performance Plan (APP) target delivery status across all 32 institutions</p>
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
            <span className="font-bold text-slate-700">Portfolio Target Delivery Rate</span>
            <span className="font-black text-slate-900 font-mono text-sm">64.2%</span>
          </div>
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: '64.2%' }} className="h-full bg-emerald-500" title="Achieved (64.2%)" />
            <div style={{ width: '18%' }} className="h-full bg-amber-400" title="In Progress (18.0%)" />
            <div style={{ width: '17.8%' }} className="h-full bg-rose-500" title="Lagging (17.8%)" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Achieved (64.2% • 312 Indicators)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> In Progress (18.0% • 86 Indicators)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Lagging (17.8% • 82 Indicators)
            </span>
          </div>
        </div>

        {/* Sector Attainment Breakdown */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
            Attainment Rate by Cluster:
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex justify-between text-slate-800 mb-1 font-semibold">
                <span>Performing Arts &amp; Theatres (5)</span>
                <span className="font-bold font-mono text-emerald-700">72.4%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div style={{ width: '72.4%' }} className="h-full bg-emerald-500 rounded-full" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex justify-between text-slate-800 mb-1 font-semibold">
                <span>Heritage &amp; Museums (13)</span>
                <span className="font-bold font-mono text-emerald-700">68.1%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div style={{ width: '68.1%' }} className="h-full bg-emerald-500 rounded-full" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex justify-between text-slate-800 mb-1 font-semibold">
                <span>Subsidized Cultural NPOs (6)</span>
                <span className="font-bold font-mono text-emerald-700">65.0%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div style={{ width: '65.0%' }} className="h-full bg-emerald-500 rounded-full" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex justify-between text-slate-800 mb-1 font-semibold">
                <span>Creative Industries &amp; Film (4)</span>
                <span className="font-bold font-mono text-amber-700">61.5%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div style={{ width: '61.5%' }} className="h-full bg-amber-500 rounded-full" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex justify-between text-slate-800 mb-1 font-semibold">
                <span>Sport &amp; Recreation (2)</span>
                <span className="font-bold font-mono text-rose-700">48.2%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div style={{ width: '48.2%' }} className="h-full bg-rose-500 rounded-full" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Statutory Cut-Off</span>
                <span className="text-xs font-black text-slate-800">31 Jan 2026 (Q3 Clearance)</span>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                Active Cycle
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PRIORITY ATTENTION WATCHLIST (BELOW MILESTONE DELIVERY & ATTAINMENT) */}
      <div className="bg-white border border-rose-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Priority Attention Watchlist</h2>
                <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                  3 Flagged Institutions
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target delivery variances, expenditure pacing anomalies, and statutory compliance issues
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('risks')}
            className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Full Risk Radar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Structured Attention Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Card 1: Boxing South Africa */}
          <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/30 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sport &amp; Recreation</span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">Boxing South Africa (BSA)</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0">
                  Critical Risk
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-rose-900 block">Variance:</span>
                  <p className="text-slate-800 font-medium leading-snug">
                    40% target delivery rate (4 of 10 sanctioned bouts delivered).
                  </p>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-rose-100 text-[11px] text-slate-700 leading-snug">
                  Promoter licensing dispute halted scheduled tournaments; Q3 governance report 18 days overdue.
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-200/60 flex items-center gap-2">
              <button
                onClick={() => onNavigate('reports')}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-center transition-colors cursor-pointer"
              >
                Review Report
              </button>
              <button
                onClick={() => onNavigate('tasks')}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white text-center transition-colors cursor-pointer"
              >
                Directive
              </button>
            </div>
          </div>

          {/* Card 2: National Arts Council */}
          <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/30 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Creative &amp; Film</span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">National Arts Council (NAC)</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                  Requires Review
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-amber-900 block">Variance:</span>
                  <p className="text-slate-800 font-medium leading-snug">
                    Grant disbursement at 82% pacing vs 58% project evidence dossiers.
                  </p>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-100 text-[11px] text-slate-700 leading-snug">
                  Expenditure burn rate outpacing verified deliverables; review recommended prior to Q4 tranche release.
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center gap-2">
              <button
                onClick={() => onNavigate('financials')}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-center transition-colors cursor-pointer"
              >
                Audit Tranche
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white text-center transition-colors cursor-pointer"
              >
                Review Report
              </button>
            </div>
          </div>

          {/* Card 3: PACOFS */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Performing Arts</span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">PACOFS (Free State)</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0">
                  Audit Findings
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-900 block">Variance:</span>
                  <p className="text-slate-800 font-medium leading-snug">
                    3 unresolved AGSA audit findings outstanding &gt;90 days.
                  </p>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 leading-snug">
                  Theatre sound and stage lighting assets valuation reconciliation delayed past statutory timeline.
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2">
              <button
                onClick={() => onNavigate('risks')}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-center transition-colors cursor-pointer"
              >
                Risk Profile
              </button>
              <button
                onClick={() => onNavigate('tasks')}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white text-center transition-colors cursor-pointer"
              >
                Directive
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. RECENT STATUTORY ACTIVITY & AI EXECUTIVE INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Recent Activity Feed (lg:col-span-7) */}
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
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">Artscape Theatre Centre</span>
                    <span className="text-[10px] text-slate-400">1 hour ago</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Q3 Performance and Expenditure report reviewed and cleared by departmental oversight reviewer.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/40 border border-rose-100 text-xs">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">Boxing South Africa</span>
                    <span className="text-[10px] text-rose-600 font-bold">Directive Issued</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Ministerial corrective directive #DIR-2026-08 issued regarding sanctioned bout delivery and reporting.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">National Film &amp; Video Foundation</span>
                    <span className="text-[10px] text-slate-400">Yesterday</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Tranche 2 development grant verification approved following beneficiary evidence dossier clearance.
                  </p>
                </div>
              </div>
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

        {/* Right Column: AI Performance Analyst Insights (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#044332] to-[#02281e] text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-700/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">AI Performance Analyst</h3>
                  <p className="text-[11px] text-emerald-200/70">Cross-Portfolio Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('ai')}
                className="text-xs text-emerald-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Launch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/40 text-xs text-emerald-100 leading-relaxed">
              "Portfolio milestone attainment is healthy across 29 of 32 institutions. Early departmental intervention is recommended for <strong className="text-white">Boxing South Africa</strong> and <strong className="text-white">National Arts Council</strong> to prevent year-end subvention retentions."
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">Suggested Inquiries:</span>
              <div className="space-y-1.5">
                <button
                  onClick={() => onNavigate('ai')}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer truncate"
                >
                  → Which entities require immediate intervention?
                </button>
                <button
                  onClick={() => onNavigate('ai')}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer truncate"
                >
                  → Why is Boxing SA flagged for delivery delay?
                </button>
                <button
                  onClick={() => onNavigate('ai')}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer truncate"
                >
                  → Compare grant disbursements with evidence dossiers
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
