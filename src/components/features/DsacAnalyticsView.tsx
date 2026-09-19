import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Coins, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Building2, 
  Sparkles, 
  PieChart,
  Briefcase,
  HelpCircle,
  Award,
  Clock,
  Layers,
  FileCheck,
  Calendar,
  Target
} from 'lucide-react';
import { PublicEntity, EntityType } from '../../types';
import { AIPerformanceAnalyst } from '../AIPerformanceAnalyst';
import { store } from '../../services/store';
import { normalizeFinancialYear } from '../../services/calculationEngine';
import { getCurrentReportingPeriod, isFinancialYearClosed } from '../../services/reportingPeriod';

interface DsacAnalyticsViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
  onOpenSideView?: (feature: 'compliance' | 'performance' | 'support' | 'reports' | 'entities' | 'risks', entityId?: string) => void;
}

export const DsacAnalyticsView: React.FC<DsacAnalyticsViewProps> = ({
  entities,
  onSelectEntity,
  onOpenWorkspace,
  onOpenSideView,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'targets' | 'demographics' | 'ai'>('visual');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PUBLIC_ENTITY' | 'NPO'>('ALL');
  const [clusterFilter, setClusterFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentReportingPeriod().financialYear);
  // Current year: year-to-date at the reporting quarter. A closed year: the full year.
  const quarterFor = (fy: string) => (isFinancialYearClosed(normalizeFinancialYear(fy)) ? 'FULL_YEAR' as const : getCurrentReportingPeriod().quarter);

  // Authoritative Department Aggregation from Calculation Engine
  const deptFinancialAgg = useMemo(() => {
    return store.getDepartmentFinancialAggregation(selectedYear, quarterFor(selectedYear), typeFilter);
  }, [selectedYear, typeFilter]);

  const deptPerfAgg = useMemo(() => {
    return store.getDepartmentPerformanceAggregation(selectedYear, quarterFor(selectedYear), typeFilter);
  }, [selectedYear, typeFilter]);

  // Clusters list
  const clusters = useMemo(() => {
    const set = new Set<string>();
    entities.forEach(e => {
      if (e.cluster) set.add(e.cluster);
    });
    return Array.from(set).sort();
  }, [entities]);

  // Filtered entities
  const filteredEntities = useMemo(() => {
    return entities.filter(e => {
      const matchesType = typeFilter === 'ALL' || e.type === typeFilter;
      const matchesCluster = clusterFilter === 'ALL' || e.cluster === clusterFilter;
      const matchesSearch = searchQuery.trim() === '' || 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.shortCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesCluster && matchesSearch;
    });
  }, [entities, typeFilter, clusterFilter, searchQuery]);

  // Core portfolio totals from Authoritative Department Aggregation
  const totalBudget = deptFinancialAgg.totalApprovedBudget;
  const totalTransferred = deptFinancialAgg.totalTransferredToDate;
  const totalReportedExpenditure = deptFinancialAgg.totalReportedExpenditure;
  const transferPercentage = deptFinancialAgg.transferRate;
  const expenditurePercentage = deptFinancialAgg.expenditureRate;

  const avgComplianceScore = useMemo(() => {
    if (filteredEntities.length === 0) return 0;
    const sum = filteredEntities.reduce((acc, e) => acc + (e.overallComplianceScore || 0), 0);
    return Math.round(sum / filteredEntities.length);
  }, [filteredEntities]);

  const cleanAuditCount = useMemo(() => {
    return filteredEntities.filter(e => e.auditOutcome === 'CLEAN_AUDIT').length;
  }, [filteredEntities]);

  const compliantCount = useMemo(() => {
    return filteredEntities.filter(e => e.riskLevel === 'LOW').length;
  }, [filteredEntities]);

  const monitoringCount = useMemo(() => {
    return filteredEntities.filter(e => e.riskLevel === 'MEDIUM').length;
  }, [filteredEntities]);

  const nonCompliantCount = useMemo(() => {
    return filteredEntities.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL').length;
  }, [filteredEntities]);

  const totalJobsCreated = useMemo(() => {
    return filteredEntities.reduce((sum, e) => {
      const stats = e.jobStats || { permanentJobs: 0, youthJobsCreated: 0 };
      return sum + (stats.permanentJobs || 0) + (stats.youthJobsCreated || 0);
    }, 0);
  }, [filteredEntities]);

  const totalYouthJobs = useMemo(() => {
    return filteredEntities.reduce((sum, e) => sum + (e.jobStats?.youthJobsCreated || 0), 0);
  }, [filteredEntities]);

  const totalPractitioners = useMemo(() => {
    return filteredEntities.reduce((sum, e) => sum + (e.jobStats?.creativeSectorPractitionersSupported || 0), 0);
  }, [filteredEntities]);

  // Cluster breakdown data using entity financial summaries for selected year
  const clusterData = useMemo(() => {
    const map: { [key: string]: { budget: number; transferred: number; count: number } } = {};
    filteredEntities.forEach(e => {
      const c = e.cluster || 'Other';
      if (!map[c]) {
        map[c] = { budget: 0, transferred: 0, count: 0 };
      }
      const fin = store.getEntityFinancialSummary(e.id, selectedYear, quarterFor(selectedYear));
      map[c].budget += fin.approvedAmount;
      map[c].transferred += fin.ytdActual;
      map[c].count += 1;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      budget: data.budget,
      transferred: data.transferred,
      count: data.count,
      percent: data.budget > 0 ? Math.round((data.transferred / data.budget) * 100) : 0,
    })).sort((a, b) => b.budget - a.budget);
  }, [filteredEntities, selectedYear]);

  // Top 5 job delivering entities
  const topDeliveringEntities = useMemo(() => {
    return [...filteredEntities]
      .sort((a, b) => {
        const totalA = (a.jobStats?.permanentJobs || 0) + (a.jobStats?.youthJobsCreated || 0);
        const totalB = (b.jobStats?.permanentJobs || 0) + (b.jobStats?.youthJobsCreated || 0);
        return totalB - totalA;
      })
      .slice(0, 5);
  }, [filteredEntities]);

  const permanentJobsTotal = useMemo(() => {
    return filteredEntities.reduce((sum, e) => sum + (e.jobStats?.permanentJobs || 0), 0);
  }, [filteredEntities]);

  const temporaryJobsTotal = useMemo(() => {
    return filteredEntities.reduce((sum, e) => sum + (e.jobStats?.temporaryJobs || 0), 0);
  }, [filteredEntities]);

  const totalStaffCount = useMemo(() => {
    return filteredEntities.reduce((sum, e) => sum + (e.demographics?.totalStaff || 0), 0);
  }, [filteredEntities]);

  const totalFemaleCount = useMemo(() => {
    return filteredEntities.reduce((sum, e) => sum + (e.demographics?.female || 0), 0);
  }, [filteredEntities]);

  const totalDisabilityCount = useMemo(() => {
    return filteredEntities.reduce((sum, e) => sum + (e.demographics?.personsWithDisabilities || 0), 0);
  }, [filteredEntities]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      
      {/* Top Header & Tab Switcher (KISS: Clear, simple, no clutter) */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Portfolio Analytics &amp; Delivery Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated performance, budget transfers, and compliance across 26 Public Entities and 6 NPOs (32 Total)
          </p>
        </div>

        {/* Tab Controls: Simple Toggle directly matching GovTech Requirement A */}
        <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'visual'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Visual Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('targets')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'targets'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-blue-600" />
            <span>Annual Targets (In Progress / Missed)</span>
          </button>
          <button
            onClick={() => setActiveTab('demographics')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'demographics'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Staff Demographics &amp; Jobs</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Executive Inquiries</span>
          </button>
        </div>
      </div>

      {/* Mode 2: AI Performance Analyst View */}
      {activeTab === 'ai' ? (
        <AIPerformanceAnalyst />
      ) : activeTab === 'visual' ? (
        /* Mode 1: Visual Analytics (KISS Principle) */
        <div className="space-y-5">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Financial Year Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
                <span className="text-[11px] font-bold text-slate-500 px-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>FY:</span>
                </span>
                {(['2024/25', '2025/26', '2026/27', '2023/24'] as const).map(yr => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`px-2 py-0.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      normalizeFinancialYear(selectedYear) === yr
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    typeFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All (32)
                </button>
                <button
                  onClick={() => setTypeFilter('PUBLIC_ENTITY')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    typeFilter === 'PUBLIC_ENTITY' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Public Entities (26)
                </button>
                <button
                  onClick={() => setTypeFilter('NPO')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    typeFilter === 'NPO' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cultural NPOs (6)
                </button>
              </div>

              <select
                value={clusterFilter}
                onChange={(e) => setClusterFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer hidden md:block"
              >
                <option value="ALL">All Sectors &amp; Clusters</option>
                {clusters.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search entity name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 4 Simple, Bold Top Cards (KISS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Budget & Tranches */}
            <div 
              onClick={() => onOpenSideView?.('support', 'ent-sahra')}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
              title="Click to inspect support and tranche allocation in side view"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Statutory Allocation</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
                  <Coins className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                R {(totalBudget / 1_000_000_000).toFixed(2)}B
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span>Transferred: R {(totalTransferred / 1_000_000_000).toFixed(2)}B</span>
                  <span className="font-bold text-emerald-800">{transferPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${transferPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: PFMA Compliance Rate */}
            <div 
              onClick={() => onOpenSideView?.('compliance')}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
              title="Click to inspect compliance in side view"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Portfolio Compliance</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                {avgComplianceScore}%
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-semibold">{compliantCount} On Track</span>
                <span className="text-rose-600 font-semibold">{nonCompliantCount} High/Critical ({monitoringCount} Med)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Section 38(1)(j) Written Assurance</div>
            </div>

            {/* Card 3: AGSA Audit Outcomes */}
            <div 
              onClick={() => onOpenSideView?.('compliance')}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-teal-300 transition-all cursor-pointer group"
              title="Click to inspect AGSA audit outcomes"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">AGSA Clean Audits</span>
                <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 group-hover:scale-110 transition-transform">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                {cleanAuditCount} <span className="text-sm font-semibold text-slate-400">/ {filteredEntities.length}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                <span>Clean Opinion Rate:</span>
                <span className="font-bold text-teal-800">
                  {filteredEntities.length > 0 ? Math.round((cleanAuditCount / filteredEntities.length) * 100) : 0}%
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Unqualified with zero findings</div>
            </div>

            {/* Card 4: MTSF Job Creation */}
            <div 
              onClick={() => onOpenSideView?.('performance')}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
              title="Click to inspect performance and jobs in side view"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">MTSF Job Delivery</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                {totalJobsCreated.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                <span>Youth Under 35:</span>
                <span className="font-bold text-amber-900">{totalYouthJobs.toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Practitioners supported: {totalPractitioners.toLocaleString()}</div>
            </div>

          </div>

          {/* ROW 2: Two Clear Visual Charts (KISS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Chart 1: Budget vs Transferred by Cluster (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Budget Allocation vs. Transferred by Sector
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Statutory Vote 37 MTEF Tranche Distribution
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenSideView?.('support', 'ent-sahra')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1 hover:underline"
                  >
                    <span>Inspect Tranches</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Simple Horizontal Bar Comparison */}
                <div className="py-4 space-y-4">
                  {clusterData.map(c => (
                    <div 
                      key={c.name}
                      onClick={() => onOpenSideView?.('support', 'ent-sahra')}
                      className="group cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
                            {c.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {c.count} {c.count === 1 ? 'Entity' : 'Entities'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">
                            R {(c.transferred / 1_000_000).toFixed(1)}M
                          </span>
                          <span className="text-slate-400 font-normal"> / R {(c.budget / 1_000_000).toFixed(1)}M</span>
                          <span className="ml-2 font-bold text-emerald-800 text-[11px]">({c.percent}%)</span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-emerald-600 group-hover:bg-emerald-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, c.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span>Tranche Rule: Submitted Dec into 4 equal quarters (25% each)</span>
                <span className="font-semibold text-emerald-800">Portfolio Average: {transferPercentage}% Disbursed</span>
              </div>
            </div>

            {/* Chart 2: Compliance Distribution & Audit Status (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      PFMA Compliance &amp; AGSA Health
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Section 38(1)(j) &amp; Tabling Verification
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenSideView?.('compliance')}
                    className="text-xs text-blue-700 hover:text-blue-800 font-semibold cursor-pointer flex items-center gap-1 hover:underline"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Compliance Tier Breakdown */}
                <div className="py-4 space-y-3">
                  <div 
                    onClick={() => onOpenSideView?.('compliance')}
                    className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <div>
                        <div className="text-xs font-bold text-emerald-950">Compliant (Score ≥ 80%)</div>
                        <div className="text-[10px] text-emerald-700">Satisfies all statutory PFMA quarterly returns</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-950">{compliantCount}</span>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        {filteredEntities.length > 0 ? Math.round((compliantCount / filteredEntities.length) * 100) : 0}%
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => onOpenSideView?.('compliance')}
                    className="p-3 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                      <div>
                        <div className="text-xs font-bold text-amber-950">Watchlist / Monitoring (60 – 79%)</div>
                        <div className="text-[10px] text-amber-700">Minor reporting lags or single target deviation</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-amber-950">{monitoringCount}</span>
                      <div className="text-[10px] text-amber-700 font-medium">
                        {filteredEntities.length > 0 ? Math.round((monitoringCount / filteredEntities.length) * 100) : 0}%
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => onOpenSideView?.('compliance')}
                    className="p-3 rounded-lg bg-rose-50/70 border border-rose-100 flex items-center justify-between cursor-pointer hover:bg-rose-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                      <div>
                        <div className="text-xs font-bold text-rose-950">Non-Compliant / Remedial (&lt; 60%)</div>
                        <div className="text-[10px] text-rose-700">Audit qualifications, overdue reports, intervention</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-rose-950">{nonCompliantCount}</span>
                      <div className="text-[10px] text-rose-700 font-medium">
                        {filteredEntities.length > 0 ? Math.round((nonCompliantCount / filteredEntities.length) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Outcomes Summary */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-700 mb-2">AGSA Audit Breakdown:</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-sm font-black text-emerald-800">{cleanAuditCount}</div>
                      <div className="text-[9px] text-slate-500">Clean Audit</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-sm font-black text-amber-800">
                        {filteredEntities.filter(e => e.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS').length}
                      </div>
                      <div className="text-[9px] text-slate-500">Unqualified</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-sm font-black text-rose-800">
                        {filteredEntities.filter(e => e.auditOutcome === 'QUALIFIED' || e.auditOutcome === 'DISCLAIMER').length}
                      </div>
                      <div className="text-[9px] text-slate-500">Qualified</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center pt-3 border-t border-slate-100">
                National Treasury PFMA Early Warning Standards
              </div>
            </div>

          </div>

          {/* ROW 3: Top Delivering Entities & Entity Scorecard (KISS) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Institution Scorecard &amp; Delivery Ranking ({filteredEntities.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click any entity to inspect its detailed compliance, performance, or support dossier
                </p>
              </div>
              <div className="text-xs text-slate-500">
                Showing {filteredEntities.length} of {entities.length} total institutions
              </div>
            </div>

            {/* Simple Scannable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                    <th className="py-2.5 px-3">Institution</th>
                    <th className="py-2.5 px-3">Type &amp; Cluster</th>
                    <th className="py-2.5 px-3 text-right">Budget Allocation</th>
                    <th className="py-2.5 px-3 text-right">Transferred</th>
                    <th className="py-2.5 px-3 text-center">Compliance</th>
                    <th className="py-2.5 px-3 text-center">Risk Level</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntities.slice(0, 12).map(entity => {
                    const transferredPct = entity.budgetAllocationZAR > 0 
                      ? Math.round((entity.transferredAmountZAR / entity.budgetAllocationZAR) * 100) 
                      : 0;

                    return (
                      <tr 
                        key={entity.id} 
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => onOpenSideView?.('compliance', entity.id)}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                            {entity.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{entity.shortCode} • {entity.headOfEntity}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            entity.type === 'PUBLIC_ENTITY' 
                              ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {entity.type === 'PUBLIC_ENTITY' ? 'Public Entity' : 'NPO'}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[160px]">
                            {entity.cluster}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          R {(entity.budgetAllocationZAR / 1_000_000).toFixed(1)}M
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-emerald-800">
                            R {(entity.transferredAmountZAR / 1_000_000).toFixed(1)}M
                          </div>
                          <div className="text-[10px] text-slate-400">{transferredPct}% Disbursed</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block font-black text-xs px-2 py-0.5 rounded-full ${
                            entity.overallComplianceScore >= 80 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : entity.overallComplianceScore >= 60 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {entity.overallComplianceScore}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            entity.riskLevel === 'LOW' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            entity.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            entity.riskLevel === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-rose-600 text-white animate-pulse'
                          }`}>
                            {entity.riskLevel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSideView?.('support', entity.id);
                            }}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredEntities.length > 12 && (
              <div className="text-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Showing top 12 of {filteredEntities.length} institutions. Use search or sector filter to refine.
                </span>
              </div>
            )}
          </div>

        </div>
      ) : activeTab === 'targets' ? (
        /* Mode 3: Annual Targets Breakdown (Requirement a: in progress, not started, deadline missed) */
        <div className="space-y-5">
          {/* 4 Status KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">In Progress</span>
                <span className="p-1 rounded-md bg-blue-100 text-blue-800">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-blue-900 mt-2">
                {deptPerfAgg.totalInProgressCount} Targets
              </div>
              <div className="text-[11px] text-blue-600 mt-1">
                {deptPerfAgg.totalKpisEvaluated > 0 
                  ? Math.round((deptPerfAgg.totalInProgressCount / deptPerfAgg.totalKpisEvaluated) * 100) 
                  : 0}% of portfolio targets active
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Not Started</span>
                <span className="p-1 rounded-md bg-slate-100 text-slate-700">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {deptPerfAgg.totalNotStartedCount} Targets
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {deptPerfAgg.totalKpisEvaluated > 0 
                  ? Math.round((deptPerfAgg.totalNotStartedCount / deptPerfAgg.totalKpisEvaluated) * 100) 
                  : 0}% scheduled for later quarters
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Deadline Missed</span>
                <span className="p-1 rounded-md bg-rose-100 text-rose-800">
                  <AlertCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-rose-700 mt-2">
                {deptPerfAgg.totalMissedCount} Targets
              </div>
              <div className="text-[11px] text-rose-600 font-semibold mt-1">
                Requires remedial directives
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Achieved / On Track</span>
                <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-2">
                {deptPerfAgg.totalCompletedCount} Targets
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                {deptPerfAgg.totalKpisEvaluated > 0 
                  ? Math.round((deptPerfAgg.totalCompletedCount / deptPerfAgg.totalKpisEvaluated) * 100) 
                  : 0}% achievement rate
              </div>
            </div>
          </div>

          {/* Targets Table by Entity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Annual Targets Status by Public Entity &amp; NPO
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Breakdown of annual targets by milestone completion status ({selectedYear} Cycle).
                </p>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter entity targets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Public Entity / NPO</th>
                    <th className="py-3 px-3 text-center">Total Targets</th>
                    <th className="py-3 px-3 text-center text-blue-700">In Progress</th>
                    <th className="py-3 px-3 text-center text-slate-600">Not Started</th>
                    <th className="py-3 px-3 text-center text-rose-700">Deadline Missed</th>
                    <th className="py-3 px-3 text-center text-emerald-800">Achieved</th>
                    <th className="py-3 px-3 text-center">Overall Pacing</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {deptPerfAgg.entityBreakdown
                    .filter(eb => 
                      searchQuery.trim() === '' || 
                      eb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      eb.shortName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(ent => (
                      <tr key={ent.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{ent.name}</div>
                          <div className="text-[10px] text-slate-400">{ent.shortName} • {ent.cluster}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-black text-slate-800">
                          {ent.totalKpis}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full font-bold text-blue-700 bg-blue-50 border border-blue-200">
                            {ent.inProgressCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full font-bold text-slate-600 bg-slate-100 border border-slate-200">
                            {Math.max(0, ent.totalKpis - ent.completedCount - ent.inProgressCount - ent.missedCount)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${
                            ent.missedCount > 0 
                              ? 'text-rose-700 bg-rose-50 border border-rose-200 font-black' 
                              : 'text-slate-400 bg-slate-50'
                          }`}>
                            {ent.missedCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                            {ent.completedCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ent.status === 'ON_TRACK' ? 'bg-emerald-100 text-emerald-800' :
                            ent.status === 'AT_RISK' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {ent.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onSelectEntity?.(ent.id)}
                            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Mode 4: Staff Demographics & Job Creation by Entity (Requirement a) */
        <div className="space-y-5">
          {/* Top Job Stats Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Permanent Jobs</span>
                <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                  <Briefcase className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {permanentJobsTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Full-time institutional headcount
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Temporary Jobs</span>
                <span className="p-1 rounded-md bg-blue-100 text-blue-800">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {temporaryJobsTotal.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Contract &amp; seasonal production staff
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Youth Jobs (Under 35)</span>
                <span className="p-1 rounded-md bg-indigo-100 text-indigo-800">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-700 mt-2">
                {totalYouthJobs.toLocaleString()}
              </div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                National Youth Employment Accord
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Creatives Supported</span>
                <span className="p-1 rounded-md bg-amber-100 text-amber-800">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-amber-700 mt-2">
                {totalPractitioners.toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-600 font-semibold mt-1">
                Artists, curators &amp; performers
              </div>
            </div>
          </div>

          {/* Demographics and Job Creation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Staff Demographics &amp; Job Creation Statistics by Entity
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Employment Equity and job creation metrics reported under Section 38 PFMA and MTSF priorities.
                </p>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter demographics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Public Entity / NPO</th>
                    <th className="py-3 px-3 text-right">Perm Jobs</th>
                    <th className="py-3 px-3 text-right">Temp Jobs</th>
                    <th className="py-3 px-3 text-right text-indigo-700">Youth Jobs</th>
                    <th className="py-3 px-3 text-right text-amber-700">Creatives</th>
                    <th className="py-3 px-3 text-center">African / Col / Ind / Wht</th>
                    <th className="py-3 px-3 text-center">Female / Male</th>
                    <th className="py-3 px-3 text-center">Disabilities</th>
                    <th className="py-3 px-3 text-right">Total Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredEntities.map(e => {
                    const demo = e.demographics || {
                      african: 0, coloured: 0, indian: 0, white: 0,
                      female: 0, male: 0, youth: 0, personsWithDisabilities: 0, totalStaff: 0
                    };
                    const jobs = e.jobStats || {
                      permanentJobs: 0, temporaryJobs: 0, youthJobsCreated: 0,
                      creativeSectorPractitionersSupported: 0, targetJobsAnnual: 0
                    };

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{e.name}</div>
                          <div className="text-[10px] text-slate-400">{e.shortCode} • {e.cluster}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">
                          {jobs.permanentJobs.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600">
                          {jobs.temporaryJobs.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-indigo-700">
                          {jobs.youthJobsCreated.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-amber-700">
                          {jobs.creativeSectorPractitionersSupported.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center text-[11px] text-slate-600">
                          {demo.african}% / {demo.coloured}% / {demo.indian}% / {demo.white}%
                        </td>
                        <td className="py-3 px-3 text-center text-[11px] text-slate-600">
                          {demo.female}% / {demo.male}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700">
                            {demo.personsWithDisabilities} staff
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          {demo.totalStaff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
