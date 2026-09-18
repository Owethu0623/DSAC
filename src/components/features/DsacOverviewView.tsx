import React, { useState, useMemo } from 'react';
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
  Filter,
  Users,
  Compass,
  BookOpen
} from 'lucide-react';
import { PublicEntity, EntityCluster } from '../../types';

interface DsacOverviewViewProps {
  entities: PublicEntity[];
  reportsOutstanding: number;
  highRiskEntitiesCount: number;
  highRiskEntities: PublicEntity[];
  totalApprovedBudget: number;
  totalTransferredToDate: number;
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
  totalApprovedBudget,
  totalTransferredToDate,
  remainingDisbursement,
  transferRate,
  expenditureRate,
  formatZAR,
  onNavigate,
  onInvestigateEntity,
  onOpenDemo,
  onOpenGuide
}) => {
  const [selectedCluster, setSelectedCluster] = useState<string>('ALL');
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<'ALL' | 'ON_TRACK' | 'REVIEW' | 'RISK'>('ALL');
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2025/2026 (Current)');

  // Filtered entities based on cluster and health status
  const filteredWatchlist = useMemo(() => {
    return entities.filter(ent => {
      const matchesCluster = selectedCluster === 'ALL' || ent.cluster === selectedCluster;
      
      let matchesHealth = true;
      if (selectedHealthFilter === 'ON_TRACK') {
        matchesHealth = ent.riskLevel === 'LOW';
      } else if (selectedHealthFilter === 'REVIEW') {
        matchesHealth = ent.riskLevel === 'MEDIUM';
      } else if (selectedHealthFilter === 'RISK') {
        matchesHealth = ent.riskLevel === 'HIGH' || ent.riskLevel === 'CRITICAL';
      }

      return matchesCluster && matchesHealth;
    });
  }, [entities, selectedCluster, selectedHealthFilter]);

  // Cluster counts
  const clusterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entities.forEach(e => {
      counts[e.cluster] = (counts[e.cluster] || 0) + 1;
    });
    return counts;
  }, [entities]);

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
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option>2025/2026 (Current)</option>
              <option>2024/2025 (Audited)</option>
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

      {/* 2. ROW 1: THE 4 PRIMARY EXECUTIVE METRICS (FIRST THING USER SEES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Statutory Compliance Status */}
        <div 
          onClick={() => onNavigate('compliance')}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-teal-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
              Vote 40 Active
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">32</div>
            <div className="text-sm font-bold text-slate-800 mt-1.5">Monitored Portfolio</div>
            <div className="text-xs text-slate-500 mt-0.5">26 Public Entities • 6 Subsidized NPOs</div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-800">
            <span>Statutory Compliance &amp; Rules</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Quarterly Reports Status */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-100">
              <FileCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
              {reportsOutstanding} Pending Review
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">29 / 32</div>
            <div className="text-sm font-bold text-slate-800 mt-1.5">Q3 Submissions Filed</div>
            <div className="text-xs text-slate-500 mt-0.5">90.6% statutory submission rate</div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:text-amber-800">
            <span>Review Pending Reports</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Milestone Target Delivery */}
        <div 
          onClick={() => onNavigate('performance')}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              On Track for Q3
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none font-mono">64.2%</div>
            <div className="text-sm font-bold text-slate-800 mt-1.5">Target Delivery Rate</div>
            <div className="text-xs text-slate-500 mt-0.5">Across 480 verified annual indicators</div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
            <span>View Performance &amp; KPIs</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Vote 40 Disbursals */}
        <div 
          onClick={() => onNavigate('financials')}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-indigo-100">
              <Coins className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
              {transferRate.toFixed(1)}% Disbursed
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none truncate">
              {formatZAR(totalTransferredToDate)}
            </div>
            <div className="text-sm font-bold text-slate-800 mt-1.5">Transferred of {formatZAR(totalApprovedBudget)}</div>
            <div className="text-xs text-slate-500 mt-0.5">R 1.38B Remaining for Q4</div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700 group-hover:text-indigo-800">
            <span>Financial Monitoring</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 3. ROW 2: PORTFOLIO HEALTH & CLUSTER FILTER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Portfolio Status Filter:</span>
            
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedHealthFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedHealthFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All (32)
              </button>
              <button
                onClick={() => setSelectedHealthFilter('ON_TRACK')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedHealthFilter === 'ON_TRACK'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                On Track (26)
              </button>
              <button
                onClick={() => setSelectedHealthFilter('REVIEW')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedHealthFilter === 'REVIEW'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Under Review (3)
              </button>
              <button
                onClick={() => setSelectedHealthFilter('RISK')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedHealthFilter === 'RISK'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                Priority Action (3)
              </button>
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 self-start md:self-auto cursor-pointer"
          >
            <span>View Submissions &amp; Clearances</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cluster Tabs */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Cluster:</span>
          {[
            { id: 'ALL', label: 'All Sectors', count: 32 },
            { id: 'Performing Arts & Theatres', label: 'Performing Arts & Theatres', count: clusterCounts['Performing Arts & Theatres'] || 5 },
            { id: 'Heritage & Museums', label: 'Heritage & Museums', count: clusterCounts['Heritage & Museums'] || 13 },
            { id: 'Creative Industries & Film', label: 'Creative & Film', count: clusterCounts['Creative Industries & Film'] || 4 },
            { id: 'Sport & Recreation', label: 'Sport & Recreation', count: clusterCounts['Sport & Recreation'] || 2 },
            { id: 'Subsidized Cultural NPOs', label: 'Subsidized Cultural NPOs', count: clusterCounts['Subsidized Cultural NPOs'] || 6 },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCluster(c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCluster === c.id
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c.label} ({c.count})
            </button>
          ))}
        </div>
      </div>

      {/* 4. ROW 3: PRIORITY ATTENTION WATCHLIST (SCANNABLE & DIGESTIBLE) */}
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

      {/* 5. ROW 4: DIAGNOSTIC COMPARISONS (TWO BALANCED COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Milestone Progress & Attainment (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Milestone Delivery &amp; Attainment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Annual Performance Plan (APP) target delivery status</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                Q3 Verified
              </span>
            </div>

            {/* Delivery Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700">Portfolio Target Delivery Rate</span>
                <span className="font-black text-slate-900 font-mono text-sm">64.2%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: '64.2%' }} className="h-full bg-emerald-500" title="Achieved (64.2%)" />
                <div style={{ width: '18%' }} className="h-full bg-amber-400" title="In Progress (18.0%)" />
                <div style={{ width: '17.8%' }} className="h-full bg-rose-500" title="Lagging (17.8%)" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Achieved (64.2%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> In Progress (18.0%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Lagging (17.8%)
                </span>
              </div>
            </div>

            {/* Delivery by Sector breakdown */}
            <div className="mt-5 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Attainment by Sector:</span>
              
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span className="font-medium">Performing Arts &amp; Theatres (5)</span>
                    <span className="font-bold font-mono">72.4%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: '72.4%' }} className="h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span className="font-medium">Heritage &amp; Museums (13)</span>
                    <span className="font-bold font-mono">68.1%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: '68.1%' }} className="h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span className="font-medium">Subsidized Cultural NPOs (6)</span>
                    <span className="font-bold font-mono">65.0%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: '65.0%' }} className="h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span className="font-medium">Creative Industries &amp; Film (4)</span>
                    <span className="font-bold font-mono">61.5%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: '61.5%' }} className="h-full bg-amber-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span className="font-medium">Sport &amp; Recreation (2)</span>
                    <span className="font-bold font-mono text-rose-700">48.2%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: '48.2%' }} className="h-full bg-rose-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">Next Cut-Off:</span> 31 Jan 2026 (Q3 Clearance)
            </div>
            <button
              onClick={() => onNavigate('performance')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Performance Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Vote 40 Financial Oversight (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Vote 40 Financial Monitoring</h3>
                <p className="text-xs text-slate-500 mt-0.5">Approved allocations, transfer tranches, and expenditure burn rate</p>
              </div>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase">
                PFMA Sec 38
              </span>
            </div>

            {/* 4 Clean Metric Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approved</div>
                <div className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate">{formatZAR(totalApprovedBudget)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Parliament Vote</div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Transferred</div>
                <div className="text-base sm:text-lg font-black text-indigo-950 mt-1 truncate">{formatZAR(totalTransferredToDate)}</div>
                <div className="text-[10px] text-indigo-700 font-bold mt-0.5">{transferRate.toFixed(1)}% disbursed</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remaining</div>
                <div className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate">{formatZAR(remainingDisbursement)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Q4 Allocation</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Burn Rate</div>
                <div className="text-base sm:text-lg font-black text-emerald-950 mt-1">{expenditureRate.toFixed(1)}%</div>
                <div className="text-[10px] text-emerald-800 font-bold mt-0.5">Reported Spend</div>
              </div>
            </div>

            {/* Transfer vs Delivery Comparison Bar */}
            <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700">Financial Transfers (71.4%) vs Target Delivery (64.2%)</span>
                <span className="text-[11px] font-bold text-amber-700">+7.2% Variance</span>
              </div>
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-20 text-slate-500">Transferred:</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div style={{ width: `${transferRate}%` }} className="h-full bg-indigo-600 rounded-full" />
                  </div>
                  <span className="w-12 text-right font-mono font-bold text-slate-700">{transferRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-20 text-slate-500">Milestones:</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div style={{ width: '64.2%' }} className="h-full bg-emerald-600 rounded-full" />
                  </div>
                  <span className="w-12 text-right font-mono font-bold text-slate-700">64.2%</span>
                </div>
              </div>
            </div>

            {/* Note on release conditionality */}
            <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Statutory Note:</strong> Q4 subvention tranches remain contingent on accounting officer submission and clearance of verified Q3 performance reports.
              </span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Subvention tracking</span>
            <button
              onClick={() => onNavigate('financials')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Financial Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. ROW 5: RECENT STATUTORY ACTIVITY & AI EXECUTIVE INSIGHTS */}
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
