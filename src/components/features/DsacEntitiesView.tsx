import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  Search, 
  ShieldCheck, 
  ExternalLink, 
  Coins, 
  Briefcase, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  TrendingUp, 
  LayoutGrid, 
  Table as TableIcon, 
  CheckCircle2, 
  FileText, 
  Mail,
  Calendar,
  Clock,
  XCircle,
  AlertCircle,
  Award,
  Target,
  ChevronDown,
  Check,
  FolderLock,
  Download,
  Filter,
  BarChart3,
  Wallet,
  FileCheck,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { PublicEntity, KPIRecord, QuarterlyReport, ReportItem } from '../../types';
import { store } from '../../services/store';
import { formatZAR } from '../../services/financialService';
import { calculateEntityPerformanceSummary } from '../../services/calculationEngine';
import { getCurrentReportingPeriod } from '../../services/reportingPeriod';

interface DsacEntitiesViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
}

export const DsacEntitiesView: React.FC<DsacEntitiesViewProps> = ({
  entities,
  onSelectEntity,
  onOpenWorkspace
}) => {
  // List View Filter and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PUBLIC_ENTITY' | 'NPO'>('ALL');
  const [clusterFilter, setClusterFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Available clusters for filtering
  const allClusters = useMemo(() => {
    const set = new Set(entities.map(e => e.cluster));
    return Array.from(set).filter(Boolean);
  }, [entities]);

  // Filtered entities list
  const filteredEntities = useMemo(() => {
    return entities.filter(ent => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        ent.name.toLowerCase().includes(q) ||
        ent.shortCode.toLowerCase().includes(q) ||
        ent.headOfEntity.toLowerCase().includes(q) ||
        ent.cluster.toLowerCase().includes(q);

      const matchesType = typeFilter === 'ALL' || ent.type === typeFilter;
      const matchesCluster = clusterFilter === 'ALL' || ent.cluster === clusterFilter;
      const matchesRisk = riskFilter === 'ALL' || ent.riskLevel === riskFilter;

      return matchesSearch && matchesType && matchesCluster && matchesRisk;
    });
  }, [entities, searchTerm, typeFilter, clusterFilter, riskFilter]);

  // Aggregate stats across all entities
  const totalEntities = entities.length;
  const publicEntitiesCount = entities.filter(e => e.type === 'PUBLIC_ENTITY').length;
  const nposCount = entities.filter(e => e.type === 'NPO').length;
  const totalBudget = entities.reduce((acc, e) => acc + (e.budgetAllocationZAR || 0), 0);
  const totalDisbursed = entities.reduce((acc, e) => acc + (e.transferredAmountZAR || 0), 0);
  const totalSpent = entities.reduce((acc, e) => acc + (e.reportedExpenditureZAR || 0), 0);
  const cleanAuditsCount = entities.filter(e => e.auditOutcome === 'CLEAN_AUDIT').length;

  const handleOpenWorkspace = (entityId: string) => {
    if (onOpenWorkspace) {
      onOpenWorkspace(entityId);
    } else if (onSelectEntity) {
      onSelectEntity(entityId);
    }
  };

  /** One entity page for everyone: choosing an organisation opens it rather than a page of its own. */
  const handleCardSelect = (entityId: string) => handleOpenWorkspace(entityId);

  // =========================================================================
  // VIEW: ENTITIES DIRECTORY LIST (Default state when no entity is selected)
  // =========================================================================
  return (
    <div className="space-y-4 w-full">
      {/* Top Banner & Portfolio Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Building2 className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Statutory Oversight Directory: 26 Public Entities &amp; 6 Subsidized NPOs
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select any entity below to view its quarterly reports, annual targets &amp; delivery progress, and Vote 37 budgets &amp; spendings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Vote 37 Allocation:</span>
              <span className="text-base font-black text-emerald-800 font-mono">
                {formatZAR(totalBudget)}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Summary Directory Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">Total Portfolio</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">32 Institutions</div>
            <div className="text-[10px] text-slate-400">26 Schedule 3A + 6 Funded NPOs</div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
            <div className="text-[11px] font-semibold text-emerald-800">Transferred (Disbursed)</div>
            <div className="text-xl font-black text-emerald-800 mt-0.5 font-mono">{formatZAR(totalDisbursed)}</div>
            <div className="text-[10px] text-emerald-600 font-medium">
              {totalBudget > 0 ? Math.round((totalDisbursed / totalBudget) * 100) : 0}% Disbursed to Date
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200/70">
            <div className="text-[11px] font-semibold text-teal-800">Total Reported Spend</div>
            <div className="text-xl font-black text-teal-800 mt-0.5 font-mono">{formatZAR(totalSpent)}</div>
            <div className="text-[10px] text-teal-600 font-medium">
              {totalDisbursed > 0 ? Math.round((totalSpent / totalDisbursed) * 100) : 0}% Burn Rate
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">AGSA Clean Audits</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {cleanAuditsCount} of {totalEntities}
            </div>
            <div className="text-[10px] text-slate-400">Unqualified Audit Opinions</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search institution by name, code (e.g. SAHRA), CEO, or cluster..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Type Filter Buttons */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs shrink-0">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  typeFilter === 'ALL' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({totalEntities})
              </button>
              <button
                onClick={() => setTypeFilter('PUBLIC_ENTITY')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  typeFilter === 'PUBLIC_ENTITY' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Public Entities ({publicEntitiesCount})
              </button>
              <button
                onClick={() => setTypeFilter('NPO')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  typeFilter === 'NPO' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                NPOs ({nposCount})
              </button>
            </div>

            {/* Cluster Dropdown Filter */}
            <select
              value={clusterFilter}
              onChange={(e) => setClusterFilter(e.target.value)}
              aria-label="Filter by cluster"
              className="text-xs font-semibold py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Clusters</option>
              {allClusters.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Risk Dropdown Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              aria-label="Filter by risk level"
              className="text-xs font-semibold py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High / Critical Risk</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Content: Grid or Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntities.map((entity) => {
            const isCleanAudit = entity.auditOutcome === 'CLEAN_AUDIT';
            const spendRate = entity.transferredAmountZAR > 0
              ? Math.round((entity.reportedExpenditureZAR / entity.transferredAmountZAR) * 100)
              : 0;

            return (
              <div
                key={entity.id}
                onClick={() => handleCardSelect(entity.id)}
                className="bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all p-4 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Top Bar: Code Badge, Type Badge, Risk Level */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-emerald-900 transition-colors">
                        {entity.shortCode}
                      </span>
                      <div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          entity.type === 'PUBLIC_ENTITY' 
                            ? 'bg-teal-100 text-teal-800 border border-teal-200' 
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}>
                          {entity.type === 'PUBLIC_ENTITY' ? 'Schedule 3A' : 'Funded NPO'}
                        </span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5">
                          {entity.cluster}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      entity.riskLevel === 'LOW'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : entity.riskLevel === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {entity.riskLevel}
                    </span>
                  </div>

                  {/* Institution Name */}
                  <h3 className="font-black text-slate-900 text-sm mt-3 line-clamp-2 group-hover:text-emerald-900 transition-colors">
                    {entity.name}
                  </h3>

                  {/* Leadership details */}
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    CEO: <strong className="text-slate-700">{entity.headOfEntity}</strong>
                  </p>

                  {/* Financial & Compliance Metrics Grid */}
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400">Vote 37 Allocation</div>
                      <div className="font-black text-slate-900 mt-0.5 font-mono">
                        {formatZAR(entity.budgetAllocationZAR)}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                      <div className="text-[10px] text-emerald-700 font-medium">Burn Rate</div>
                      <div className="font-black text-emerald-800 mt-0.5 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{spendRate}% Spent</span>
                      </div>
                    </div>
                  </div>

                  {/* Audit Outcome & Compliance Score */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 text-[10px]">
                      Compliance: <strong className="text-slate-800">{entity.overallComplianceScore}%</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCleanAudit ? 'bg-teal-100 text-teal-800' :
                      entity.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS' ? 'bg-blue-100 text-blue-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {entity.auditOutcome === 'CLEAN_AUDIT' ? 'Clean Audit' : 'Unqualified'}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="w-full py-2 px-3 rounded-lg bg-slate-900 group-hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <span>View Reports, Targets &amp; Budgets</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Code &amp; Institution</th>
                  <th className="py-3 px-3">Type &amp; Cluster</th>
                  <th className="py-3 px-3">Accounting Officer</th>
                  <th className="py-3 px-3 text-right">Vote 37 Budget</th>
                  <th className="py-3 px-3 text-right">Spent / Disbursed</th>
                  <th className="py-3 px-3 text-center">Compliance</th>
                  <th className="py-3 px-3">Risk Level</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntities.map((entity) => {
                  const spendRate = entity.transferredAmountZAR > 0
                    ? Math.round((entity.reportedExpenditureZAR / entity.transferredAmountZAR) * 100)
                    : 0;

                  return (
                    <tr
                      key={entity.id}
                      onClick={() => handleCardSelect(entity.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shrink-0 group-hover:bg-emerald-900 transition-colors">
                            {entity.shortCode}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                              {entity.name}
                            </div>
                            <div className="text-[10px] text-slate-400">{entity.shortCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider block w-fit ${
                          entity.type === 'PUBLIC_ENTITY' ? 'bg-teal-100 text-teal-800' : 'bg-sky-100 text-sky-800'
                        }`}>
                          {entity.type === 'PUBLIC_ENTITY' ? 'Schedule 3A' : 'NPO'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{entity.cluster}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{entity.headOfEntity}</div>
                        <div className="text-[10px] text-slate-400">{entity.reportingOfficerName}</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-black text-slate-900 font-mono">
                          {formatZAR(entity.budgetAllocationZAR)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-slate-800 font-mono">
                          {formatZAR(entity.reportedExpenditureZAR)}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          {spendRate}% burn
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {entity.overallComplianceScore}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          entity.riskLevel === 'LOW' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          entity.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {entity.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardSelect(entity.id);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-emerald-800 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
