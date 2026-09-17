import React, { useState, useMemo } from 'react';
import { 
  X, 
  Building2, 
  ShieldCheck, 
  Target, 
  Coins, 
  FileText, 
  AlertTriangle, 
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Maximize2,
  Minimize2,
  Users,
  Send,
  Download,
  FileCheck,
  Award,
  BarChart3,
  TrendingUp,
  Briefcase,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PublicEntity, KPIRecord } from '../../types';
import { store } from '../../services/store';
import { generateEntityFeatureDossier } from '../../services/entityFeatureGenerator';

export type DsacFeatureId = 'compliance' | 'performance' | 'support' | 'reports' | 'entities' | 'risks';

interface DsacFeatureSideViewProps {
  isOpen: boolean;
  onClose: () => void;
  activeFeature: DsacFeatureId;
  onChangeFeature: (feature: DsacFeatureId) => void;
  selectedEntityId: string;
  onSelectEntityId: (id: string) => void;
  onOpenWorkspace?: (id: string) => void;
  initialEntityFilter?: 'ALL' | 'PUBLIC_ENTITY' | 'NPO';
}

export const DsacFeatureSideView: React.FC<DsacFeatureSideViewProps> = ({
  isOpen,
  onClose,
  activeFeature,
  onChangeFeature,
  selectedEntityId,
  onSelectEntityId,
  onOpenWorkspace,
  initialEntityFilter,
}) => {
  const [isWide, setIsWide] = useState<boolean>(false);
  const [entityFilter, setEntityFilter] = useState<'ALL' | 'PUBLIC_ENTITY' | 'NPO'>(initialEntityFilter || 'ALL');
  const [clusterFilter, setClusterFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  React.useEffect(() => {
    if (initialEntityFilter) {
      setEntityFilter(initialEntityFilter);
    }
  }, [initialEntityFilter]);
  
  // Interactive action states
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [selectedReportQuarter, setSelectedReportQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'DECEMBER_BUDGET'>('Q2');

  const entities = store.entities;

  // Selected entity object
  const currentEntity = useMemo(() => {
    return entities.find(e => e.id === selectedEntityId) || entities[0] || null;
  }, [entities, selectedEntityId]);

  // Dossier containing rich generated features for this entity
  const featureDossier = useMemo(() => {
    if (!currentEntity) return null;
    return generateEntityFeatureDossier(currentEntity);
  }, [currentEntity]);

  // KPIs for this entity (fallback to generated sector-specific APP KPIs if store has none)
  const displayKpis = useMemo(() => {
    if (!currentEntity) return [];
    const fromStore = store.kpis.filter(k => k.entityId === currentEntity.id);
    if (fromStore.length > 0) return fromStore;
    if (!featureDossier) return [];
    return featureDossier.performance.kpis.map(k => ({
      id: k.id,
      entityId: currentEntity.id,
      name: k.name,
      programmeName: k.programme,
      description: k.description,
      baseline: k.baseline,
      annualTarget: k.annualTarget,
      unitOfMeasure: k.unit,
      q1Target: k.q1Target,
      q1Actual: k.q1Actual,
      q2Target: k.q2Target,
      q2Actual: k.q2Actual,
      q3Target: k.q3Target,
      q3Actual: k.q3Actual,
      q4Target: k.q4Target,
      currentValue: k.currentValue,
      expectedValue: Math.round(k.annualTarget * 0.75),
      percentageAchieved: k.percentageAchieved,
      status: k.status,
      reportingQuarter: 'Q3' as const,
      varianceExplanation: k.varianceExplanation,
      correctiveAction: k.correctiveAction,
    }));
  }, [currentEntity, featureDossier]);

  // Filtered entities list for selection
  const filteredEntities = useMemo(() => {
    return entities.filter(e => {
      if (entityFilter !== 'ALL' && e.type !== entityFilter) return false;
      if (clusterFilter !== 'ALL' && e.cluster !== clusterFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.shortCode.toLowerCase().includes(q) ||
          e.headOfEntity.toLowerCase().includes(q) ||
          e.cluster.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entities, entityFilter, clusterFilter, searchQuery]);

  const publicEntitiesCount = entities.filter(e => e.type === 'PUBLIC_ENTITY').length;
  const nposCount = entities.filter(e => e.type === 'NPO').length;

  const clusters = useMemo(() => {
    return Array.from(new Set(entities.map(e => e.cluster)));
  }, [entities]);

  const handleEntityFilterChange = (filter: 'ALL' | 'PUBLIC_ENTITY' | 'NPO') => {
    setEntityFilter(filter);
    const matching = entities.filter(e => {
      if (filter !== 'ALL' && e.type !== filter) return false;
      if (clusterFilter !== 'ALL' && e.cluster !== clusterFilter) return false;
      return true;
    });
    if (matching.length > 0 && (!currentEntity || !matching.some(m => m.id === currentEntity.id))) {
      onSelectEntityId(matching[0].id);
    }
  };

  const handleClusterFilterChange = (cluster: string) => {
    setClusterFilter(cluster);
    const matching = entities.filter(e => {
      if (entityFilter !== 'ALL' && e.type !== entityFilter) return false;
      if (cluster !== 'ALL' && e.cluster !== cluster) return false;
      return true;
    });
    if (matching.length > 0 && (!currentEntity || !matching.some(m => m.id === currentEntity.id))) {
      onSelectEntityId(matching[0].id);
    }
  };

  const handlePrevEntity = () => {
    if (filteredEntities.length === 0) return;
    const currentIdx = filteredEntities.findIndex(e => e.id === currentEntity?.id);
    const prevIdx = (currentIdx - 1 + filteredEntities.length) % filteredEntities.length;
    onSelectEntityId(filteredEntities[prevIdx].id);
  };

  const handleNextEntity = () => {
    if (filteredEntities.length === 0) return;
    const currentIdx = filteredEntities.findIndex(e => e.id === currentEntity?.id);
    const nextIdx = (currentIdx + 1) % filteredEntities.length;
    onSelectEntityId(filteredEntities[nextIdx].id);
  };

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  // 1. Action: Verify compliance
  const handleVerifyCompliance = () => {
    if (!currentEntity) return;
    const updated = {
      ...currentEntity,
      overallComplianceScore: Math.min(100, currentEntity.overallComplianceScore + 5),
    };
    store.updateEntity(updated);
    showNotification(`Assurance verified for ${currentEntity.shortCode}. Compliance updated to ${updated.overallComplianceScore}%.`);
  };

  // 2. Action: Disburse Tranche
  const handleDisburseTranche = () => {
    if (!currentEntity) return;
    const trancheAmount = Math.round(currentEntity.budgetAllocationZAR * 0.25);
    const newTransferred = Math.min(currentEntity.budgetAllocationZAR, currentEntity.transferredAmountZAR + trancheAmount);
    const updated = {
      ...currentEntity,
      transferredAmountZAR: newTransferred,
    };
    store.updateEntity(updated);
    showNotification(`Q4 statutory funding tranche of R ${(trancheAmount / 1_000_000).toFixed(2)}M disbursed to ${currentEntity.shortCode}.`);
  };

  // 3. Action: Approve Report
  const handleApproveReport = () => {
    if (!currentEntity) return;
    showNotification(`Statutory ${selectedReportQuarter} submission for ${currentEntity.shortCode} approved with official DSAC oversight endorsement.`);
    setReviewNote('');
  };

  // 4. Action: Request Correction
  const handleRequestCorrection = () => {
    if (!currentEntity) return;
    showNotification(`Correction notice issued to Accounting Officer ${currentEntity.headOfEntity} (${currentEntity.contactEmail}).`);
    setReviewNote('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div 
        className={`${isWide ? 'w-full max-w-4xl' : 'w-full max-w-2xl'} bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 transition-all duration-300 animate-slideLeft`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER: Branding, Feature Title & Controls */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-black text-xs shadow-xs">
              SA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                  DSAC REPO • Side View Inspector
                </span>
                <span className="text-[10px] text-slate-400">•</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-semibold px-1.5 py-0.5 rounded border border-emerald-800">
                  {entities.length} Portfolios (26 PEs + 6 NPOs)
                </span>
              </div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5 capitalize">
                {activeFeature === 'compliance' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                {activeFeature === 'performance' && <Target className="w-4 h-4 text-emerald-400" />}
                {activeFeature === 'support' && <Coins className="w-4 h-4 text-emerald-400" />}
                {activeFeature === 'reports' && <FileText className="w-4 h-4 text-emerald-400" />}
                {activeFeature === 'entities' && <Building2 className="w-4 h-4 text-emerald-400" />}
                {activeFeature === 'risks' && <AlertTriangle className="w-4 h-4 text-emerald-400" />}
                <span>
                  {activeFeature === 'support' ? 'Support & Funding' : activeFeature === 'entities' ? 'Entities & NPOs Register' : activeFeature === 'risks' ? 'Risk & Early Warnings' : activeFeature}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsWide(!isWide)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isWide ? "Standard Width" : "Expand View"}
            >
              {isWide ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Side View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRIMARY FEATURE SWITCHER TABS */}
        <div className="flex items-center border-b border-slate-200 px-4 bg-slate-50 overflow-x-auto text-xs font-bold text-slate-600 shrink-0">
          {[
            { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
            { id: 'performance', label: 'Performance', icon: Target },
            { id: 'support', label: 'Support & Funding', icon: Coins },
            { id: 'reports', label: 'Reports & PoE', icon: FileText },
            { id: 'entities', label: 'All 32 Entities', icon: Building2 },
            { id: 'risks', label: 'Risk & Alerts', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFeature === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeFeature(tab.id as DsacFeatureId)}
                className={`py-3 px-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'border-emerald-700 text-emerald-800 bg-white font-extrabold shadow-2xs'
                    : 'border-transparent hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* NOTIFICATION TOAST BAR */}
        {actionSuccessMessage && (
          <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-semibold flex items-center justify-between animate-fadeIn shrink-0">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {actionSuccessMessage}
            </span>
            <button onClick={() => setActionSuccessMessage(null)} className="opacity-80 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ENTITY SELECTOR BAR (26 Public Entities + 6 NPOs) */}
        <div className="p-3 bg-white border-b border-slate-200 space-y-2.5 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Select Entity:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[10px] font-bold">
                <button
                  onClick={() => handleEntityFilterChange('ALL')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                    entityFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All (32)
                </button>
                <button
                  onClick={() => handleEntityFilterChange('PUBLIC_ENTITY')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                    entityFilter === 'PUBLIC_ENTITY' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  26 Public Entities
                </button>
                <button
                  onClick={() => handleEntityFilterChange('NPO')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                    entityFilter === 'NPO' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  6 NPOs
                </button>
              </div>
            </div>

            {/* Cluster dropdown filter */}
            <select
              value={clusterFilter}
              onChange={(e) => handleClusterFilterChange(e.target.value)}
              className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1"
            >
              <option value="ALL">All Clusters ({clusters.length})</option>
              {clusters.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Quick Entity Dropdown picker with Prev/Next Navigation */}
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={handlePrevEntity}
              disabled={filteredEntities.length <= 1}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-colors"
              title="Previous Institution"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex-1">
              <select
                value={currentEntity?.id || ''}
                onChange={(e) => onSelectEntityId(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 pr-8 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
              >
                {(entityFilter === 'ALL' || entityFilter === 'PUBLIC_ENTITY') && (
                  <optgroup label={`Statutory Public Entities (${entities.filter(e => e.type === 'PUBLIC_ENTITY' && (clusterFilter === 'ALL' || e.cluster === clusterFilter)).length})`}>
                    {entities
                      .filter(e => e.type === 'PUBLIC_ENTITY' && (clusterFilter === 'ALL' || e.cluster === clusterFilter))
                      .map(e => (
                        <option key={e.id} value={e.id}>
                          {e.shortCode} - {e.name} ({e.cluster})
                        </option>
                      ))}
                  </optgroup>
                )}
                {(entityFilter === 'ALL' || entityFilter === 'NPO') && (
                  <optgroup label={`Subsidized Cultural NPOs (${entities.filter(e => e.type === 'NPO' && (clusterFilter === 'ALL' || e.cluster === clusterFilter)).length})`}>
                    {entities
                      .filter(e => e.type === 'NPO' && (clusterFilter === 'ALL' || e.cluster === clusterFilter))
                      .map(e => (
                        <option key={e.id} value={e.id}>
                          {e.shortCode} - {e.name} ({e.cluster})
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            <button
              onClick={handleNextEntity}
              disabled={filteredEntities.length <= 1}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-colors"
              title="Next Institution"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {onOpenWorkspace && currentEntity && (
              <button
                onClick={() => onOpenWorkspace(currentEntity.id)}
                className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer transition-colors"
                title="Open Complete Entity Workspace"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Workspace</span>
              </button>
            )}
          </div>
        </div>

        {/* ACTIVE ENTITY BANNER CARD */}
        {currentEntity && (
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                currentEntity.type === 'PUBLIC_ENTITY' ? 'bg-teal-100 text-teal-800' : 'bg-sky-100 text-sky-800'
              }`}>
                {currentEntity.shortCode.slice(0, 3)}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs text-slate-900 truncate">{currentEntity.name}</span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0 ${
                    currentEntity.type === 'PUBLIC_ENTITY' ? 'bg-teal-100 text-teal-900' : 'bg-sky-100 text-sky-900'
                  }`}>
                    {currentEntity.type === 'PUBLIC_ENTITY' ? 'Public Entity' : 'Subsidized NPO'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  Cluster: {currentEntity.cluster} • Officer: {currentEntity.headOfEntity}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] text-slate-400 font-medium">Compliance</div>
              <div className="text-xs font-black text-emerald-800">
                {currentEntity.overallComplianceScore}%
              </div>
            </div>
          </div>
        )}

        {/* MAIN FEATURE CONTENT SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* ========================================================================= */}
          {/* FEATURE 1: COMPLIANCE VIEW */}
          {/* ========================================================================= */}
          {activeFeature === 'compliance' && currentEntity && (
            <div className="space-y-4 text-xs">
              
              {/* Compliance Header Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    PFMA Statutory Compliance Oversight
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-1">
                    Section 38(1)(j) &amp; Regulatory Standing
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Assurance verification for statutory transfer disbursements under South African PFMA.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-medium">Compliance Score</div>
                    <div className="text-2xl font-black text-emerald-800">
                      {currentEntity.overallComplianceScore}%
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    currentEntity.overallComplianceScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                    currentEntity.overallComplianceScore >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {currentEntity.overallComplianceScore >= 80 ? 'Compliant' : currentEntity.overallComplianceScore >= 60 ? 'Remediation' : 'High Risk'}
                  </div>
                </div>
              </div>

              {/* AGSA Audit Outcome Block */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span>AGSA Audit Assessment ({currentEntity.auditYear})</span>
                  <span className="text-[10px] font-mono text-slate-400 font-normal">Auditor-General South Africa</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {currentEntity.auditOutcome.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Official Auditor-General Published Finding
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentEntity.auditOutcome === 'CLEAN_AUDIT' ? 'bg-emerald-100 text-emerald-800' :
                    currentEntity.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS' ? 'bg-teal-100 text-teal-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {currentEntity.auditOutcome === 'CLEAN_AUDIT' ? 'Clean' : 'Matters Emphasized'}
                  </span>
                </div>
              </div>

              {/* Statutory Section 38(1)(j) Checklist */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  PFMA Section 38(1)(j) Statutory Assurance Checklist
                </div>
                <div className="space-y-1.5 divide-y divide-slate-100">
                  {[
                    { label: 'Written Section 38(1)(j) Assurance Certificate on File', status: 'Compliant', date: '15 Jan 2025' },
                    { label: 'Annual Performance Plan (APP) Tabled in Parliament', status: 'Compliant', date: '12 Mar 2024' },
                    { label: 'Current Year Budget Submitted December into 4 Quarters (25% each)', status: 'Compliant', date: '15 Dec 2023' },
                    { label: 'Following Year Budget Submitted December (MTEF Tabling)', status: 'Compliant', date: '12 Dec 2024' },
                    { label: 'Q1 Statutory Quarterly Performance Report Verified', status: 'Verified', date: '30 Jul 2024' },
                    { label: 'Q2 Statutory Quarterly Performance Report Verified', status: 'Verified', date: '31 Oct 2024' },
                    { label: 'Q3 Statutory Quarterly Performance Report PoE Check', status: currentEntity.riskLevel === 'HIGH' ? 'Overdue' : 'Submitted', date: '31 Jan 2025' },
                    { label: 'SARS Tax Compliance Pin & Valid B-BBEE Level', status: 'Valid Level 1', date: 'Verified' },
                    { label: 'Audit & Risk Committee Oversight Minutes Logged', status: 'Compliant', date: 'Quarterly' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 pt-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${
                          item.status === 'Overdue' ? 'text-rose-500' : 'text-emerald-600'
                        }`} />
                        <span className="text-slate-700 font-medium text-[11px]">{item.label}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Actions */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Oversight Officer Actions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleVerifyCompliance}
                    className="py-2.5 px-3 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify &amp; Update Assurance</span>
                  </button>

                  <button
                    onClick={() => showNotification(`Section 38(1)(j) Written Certificate downloaded for ${currentEntity.name}.`)}
                    className="py-2.5 px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Download Certificate PDF</span>
                  </button>
                </div>
              </div>

              {/* Portfolio Peer Comparison (Same Cluster) */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Cluster Peers ({currentEntity.cluster})
                </div>
                <div className="space-y-1.5">
                  {entities.filter(e => e.cluster === currentEntity.cluster).slice(0, 4).map(peer => (
                    <div 
                      key={peer.id}
                      onClick={() => onSelectEntityId(peer.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        peer.id === currentEntity.id ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-[11px]">{peer.shortCode}</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[180px]">{peer.name}</span>
                      </div>
                      <span className="font-black text-emerald-800 text-[11px]">{peer.overallComplianceScore}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* FEATURE 2: PERFORMANCE VIEW */}
          {/* ========================================================================= */}
          {activeFeature === 'performance' && currentEntity && (
            <div className="space-y-4 text-xs">
              
              {/* Performance Stats Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] font-semibold text-slate-500">MTSF Target Ratio</div>
                  <div className="text-lg font-black text-emerald-800 mt-0.5">
                    {Math.round((currentEntity.jobStats.permanentJobs / (currentEntity.jobStats.targetJobsAnnual || 300)) * 100)}%
                  </div>
                  <div className="text-[9px] text-slate-400">Annual Delivery</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] font-semibold text-slate-500">Youth Jobs</div>
                  <div className="text-lg font-black text-sky-800 mt-0.5">
                    {currentEntity.jobStats.youthJobsCreated}
                  </div>
                  <div className="text-[9px] text-sky-600 font-semibold">Priority Metric</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] font-semibold text-slate-500">Practitioners</div>
                  <div className="text-lg font-black text-teal-800 mt-0.5">
                    {currentEntity.jobStats.creativeSectorPractitionersSupported}
                  </div>
                  <div className="text-[9px] text-slate-400">Supported</div>
                </div>
              </div>

              {/* Progress to Annual Job Targets */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    MTSF Priority 1: Sustainable Job Creation
                  </span>
                  <span className="font-bold text-emerald-800">
                    {currentEntity.jobStats.permanentJobs + currentEntity.jobStats.youthJobsCreated} / {currentEntity.jobStats.targetJobsAnnual} Target
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.round(((currentEntity.jobStats.permanentJobs + currentEntity.jobStats.youthJobsCreated) / (currentEntity.jobStats.targetJobsAnnual || 500)) * 100))}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>Baseline: 0</span>
                  <span>Target: {currentEntity.jobStats.targetJobsAnnual} Beneficiaries</span>
                </div>
              </div>

              {/* Specific KPIs for this Entity */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span>Official Annual Performance Plan (APP) KPIs</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">{displayKpis.length} Tracked</span>
                </div>

                {displayKpis.length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-50 text-slate-500 text-center text-xs">
                    Standard statutory baseline active for {currentEntity.shortCode}.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {displayKpis.map(kpi => (
                      <div key={kpi.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{kpi.name}</div>
                            <div className="text-[10px] text-slate-500">{kpi.programmeName}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            kpi.status === 'ON_TRACK' ? 'bg-emerald-100 text-emerald-800' :
                            kpi.status === 'AT_RISK' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {kpi.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1 border-t border-slate-200">
                          <div>
                            <div className="text-slate-400">Q1</div>
                            <div className="font-bold text-slate-700">{kpi.q1Actual || 0}/{kpi.q1Target}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Q2</div>
                            <div className="font-bold text-slate-700">{kpi.q2Actual || 0}/{kpi.q2Target}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Q3</div>
                            <div className="font-bold text-slate-700">{kpi.q3Actual || 0}/{kpi.q3Target}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Annual</div>
                            <div className="font-bold text-emerald-700">{kpi.currentValue}/{kpi.annualTarget}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Performance Verification */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Oversight Performance Endorsement
                </div>
                <button
                  onClick={() => showNotification(`Quarterly performance verified for ${currentEntity.shortCode} and pushed to parliamentary briefing repo.`)}
                  className="w-full py-2.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Verify Quarterly Targets &amp; Endorse</span>
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* FEATURE 3: SUPPORT & FUNDING VIEW */}
          {/* ========================================================================= */}
          {activeFeature === 'support' && currentEntity && (
            <div className="space-y-4 text-xs">
              
              {/* Statutory Budget Breakdown Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    MTEF Statutory Allocation
                  </span>
                  <span className="text-xs font-bold text-blue-900">
                    Vote 37: Sport, Arts and Culture
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Total Approved Budget</div>
                    <div className="text-lg font-black text-slate-900">
                      R {(currentEntity.budgetAllocationZAR / 1_000_000).toFixed(2)}M ZAR
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Transferred to Date</div>
                    <div className="text-lg font-black text-teal-800">
                      R {(currentEntity.transferredAmountZAR / 1_000_000).toFixed(2)}M ZAR
                    </div>
                    <div className="text-[10px] text-teal-700 font-semibold">
                      {Math.round((currentEntity.transferredAmountZAR / currentEntity.budgetAllocationZAR) * 100)}% Disbursed
                    </div>
                  </div>
                </div>

                {/* Tranche Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                    <span>Tranche Progress (Q1 to Q4)</span>
                    <span>Remaining: R {((currentEntity.budgetAllocationZAR - currentEntity.transferredAmountZAR) / 1_000_000).toFixed(2)}M</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-700 h-full rounded-full" 
                      style={{ width: `${Math.round((currentEntity.transferredAmountZAR / currentEntity.budgetAllocationZAR) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Quarterly Tranche Breakdown */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Statutory Tranche Schedule (2024/25)
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Submitted Dec in 4 Quarters
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Current financial year budget was submitted in <strong>December into 4 equal quarters (25% each)</strong>. Budget for the following year must be submitted in <strong>December</strong>.
                </p>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">Tranche 1 (Q1 - 25%) • R {((currentEntity.budgetAllocationZAR * 0.25) / 1_000_000).toFixed(2)}M</div>
                      <div className="text-[10px] text-slate-500">Paid 15 April 2024 • Section 38 Verified • Dec Allocation Baseline</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Disbursed</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">Tranche 2 (Q2 - 25%) • R {((currentEntity.budgetAllocationZAR * 0.25) / 1_000_000).toFixed(2)}M</div>
                      <div className="text-[10px] text-slate-500">Paid 15 July 2024 • Q1 Performance Endorsed • Dec Allocation Baseline</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Disbursed</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div>
                      <div className="font-bold text-slate-800">Tranche 3 (Q3 - 25%) • R {((currentEntity.budgetAllocationZAR * 0.25) / 1_000_000).toFixed(2)}M</div>
                      <div className="text-[10px] text-slate-500">Paid 15 October 2024 • Q2 Reports Cleared • Dec Allocation Baseline</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Disbursed</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-200">
                    <div>
                      <div className="font-bold text-blue-900">Tranche 4 (Q4 - 25%) • R {((currentEntity.budgetAllocationZAR * 0.25) / 1_000_000).toFixed(2)}M</div>
                      <div className="text-[10px] text-slate-500">Pending Q3 Statutory Review &amp; AFS Baseline • Final 25% Tranche</div>
                    </div>
                    <button
                      onClick={handleDisburseTranche}
                      className="px-2.5 py-1 rounded-md bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] cursor-pointer"
                    >
                      Disburse Tranche
                    </button>
                  </div>
                </div>
              </div>

              {/* Budget Utilization (Matched to portfolio allocations) */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Budget Utilization</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Matched to portfolio allocations
                  </span>
                </div>

                {/* Primary Metric Banner */}
                <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-xs space-y-1">
                  <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                    This Financial Year
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-400">R 1.54B</span>
                    <span className="text-xs font-semibold text-slate-200">Transferred to Date (75%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Portfolio Total: R 2.05B Approved • {currentEntity.shortCode} Statutory Allocation: R {(currentEntity.budgetAllocationZAR / 1_000_000).toFixed(1)}M
                  </div>
                </div>

                {/* 3 Progress Bars */}
                <div className="space-y-2.5 pt-1 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>R 2.05B Approved</span>
                      <span className="font-black text-slate-900">100%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div className="bg-slate-800 h-full rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>R 1.54B Transferred to Date</span>
                      <span className="font-black text-emerald-700">75%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>R 514.0M Balance Pending</span>
                      <span className="font-black text-amber-700">25%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Entity-specific utilization breakdown footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{currentEntity.shortCode} Reported Expenditure:</span>
                  <strong className="text-slate-800 font-bold">
                    R {(currentEntity.reportedExpenditureZAR / 1_000_000).toFixed(1)}M ({Math.round((currentEntity.reportedExpenditureZAR / (currentEntity.transferredAmountZAR || 1)) * 100)}% of disbursed tranche)
                  </strong>
                </div>
              </div>

              {/* Departmental Capacity & Intervention Packages */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  DSAC Capacity Support &amp; Technical Interventions
                </div>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Governance Advisory Task Team</div>
                      <div className="text-[10px] text-slate-500">Assistance with Audit Committee &amp; Risk Registers</div>
                    </div>
                    <button 
                      onClick={() => showNotification(`Governance Advisory Team dispatched to ${currentEntity.shortCode}.`)}
                      className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      Deploy Support
                    </button>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Financial Systems &amp; SCM Technical Aid</div>
                      <div className="text-[10px] text-slate-500">PFMA irregular expenditure remediation unit</div>
                    </div>
                    <button 
                      onClick={() => showNotification(`SCM Technical Aid package requested for ${currentEntity.shortCode}.`)}
                      className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      Deploy Support
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* FEATURE 4: REPORTS & POE VIEW */}
          {/* ========================================================================= */}
          {activeFeature === 'reports' && currentEntity && (
            <div className="space-y-4 text-xs">
              
              {/* Statutory Budget Submission Mandate Banner */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-xl shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-700/80 px-2 py-0.5 rounded text-emerald-100">
                    Statutory PFMA Budget Mandate
                  </span>
                  <span className="text-[10px] text-emerald-200 font-semibold">
                    Vote 37 / Public Entity Treasury Reg. 29
                  </span>
                </div>
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-emerald-100">
                    • <strong>Current Year Budget (2024/25):</strong> Must be submitted in <strong>December into 4 quarters (25% each)</strong>.
                  </p>
                  <p className="font-bold text-emerald-100 mt-0.5">
                    • <strong>Following Year Budget (2025/26):</strong> Must be submitted in <strong>December</strong> for MTEF Parliamentary Tabling.
                  </p>
                </div>
              </div>

              {/* Reports Filter / Quarter Picker & December Budget Toggle */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold">
                {(['Q1', 'Q2', 'Q3'] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => setSelectedReportQuarter(q)}
                    className={`flex-1 py-1.5 rounded-md text-center cursor-pointer transition-all ${
                      selectedReportQuarter === q ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {q} Performance Report
                  </button>
                ))}
                <button
                  onClick={() => setSelectedReportQuarter('DECEMBER_BUDGET')}
                  className={`flex-1 py-1.5 rounded-md text-center cursor-pointer transition-all ${
                    selectedReportQuarter === 'DECEMBER_BUDGET' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900 bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  December Budget Submissions
                </button>
              </div>

              {/* VIEW A: DECEMBER STATUTORY BUDGET SUBMISSIONS (4 QUARTERS & NEXT YEAR) */}
              {selectedReportQuarter === 'DECEMBER_BUDGET' && (
                <div className="space-y-3.5">
                  {/* Part 1: Current Year Budget in 4 Quarters */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Statutory Requirement • Current Financial Year (2024/25)
                        </span>
                        <h3 className="text-sm font-black text-slate-900 mt-1">
                          Current Year Budget Submitted in December into 4 Quarters
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Total Approved Allocation: <strong className="text-slate-800">R {((currentEntity.budgetAllocationZAR) / 1_000_000).toFixed(2)}M ZAR</strong> partitioned into 4 equal 25% tranches.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md shrink-0">
                        Submitted Dec • 4 Quarters Verified
                      </span>
                    </div>

                    {/* 4 Quarters Partition Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">Quarter 1 (25%)</span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">Disbursed</span>
                        </div>
                        <div className="text-sm font-black text-emerald-900">
                          R {((currentEntity.budgetAllocationZAR * 0.25) / 1_000_000).toFixed(2)}M
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Period: 01 Apr – 30 Jun • Verified in December Submission
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">Quarter 2 (25%)</span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">Disbursed</span>
                        </div>
                        <div className="text-sm font-black text-emerald-900">
                          R {((currentEntity.budgetAllocationZAR * 0.25) / 1_000_000).toFixed(2)}M
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Period: 01 Jul – 30 Sep • Verified in December Submission
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">Quarter 3 (25%)</span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">Disbursed</span>
                        </div>
                        <div className="text-sm font-black text-emerald-900">
                          R {((currentEntity.budgetAllocationZAR * 0.25) / 1_000_000).toFixed(2)}M
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Period: 01 Oct – 31 Dec • Verified in December Submission
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">Quarter 4 (25%)</span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-sky-200 text-sky-900">Pending Gate</span>
                        </div>
                        <div className="text-sm font-black text-sky-900">
                          R {((currentEntity.budgetAllocationZAR * 0.25) / 1_000_000).toFixed(2)}M
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Period: 01 Jan – 31 Mar • Subject to Q3 PoE verification
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Part 2: Following Year Budget (2025/26) Submitted in December */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                          Statutory Requirement • Following Financial Year (2025/26)
                        </span>
                        <h3 className="text-sm font-black text-slate-900 mt-1">
                          Following Year Budget Submission (MTEF Parliamentary Tabling)
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Statutory Mandate: Must be submitted in <strong>December</strong> for National Treasury ENE &amp; Vote 37 appropriation.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md shrink-0">
                        Submitted 12 Dec • Endorsed
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Statutory Submission Deadline:</span>
                        <span className="font-bold text-slate-900">31 December 2024</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Actual Submission Date:</span>
                        <span className="font-bold text-emerald-700">12 December 2024 (On Time)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Requested Following Year MTEF Baseline:</span>
                        <span className="font-black text-slate-900">R {((currentEntity.budgetAllocationZAR * 1.05) / 1_000_000).toFixed(2)}M ZAR (+5.0% projected)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Accounting Officer Endorsement:</span>
                        <span className="font-bold text-slate-900">{currentEntity.headOfEntity} (Signed)</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => showNotification(`Downloading December Budget Submission Pack for ${currentEntity.shortCode}...`)}
                        className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Download December Submission Dossier.pdf</span>
                      </button>

                      <button
                        onClick={() => showNotification(`December Budget Submissions verified as fully compliant for ${currentEntity.name}.`)}
                        className="py-2 px-3.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify December Mandate</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW B: QUARTERLY PERFORMANCE REPORTS (Q1, Q2, Q3) */}
              {selectedReportQuarter !== 'DECEMBER_BUDGET' && (
                <>
                  {/* Selected Quarter Report Details */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Statutory Quarterly Submission
                        </span>
                        <h3 className="text-sm font-black text-slate-900 mt-1">
                          {selectedReportQuarter} Performance Report &amp; Portfolio of Evidence (PoE)
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Entity: {currentEntity.name} ({currentEntity.shortCode})
                        </p>
                      </div>

                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                        Formally Verified
                      </span>
                    </div>

                    {/* Quarterly Budget Reconciliation Line (Reflecting December Partition) */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div>
                        <span className="text-slate-500">Quarterly Tranche Allocation:</span>
                        <strong className="text-slate-900 ml-1.5">
                          R {((currentEntity.budgetAllocationZAR * 0.25) / 1_000_000).toFixed(2)}M ZAR
                        </strong>
                        <span className="text-slate-500 text-[10px] ml-1">
                          (25% of annual budget submitted in December)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded self-start sm:self-center">
                        Disbursed per Section 38(1)(j)
                      </span>
                    </div>

                    {/* Submissions checklist */}
                    <div className="space-y-2 border-t border-slate-100 pt-2 text-[11px]">
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600">Accounting Officer Signature:</span>
                        <span className="font-bold text-slate-900">{currentEntity.headOfEntity} (Signed)</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600">Reporting Officer / CFO:</span>
                        <span className="font-bold text-slate-900">{currentEntity.reportingOfficerName}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600">PoE Document Bundle:</span>
                        <button 
                          onClick={() => showNotification(`Downloading PoE Bundle for ${currentEntity.shortCode} ${selectedReportQuarter}...`)}
                          className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PoE-Signed-Archive.zip (14.2 MB)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Report Review Panel */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      DSAC Official Oversight Review &amp; Feedback
                    </div>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder={`Enter official DSAC review comments for ${currentEntity.shortCode} ${selectedReportQuarter} submission...`}
                      className="w-full h-20 p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleRequestCorrection}
                        className="py-2 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Request Correction
                      </button>

                      <button
                        onClick={handleApproveReport}
                        className="py-2 px-4 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Submission</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* FEATURE 5: ALL 32 ENTITIES REGISTER */}
          {/* ========================================================================= */}
          {activeFeature === 'entities' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">Statutory Public Entities &amp; Subsidized NPOs Directory</div>
                  <div className="text-[11px] text-slate-500">26 Public Entities + 6 Subsidized Cultural NPOs</div>
                </div>
                <div className="text-right font-black text-emerald-800">
                  {filteredEntities.length} Listed
                </div>
              </div>

              {/* Entity Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, code, cluster, or CEO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* All Entities List */}
              <div className="space-y-2">
                {filteredEntities.map((ent) => {
                  const isSelected = ent.id === currentEntity?.id;
                  return (
                    <div
                      key={ent.id}
                      onClick={() => onSelectEntityId(ent.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50/80 border-emerald-300 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 text-xs">{ent.name}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                              ent.type === 'PUBLIC_ENTITY' ? 'bg-teal-100 text-teal-900' : 'bg-sky-100 text-sky-900'
                            }`}>
                              {ent.shortCode}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Cluster: {ent.cluster} • CEO: {ent.headOfEntity}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-emerald-800">{ent.overallComplianceScore}%</div>
                          <div className="text-[9px] text-slate-400">Compliance</div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-600">
                          Budget: <strong className="text-slate-900">R {(ent.budgetAllocationZAR / 1_000_000).toFixed(1)}M</strong>
                        </span>
                        <span className={`font-semibold ${
                          ent.auditOutcome === 'CLEAN_AUDIT' ? 'text-emerald-700' : 'text-slate-600'
                        }`}>
                          {ent.auditOutcome.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FEATURE 6: RISK & EARLY WARNINGS */}
          {/* ========================================================================= */}
          {activeFeature === 'risks' && currentEntity && (
            <div className="space-y-4 text-xs">
              
              {/* Risk Profile Card */}
              <div className={`p-4 rounded-xl border shadow-xs flex items-center justify-between ${
                currentEntity.riskLevel === 'HIGH' ? 'bg-rose-50 border-rose-200' :
                currentEntity.riskLevel === 'MEDIUM' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                    currentEntity.riskLevel === 'HIGH' ? 'bg-rose-200 text-rose-900' :
                    currentEntity.riskLevel === 'MEDIUM' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {currentEntity.riskLevel} Risk Classification
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-1">
                    Early Warning Oversight Index
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Continuous statutory algorithmic risk assessment.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">{currentEntity.riskScore}/100</div>
                  <div className="text-[10px] text-slate-500 font-medium">Risk Score</div>
                </div>
              </div>

              {/* Active Risk Factors */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Identified Oversight Risk Triggers
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">PFMA Section 38(1)(j) Audit Finding</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Remediation</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Previous AGSA audit raised matters regarding supply chain compliance in grant awards.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Budget Absorption &amp; Tranche Utilization</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Satisfactory</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      75% of statutory tranche expended aligned with approved Annual Performance Plan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ministerial Directive Action */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Enforcement Actions
                </div>
                <button
                  onClick={() => showNotification(`Formal compliance warning issued to Accounting Officer of ${currentEntity.shortCode}.`)}
                  className="w-full py-2.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Issue Statutory Directive / Remediation Notice</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* BOTTOM DRAWER FOOTER */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-slate-700">{currentEntity?.shortCode || 'DSAC'}</span>
            <span>•</span>
            <span>REPO Oversight Live</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200/60 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            {onOpenWorkspace && currentEntity && (
              <button
                onClick={() => onOpenWorkspace(currentEntity.id)}
                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Full Workspace</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
