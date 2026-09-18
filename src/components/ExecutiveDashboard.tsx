import React, { useState } from 'react';
import { 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Briefcase, 
  DollarSign, 
  CheckCircle, 
  AlertOctagon, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  Filter,
  BarChart3,
  Calendar,
  Layers
} from 'lucide-react';
import { store } from '../services/store';
import { formatCompactZAR } from '../services/calculationEngine';
import { PublicEntity, RiskLevel } from '../types';

interface ExecutiveDashboardProps {
  onNavigateToEntity: (entityId: string) => void;
  onNavigateToEarlyWarning: () => void;
  onNavigateToAI: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateToEntity,
  onNavigateToEarlyWarning,
  onNavigateToAI,
}) => {
  const pulse = store.getPerformancePulse();
  const entities = store.entities;
  const kpis = store.kpis;
  const reports = store.reports;
  const riskAlerts = store.riskAlerts;

  const [selectedCluster, setSelectedCluster] = useState<string>('ALL');

  const filteredEntities = selectedCluster === 'ALL'
    ? entities
    : entities.filter(e => e.cluster === selectedCluster);

  // Total demographic tallies
  const totalStaff = entities.reduce((acc, e) => acc + e.demographics.totalStaff, 0);
  const totalAfrican = entities.reduce((acc, e) => acc + e.demographics.african, 0);
  const totalColoured = entities.reduce((acc, e) => acc + e.demographics.coloured, 0);
  const totalIndian = entities.reduce((acc, e) => acc + e.demographics.indian, 0);
  const totalWhite = entities.reduce((acc, e) => acc + e.demographics.white, 0);
  const totalFemale = entities.reduce((acc, e) => acc + e.demographics.female, 0);
  const totalDisabilities = entities.reduce((acc, e) => acc + e.demographics.personsWithDisabilities, 0);

  // Audit counts
  const cleanAuditCount = entities.filter(e => e.auditOutcome === 'CLEAN_AUDIT').length;
  const unqualifiedWithFindingsCount = entities.filter(e => e.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS').length;
  const qualifiedCount = entities.filter(e => e.auditOutcome === 'QUALIFIED').length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Official Heading & Context */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 w-fit px-2.5 py-1 rounded border border-emerald-200">
              Department of Sport, Arts and Culture • National Oversight
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Cabinet_Grotesk'] tracking-tight">
              Executive Performance Pulse
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Real-time monitoring and early warning across 26 Public Entities and 6 Non-Profit Organisations funded under the DSAC statutory vote.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToAI}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg text-sm font-semibold shadow transition-all hover:shadow-md"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Ask AI Performance Analyst</span>
            </button>
          </div>
        </div>

        {/* The Core Differentiator: Performance Pulse Traffic Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          
          {/* Green: On Track */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>On Track (Green)</span>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-1 font-['Cabinet_Grotesk']">
                {pulse.onTrackCount} <span className="text-sm font-normal text-slate-500">of {pulse.totalEntities}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Meeting delivery milestones with clean compliance.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              {Math.round((pulse.onTrackCount / pulse.totalEntities) * 100)}%
            </span>
          </div>

          {/* Amber: Requires Monitoring */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Requires Monitoring (Amber)</span>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-1 font-['Cabinet_Grotesk']">
                {pulse.monitoringCount} <span className="text-sm font-normal text-slate-500">entities</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Minor target trajectory delays or upcoming statutory deadlines.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
              {Math.round((pulse.monitoringCount / pulse.totalEntities) * 100)}%
            </span>
          </div>

          {/* Red: Requires Intervention */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-rose-800 text-xs font-bold uppercase tracking-wider">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Requires Intervention (Red)</span>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-1 font-['Cabinet_Grotesk']">
                {pulse.interventionCount} <span className="text-sm font-normal text-slate-500">entities</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Statutory deadline missed or funding/delivery variance gap.
              </p>
            </div>
            <button
              onClick={onNavigateToEarlyWarning}
              className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-1"
            >
              <span>View Alerts</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>

      {/* Financial Expenditure vs Service Delivery Variance Matrix */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              National Treasury PFMA Vote 37 Oversight
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Financial Disbursement vs. Service Delivery Output Variance
            </h2>
          </div>
          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            FY 2025/2026 • Tranches 1 to 3
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div>
            <div className="text-xs text-slate-400">Parliamentary Allocation</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {formatCompactZAR(pulse.totalAllocation)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Statutory baseline across 32 entities</div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Transferred Funds to Date</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {formatCompactZAR(pulse.totalTransferred)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">75.0% of annual budget released</div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Reported Entity Expenditure</div>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
              {formatCompactZAR(pulse.totalExpended)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{pulse.expenditureRate.toFixed(1)}% of transferred funds utilised</div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Variance Risk Flag</span>
              <span className="text-rose-400 text-[11px] font-bold">Requires Assessment</span>
            </div>
            <div className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              <strong>NAC & Boxing SA</strong> exhibit high fund absorption ({'>'}89%) against low verified target completion ({'<'}52%).
            </div>
          </div>
        </div>
      </div>

      {/* Target Status Breakdown & Audit Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Annual Target Tracking */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-700" />
              <h2 className="font-bold text-slate-900">Annual Target Status Distribution</h2>
            </div>
            <span className="text-xs text-slate-500">{kpis.length} Monitored KPIs</span>
          </div>

          <div className="space-y-4 mt-5">
            {/* On Track */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  On Track
                </span>
                <span className="text-slate-700">
                  {kpis.filter(k => k.status === 'ON_TRACK' || k.status === 'COMPLETED').length} KPIs ({Math.round((kpis.filter(k => k.status === 'ON_TRACK' || k.status === 'COMPLETED').length / kpis.length) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${(kpis.filter(k => k.status === 'ON_TRACK' || k.status === 'COMPLETED').length / kpis.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* At Risk */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  At Risk / Trajectory Lag
                </span>
                <span className="text-slate-700">
                  {kpis.filter(k => k.status === 'AT_RISK').length} KPIs ({Math.round((kpis.filter(k => k.status === 'AT_RISK').length / kpis.length) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${(kpis.filter(k => k.status === 'AT_RISK').length / kpis.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Missed */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  Deadline Missed / Target Deficit
                </span>
                <span className="text-slate-700">
                  {kpis.filter(k => k.status === 'MISSED').length} KPIs ({Math.round((kpis.filter(k => k.status === 'MISSED').length / kpis.length) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full" 
                  style={{ width: `${(kpis.filter(k => k.status === 'MISSED').length / kpis.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated from verified quarterly returns</span>
            <button 
              onClick={onNavigateToEarlyWarning}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Inspect Lagging Indicators</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Auditor-General Outcomes */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-slate-700" />
              <h2 className="font-bold text-slate-900">Auditor-General (AGSA) Findings</h2>
            </div>
            <span className="text-xs text-slate-500">2024/2025 Audit Outcomes</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
              <div className="text-2xl font-bold text-emerald-800 font-['Cabinet_Grotesk']">
                {cleanAuditCount}
              </div>
              <div className="text-xs font-semibold text-emerald-900 mt-1">Clean Audits</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">NFVF, PanSALB, TPC, BASA</div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
              <div className="text-2xl font-bold text-amber-800 font-['Cabinet_Grotesk']">
                {unqualifiedWithFindingsCount}
              </div>
              <div className="text-xs font-semibold text-amber-900 mt-1">Unqualified (Findings)</div>
              <div className="text-[10px] text-amber-700 mt-0.5">SAHRA, Ditsong Museums</div>
            </div>

            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-center">
              <div className="text-2xl font-bold text-rose-800 font-['Cabinet_Grotesk']">
                {qualifiedCount}
              </div>
              <div className="text-xs font-semibold text-rose-900 mt-1">Qualified Audits</div>
              <div className="text-[10px] text-rose-700 mt-0.5">NAC, Boxing SA</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Governance Impact:</strong> Entities with prior qualified audits are assigned a higher risk weighting in the Early Warning Engine.
          </div>
        </div>

      </div>

      {/* Job Creation & Employment Equity Demographics (Mandatory Requirement) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-emerald-700">
              National Transformation Indicators
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Job Creation & Staff Employment Equity Demographics
            </h2>
          </div>
          <span className="text-xs text-slate-500">Verified through entity payroll returns & grant rosters</span>
        </div>

        {/* Top Job Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>Youth Jobs Created</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-['Cabinet_Grotesk']">
              {pulse.totalYouthJobs.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Under-35 practitioners</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Permanent Staff</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-['Cabinet_Grotesk']">
              {pulse.totalPermanentJobs.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Across public entities</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Artists & Practitioners</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-['Cabinet_Grotesk']">
              {pulse.totalCreativePractitioners.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Funded via project grants</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Persons with Disabilities</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-['Cabinet_Grotesk']">
              {totalDisabilities} <span className="text-xs font-normal text-slate-500">({Math.round((totalDisabilities / totalStaff) * 100)}%)</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Target quota: 5.0%</div>
          </div>
        </div>

        {/* Demographic Breakdown Bars */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Public Sector Employment Equity Representation (Total Staff: {totalStaff.toLocaleString()})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Racial Equity */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Racial Representation</span>
                <span className="text-slate-500">Target vs Actual</span>
              </div>
              <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
                <div style={{ width: `${(totalAfrican / totalStaff) * 100}%` }} className="bg-emerald-600" title={`African: ${totalAfrican} (${Math.round((totalAfrican / totalStaff) * 100)}%)`}></div>
                <div style={{ width: `${(totalColoured / totalStaff) * 100}%` }} className="bg-blue-500" title={`Coloured: ${totalColoured} (${Math.round((totalColoured / totalStaff) * 100)}%)`}></div>
                <div style={{ width: `${(totalIndian / totalStaff) * 100}%` }} className="bg-amber-500" title={`Indian: ${totalIndian} (${Math.round((totalIndian / totalStaff) * 100)}%)`}></div>
                <div style={{ width: `${(totalWhite / totalStaff) * 100}%` }} className="bg-purple-500" title={`White: ${totalWhite} (${Math.round((totalWhite / totalStaff) * 100)}%)`}></div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 mt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> African: {Math.round((totalAfrican / totalStaff) * 100)}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Coloured: {Math.round((totalColoured / totalStaff) * 100)}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Indian: {Math.round((totalIndian / totalStaff) * 100)}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> White: {Math.round((totalWhite / totalStaff) * 100)}%</span>
              </div>
            </div>

            {/* Gender Equity */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Gender Equity</span>
                <span className="text-slate-500">{Math.round((totalFemale / totalStaff) * 100)}% Female Representation</span>
              </div>
              <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
                <div style={{ width: `${(totalFemale / totalStaff) * 100}%` }} className="bg-pink-600" title={`Female: ${totalFemale}`}></div>
                <div style={{ width: `${((totalStaff - totalFemale) / totalStaff) * 100}%` }} className="bg-slate-700" title={`Male: ${totalStaff - totalFemale}`}></div>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-600 mt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-600"></span> Female ({totalFemale})</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-700"></span> Male ({totalStaff - totalFemale})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Entities Directory Quick Table with Cluster Filters */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Entities Overview & Performance Trajectory
            </h2>
            <p className="text-xs text-slate-500">
              Click any entity to inspect its dedicated workspace, KPI milestones, and evidence documents.
            </p>
          </div>

          {/* Cluster Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs overflow-x-auto">
            {['ALL', 'Heritage & Museums', 'Creative Industries & Film', 'Sport & Recreation', 'Performing Arts & Theatres'].map(c => (
              <button
                key={c}
                onClick={() => setSelectedCluster(c)}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  selectedCluster === c
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c === 'ALL' ? 'All Clusters' : c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Entity Name</th>
                <th className="py-3 px-3">Type / Cluster</th>
                <th className="py-3 px-3">Audit Finding</th>
                <th className="py-3 px-3">Budget Allocation (ZAR)</th>
                <th className="py-3 px-3">Utilisation %</th>
                <th className="py-3 px-3">Risk Pulse</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntities.map(entity => {
                const spendingRate = entity.transferredAmountZAR > 0
                  ? Math.round((entity.reportedExpenditureZAR / entity.transferredAmountZAR) * 100)
                  : 0;

                return (
                  <tr 
                    key={entity.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onNavigateToEntity(entity.id)}
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{entity.name}</div>
                      <div className="text-[11px] text-slate-500">Contact: {entity.reportingOfficerName}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {entity.type === 'PUBLIC_ENTITY' ? 'Public Entity' : 'NPO'}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">{entity.cluster}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        entity.auditOutcome === 'CLEAN_AUDIT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entity.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {entity.auditOutcome.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-medium text-slate-800">
                      R {(entity.budgetAllocationZAR / 1_000_000).toFixed(2)}M
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{spendingRate}%</span>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${spendingRate > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${spendingRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        entity.riskLevel === 'LOW'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : entity.riskLevel === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {entity.riskLevel === 'LOW' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {entity.riskLevel === 'MEDIUM' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        {(entity.riskLevel === 'HIGH' || entity.riskLevel === 'CRITICAL') && <AlertOctagon className="w-3 h-3 text-rose-600" />}
                        <span>{entity.riskLevel} ({entity.riskScore})</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToEntity(entity.id);
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        <span>Workspace</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
