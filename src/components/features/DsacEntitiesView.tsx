import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  ExternalLink, 
  Coins, 
  Briefcase, 
  Award, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Mail,
  UserCheck,
  Check
} from 'lucide-react';
import { PublicEntity, EntityCluster } from '../../types';

interface DsacEntitiesViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const DsacEntitiesView: React.FC<DsacEntitiesViewProps> = ({
  entities,
  onSelectEntity,
  onOpenWorkspace,
  onNavigateToTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clusterFilter, setClusterFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PUBLIC_ENTITY' | 'NPO'>('ALL');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(entities[0]?.id || 'ent-sahra');

  const clusters = [
    { name: 'Heritage & Museums', count: entities.filter(e => e.cluster === 'Heritage & Museums').length },
    { name: 'Performing Arts & Theatres', count: entities.filter(e => e.cluster === 'Performing Arts & Theatres').length },
    { name: 'Creative Industries & Film', count: entities.filter(e => e.cluster === 'Creative Industries & Film').length },
    { name: 'Languages, Literature & Libraries', count: entities.filter(e => e.cluster === 'Languages, Literature & Libraries' || e.cluster === 'Language & Literature').length },
    { name: 'Sport & Recreation', count: entities.filter(e => e.cluster === 'Sport & Recreation').length },
    { name: 'Subsidized Cultural NPOs', count: entities.filter(e => e.cluster === 'Subsidized Cultural NPOs' || e.type === 'NPO').length },
  ];

  const filteredEntities = entities.filter(ent => {
    const matchesSearch = 
      ent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.headOfEntity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || ent.type === typeFilter;

    let matchesCluster = true;
    if (clusterFilter !== 'ALL') {
      if (clusterFilter === 'Subsidized Cultural NPOs') {
        matchesCluster = ent.type === 'NPO' || ent.cluster === 'Subsidized Cultural NPOs';
      } else if (clusterFilter === 'Languages, Literature & Libraries') {
        matchesCluster = ent.cluster === 'Languages, Literature & Libraries' || ent.cluster === 'Language & Literature';
      } else {
        matchesCluster = ent.cluster === clusterFilter;
      }
    }

    return matchesSearch && matchesType && matchesCluster;
  });

  const selectedEntity = entities.find(e => e.id === selectedEntityId) || entities[0];

  const totalEntities = entities.length;
  const publicEntitiesCount = entities.filter(e => e.type === 'PUBLIC_ENTITY').length;
  const nposCount = entities.filter(e => e.type === 'NPO').length;

  const totalBudget = entities.reduce((acc, e) => acc + e.budgetAllocationZAR, 0);
  const totalJobs = entities.reduce((acc, e) => acc + e.jobStats.permanentJobs + e.jobStats.temporaryJobs, 0);
  const totalYouthJobs = entities.reduce((acc, e) => acc + e.jobStats.youthJobsCreated, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Institutional Directory &amp; Governance
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Oversight Portfolio: {publicEntitiesCount} Statutory Public Entities (PFMA Schedule 3A) + {nposCount} Subsidized Cultural NPOs ({totalEntities} Total)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Total Statutory Budget:</span>
            <span className="text-sm font-black text-emerald-800">
              R {(totalBudget / 1_000_000).toFixed(1)}M ZAR
            </span>
          </div>
        </div>

        {/* 4 Summary Directory Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">Total Oversight Portfolio</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">32 Institutions</div>
            <div className="text-[10px] text-slate-400">26 Entities + 6 NPOs</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
            <div className="text-[11px] font-semibold text-emerald-800">Permanent &amp; Gig Jobs</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{totalJobs.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Supported Across Sectors</div>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200/70">
            <div className="text-[11px] font-semibold text-sky-800">Youth Employment (18-35)</div>
            <div className="text-xl font-black text-sky-700 mt-0.5">{totalYouthJobs.toLocaleString()}</div>
            <div className="text-[10px] text-sky-600 font-medium">Presidential Stimulus</div>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200/70">
            <div className="text-[11px] font-semibold text-teal-800">AGSA Clean Audits</div>
            <div className="text-xl font-black text-teal-700 mt-0.5">
              {entities.filter(e => e.auditOutcome === 'CLEAN_AUDIT').length} of {totalEntities}
            </div>
            <div className="text-[10px] text-teal-600 font-medium">Unqualified Opinion</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search institution by name, code, CEO, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              All ({totalEntities})
            </button>
            <button
              onClick={() => setTypeFilter('PUBLIC_ENTITY')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                typeFilter === 'PUBLIC_ENTITY' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Public Entities ({publicEntitiesCount})
            </button>
            <button
              onClick={() => setTypeFilter('NPO')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                typeFilter === 'NPO' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NPOs ({nposCount})
            </button>
          </div>
        </div>

        {/* Cluster Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setClusterFilter('ALL')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-all ${
              clusterFilter === 'ALL'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Clusters ({totalEntities})
          </button>
          {clusters.map((c) => (
            <button
              key={c.name}
              onClick={() => setClusterFilter(c.name)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-all ${
                clusterFilter === c.name
                  ? 'bg-emerald-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name} ({c.count})
            </button>
          ))}
        </div>
      </div>

      {/* MASTER-DETAIL SIDE VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT PANE: Directory List of 32 Institutions (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col h-[740px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Institutions ({filteredEntities.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Click to inspect in side view</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredEntities.map((entity) => {
              const isSelected = entity.id === selectedEntityId;
              const isCleanAudit = entity.auditOutcome === 'CLEAN_AUDIT';

              return (
                <div
                  key={entity.id}
                  onClick={() => setSelectedEntityId(entity.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-600 shadow-xs ring-1 ring-emerald-400/40'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {entity.name}
                        </span>
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
                      <div className="text-xs font-black text-slate-900">
                        R {(entity.budgetAllocationZAR / 1_000_000).toFixed(1)}M
                      </div>
                      <div className="text-[9px] text-slate-400">Annual Vote</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="truncate">CEO: <strong className="text-slate-700">{entity.headOfEntity}</strong></span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> {entity.overallComplianceScore}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE: Side View Detail Dossier (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-20">
          {selectedEntity ? (
            <div className="space-y-5">
              
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                      selectedEntity.type === 'PUBLIC_ENTITY' ? 'bg-teal-100 text-teal-900 border border-teal-200' : 'bg-sky-100 text-sky-900 border border-sky-200'
                    }`}>
                      {selectedEntity.type === 'PUBLIC_ENTITY' ? 'PFMA Schedule 3A Public Entity' : 'Subsidized Cultural NPO'}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      Code: <strong className="text-slate-800">{selectedEntity.shortCode}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1.5">
                    {selectedEntity.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Official Cluster: <strong className="text-slate-800">{selectedEntity.cluster}</strong>
                  </p>
                </div>

                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                  <div className="text-xl font-black text-emerald-800 leading-none">
                    R {(selectedEntity.budgetAllocationZAR / 1_000_000).toFixed(1)}M
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                    Annual Budget
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {onOpenWorkspace && (
                  <button
                    onClick={() => onOpenWorkspace(selectedEntity.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Entity Workspace</span>
                  </button>
                )}

                {onNavigateToTab && selectedEntity.type === 'NPO' && (
                  <button
                    onClick={() => onNavigateToTab('entity-portal')}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Inspect in NPO Portal View</span>
                  </button>
                )}

                <a
                  href={`mailto:${selectedEntity.contactEmail}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Contact Executive</span>
                </a>
              </div>

              {/* Leadership & Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Executive Leadership (CEO / Director)</span>
                  </div>
                  <div className="font-bold text-slate-900 mt-1">
                    {selectedEntity.headOfEntity}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Accounting Officer
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
                    <Briefcase className="w-4 h-4 text-teal-600" />
                    <span>Statutory Reporting Officer / CFO</span>
                  </div>
                  <div className="font-bold text-slate-900 mt-1">
                    {selectedEntity.reportingOfficerName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {selectedEntity.contactEmail}
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  Statutory Allocation &amp; Expenditure (ZAR)
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-500">Allocated Grant</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      R {selectedEntity.budgetAllocationZAR.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-100">
                    <div className="text-[10px] text-teal-700 font-semibold">Transferred (75%)</div>
                    <div className="font-bold text-teal-900 mt-0.5">
                      R {selectedEntity.transferredAmountZAR.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-500">Reported Expenditure</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      R {selectedEntity.reportedExpenditureZAR.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment & Sector Delivery */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  MTSF Job Creation &amp; Transformation Impact
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500">Permanent Staff</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {selectedEntity.jobStats.permanentJobs}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Gig/Temp Jobs</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {selectedEntity.jobStats.temporaryJobs}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Youth (18-35)</div>
                    <div className="font-bold text-sky-700 mt-0.5">
                      {selectedEntity.jobStats.youthJobsCreated}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Practitioners</div>
                    <div className="font-bold text-teal-700 mt-0.5">
                      {selectedEntity.jobStats.creativeSectorPractitionersSupported}
                    </div>
                  </div>
                </div>
              </div>

              {/* Demographic Profile */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Staff Equity &amp; Demographics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-500">African</span>
                    <div className="font-bold text-slate-900">{selectedEntity.demographics.african}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-500">Coloured</span>
                    <div className="font-bold text-slate-900">{selectedEntity.demographics.coloured}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-500">Female</span>
                    <div className="font-bold text-emerald-700">{selectedEntity.demographics.female}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-500">Persons w/ Disabilities</span>
                    <div className="font-bold text-slate-900">{selectedEntity.demographics.personsWithDisabilities}%</div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              Select an institution to view details
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
