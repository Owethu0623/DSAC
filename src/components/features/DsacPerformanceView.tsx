import React, { useState, useMemo } from 'react';
import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  BarChart3, 
  FileText, 
  ExternalLink,
  Sliders,
  ChevronRight,
  Sparkles,
  Award,
  Users,
  Calendar
} from 'lucide-react';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';
import { FinancialQuarter } from '../../types/financial';
import { normalizeFinancialYear } from '../../services/calculationEngine';

interface DsacPerformanceViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
}

export const DsacPerformanceView: React.FC<DsacPerformanceViewProps> = ({
  entities,
  onSelectEntity,
  onOpenWorkspace
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PUBLIC_ENTITY' | 'NPO'>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('2025/26');
  const [quarterTab, setQuarterTab] = useState<FinancialQuarter>('Q3');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(entities[0]?.id || 'ent-sahra');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedEntity = entities.find(e => e.id === selectedEntityId) || entities[0];

  // =========================================================================
  // AUTHORITATIVE DEPARTMENT PERFORMANCE AGGREGATION
  // =========================================================================
  const deptPerfAgg = useMemo(() => {
    return store.getDepartmentPerformanceAggregation(selectedYear, quarterTab, typeFilter);
  }, [selectedYear, quarterTab, typeFilter]);

  // Filter entities in the left pane based on search term
  const filteredEntityBreakdown = useMemo(() => {
    return deptPerfAgg.entityBreakdown.filter(ent => {
      const matchesSearch = 
        ent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ent.shortName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [deptPerfAgg.entityBreakdown, searchTerm]);

  // =========================================================================
  // AUTHORITATIVE SELECTED ENTITY KPI PERFORMANCE SUMMARY
  // =========================================================================
  const selectedEntitySummary = useMemo(() => {
    if (!selectedEntity) return null;
    return store.getEntityPerformanceSummary(selectedEntity.id, selectedYear, quarterTab);
  }, [selectedEntity, selectedYear, quarterTab]);

  // Sector Youth Jobs Total
  const totalYouthJobs = useMemo(() => {
    return entities
      .filter(e => typeFilter === 'ALL' || e.type === typeFilter)
      .reduce((sum, e) => sum + (e.jobStats?.youthJobsCreated || 0), 0);
  }, [entities, typeFilter]);

  const handleRecordVarianceNote = () => {
    if (!selectedEntity) return;
    setActionNotice(`Quarterly variance request issued to ${selectedEntity.shortCode} reporting officer.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const onTrackPercent = deptPerfAgg.totalKpisEvaluated > 0 
    ? Math.round((deptPerfAgg.onTrackCount / deptPerfAgg.totalKpisEvaluated) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                <Target className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Performance &amp; KPI Oversight
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Quarterly Target Tracking, Actuals vs Baselines &amp; MTSF Sector Outcomes across all 26 Public Entities and 6 NPOs (32 Total)
            </p>
          </div>

          {/* Controls: Financial Year & Quarter Switchers */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* Financial Year Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-[11px] font-bold text-slate-500 px-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>FY:</span>
              </span>
              {(['2024/25', '2025/26', '2026/27', '2023/24'] as const).map(yr => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    normalizeFinancialYear(selectedYear) === yr
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title={`Switch to ${yr} Financial Year`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Quarter Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuarterTab(q)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    quarterTab === q
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {q} {q === 'Q3' && <span className="text-[9px] text-emerald-300 ml-0.5">• Live</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Summary Performance Metrics Derived Directly from Central Calculation Engine */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">Portfolio Target Delivery</div>
            <div className="text-xl font-black text-teal-800 mt-0.5">
              {deptPerfAgg.overallPortfolioDeliveryRate}%
            </div>
            <div className="text-[10px] text-slate-400">Cumulative YTD {selectedYear} ({quarterTab})</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
            <div className="text-[11px] font-semibold text-emerald-800">On-Track Targets</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              {deptPerfAgg.onTrackCount} Targets
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">
              {onTrackPercent}% of {deptPerfAgg.totalKpisEvaluated} Evaluated
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70">
            <div className="text-[11px] font-semibold text-amber-800">Lagging Targets (At Risk)</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">
              {deptPerfAgg.laggingCount} Targets
            </div>
            <div className="text-[10px] text-amber-600 font-medium">Under {quarterTab} Target by &gt;15%</div>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200/70">
            <div className="text-[11px] font-semibold text-sky-800">Youth Jobs Created</div>
            <div className="text-xl font-black text-sky-700 mt-0.5">
              {totalYouthJobs.toLocaleString()} Jobs
            </div>
            <div className="text-[10px] text-sky-600 font-medium">Across all institutions</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search entity performance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              typeFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All 32 Institutions
          </button>
          <button
            onClick={() => setTypeFilter('PUBLIC_ENTITY')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              typeFilter === 'PUBLIC_ENTITY' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            26 Public Entities
          </button>
          <button
            onClick={() => setTypeFilter('NPO')}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              typeFilter === 'NPO' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            6 NPOs
          </button>
        </div>
      </div>

      {/* MASTER-DETAIL SIDE VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT PANE: Entities Performance Index (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col h-[740px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Target Index ({filteredEntityBreakdown.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Select to view scorecard</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredEntityBreakdown.map((entityItem) => {
              const isSelected = entityItem.id === selectedEntityId;
              const matchingEntityObj = entities.find(e => e.id === entityItem.id);

              return (
                <div
                  key={entityItem.id}
                  onClick={() => setSelectedEntityId(entityItem.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-600 shadow-xs ring-1 ring-teal-400/40'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {entityItem.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                          entityItem.type === 'PUBLIC_ENTITY' ? 'bg-teal-100 text-teal-800' : 'bg-sky-100 text-sky-800'
                        }`}>
                          {entityItem.type === 'PUBLIC_ENTITY' ? 'Public Entity' : 'NPO'}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {matchingEntityObj?.cluster || 'Sector Cluster'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-teal-800">
                        {entityItem.achieved}%
                      </div>
                      <div className="text-[9px] text-slate-400">Achieved</div>
                    </div>
                  </div>

                  {/* Stacked achievement bar matching authoritative calculation */}
                  <div className="mt-2.5">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${entityItem.achieved}%` }}
                        title={`Achieved: ${entityItem.achieved}%`}
                      />
                      <div
                        className="bg-amber-400 h-full"
                        style={{ width: `${entityItem.inProgress}%` }}
                        title={`In Progress: ${entityItem.inProgress}%`}
                      />
                      <div
                        className="bg-rose-400 h-full"
                        style={{ width: `${entityItem.notAchieved}%` }}
                        title={`Not Achieved: ${entityItem.notAchieved}%`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <span>KPIs: <strong className="text-slate-700">{entityItem.totalKpis}</strong></span>
                    <span>Achieved Targets: <strong className="text-teal-700">{entityItem.completedCount}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE: Side View Detail Scorecard (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-20">
          {selectedEntity && selectedEntitySummary ? (
            <div className="space-y-5">
              
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200">
                      {selectedEntity.type === 'PUBLIC_ENTITY' ? 'Public Entity Scorecard' : 'NPO Scorecard'}
                    </span>
                    <span className="text-xs text-slate-500">
                      Cluster: <strong className="text-slate-700">{selectedEntity.cluster}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {selectedEntity.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Annual Target Progress for Fiscal Period {selectedYear} • Review Quarter: <strong className="text-emerald-700">{quarterTab}</strong>
                  </p>
                </div>

                <div className="text-center p-2.5 rounded-xl bg-teal-50 border border-teal-200 shrink-0">
                  <div className="text-2xl font-black text-teal-800 leading-none">
                    {selectedEntitySummary.totalKpis}
                  </div>
                  <div className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mt-1">
                    Indicators
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRecordVarianceNote}
                    className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Request Variance Note</span>
                  </button>
                  {actionNotice && (
                    <span className="text-xs text-emerald-700 font-semibold animate-fadeIn">
                      {actionNotice}
                    </span>
                  )}
                </div>

                {onOpenWorkspace && (
                  <button
                    onClick={() => onOpenWorkspace(selectedEntity.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Open Entity Workspace</span>
                  </button>
                )}
              </div>

              {/* KPIs List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Strategic Programme Targets</span>
                  <span className="text-[11px] text-slate-500 font-semibold">Overall Achieved: {selectedEntitySummary.overallAchievementRate}%</span>
                </h4>

                <div className="space-y-3">
                  {selectedEntitySummary.items.map((kpi) => (
                    <div key={kpi.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-sm">
                            {kpi.programmeName}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                            {kpi.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {kpi.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            kpi.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : kpi.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : kpi.status === 'NOT_STARTED'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {kpi.percentageAchieved}% Achieved
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Unit: {kpi.unitOfMeasure}
                          </div>
                        </div>
                      </div>

                      {/* Quarterly Breakdown Bars */}
                      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200/70 text-center">
                        <div className={`p-1.5 rounded-lg border ${quarterTab === 'Q1' ? 'bg-emerald-50 border-emerald-300 font-bold' : 'bg-white border-slate-200'}`}>
                          <div className="text-[9px] font-bold text-slate-500">Q1 Actual / Target</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {kpi.q1Actual !== null ? kpi.q1Actual.toLocaleString() : '-'} / {kpi.q1Target.toLocaleString()}
                          </div>
                        </div>
                        <div className={`p-1.5 rounded-lg border ${quarterTab === 'Q2' ? 'bg-emerald-50 border-emerald-300 font-bold' : 'bg-white border-slate-200'}`}>
                          <div className="text-[9px] font-bold text-slate-500">Q2 Actual / Target</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {kpi.q2Actual !== null ? kpi.q2Actual.toLocaleString() : '-'} / {kpi.q2Target.toLocaleString()}
                          </div>
                        </div>
                        <div className={`p-1.5 rounded-lg border ${quarterTab === 'Q3' ? 'bg-emerald-50 border-emerald-300 font-bold' : 'bg-white border-slate-200'}`}>
                          <div className="text-[9px] font-bold text-emerald-800">Q3 Actual / Target</div>
                          <div className="text-xs font-bold text-emerald-900 mt-0.5">
                            {kpi.q3Actual !== null ? kpi.q3Actual.toLocaleString() : '-'} / {kpi.q3Target.toLocaleString()}
                          </div>
                        </div>
                        <div className={`p-1.5 rounded-lg border ${quarterTab === 'Q4' ? 'bg-emerald-50 border-emerald-300 font-bold' : 'bg-white border-slate-200'}`}>
                          <div className="text-[9px] font-bold text-slate-500">Q4 Actual / Target</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {kpi.q4Actual !== null ? kpi.q4Actual.toLocaleString() : '-'} / {kpi.q4Target.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sector Job Creation & Impact */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">MTSF Sector Employment Delivery</span>
                  <span className="text-[11px] text-teal-700 font-semibold">{selectedYear} Targets</span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-2.5 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500">Permanent Jobs</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {selectedEntity.jobStats.permanentJobs}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Gig/Temp Jobs</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {selectedEntity.jobStats.temporaryJobs}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Youth Jobs</div>
                    <div className="text-xs font-bold text-sky-700 mt-0.5">
                      {selectedEntity.jobStats.youthJobsCreated}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Artists Funded</div>
                    <div className="text-xs font-bold text-teal-700 mt-0.5">
                      {selectedEntity.jobStats.creativeSectorPractitionersSupported}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              Select an entity to view performance details
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
