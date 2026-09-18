import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Coins, 
  Target, 
  TrendingUp, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles
} from 'lucide-react';
import { store } from '../../services/store';
import { FinancialQuarter } from '../../types/financial';
import { formatZAR, normalizeFinancialYear, normalizeQuarter } from '../../services/calculationEngine';

interface EntityVisualAnalyticsProps {
  entityId: string;
  financialYear?: string;
  initialQuarter?: FinancialQuarter | 'FULL_YEAR';
  className?: string;
  showQuarterSelector?: boolean;
  showYearSelector?: boolean;
  onYearChange?: (year: string) => void;
  overrideTargets?: Array<{
    title: string;
    current: string;
    target: string;
    pct: number;
    color: string;
  }>;
}

export const EntityVisualAnalytics: React.FC<EntityVisualAnalyticsProps> = ({
  entityId,
  financialYear = '2025/26',
  initialQuarter = 'Q3',
  className = '',
  showQuarterSelector = true,
  showYearSelector = true,
  onYearChange,
}) => {
  // Financial year state (sync with prop or allow in-component switching)
  const [activeYear, setActiveYear] = useState<string>(() => normalizeFinancialYear(financialYear));
  
  // Selected reporting period (Q1, Q2, Q3, Q4, FULL_YEAR)
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialQuarter | 'FULL_YEAR'>(initialQuarter);
  
  // State for showing detailed KPI breakdown
  const [showKpiTable, setShowKpiTable] = useState<boolean>(true);

  // Synchronize when parent prop changes
  useEffect(() => {
    const norm = normalizeFinancialYear(financialYear);
    setActiveYear(norm);
  }, [financialYear]);

  useEffect(() => {
    setSelectedQuarter(initialQuarter);
  }, [initialQuarter]);

  // Handle year selection
  const handleYearSelect = (newYear: string) => {
    const norm = normalizeFinancialYear(newYear);
    setActiveYear(norm);
    if (onYearChange) {
      onYearChange(norm);
    }
  };

  // Authoritative Entity Metadata
  const entity = store.entities.find(e => e.id === entityId) || store.entities[0];

  // =========================================================================
  // 1. AUTHORITATIVE PERFORMANCE SUMMARY FROM CALCULATION ENGINE
  // =========================================================================
  const performanceSummary = useMemo(() => {
    return store.getEntityPerformanceSummary(entity.id, activeYear, selectedQuarter);
  }, [entity.id, activeYear, selectedQuarter]);

  // =========================================================================
  // 2. AUTHORITATIVE FINANCIAL SUMMARY FROM CALCULATION ENGINE
  // =========================================================================
  const financialSummary = useMemo(() => {
    return store.getEntityFinancialSummary(entity.id, activeYear, selectedQuarter);
  }, [entity.id, activeYear, selectedQuarter]);

  // Performance Pie Chart Data: only items with value > 0
  const performanceChartData = useMemo(() => {
    return performanceSummary.statusDistribution
      .map(item => ({
        name: item.name,
        value: item.value,
        color: item.color,
        textColor: item.textColor,
        bgPill: item.bgPill,
        icon: item.name === 'Completed' ? CheckCircle2 :
              item.name === 'In Progress' ? Clock :
              item.name === 'Not Started' ? AlertCircle : XCircle,
      }))
      .filter(item => item.value > 0);
  }, [performanceSummary]);

  // Budget Data Calculations
  const approvedBudget = financialSummary.approvedAmount;
  const budgetUtilised = financialSummary.ytdActual;
  const rawRemaining = financialSummary.remainingBudget;
  const remainingBudget = Math.max(0, rawRemaining);
  const isOverspent = rawRemaining < 0;
  const utilisationPercent = financialSummary.utilisationPercent;

  // Budget Pie Chart Data
  const budgetChartData = useMemo(() => {
    if (approvedBudget <= 0 && budgetUtilised <= 0) {
      return [{ name: 'No Allocation', value: 1, color: '#cbd5e1', displayValue: 'R 0' }];
    }

    if (isOverspent) {
      return [
        {
          name: 'Budget Utilised (Approved)',
          value: approvedBudget,
          displayValue: formatZAR(approvedBudget),
          color: '#0d9488', // teal-600
        },
        {
          name: 'Excess Overspend',
          value: Math.abs(rawRemaining),
          displayValue: formatZAR(Math.abs(rawRemaining)),
          color: '#e11d48', // rose-600
        },
      ];
    }

    const slices = [
      {
        name: 'Budget Utilised',
        value: budgetUtilised,
        displayValue: formatZAR(budgetUtilised),
        color: '#0d9488', // teal-600
      },
      {
        name: 'Remaining Budget',
        value: remainingBudget,
        displayValue: formatZAR(remainingBudget),
        color: '#cbd5e1', // slate-300
      },
    ].filter(item => item.value > 0);

    return slices.length > 0 ? slices : [{ name: 'Zero Expenditure', value: 1, color: '#e2e8f0', displayValue: 'R 0' }];
  }, [approvedBudget, budgetUtilised, remainingBudget, isOverspent, rawRemaining]);

  // Tooltips
  const renderPerformanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = performanceSummary.totalKpis > 0 
        ? Math.round((data.value / performanceSummary.totalKpis) * 100) 
        : 0;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-xl border border-slate-700">
          <div className="font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <div className="text-slate-300 mt-1">
            <strong>{data.value}</strong> of {performanceSummary.totalKpis} targets ({pct}%)
          </div>
        </div>
      );
    }
    return null;
  };

  const renderBudgetTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = approvedBudget > 0 ? ((data.value / approvedBudget) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-xl border border-slate-700">
          <div className="font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <div className="text-slate-300 mt-1">
            Amount: <strong className="text-white">{formatZAR(data.value)}</strong>
          </div>
          <div className="text-slate-400 text-[11px]">
            {pct}% of approved appropriation
          </div>
        </div>
      );
    }
    return null;
  };

  const isAuditedYear = activeYear === '2024/25' || activeYear === '2023/24';

  return (
    <div className={`space-y-4 ${className}`} id="entity-visual-analytics-section">
      {/* Visual Analytics Header with Financial Year & Period Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  Visual Analytics — {entity.name}
                </h3>
                {isAuditedYear && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    Audited AFS
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative distribution of gazetted Annual Performance Plan targets and PFMA Section 38 budget utilization.
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Financial Year Selector & Period Selector */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Financial Year Selector */}
          {showYearSelector && (
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded-lg p-1 text-xs">
              <span className="text-[11px] font-bold text-slate-600 px-1.5 flex items-center gap-1">
                <span>FY:</span>
              </span>
              {(['2024/25', '2025/26', '2026/27', '2023/24'] as const).map(yr => {
                const isActive = activeYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => handleYearSelect(yr)}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    title={`Switch to ${yr} Financial Year`}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          )}

          {/* Reporting Period (Quarter) Selector */}
          {showQuarterSelector && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
              <span className="text-[11px] font-bold text-slate-500 px-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Period:</span>
              </span>
              {(['Q1', 'Q2', 'Q3', 'Q4', 'FULL_YEAR'] as const).map(q => {
                const label = q === 'FULL_YEAR' ? 'Full Year' : q;
                const isActive = selectedQuarter === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedQuarter(q)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    title={`Evaluate performance & spend through ${label}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Two Balanced Visual Analytics Cards (Performance Status & Budget Utilisation) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* ================================================================= */}
        {/* 1. PERFORMANCE STATUS PIE CHART CARD                              */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between" id="performance-status-chart-card">
          <div>
            {/* Header with Title & Quick Insight */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-700" />
                  <span>Performance Status</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Institutional targets distribution ({activeYear} • {selectedQuarter === 'FULL_YEAR' ? 'Full Year' : selectedQuarter})
                </p>
              </div>

              {/* Immediate Glance: "X of Y completed" */}
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 border border-emerald-200 text-emerald-800">
                {performanceSummary.completedCount} of {performanceSummary.totalKpis} completed
              </span>
            </div>

            {/* Content: Chart + Detailed Numerical Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center py-4">
              
              {/* Pie / Donut Chart */}
              <div className="h-48 w-full flex items-center justify-center relative">
                {performanceSummary.totalKpis === 0 ? (
                  <div className="text-xs text-slate-400 italic text-center">No performance targets recorded</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={performanceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {performanceChartData.map((entry, index) => (
                          <Cell key={`perf-cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={renderPerformanceTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {/* Center Badge in Donut */}
                {performanceSummary.totalKpis > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total</span>
                    <span className="text-xl font-black text-slate-900 leading-tight">
                      {performanceSummary.totalKpis}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">KPI Items</span>
                  </div>
                )}
              </div>

              {/* Exact Numerical Legend & Values Matching Chart */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800 pb-1.5 border-b border-slate-100">
                  <span>Total Performance Items</span>
                  <span className="font-black text-slate-900 text-sm font-mono">{performanceSummary.totalKpis}</span>
                </div>

                {/* Completed */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-900">Completed</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-950 font-mono text-xs">{performanceSummary.completedCount}</span>
                    <span className="text-[10px] text-emerald-700 ml-1">
                      ({performanceSummary.completedPercent}%)
                    </span>
                  </div>
                </div>

                {/* In Progress */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/70 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span className="font-bold text-blue-900">In Progress</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-blue-950 font-mono text-xs">{performanceSummary.inProgressCount}</span>
                    <span className="text-[10px] text-blue-700 ml-1">
                      ({performanceSummary.inProgressPercent}%)
                    </span>
                  </div>
                </div>

                {/* Not Started */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                    <span className="font-bold text-slate-700">Not Started</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-800 font-mono text-xs">{performanceSummary.notStartedCount}</span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      ({performanceSummary.notStartedPercent}%)
                    </span>
                  </div>
                </div>

                {/* Missed */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                    <span className="font-bold text-rose-900">Missed</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-rose-950 font-mono text-xs">{performanceSummary.missedCount}</span>
                    <span className="text-[10px] text-rose-700 ml-1">
                      ({performanceSummary.missedPercent}%)
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Footnote */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Scorecard Source: Gazetted Annual Performance Plan</span>
            <span className="font-bold text-slate-700">
              {performanceSummary.completedCount + performanceSummary.inProgressCount} Active / Achieved
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. BUDGET UTILISATION PIE CHART CARD                              */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between" id="budget-utilisation-chart-card">
          <div>
            {/* Header with Title & Period Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Budget Utilisation</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Authoritative YTD expenditure vs. approved Vote 37 appropriation ({activeYear})
                </p>
              </div>

              {/* Utilisation Percentage Badge */}
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-full text-xs font-black inline-block ${
                  isOverspent
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : utilisationPercent >= 70
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {utilisationPercent}% Utilised
                </span>
              </div>
            </div>

            {/* Content: Chart + Financial Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center py-4">
              
              {/* Pie / Donut Chart */}
              <div className="h-48 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {budgetChartData.map((entry, index) => (
                        <Cell key={`budget-cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={renderBudgetTooltip} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Badge in Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {selectedQuarter === 'FULL_YEAR' ? 'Full Year' : selectedQuarter}
                  </span>
                  <span className={`text-xl font-black leading-tight ${isOverspent ? 'text-rose-700' : 'text-slate-900'}`}>
                    {utilisationPercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Burn Rate</span>
                </div>
              </div>

              {/* Exact Numerical Legend & Summary Matching Chart */}
              <div className="space-y-2 text-xs">
                {/* Approved Annual Budget */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-bold text-slate-700">Approved Budget</span>
                  <span className="font-black text-slate-900 font-mono text-sm">{formatZAR(approvedBudget)}</span>
                </div>

                {/* Utilised */}
                <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
                      <span className="font-bold text-teal-950">Budget Utilised</span>
                    </div>
                    <span className="font-black text-teal-950 font-mono text-xs">{formatZAR(budgetUtilised)}</span>
                  </div>
                  <div className="text-[10px] text-teal-700 mt-1 flex items-center justify-between">
                    <span>YTD Spend through {selectedQuarter === 'FULL_YEAR' ? 'Q4' : selectedQuarter}</span>
                    <span className="font-bold font-mono">{utilisationPercent}% of Budget</span>
                  </div>
                </div>

                {/* Remaining / Deficit */}
                <div className={`p-2.5 rounded-lg border ${
                  isOverspent 
                    ? 'bg-rose-50/80 border-rose-300 text-rose-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOverspent ? 'bg-rose-600' : 'bg-slate-400'}`} />
                      <span className="font-bold">
                        {isOverspent ? 'Net Budget Deficit' : 'Remaining Budget'}
                      </span>
                    </div>
                    <span className={`font-black font-mono text-xs ${isOverspent ? 'text-rose-700' : 'text-slate-900'}`}>
                      {isOverspent ? `- ${formatZAR(Math.abs(rawRemaining))}` : formatZAR(remainingBudget)}
                    </span>
                  </div>
                  <div className="text-[10px] mt-1 flex items-center justify-between text-slate-500">
                    <span>{isOverspent ? 'Exceeds gazetted allocation' : 'Available for remaining quarters'}</span>
                    <span className="font-bold font-mono">
                      {isOverspent ? `+${(utilisationPercent - 100).toFixed(1)}% over` : `${(100 - utilisationPercent).toFixed(1)}% remaining`}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Fiscal Assessment:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    isOverspent 
                      ? 'bg-rose-100 text-rose-800' 
                      : utilisationPercent >= 65 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {financialSummary.financialStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Footnote */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Authoritative Engine: PFMA Section 38(1)(j)</span>
            <span className="font-bold text-slate-700">
              Requested: {formatZAR(financialSummary.requestedAmount)}
            </span>
          </div>
        </div>

      </div>

      {/* Collapsible Key Targets Performance Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowKpiTable(prev => !prev)}
          className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-left cursor-pointer border-b border-slate-200"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-800" />
            <span className="text-xs sm:text-sm font-black text-slate-900">
              Authoritative APP Scorecard Breakdown — {activeYear} ({selectedQuarter === 'FULL_YEAR' ? 'Full Year Target' : `${selectedQuarter} Cumulative Target`})
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
              {performanceSummary.items.length} KPIs
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>Overall Achievement: {performanceSummary.overallAchievementRate}%</span>
            {showKpiTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showKpiTable && (
          <div className="p-4 sm:p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-2.5">KPI Name & Programme</th>
                    <th className="pb-2.5 text-right">Target for Period</th>
                    <th className="pb-2.5 text-right">Actual Achieved</th>
                    <th className="pb-2.5 text-right">% Achieved</th>
                    <th className="pb-2.5 text-right">Progress Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {performanceSummary.items.map(kpi => (
                    <tr key={kpi.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 pr-4">
                        <div className="font-bold text-slate-900">{kpi.name}</div>
                        <div className="text-[11px] text-slate-500">{kpi.programmeName}</div>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-700">
                        {kpi.targetDisplay}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                        {kpi.actualDisplay}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold">
                        <span className={
                          kpi.percentageAchieved >= 100 ? 'text-emerald-700' :
                          kpi.percentageAchieved >= 70 ? 'text-blue-700' :
                          kpi.percentageAchieved > 0 ? 'text-amber-700' : 'text-slate-400'
                        }>
                          {kpi.percentageAchieved}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          kpi.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : kpi.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : kpi.status === 'NOT_STARTED'
                            ? 'bg-slate-100 text-slate-700 border border-slate-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {kpi.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
