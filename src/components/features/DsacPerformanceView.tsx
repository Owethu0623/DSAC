import React, { useState } from 'react';
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
  Users
} from 'lucide-react';
import { PublicEntity, KPIRecord } from '../../types';
import { store } from '../../services/store';

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
  const [quarterTab, setQuarterTab] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q3');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(entities[0]?.id || 'ent-sahra');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedEntity = entities.find(e => e.id === selectedEntityId) || entities[0];

  // Get KPIs from store for selected entity
  const entityKpis = store.kpis.filter(k => k.entityId === selectedEntityId);

  // If store doesn't have custom KPIs for this specific entity yet, provide realistic statutory indicators based on their cluster
  const displayKpis: KPIRecord[] = entityKpis.length > 0 ? entityKpis : [
    {
      id: `kpi-${selectedEntity.id}-1`,
      entityId: selectedEntity.id,
      entityName: selectedEntity.name,
      programmeName: 'Programme 1: Administration & Good Governance',
      name: 'Unqualified Audit Opinion with Zero Material Misstatements',
      description: 'Audit outcome issued by the Auditor-General of South Africa (AGSA) or independent audit board.',
      unitOfMeasure: 'Audit Outcome',
      baseline: 1,
      annualTarget: 1,
      q1Target: 1,
      q1Actual: 1,
      q2Target: 1,
      q2Actual: 1,
      q3Target: 1,
      q3Actual: 1,
      q4Target: 1,
      currentValue: 1,
      expectedValue: 1,
      percentageAchieved: 100,
      status: 'ON_TRACK',
      historicalPerformance: [
        { year: '2022/23', target: 1, achieved: 1 },
        { year: '2023/24', target: 1, achieved: 1 },
        { year: '2024/25', target: 1, achieved: 1 },
      ]
    },
    {
      id: `kpi-${selectedEntity.id}-2`,
      entityId: selectedEntity.id,
      entityName: selectedEntity.name,
      programmeName: 'Programme 2: Core Mandate & Sector Delivery',
      name: selectedEntity.type === 'PUBLIC_ENTITY' 
        ? 'Sector Beneficiaries Reached & Statutory Initiatives Delivered'
        : 'Community Arts Outreach & Creative Workshops Conducted',
      description: 'Number of creative practitioners, artists, and citizens actively participating in accredited programmes.',
      unitOfMeasure: 'Beneficiaries',
      baseline: 1200,
      annualTarget: selectedEntity.jobStats.creativeSectorPractitionersSupported || 800,
      q1Target: Math.round((selectedEntity.jobStats.creativeSectorPractitionersSupported || 800) * 0.25),
      q1Actual: Math.round((selectedEntity.jobStats.creativeSectorPractitionersSupported || 800) * 0.28),
      q2Target: Math.round((selectedEntity.jobStats.creativeSectorPractitionersSupported || 800) * 0.25),
      q2Actual: Math.round((selectedEntity.jobStats.creativeSectorPractitionersSupported || 800) * 0.26),
      q3Target: Math.round((selectedEntity.jobStats.creativeSectorPractitionersSupported || 800) * 0.25),
      q3Actual: Math.round((selectedEntity.jobStats.creativeSectorPractitionersSupported || 800) * 0.22),
      q4Target: Math.round((selectedEntity.jobStats.creativeSectorPractitionersSupported || 800) * 0.25),
      currentValue: Math.round((selectedEntity.jobStats.creativeSectorPractitionersSupported || 800) * 0.76),
      expectedValue: Math.round((selectedEntity.jobStats.creativeSectorPractitionersSupported || 800) * 0.75),
      percentageAchieved: 76,
      status: 'ON_TRACK',
      historicalPerformance: [
        { year: '2022/23', target: 600, achieved: 580 },
        { year: '2023/24', target: 700, achieved: 710 },
        { year: '2024/25', target: 800, achieved: 610 },
      ]
    },
    {
      id: `kpi-${selectedEntity.id}-3`,
      entityId: selectedEntity.id,
      entityName: selectedEntity.name,
      programmeName: 'Programme 3: Youth Empowerment & Job Creation',
      name: 'Youth Jobs and Work Opportunities Created (Presidential Employment Stimulus / MTSF)',
      description: 'Temporary and permanent job opportunities created for South African youth aged 18-35.',
      unitOfMeasure: 'Jobs Created',
      baseline: 80,
      annualTarget: selectedEntity.jobStats.targetJobsAnnual || 300,
      q1Target: Math.round((selectedEntity.jobStats.targetJobsAnnual || 300) * 0.25),
      q1Actual: Math.round((selectedEntity.jobStats.targetJobsAnnual || 300) * 0.27),
      q2Target: Math.round((selectedEntity.jobStats.targetJobsAnnual || 300) * 0.25),
      q2Actual: Math.round((selectedEntity.jobStats.targetJobsAnnual || 300) * 0.24),
      q3Target: Math.round((selectedEntity.jobStats.targetJobsAnnual || 300) * 0.25),
      q3Actual: Math.round((selectedEntity.jobStats.targetJobsAnnual || 300) * 0.20),
      q4Target: Math.round((selectedEntity.jobStats.targetJobsAnnual || 300) * 0.25),
      currentValue: Math.round((selectedEntity.jobStats.targetJobsAnnual || 300) * 0.71),
      expectedValue: Math.round((selectedEntity.jobStats.targetJobsAnnual || 300) * 0.75),
      percentageAchieved: 71,
      status: 'AT_RISK',
      historicalPerformance: [
        { year: '2022/23', target: 200, achieved: 190 },
        { year: '2023/24', target: 250, achieved: 260 },
        { year: '2024/25', target: 300, achieved: 213 },
      ]
    }
  ];

  // Filter entities
  const filteredEntities = entities.filter(ent => {
    const matchesSearch = 
      ent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.cluster.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      typeFilter === 'ALL' || ent.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const totalEntities = entities.length;
  const publicEntitiesCount = entities.filter(e => e.type === 'PUBLIC_ENTITY').length;
  const nposCount = entities.filter(e => e.type === 'NPO').length;

  const handleRecordVarianceNote = () => {
    setActionNotice(`Quarterly variance request issued to ${selectedEntity.shortCode} reporting officer.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

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

          {/* Quarter Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
              <button
                key={q}
                onClick={() => setQuarterTab(q)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  quarterTab === q
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {q} {q === 'Q3' && <span className="text-[9px] text-emerald-300 ml-0.5">• Live</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Summary Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">Portfolio Target Delivery</div>
            <div className="text-xl font-black text-teal-800 mt-0.5">74.8%</div>
            <div className="text-[10px] text-slate-400">Cumulative YTD 2024/25</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
            <div className="text-[11px] font-semibold text-emerald-800">On-Track Targets</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">118 Targets</div>
            <div className="text-[10px] text-emerald-600 font-medium">80% Achieved or Exceeded</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70">
            <div className="text-[11px] font-semibold text-amber-800">Lagging Targets (At Risk)</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">24 Targets</div>
            <div className="text-[10px] text-amber-600 font-medium">Under Q3 Target by &gt;15%</div>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200/70">
            <div className="text-[11px] font-semibold text-sky-800">Youth Jobs Created</div>
            <div className="text-xl font-black text-sky-700 mt-0.5">8,450 Jobs</div>
            <div className="text-[10px] text-sky-600 font-medium">Across all 32 institutions</div>
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
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              typeFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All 32 Institutions
          </button>
          <button
            onClick={() => setTypeFilter('PUBLIC_ENTITY')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              typeFilter === 'PUBLIC_ENTITY' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            26 Public Entities
          </button>
          <button
            onClick={() => setTypeFilter('NPO')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              typeFilter === 'NPO' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            6 NPOs
          </button>
        </div>
      </div>

      {/* MASTER-DETAIL SIDE VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT PANE: 32 Entities Performance Index (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col h-[740px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Target Index ({filteredEntities.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Select to view scorecard</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredEntities.map((entity) => {
              const isSelected = entity.id === selectedEntityId;
              const approxKpiAchievement = Math.min(100, Math.round(entity.overallComplianceScore * 0.95 + 4));

              return (
                <div
                  key={entity.id}
                  onClick={() => setSelectedEntityId(entity.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-600 shadow-xs ring-1 ring-teal-400/40'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {entity.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                          entity.type === 'PUBLIC_ENTITY' ? 'bg-teal-100 text-teal-800' : 'bg-sky-100 text-sky-800'
                        }`}>
                          {entity.type === 'PUBLIC_ENTITY' ? 'Public Entity' : 'NPO'}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">{entity.cluster}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-teal-800">
                        {approxKpiAchievement}%
                      </div>
                      <div className="text-[9px] text-slate-400">Achieved</div>
                    </div>
                  </div>

                  {/* Stacked achievement bar */}
                  <div className="mt-2.5">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${Math.round(approxKpiAchievement * 0.75)}%` }}
                        title="Achieved"
                      ></div>
                      <div
                        className="bg-sky-400 h-full"
                        style={{ width: `${Math.round(approxKpiAchievement * 0.15)}%` }}
                        title="In Progress"
                      ></div>
                      <div
                        className="bg-rose-400 h-full"
                        style={{ width: `${Math.max(5, 100 - approxKpiAchievement)}%` }}
                        title="Not Achieved"
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <span>Jobs Target: <strong className="text-slate-700">{entity.jobStats.targetJobsAnnual}</strong></span>
                    <span>Practitioners: <strong className="text-teal-700">{entity.jobStats.creativeSectorPractitionersSupported}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE: Side View Detail Scorecard (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-20">
          {selectedEntity ? (
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
                    Annual Target Progress for Fiscal Period 2024/25 • Current Review Quarter: <strong className="text-emerald-700">{quarterTab}</strong>
                  </p>
                </div>

                <div className="text-center p-2.5 rounded-xl bg-teal-50 border border-teal-200 shrink-0">
                  <div className="text-2xl font-black text-teal-800 leading-none">
                    {displayKpis.length}
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
                    className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
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
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
                  <span className="text-[11px] text-slate-500 font-semibold">Q1–Q4 Cumulative</span>
                </h4>

                <div className="space-y-3">
                  {displayKpis.map((kpi, idx) => (
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
                            kpi.status === 'ON_TRACK' || kpi.percentageAchieved >= 75
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
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
                        <div className={`p-1.5 rounded-lg border ${quarterTab === 'Q1' ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}>
                          <div className="text-[9px] font-bold text-slate-500">Q1 Actual / Target</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {kpi.q1Actual ?? '-'} / {kpi.q1Target}
                          </div>
                        </div>
                        <div className={`p-1.5 rounded-lg border ${quarterTab === 'Q2' ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}>
                          <div className="text-[9px] font-bold text-slate-500">Q2 Actual / Target</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {kpi.q2Actual ?? '-'} / {kpi.q2Target}
                          </div>
                        </div>
                        <div className={`p-1.5 rounded-lg border ${quarterTab === 'Q3' ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}>
                          <div className="text-[9px] font-bold text-emerald-800">Q3 Actual / Target</div>
                          <div className="text-xs font-bold text-emerald-900 mt-0.5">
                            {kpi.q3Actual ?? '-'} / {kpi.q3Target}
                          </div>
                        </div>
                        <div className={`p-1.5 rounded-lg border ${quarterTab === 'Q4' ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}>
                          <div className="text-[9px] font-bold text-slate-500">Q4 Projected</div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {kpi.q4Target}
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
                  <span className="text-[11px] text-teal-700 font-semibold">2024/2025 Targets</span>
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
