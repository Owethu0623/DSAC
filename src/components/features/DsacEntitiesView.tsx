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

interface DsacEntitiesViewProps {
  entities: PublicEntity[];
  initialEntityId?: string | null;
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const DsacEntitiesView: React.FC<DsacEntitiesViewProps> = ({
  entities,
  initialEntityId = null,
  onSelectEntity,
  onOpenWorkspace,
  onNavigateToTab
}) => {
  // Selected Entity state for drill-down view
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(initialEntityId);
  
  // Detail View Sub-tabs: 'reports' | 'targets' | 'financials'
  const [detailTab, setDetailTab] = useState<'reports' | 'targets' | 'financials'>('reports');

  // List View Filter and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PUBLIC_ENTITY' | 'NPO'>('ALL');
  const [clusterFilter, setClusterFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selected quarter for reports inspection
  const [selectedQuarterFilter, setSelectedQuarterFilter] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ALL');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

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

  // Currently selected entity for drill-down
  const activeEntity = useMemo(() => {
    if (!selectedEntityId) return null;
    return entities.find(e => e.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

  // Data for the active entity
  const entityReports = useMemo(() => {
    if (!activeEntity) return [];
    return store.reports.filter(r => r.entityId === activeEntity.id);
  }, [activeEntity]);

  const entityKpis = useMemo(() => {
    if (!activeEntity) return [];
    return store.kpis.filter(k => k.entityId === activeEntity.id);
  }, [activeEntity]);

  const entityPerfSummary = useMemo(() => {
    if (!activeEntity) return null;
    return calculateEntityPerformanceSummary(activeEntity.id, '2025/26', 'FULL_YEAR', store.kpis, activeEntity);
  }, [activeEntity]);

  const entityFinancialSummary = useMemo(() => {
    if (!activeEntity) return null;
    return store.getEntityFinancialSummary(activeEntity.id, '2026/27', 'Q3');
  }, [activeEntity]);

  const handleOpenWorkspace = (entityId: string) => {
    if (onOpenWorkspace) {
      onOpenWorkspace(entityId);
    } else if (onSelectEntity) {
      onSelectEntity(entityId);
    }
  };

  const handleCardSelect = (entityId: string) => {
    setSelectedEntityId(entityId);
    setDetailTab('reports');
    if (onSelectEntity) {
      onSelectEntity(entityId);
    }
  };

  // =========================================================================
  // VIEW: ENTITY DETAIL (When an entity is selected)
  // =========================================================================
  if (activeEntity) {
    const burnRatePercent = activeEntity.transferredAmountZAR > 0
      ? Math.round((activeEntity.reportedExpenditureZAR / activeEntity.transferredAmountZAR) * 100)
      : 0;

    const disbursementRatePercent = activeEntity.budgetAllocationZAR > 0
      ? Math.round((activeEntity.transferredAmountZAR / activeEntity.budgetAllocationZAR) * 100)
      : 0;

    const remainingUnspent = Math.max(0, activeEntity.transferredAmountZAR - activeEntity.reportedExpenditureZAR);
    const remainingSubvention = Math.max(0, activeEntity.budgetAllocationZAR - activeEntity.transferredAmountZAR);

    const filteredReports = entityReports.filter(r => {
      if (selectedQuarterFilter === 'ALL') return true;
      return r.quarter === selectedQuarterFilter;
    });

    const approvedReportsCount = entityReports.filter(r => r.submissionStatus === 'APPROVED').length;
    const underReviewReportsCount = entityReports.filter(r => r.submissionStatus === 'UNDER_REVIEW' || r.submissionStatus === 'SUBMITTED').length;
    const overdueReportsCount = entityReports.filter(r => r.submissionStatus === 'OVERDUE' || r.submissionStatus === 'CORRECTION_REQUIRED').length;

    const overallAttainment = entityPerfSummary ? entityPerfSummary.overallAchievementRate : 0;
    const onTrackKpisCount = entityKpis.filter(k => k.status === 'ON_TRACK' || k.status === 'COMPLETED').length;
    const atRiskKpisCount = entityKpis.filter(k => k.status === 'AT_RISK').length;
    const missedKpisCount = entityKpis.filter(k => k.status === 'MISSED').length;

    return (
      <div className="space-y-4 w-full">
        {/* Top Navigation & Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedEntityId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Entities ({totalEntities})</span>
            </button>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-slate-900">{activeEntity.shortCode}</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-500 truncate max-w-[200px] hidden sm:inline">{activeEntity.name}</span>
            </div>
          </div>

          {/* Quick Entity Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap hidden md:inline">
              Switch Entity:
            </span>
            <select
              value={activeEntity.id}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              aria-label="Switch Entity"
              className="text-xs font-semibold py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {entities.map(e => (
                <option key={e.id} value={e.id}>
                  {e.shortCode} - {e.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleOpenWorkspace(activeEntity.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
            >
              <span>Open Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Entity Profile Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs border border-slate-800">
                {activeEntity.shortCode}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                    {activeEntity.name}
                  </h1>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activeEntity.type === 'PUBLIC_ENTITY'
                      ? 'bg-teal-100 text-teal-800 border border-teal-200'
                      : 'bg-sky-100 text-sky-800 border border-sky-200'
                  }`}>
                    {activeEntity.type === 'PUBLIC_ENTITY' ? 'PFMA Schedule 3A Public Entity' : 'Subsidized Cultural NPO'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activeEntity.riskLevel === 'LOW'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : activeEntity.riskLevel === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {activeEntity.riskLevel} Risk
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span><strong>Cluster:</strong> {activeEntity.cluster}</span>
                  <span>•</span>
                  <span><strong>CEO / Accounting Officer:</strong> {activeEntity.headOfEntity}</span>
                  <span>•</span>
                  <span><strong>Reporting Officer:</strong> {activeEntity.reportingOfficerName}</span>
                </div>
              </div>
            </div>

            {/* Key Vital Status Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 shrink-0">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-right sm:text-left lg:text-right">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Vote 40 Allocation</div>
                <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                  {formatZAR(activeEntity.budgetAllocationZAR)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/70 text-right sm:text-left lg:text-right">
                <div className="text-[10px] font-semibold text-emerald-700 uppercase">Compliance Score</div>
                <div className="text-sm font-black text-emerald-800 mt-0.5 flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeEntity.overallComplianceScore}%</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-right sm:text-left lg:text-right">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">AGSA Audit</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">
                  {activeEntity.auditOutcome === 'CLEAN_AUDIT' ? 'Clean Audit' :
                   activeEntity.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS' ? 'Unqualified' :
                   'Qualified'}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-teal-50/70 border border-teal-200/70 text-right sm:text-left lg:text-right">
                <div className="text-[10px] font-semibold text-teal-700 uppercase">Target Attainment</div>
                <div className="text-sm font-black text-teal-800 mt-0.5">
                  {overallAttainment}% Achieved
                </div>
              </div>
            </div>
          </div>

          {/* Primary Drill-Down Tabs */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDetailTab('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                detailTab === 'reports'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Reports ({entityReports.length})</span>
              {underReviewReportsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full font-black">
                  {underReviewReportsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setDetailTab('targets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                detailTab === 'targets'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>2. Targets &amp; Delivery ({entityKpis.length})</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                overallAttainment >= 80 ? 'bg-emerald-400 text-emerald-950' : 'bg-amber-400 text-slate-950'
              }`}>
                {overallAttainment}%
              </span>
            </button>

            <button
              onClick={() => setDetailTab('financials')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                detailTab === 'financials'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>3. Budgets &amp; Spendings</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-teal-200 text-teal-950 rounded-full font-black">
                {burnRatePercent}% Spent
              </span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            TAB 1: REPORTS (Quarterly Reports & Clearances)
            =================================================================== */}
        {detailTab === 'reports' && (
          <div className="space-y-4">
            {/* Reports Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <div className="text-[11px] font-semibold text-slate-500">Statutory Submissions</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{entityReports.length} Reports</div>
                <div className="text-[10px] text-slate-400">Quarterly statutory cycle</div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
                <div className="text-[11px] font-semibold text-emerald-700">Approved by DSAC</div>
                <div className="text-xl font-black text-emerald-800 mt-0.5">{approvedReportsCount} Cleared</div>
                <div className="text-[10px] text-emerald-600">Tranche disbursement released</div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/70">
                <div className="text-[11px] font-semibold text-amber-700">Under Review / Submitted</div>
                <div className="text-xl font-black text-amber-800 mt-0.5">{underReviewReportsCount} In Progress</div>
                <div className="text-[10px] text-amber-600">Awaiting clearance sign-off</div>
              </div>

              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200/70">
                <div className="text-[11px] font-semibold text-rose-700">Action Required</div>
                <div className="text-xl font-black text-rose-800 mt-0.5">{overdueReportsCount} Pending</div>
                <div className="text-[10px] text-rose-600">Overdue or correction needed</div>
              </div>
            </div>

            {/* Quarter Filter Chips */}
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Filter Quarter:</span>
                <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                  {(['ALL', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
                    <button
                      key={q}
                      onClick={() => setSelectedQuarterFilter(q)}
                      className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        selectedQuarterFilter === q
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {q === 'ALL' ? 'All Quarters' : q}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-xs text-slate-500">
                Showing {filteredReports.length} of {entityReports.length} filings
              </span>
            </div>

            {/* Reports List */}
            <div className="space-y-3">
              {filteredReports.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <div className="font-bold text-slate-700">No quarterly reports found for this filter</div>
                  <div className="text-xs mt-1">Select "All Quarters" to view statutory filings.</div>
                </div>
              ) : (
                filteredReports.map((report) => {
                  const isExpanded = expandedReportId === report.id;
                  const isApproved = report.submissionStatus === 'APPROVED';
                  const isUnderReview = report.submissionStatus === 'UNDER_REVIEW' || report.submissionStatus === 'SUBMITTED';
                  const isOverdue = report.submissionStatus === 'OVERDUE';
                  const isCorrection = report.submissionStatus === 'CORRECTION_REQUIRED';

                  return (
                    <div
                      key={report.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                    >
                      {/* Report Header Row */}
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-900 text-emerald-100 flex items-center justify-center font-black text-sm shrink-0">
                            {report.quarter}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-900 text-sm">
                                {report.quarter} Statutory Performance &amp; Expenditure Report
                              </h3>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                isUnderReview ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                isOverdue ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                isCorrection ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {report.submissionStatus.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                              <span><strong>Financial Year:</strong> {report.financialYear}</span>
                              <span>•</span>
                              <span><strong>Due Date:</strong> {new Date(report.dueDate).toLocaleDateString()}</span>
                              {report.submittedAt && (
                                <>
                                  <span>•</span>
                                  <span><strong>Submitted:</strong> {new Date(report.submittedAt).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right sm:text-right">
                            <div className="text-[10px] text-slate-400">Quarterly Spend</div>
                            <div className="text-xs font-black text-slate-900 font-mono">
                              {formatZAR(report.fundsSpentThisQuarterZAR)}
                            </div>
                          </div>

                          <button
                            onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Items' : 'Inspect Report'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Official DSAC Review Notes */}
                      {report.reviewNotes && (
                        <div className="px-4 py-2.5 bg-emerald-50/40 border-t border-b border-emerald-100 text-xs text-emerald-950 flex items-start gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-emerald-900">DSAC Official Review Note: </span>
                            <span>{report.reviewNotes}</span>
                            {report.reviewedByName && (
                              <span className="text-[11px] text-emerald-700 ml-1">
                                (Reviewed by {report.reviewedByName})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expanded Report Items (KPIs & Variances for this quarter) */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 bg-white">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
                            Reported Indicator Deliverables ({report.items?.length || 0} Targets)
                          </h4>

                          {(!report.items || report.items.length === 0) ? (
                            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                              No individual KPI sub-items recorded for this submission.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {report.items.map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex-1">
                                    <div className="font-bold text-slate-900">{item.kpiName}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      Target: <strong>{item.targetToDate} {item.unit}</strong> • Achieved: <strong>{item.actualAchieved} {item.unit}</strong>
                                    </div>
                                    {item.varianceReason && (
                                      <div className="mt-1 text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-100">
                                        <strong>Variance:</strong> {item.varianceReason}
                                      </div>
                                    )}
                                    {item.correctiveAction && (
                                      <div className="mt-1 text-[11px] text-teal-800 bg-teal-50 p-1.5 rounded border border-teal-100">
                                        <strong>Corrective Action:</strong> {item.correctiveAction}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      item.status === 'COMPLETED' || item.status === 'ON_TRACK'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : item.status === 'AT_RISK'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: TARGETS & DELIVERY (Annual Performance Plan KPIs)
            =================================================================== */}
        {detailTab === 'targets' && (
          <div className="space-y-4">
            {/* Targets Attainment Executive Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <div className="text-[11px] font-semibold text-slate-500">Overall Delivery Rate</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">{overallAttainment}%</div>
                <div className="text-[10px] text-slate-400">Attainment across all APP targets</div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
                <div className="text-[11px] font-semibold text-emerald-700">On Track / Completed</div>
                <div className="text-2xl font-black text-emerald-800 mt-0.5">{onTrackKpisCount}</div>
                <div className="text-[10px] text-emerald-600">Meeting statutory milestones</div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/70">
                <div className="text-[11px] font-semibold text-amber-700">At Risk</div>
                <div className="text-2xl font-black text-amber-800 mt-0.5">{atRiskKpisCount}</div>
                <div className="text-[10px] text-amber-600">Potential delivery slippage</div>
              </div>

              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200/70">
                <div className="text-[11px] font-semibold text-rose-700">Missed Milestones</div>
                <div className="text-2xl font-black text-rose-800 mt-0.5">{missedKpisCount}</div>
                <div className="text-[10px] text-rose-600">Directives required</div>
              </div>
            </div>

            {/* List of KPIs */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Annual Performance Plan (APP) Strategic Indicators
                  </h3>
                  <p className="text-xs text-slate-500">
                    Full KPI schedule, baselines, quarterly targets and verified actual delivery.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  {entityKpis.length} Indicators
                </span>
              </div>

              {entityKpis.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Target className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <div className="font-bold text-slate-700">No KPIs registered for this institution</div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 mt-2">
                  {entityKpis.map((kpi) => {
                    const attainment = kpi.annualTarget > 0 
                      ? Math.min(100, Math.round((kpi.currentValue / kpi.annualTarget) * 100))
                      : (kpi.percentageAchieved || 0);

                    const isGood = kpi.status === 'ON_TRACK' || kpi.status === 'COMPLETED';
                    const isAtRisk = kpi.status === 'AT_RISK';

                    return (
                      <div key={kpi.id} className="py-3.5 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                                {kpi.programmeName || 'Programme 1'}
                              </span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                                isGood ? 'bg-emerald-100 text-emerald-800' :
                                isAtRisk ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {kpi.status.replace('_', ' ')}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mt-1">
                              {kpi.name}
                            </h4>
                            {kpi.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{kpi.description}</p>
                            )}
                          </div>

                          <div className="text-right sm:text-right shrink-0">
                            <div className="text-base font-black text-slate-900">
                              {kpi.currentValue.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {kpi.annualTarget.toLocaleString()} {kpi.unitOfMeasure}</span>
                            </div>
                            <div className="text-[11px] font-bold text-emerald-700">
                              {attainment}% Attained
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isGood ? 'bg-emerald-600' :
                              isAtRisk ? 'bg-amber-500' :
                              'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, attainment)}%` }}
                          />
                        </div>

                        {/* Quarterly Milestone Breakdown */}
                        <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                          <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-bold">Q1</div>
                            <div className="text-xs font-bold text-slate-800">
                              {kpi.q1Actual !== undefined ? kpi.q1Actual : '—'} <span className="text-[10px] text-slate-400">/ {kpi.q1Target}</span>
                            </div>
                          </div>
                          <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-bold">Q2</div>
                            <div className="text-xs font-bold text-slate-800">
                              {kpi.q2Actual !== undefined ? kpi.q2Actual : '—'} <span className="text-[10px] text-slate-400">/ {kpi.q2Target}</span>
                            </div>
                          </div>
                          <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-bold">Q3</div>
                            <div className="text-xs font-bold text-slate-800">
                              {kpi.q3Actual !== undefined ? kpi.q3Actual : '—'} <span className="text-[10px] text-slate-400">/ {kpi.q3Target}</span>
                            </div>
                          </div>
                          <div className="p-1.5 rounded bg-slate-50 border border-slate-100">
                            <div className="text-[10px] text-slate-400 font-bold">Q4</div>
                            <div className="text-xs font-bold text-slate-800">
                              {kpi.q4Actual !== undefined ? kpi.q4Actual : '—'} <span className="text-[10px] text-slate-400">/ {kpi.q4Target}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: BUDGETS & SPENDINGS (Vote 40 Transfers & Burn Rate)
            =================================================================== */}
        {detailTab === 'financials' && (
          <div className="space-y-4">
            {/* Top 4 Financial Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Approved Budget</span>
                  <Coins className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
                  {formatZAR(activeEntity.budgetAllocationZAR)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Vote 40 Parliamentary Subvention
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Transferred to Date</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 font-mono">
                  {formatZAR(activeEntity.transferredAmountZAR)}
                </div>
                <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
                  {disbursementRatePercent}% of Vote 40 Disbursed
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Reported Expenditure (Spent)</span>
                  <Wallet className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
                  {formatZAR(activeEntity.reportedExpenditureZAR)}
                </div>
                <div className="text-[11px] text-teal-700 mt-1 font-semibold">
                  {burnRatePercent}% of Transferred Funds Spent
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>Remaining Balance</span>
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
                  {formatZAR(remainingUnspent)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {formatZAR(remainingSubvention)} pending tranches
                </div>
              </div>
            </div>

            {/* Tranche Release Milestones & Statutory PFMA Compliance */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Statutory Tranche Drawdown Schedule (PFMA Sec 38(1)(j))
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quarterly tranche releases are contingent on verified quarterly reporting clearances.
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                  activeEntity.trancheStatus === 'WITHHELD'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Tranche Status: {activeEntity.trancheStatus || 'RELEASED'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span>Tranche 1 (25%)</span>
                    <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-950 rounded text-[10px] font-black">DISBURSED</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1 font-mono">
                    {formatZAR(activeEntity.budgetAllocationZAR * 0.25)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    PFMA Release Date: 15 Apr 2025
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span>Tranche 2 (25%)</span>
                    <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-950 rounded text-[10px] font-black">DISBURSED</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1 font-mono">
                    {formatZAR(activeEntity.budgetAllocationZAR * 0.25)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    PFMA Release Date: 15 Jul 2025
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span>Tranche 3 (25%)</span>
                    <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-950 rounded text-[10px] font-black">DISBURSED</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1 font-mono">
                    {formatZAR(activeEntity.budgetAllocationZAR * 0.25)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    PFMA Release Date: 15 Oct 2025
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/80">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Tranche 4 (25%)</span>
                    <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded text-[10px] font-black">PENDING</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1 font-mono">
                    {formatZAR(activeEntity.budgetAllocationZAR * 0.25)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Contingent on Q3 Clearance
                  </div>
                </div>
              </div>
            </div>

            {/* Spending Categories Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                Expenditure Breakdown by Economic Classification
              </h3>

              <div className="divide-y divide-slate-100 mt-2">
                {[
                  { name: 'Compensation of Employees (Staff & Personnel)', percent: 55, allocation: activeEntity.budgetAllocationZAR * 0.55, spent: activeEntity.reportedExpenditureZAR * 0.58 },
                  { name: 'Programme Delivery & Sector Support', percent: 25, allocation: activeEntity.budgetAllocationZAR * 0.25, spent: activeEntity.reportedExpenditureZAR * 0.24 },
                  { name: 'Goods & Operational Services', percent: 15, allocation: activeEntity.budgetAllocationZAR * 0.15, spent: activeEntity.reportedExpenditureZAR * 0.14 },
                  { name: 'Capital Assets & Infrastructure Maintenance', percent: 5, allocation: activeEntity.budgetAllocationZAR * 0.05, spent: activeEntity.reportedExpenditureZAR * 0.04 },
                ].map((cat, idx) => {
                  const catSpendRate = cat.allocation > 0 ? Math.round((cat.spent / cat.allocation) * 100) : 0;
                  return (
                    <div key={idx} className="py-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{cat.name}</span>
                        <div className="font-mono text-slate-800 text-right">
                          <span className="font-black">{formatZAR(cat.spent)}</span>
                          <span className="text-slate-400 text-[11px]"> / {formatZAR(cat.allocation)} ({catSpendRate}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-teal-600 rounded-full"
                          style={{ width: `${Math.min(100, catSpendRate)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
              Select any entity below to view its quarterly reports, annual targets &amp; delivery progress, and Vote 40 budgets &amp; spendings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Vote 40 Allocation:</span>
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
                      <div className="text-[10px] text-slate-400">Vote 40 Allocation</div>
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
                  <th className="py-3 px-3 text-right">Vote 40 Budget</th>
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
