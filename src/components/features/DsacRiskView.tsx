import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  Filter, 
  ExternalLink,
  Send,
  Building2,
  FileWarning,
  Clock,
  Calendar,
  Bell
} from 'lucide-react';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';

interface DsacRiskViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
}

export const DsacRiskView: React.FC<DsacRiskViewProps> = ({
  entities,
  onSelectEntity,
  onOpenWorkspace
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(entities[0]?.id || 'ent-sahra');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const deadlines = store.deadlines;

  // Countdown broken down as 30 days / 15 days / hourly for due reports (Requirement b)
  const getCountdown = (isoDate: string) => {
    const diffMs = new Date(isoDate).getTime() - Date.now();
    if (diffMs <= 0) return { text: 'DEADLINE MISSED / OVERDUE', isOverdue: true, bracket: 'OVERDUE', badge: 'Critical Overdue' };
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return { 
        text: `${diffHours}h ${Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))}m remaining`, 
        isOverdue: false, 
        bracket: 'HOURLY_URGENT',
        badge: 'Hourly Urgency'
      };
    } else if (diffDays <= 15) {
      return { 
        text: `${diffDays} days remaining`, 
        isOverdue: false, 
        bracket: '15_DAYS',
        badge: '15-Day Reminder'
      };
    } else {
      return { 
        text: `${diffDays} days remaining`, 
        isOverdue: false, 
        bracket: '30_DAYS',
        badge: '30-Day Notice'
      };
    }
  };

  const filteredEntities = entities.filter(ent => {
    const matchesSearch = 
      ent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.shortCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || ent.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const selectedEntity = entities.find(e => e.id === selectedEntityId) || entities[0];

  const highRiskCount = entities.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL').length;
  const mediumRiskCount = entities.filter(e => e.riskLevel === 'MEDIUM').length;
  const lowRiskCount = entities.filter(e => e.riskLevel === 'LOW').length;

  const handleIssueDirective = () => {
    setActionNotice(`Ministerial Early Warning Directive dispatched to Accounting Officer of ${selectedEntity.shortCode}.`);
    setTimeout(() => setActionNotice(null), 4500);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Early Warning Risk Radar
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              PFMA compliance hazards, audit findings &amp; governance oversight across 32 entities
            </p>
          </div>

          {actionNotice && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}
        </div>

        {/* 4 Risk Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/70">
            <div className="flex items-center justify-between text-[11px] font-semibold text-rose-800">
              <span>High Risk</span>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xl font-black text-rose-700 mt-0.5">{highRiskCount}</div>
            <div className="text-[10px] text-rose-600 font-medium">Critical attention</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70">
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800">
              <span>Medium Risk</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-black text-amber-700 mt-0.5">{mediumRiskCount}</div>
            <div className="text-[10px] text-amber-600 font-medium">Regular review</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800">
              <span>Low Risk</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{lowRiskCount}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Satisfactory</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Overdue Returns</span>
              <FileWarning className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {entities.reduce((acc, e) => acc + e.overdueReportsCount, 0)}
            </div>
            <div className="text-[10px] text-slate-400">Section 38 Overdue</div>
          </div>
        </div>

        {/* Regulatory Due Dates Countdown Tracker (Requirement b: 30 Days / 15 Days / Hourly Countdown) */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Regulatory Due Dates &amp; Multi-Stage Countdown Tracker</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              30-Day Notice • 15-Day Critical • Hourly Urgency
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {deadlines.slice(0, 3).map(deadline => {
              const countdown = getCountdown(deadline.dueDate);

              return (
                <div 
                  key={deadline.id}
                  className={`p-3 rounded-xl border transition-all ${
                    countdown.bracket === 'HOURLY_URGENT'
                      ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300'
                      : countdown.bracket === '15_DAYS'
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      countdown.bracket === 'HOURLY_URGENT'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : countdown.bracket === '15_DAYS'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {countdown.badge}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-600">
                      Due: {new Date(deadline.dueDate).toLocaleDateString('en-ZA')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs truncate">{deadline.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{deadline.description}</p>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-400 font-mono">Countdown:</span>
                    <span className={`font-mono ${
                      countdown.bracket === 'HOURLY_URGENT' 
                        ? 'text-rose-700 font-black animate-pulse' 
                        : countdown.bracket === '15_DAYS'
                        ? 'text-amber-700 font-bold'
                        : 'text-slate-700 font-bold'
                    }`}>
                      {countdown.text}
                    </span>
                  </div>
                </div>
              );
            })}
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
              placeholder="Search risk records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
          <button
            onClick={() => setRiskFilter('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              riskFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({entities.length})
          </button>
          <button
            onClick={() => setRiskFilter('HIGH')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              riskFilter === 'HIGH' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:text-rose-900'
            }`}
          >
            High Risk
          </button>
          <button
            onClick={() => setRiskFilter('MEDIUM')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              riskFilter === 'MEDIUM' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700 hover:text-amber-900'
            }`}
          >
            Medium Risk
          </button>
          <button
            onClick={() => setRiskFilter('LOW')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              riskFilter === 'LOW' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            Low Risk
          </button>
        </div>
      </div>

      {/* MASTER-DETAIL SIDE VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT PANE: Master List of Risk Profiles (5 cols on lg) */}
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
              const isHigh = entity.riskLevel === 'HIGH' || entity.overallComplianceScore < 65;

              return (
                <div
                  key={entity.id}
                  onClick={() => setSelectedEntityId(entity.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-rose-50/70 border-rose-600 shadow-xs ring-1 ring-rose-400/40'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-slate-900 truncate">
                        {entity.name}
                      </h5>
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
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isHigh ? 'bg-rose-100 text-rose-800' :
                        entity.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isHigh ? 'HIGH' : entity.riskLevel}
                      </span>
                      <div className="text-[9px] text-slate-400 mt-1">
                        Score: {entity.riskScore ?? (100 - entity.overallComplianceScore)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <span>Audit: {entity.auditOutcome.replace(/_/g, ' ')}</span>
                    {entity.overdueReportsCount > 0 && (
                      <span className="text-rose-600 font-bold">
                        {entity.overdueReportsCount} Overdue Submissions
                      </span>
                    )}
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
                      selectedEntity.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                      selectedEntity.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                      'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}>
                      {selectedEntity.riskLevel} Risk Profile
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      Cluster: <strong className="text-slate-800">{selectedEntity.cluster}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1.5">
                    {selectedEntity.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Accounting Officer: <strong className="text-slate-800">{selectedEntity.headOfEntity}</strong>
                  </p>
                </div>

                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                  <div className="text-2xl font-black text-rose-700 leading-none">
                    {selectedEntity.riskScore ?? (100 - selectedEntity.overallComplianceScore)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                    Risk Index
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleIssueDirective}
                  className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Issue Directive</span>
                </button>

                {onOpenWorkspace && (
                  <button
                    onClick={() => onOpenWorkspace(selectedEntity.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Entity Workspace</span>
                  </button>
                )}
              </div>

              {/* Identified Risk Factors */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Active Risk Factors &amp; Audit Vulnerabilities
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <FileWarning className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">Auditor-General Finding Status</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Historical AGSA Outcome: <strong className="text-slate-800">{selectedEntity.auditOutcome.replace(/_/g, ' ')}</strong>. Corrective action plan requires ministerial validation.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">Statutory Reporting Punctuality</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {selectedEntity.overdueReportsCount > 0 
                          ? `${selectedEntity.overdueReportsCount} statutory return(s) currently overdue past Section 38 deadlines.`
                          : 'All quarterly submissions currently lodged within 30-day requirement.'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">PFMA Vote 37 Expenditure Velocity</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Reported expenditure is R {(selectedEntity.reportedExpenditureZAR / 1_000_000).toFixed(1)}M against R {(selectedEntity.transferredAmountZAR / 1_000_000).toFixed(1)}M transferred ({(Math.round((selectedEntity.reportedExpenditureZAR / (selectedEntity.transferredAmountZAR || 1)) * 100))}% burn rate).
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              Select an entity to view risk details
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
