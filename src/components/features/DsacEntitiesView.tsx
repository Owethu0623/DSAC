import React, { useState, useMemo } from 'react';
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
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Target,
  Calendar,
  AlertCircle,
  Download,
  Send,
  BarChart3,
  Layers,
  ChevronLeft,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { PublicEntity, EntityCluster } from '../../types';
import { store } from '../../services/store';
import { generateEntityFeatureDossier, EntityFeatureDossier } from '../../services/entityFeatureGenerator';

interface DsacEntitiesViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

type FeatureTab = 'ALL' | 'COMPLIANCE' | 'PERFORMANCE' | 'FUNDING' | 'REPORTS' | 'RISKS' | 'PROFILE';

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
  const [activeFeatureTab, setActiveFeatureTab] = useState<FeatureTab>('ALL');
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  const clusters = [
    { name: 'Heritage & Museums', count: entities.filter(e => e.cluster === 'Heritage & Museums').length },
    { name: 'Performing Arts & Theatres', count: entities.filter(e => e.cluster === 'Performing Arts & Theatres').length },
    { name: 'Creative Industries & Film', count: entities.filter(e => e.cluster === 'Creative Industries & Film').length },
    { name: 'Languages, Literature & Libraries', count: entities.filter(e => e.cluster === 'Languages, Literature & Libraries' || e.cluster === 'Language & Literature').length },
    { name: 'Sport & Recreation', count: entities.filter(e => e.cluster === 'Sport & Recreation').length },
    { name: 'Subsidized Cultural NPOs', count: entities.filter(e => e.cluster === 'Subsidized Cultural NPOs' || e.type === 'NPO').length },
  ];

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
  }, [entities, searchTerm, typeFilter, clusterFilter]);

  const selectedEntity = useMemo(() => {
    return entities.find(e => e.id === selectedEntityId) || filteredEntities[0] || entities[0];
  }, [entities, selectedEntityId, filteredEntities]);

  // Generate full comprehensive feature dossier for the selected institution
  const dossier: EntityFeatureDossier = useMemo(() => {
    return generateEntityFeatureDossier(selectedEntity);
  }, [selectedEntity]);

  const totalEntities = entities.length;
  const publicEntitiesCount = entities.filter(e => e.type === 'PUBLIC_ENTITY').length;
  const nposCount = entities.filter(e => e.type === 'NPO').length;

  const totalBudget = entities.reduce((acc, e) => acc + e.budgetAllocationZAR, 0);
  const totalJobs = entities.reduce((acc, e) => acc + e.jobStats.permanentJobs + e.jobStats.temporaryJobs, 0);
  const totalYouthJobs = entities.reduce((acc, e) => acc + e.jobStats.youthJobsCreated, 0);

  const showToast = (msg: string) => {
    setActionNotification(msg);
    setTimeout(() => {
      setActionNotification(null);
    }, 4500);
  };

  const handleVerifyCompliance = () => {
    const updated = { 
      ...selectedEntity, 
      overallComplianceScore: Math.min(100, selectedEntity.overallComplianceScore + 4) 
    };
    store.updateEntity(updated);
    showToast(`PFMA Section 38(1)(j) assurance verified for ${selectedEntity.shortCode}. Compliance score updated to ${updated.overallComplianceScore}%.`);
  };

  const handleIssueNotice = () => {
    showToast(`Statutory PFMA Section 38(1)(j) Notice issued to ${selectedEntity.name} Accounting Officer (${selectedEntity.headOfEntity}).`);
  };

  const handleDownloadDossier = () => {
    showToast(`Generated comprehensive PFMA Statutory Oversight Dossier for ${selectedEntity.shortCode} (PDF ready for download).`);
  };

  const handlePrevEntity = () => {
    if (filteredEntities.length === 0) return;
    const currentIdx = filteredEntities.findIndex(e => e.id === selectedEntity.id);
    const prevIdx = (currentIdx - 1 + filteredEntities.length) % filteredEntities.length;
    setSelectedEntityId(filteredEntities[prevIdx].id);
  };

  const handleNextEntity = () => {
    if (filteredEntities.length === 0) return;
    const currentIdx = filteredEntities.findIndex(e => e.id === selectedEntity.id);
    const nextIdx = (currentIdx + 1) % filteredEntities.length;
    setSelectedEntityId(filteredEntities[nextIdx].id);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {actionNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-100">{actionNotification}</span>
        </div>
      )}

      {/* Top Banner & KPI Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Statutory Oversight Directory: 26 Public Entities &amp; 6 Subsidized NPOs
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select any institution to generate and inspect all features (Compliance, APP Performance, Vote 37 Funding, Reports &amp; December Budget Mandates, Risks &amp; Early Warning).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Statutory Vote 37 Budget:</span>
              <span className="text-base font-black text-emerald-800">
                R {(totalBudget / 1_000_000_000).toFixed(2)}B ZAR
              </span>
            </div>
          </div>
        </div>

        {/* 4 Summary Directory Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">Total Portfolio</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">32 Institutions</div>
            <div className="text-[10px] text-slate-400">26 Public Entities + 6 NPOs</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
            <div className="text-[11px] font-semibold text-emerald-800">Permanent &amp; Gig Jobs</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{totalJobs.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Supported Across Sectors</div>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200/70">
            <div className="text-[11px] font-semibold text-sky-800">Youth Employment (18-35)</div>
            <div className="text-xl font-black text-sky-700 mt-0.5">{totalYouthJobs.toLocaleString()}</div>
            <div className="text-[10px] text-sky-600 font-medium">Presidential Stimulus Priority</div>
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
                placeholder="Search institution by name, code, CEO, or cluster..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs shrink-0">
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

      {/* MASTER-DETAIL DUAL PANE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT PANE: Directory List of 32 Institutions (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col h-[860px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Institutions ({filteredEntities.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Click pill to inspect</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredEntities.map((entity) => {
              const isSelected = entity.id === selectedEntity.id;
              const isCleanAudit = entity.auditOutcome === 'CLEAN_AUDIT';
              const isHighRisk = entity.riskLevel === 'HIGH' || entity.riskLevel === 'CRITICAL';

              return (
                <div
                  key={entity.id}
                  onClick={() => setSelectedEntityId(entity.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-emerald-50/90 border-emerald-600 shadow-xs ring-2 ring-emerald-500/30'
                      : 'bg-white hover:bg-slate-50/90 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {entity.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
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

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
                    <div className="flex items-center gap-1 font-semibold text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{entity.overallComplianceScore}% Compliance</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        isCleanAudit ? 'bg-teal-100 text-teal-800' :
                        entity.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS' ? 'bg-blue-100 text-blue-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {entity.auditOutcome === 'CLEAN_AUDIT' ? 'Clean Audit' :
                         entity.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS' ? 'Unqualified w/ Findings' :
                         'Qualified'}
                      </span>

                      {entity.overdueReportsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold text-[9px]">
                          {entity.overdueReportsCount} Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE: Entity Full Feature Inspector Dossier (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
          
          {/* Header & Quick Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                  selectedEntity.type === 'PUBLIC_ENTITY' 
                    ? 'bg-teal-100 text-teal-900 border border-teal-200' 
                    : 'bg-sky-100 text-sky-900 border border-sky-200'
                }`}>
                  {selectedEntity.type === 'PUBLIC_ENTITY' ? 'PFMA Schedule 3A Public Entity' : 'Subsidized Cultural NPO'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Code: <strong className="text-slate-800">{selectedEntity.shortCode}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-600">
                  Cluster: <strong className="text-slate-800">{selectedEntity.cluster}</strong>
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900 mt-1">
                {selectedEntity.name}
              </h3>
              
              <p className="text-xs text-slate-600">
                Executive: <strong className="text-slate-900">{selectedEntity.headOfEntity}</strong> • Reporting Officer: <span className="text-slate-700">{selectedEntity.reportingOfficerName} ({selectedEntity.contactEmail})</span>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xl font-black text-emerald-800 leading-none">
                  R {(selectedEntity.budgetAllocationZAR / 1_000_000).toFixed(1)}M
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Vote 37 Allocation
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <button
                  onClick={handlePrevEntity}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Previous Institution"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextEntity}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Next Institution"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
            <button
              onClick={handleVerifyCompliance}
              className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Verify Compliance</span>
            </button>

            <button
              onClick={handleIssueNotice}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Issue Section 38 Notice</span>
            </button>

            <button
              onClick={handleDownloadDossier}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download Statutory Dossier</span>
            </button>

            {onOpenWorkspace && (
              <button
                onClick={() => onOpenWorkspace(selectedEntity.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ml-auto"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                <span>Open Entity Workspace</span>
              </button>
            )}
          </div>

          {/* Feature Selector Tabs (Allows viewing All Features or individual feature tabs) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 text-xs">
            <button
              onClick={() => setActiveFeatureTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFeatureTab === 'ALL'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Features (Complete Dossier)</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('COMPLIANCE')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFeatureTab === 'COMPLIANCE'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Compliance ({dossier.compliance.score}%)</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('PERFORMANCE')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFeatureTab === 'PERFORMANCE'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Performance ({dossier.performance.deliveryRate}%)</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('FUNDING')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFeatureTab === 'FUNDING'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Funding &amp; Tranches</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('REPORTS')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFeatureTab === 'REPORTS'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reports &amp; Dec Budget</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('RISKS')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFeatureTab === 'RISKS'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Risk &amp; Alerts ({dossier.risks.level})</span>
            </button>

            <button
              onClick={() => setActiveFeatureTab('PROFILE')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeFeatureTab === 'PROFILE'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Leadership &amp; Jobs</span>
            </button>
          </div>

          {/* DOSSIER BODY CONTAINER */}
          <div className="space-y-6 pt-1 max-h-[720px] overflow-y-auto pr-1.5 custom-scrollbar">

            {/* ================================================================= */}
            {/* FEATURE SECTION 1: STATUTORY COMPLIANCE & PFMA SEC 38(1)(j) */}
            {/* ================================================================= */}
            {(activeFeatureTab === 'ALL' || activeFeatureTab === 'COMPLIANCE') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      PFMA Section 38(1)(j) Statutory Compliance &amp; Assurance
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Score: {dossier.compliance.score}% • {dossier.compliance.status}
                  </span>
                </div>

                {/* AGSA Audit Findings Box */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Auditor-General South Africa (AGSA) Audit Assessment ({dossier.compliance.auditYear})
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      dossier.compliance.auditOutcome === 'CLEAN_AUDIT' ? 'bg-teal-100 text-teal-800' :
                      dossier.compliance.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS' ? 'bg-blue-100 text-blue-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {dossier.compliance.auditFindingTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {dossier.compliance.auditFindingDetails}
                  </p>
                </div>

                {/* Mandatory Submissions Checklist */}
                <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Mandatory Statutory Submissions ({dossier.compliance.validatedCount} of {dossier.compliance.totalChecklistItems} Validated)
                    </div>
                    <span className="text-[10px] text-slate-400">PFMA Schedule 3A / NPO Transfer Directives</span>
                  </div>

                  <div className="space-y-1.5 divide-y divide-slate-100 text-xs">
                    {dossier.compliance.checklist.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 pt-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${
                            item.status === 'Overdue' ? 'text-rose-500' : 'text-emerald-600'
                          }`} />
                          <span className="text-slate-700 font-medium text-[11px]">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                            item.status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* FEATURE SECTION 2: PERFORMANCE & CORE APP MANDATE KPIS */}
            {/* ================================================================= */}
            {(activeFeatureTab === 'ALL' || activeFeatureTab === 'PERFORMANCE') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-teal-100 text-teal-800">
                      <Target className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Annual Performance Plan (APP) Mandate Delivery &amp; MTSF Targets
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                    Overall Delivery Rate: {dossier.performance.deliveryRate}%
                  </span>
                </div>

                {/* Job Creation Priority Bar */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      MTSF Priority 1: Job Creation &amp; Youth Employment
                    </span>
                    <span className="font-bold text-emerald-800">
                      {dossier.performance.mtsfJobsTotal.toLocaleString()} of {dossier.performance.targetJobsTotal.toLocaleString()} Target
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.round((dossier.performance.mtsfJobsTotal / (dossier.performance.targetJobsTotal || 1)) * 100))}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-center pt-1 text-slate-600">
                    <div>Permanent: <strong>{selectedEntity.jobStats.permanentJobs}</strong></div>
                    <div>Youth (18-35): <strong className="text-sky-700">{selectedEntity.jobStats.youthJobsCreated}</strong></div>
                    <div>Practitioners Supported: <strong className="text-teal-700">{selectedEntity.jobStats.creativeSectorPractitionersSupported}</strong></div>
                  </div>
                </div>

                {/* Core KPIs Tracked */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Core Mandate Performance Indicators (Q1 - Q4 Progression)
                  </div>

                  {dossier.performance.kpis.map((kpi) => (
                    <div key={kpi.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{kpi.name}</div>
                          <div className="text-[10px] text-slate-500">{kpi.programme} • {kpi.description}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          kpi.status === 'ON_TRACK' ? 'bg-emerald-100 text-emerald-800' :
                          kpi.status === 'AT_RISK' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {kpi.status.replace(/_/g, ' ')} ({kpi.percentageAchieved}%)
                        </span>
                      </div>

                      {/* Quarterly Milestone Breakdown */}
                      <div className="grid grid-cols-5 gap-1 text-[10px] text-center pt-1 border-t border-slate-100">
                        <div className="p-1 rounded bg-slate-50">
                          <div className="text-slate-400">Baseline</div>
                          <div className="font-bold text-slate-700">{kpi.baseline}</div>
                        </div>
                        <div className="p-1 rounded bg-slate-50">
                          <div className="text-slate-400">Q1 Target/Act</div>
                          <div className="font-bold text-slate-800">{kpi.q1Actual} / {kpi.q1Target}</div>
                        </div>
                        <div className="p-1 rounded bg-slate-50">
                          <div className="text-slate-400">Q2 Target/Act</div>
                          <div className="font-bold text-slate-800">{kpi.q2Actual} / {kpi.q2Target}</div>
                        </div>
                        <div className="p-1 rounded bg-slate-50">
                          <div className="text-slate-400">Q3 Target/Act</div>
                          <div className="font-bold text-slate-800">{kpi.q3Actual} / {kpi.q3Target}</div>
                        </div>
                        <div className="p-1 rounded bg-emerald-50 border border-emerald-100">
                          <div className="text-emerald-700 font-semibold">Annual Target</div>
                          <div className="font-black text-emerald-900">{kpi.annualTarget} {kpi.unit}</div>
                        </div>
                      </div>

                      {/* Variance Commentary */}
                      <div className="text-[11px] p-2 rounded bg-slate-50 border border-slate-100 text-slate-600">
                        <span className="font-bold text-slate-700">Variance &amp; Delivery Notes: </span>
                        {kpi.varianceExplanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* FEATURE SECTION 3: VOTE 37 FUNDING & 4-QUARTER TRANCHE SCHEDULE */}
            {/* ================================================================= */}
            {(activeFeatureTab === 'ALL' || activeFeatureTab === 'FUNDING') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-100 text-amber-800">
                      <Coins className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Statutory Vote 37 Funding Compliance &amp; 4-Quarter Tranches
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    Utilization: <strong className="text-emerald-800">{dossier.funding.utilizationRate}%</strong> of Transferred
                  </span>
                </div>

                {/* 4 Financial Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-medium">Approved Vote 37</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      R {(dossier.funding.approvedBudgetZAR / 1_000_000).toFixed(1)}M
                    </div>
                    <div className="text-[9px] text-slate-400">Annual Gazette</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-teal-50/80 border border-teal-200">
                    <div className="text-[10px] text-teal-800 font-semibold">Transferred to Date (75%)</div>
                    <div className="text-sm font-black text-teal-900 mt-0.5">
                      R {(dossier.funding.transferredAmountZAR / 1_000_000).toFixed(1)}M
                    </div>
                    <div className="text-[9px] text-teal-700">Q1 + Q2 + Q3 Tranches</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-medium">Reported Expenditure</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      R {(dossier.funding.reportedExpenditureZAR / 1_000_000).toFixed(1)}M
                    </div>
                    <div className="text-[9px] text-slate-400">Audited Vouchers</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200">
                    <div className="text-[10px] text-amber-800 font-semibold">Pending Q4 Gate (25%)</div>
                    <div className="text-sm font-black text-amber-900 mt-0.5">
                      R {(dossier.funding.balancePendingZAR / 1_000_000).toFixed(1)}M
                    </div>
                    <div className="text-[9px] text-amber-700">Awaiting PFMA Gate</div>
                  </div>
                </div>

                {/* 4-Quarter Statutory Tranche Schedule */}
                <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Statutory 4-Quarter Tranche Schedule (PFMA 25% Equal Tranches)
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Approved Schedule</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    {dossier.funding.tranches.map((t) => (
                      <div key={t.quarter} className={`p-2.5 rounded-lg border text-left ${
                        t.status === 'PENDING_GATE' 
                          ? 'bg-amber-50/60 border-amber-200' 
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{t.quarter} Tranche (25%)</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            t.status === 'PENDING_GATE' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {t.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="font-black text-slate-900 text-sm mt-1">
                          R {(t.amountZAR / 1_000_000).toFixed(2)}M
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{t.disbursedDate}</div>
                        <div className="text-[9px] text-slate-400 mt-1 leading-tight">{t.notes}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* FEATURE SECTION 4: REPORTS & STATUTORY DECEMBER BUDGET MANDATE */}
            {/* ================================================================= */}
            {(activeFeatureTab === 'ALL' || activeFeatureTab === 'REPORTS') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-sky-100 text-sky-800">
                      <FileText className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Statutory Quarterly Reports &amp; December Budget Mandate
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                    PFMA Section 38(1)(j) Dossier
                  </span>
                </div>

                {/* STATUTORY DECEMBER BUDGET MANDATE CARD (The core feature requested by user) */}
                <div className="p-4 bg-emerald-50/80 border-2 border-emerald-300 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-800" />
                        <span className="font-black text-xs text-emerald-950 uppercase tracking-wider">
                          Statutory December Budget Mandate (PFMA Section 38(1)(j))
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-900 mt-0.5">
                        Statutory Mandate: Current year budget must be submitted in December partitioned into 4 quarters (25% each); following year budget must be submitted in December for MTEF parliamentary tabling.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900 shrink-0">
                      December Mandate Verified
                    </span>
                  </div>

                  {/* Dual Grid: Current Year 4-Quarter Partition vs Following Year MTEF */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Panel 1: Current Year Budget Submitted December in 4 Quarters */}
                    <div className="p-3 rounded-lg bg-white border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                        <span className="font-bold text-emerald-950 text-[11px]">
                          1. Current Year Budget Submitted December
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          In 4 Quarters (25% each)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Total Approved: <strong className="text-slate-900">R {(dossier.funding.approvedBudgetZAR / 1_000_000).toFixed(2)}M</strong>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                        <div className="p-1 rounded bg-slate-50">
                          <div className="text-slate-400">Q1 (25%)</div>
                          <div className="font-bold text-slate-800">R {(dossier.funding.approvedBudgetZAR / 4_000_000).toFixed(1)}M</div>
                        </div>
                        <div className="p-1 rounded bg-slate-50">
                          <div className="text-slate-400">Q2 (25%)</div>
                          <div className="font-bold text-slate-800">R {(dossier.funding.approvedBudgetZAR / 4_000_000).toFixed(1)}M</div>
                        </div>
                        <div className="p-1 rounded bg-slate-50">
                          <div className="text-slate-400">Q3 (25%)</div>
                          <div className="font-bold text-slate-800">R {(dossier.funding.approvedBudgetZAR / 4_000_000).toFixed(1)}M</div>
                        </div>
                        <div className="p-1 rounded bg-slate-50">
                          <div className="text-slate-400">Q4 (25%)</div>
                          <div className="font-bold text-slate-800">R {(dossier.funding.approvedBudgetZAR / 4_000_000).toFixed(1)}M</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-emerald-800 font-medium">
                        ✓ Submitted on {dossier.funding.decemberStatutoryBudget.currentYearSubmission.submittedDate} • Fully partitioned and gazetted.
                      </div>
                    </div>

                    {/* Panel 2: Following Year Budget Submitted December (MTEF Tabling) */}
                    <div className="p-3 rounded-lg bg-white border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                        <span className="font-bold text-emerald-950 text-[11px]">
                          2. Following Year Budget Submitted December
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          MTEF Tabling
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Projected MTEF Vote 37: <strong className="text-slate-900">R {(dossier.funding.decemberStatutoryBudget.followingYearSubmission.projectedBudgetZAR / 1_000_000).toFixed(2)}M</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 leading-relaxed">
                        Submitted prior to December 31 statutory cut-off for National Treasury consolidation and ministerial budget vote defence.
                      </div>
                      <div className="text-[10px] text-emerald-800 font-medium">
                        ✓ Submitted on {dossier.funding.decemberStatutoryBudget.followingYearSubmission.submittedDate} • {dossier.funding.decemberStatutoryBudget.followingYearSubmission.mtefTablingStatus}.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quarterly Submissions & PoE Records */}
                <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Quarterly Performance Reports &amp; Portfolio of Evidence (PoE)
                  </div>

                  <div className="space-y-2">
                    {dossier.reports.quarterlySubmissions.map((rep) => (
                      <div key={rep.quarter} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{selectedEntity.shortCode} {rep.quarter} Statutory Report</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              rep.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                              rep.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' :
                              rep.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {rep.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            PoE Status: <strong className="text-slate-700">{rep.poeStatus}</strong> • Submitted by: {rep.submittedBy}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => showToast(`Downloaded ${selectedEntity.shortCode} ${rep.quarter} Performance Report & Verified PoE.`)}
                            className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download PoE</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* FEATURE SECTION 5: RISK & EARLY WARNING ALERTS */}
            {/* ================================================================= */}
            {(activeFeatureTab === 'ALL' || activeFeatureTab === 'RISKS') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-md ${
                      dossier.risks.level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                      dossier.risks.level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      dossier.risks.level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Governance Risk Profile &amp; Early Warning System
                    </h4>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    dossier.risks.level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                    dossier.risks.level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    dossier.risks.level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {dossier.risks.level} Risk • Score {dossier.risks.score}/100
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 text-xs">
                    {dossier.risks.headline}
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {dossier.risks.reason}
                  </p>

                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Key Contributing Factors:
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-600 list-disc pl-4">
                      {dossier.risks.contributingFactors.map((factor, i) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2 rounded bg-amber-50 border border-amber-100 text-[11px] text-amber-900 mt-2">
                    <strong className="block text-amber-950">Recommended DSAC Oversight Intervention:</strong>
                    {dossier.risks.recommendedAction}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* FEATURE SECTION 6: LEADERSHIP, DEMOGRAPHICS & SECTOR TRANSFORMATION */}
            {/* ================================================================= */}
            {(activeFeatureTab === 'ALL' || activeFeatureTab === 'PROFILE') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-purple-100 text-purple-800">
                      <Users className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Executive Leadership, Staff Equity &amp; Demographics
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Total Staff: {selectedEntity.demographics.totalStaff || 120}
                  </span>
                </div>

                {/* Leadership & Contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Executive Leadership (Accounting Officer)</span>
                    </div>
                    <div className="font-bold text-slate-900 mt-1 text-xs">
                      {selectedEntity.headOfEntity}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Statutory Signatory for Section 38(1)(j) Assurances
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
                      <Briefcase className="w-4 h-4 text-teal-600" />
                      <span>Statutory Reporting Officer / CFO</span>
                    </div>
                    <div className="font-bold text-slate-900 mt-1 text-xs">
                      {selectedEntity.reportingOfficerName}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {selectedEntity.contactEmail}
                    </div>
                  </div>
                </div>

                {/* Demographic Profile */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Staff Transformation &amp; Employment Equity Profile
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                    <div className="p-2 rounded bg-slate-50">
                      <span className="text-[10px] text-slate-500">African</span>
                      <div className="font-bold text-slate-900 mt-0.5">{selectedEntity.demographics.african}%</div>
                    </div>
                    <div className="p-2 rounded bg-slate-50">
                      <span className="text-[10px] text-slate-500">Coloured</span>
                      <div className="font-bold text-slate-900 mt-0.5">{selectedEntity.demographics.coloured}%</div>
                    </div>
                    <div className="p-2 rounded bg-slate-50">
                      <span className="text-[10px] text-slate-500">Female Staff</span>
                      <div className="font-bold text-emerald-700 mt-0.5">{selectedEntity.demographics.female}%</div>
                    </div>
                    <div className="p-2 rounded bg-slate-50">
                      <span className="text-[10px] text-slate-500">Persons w/ Disabilities</span>
                      <div className="font-bold text-slate-900 mt-0.5">{selectedEntity.demographics.personsWithDisabilities}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
