import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Send, 
  ExternalLink,
  ChevronRight,
  AlertOctagon,
  Building2,
  Users,
  Calendar,
  Eye,
  Check
} from 'lucide-react';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';
import { formatZAR } from '../../services/financialService';
import { getCurrentReportingPeriod, isQuarterDue, sameFinancialYear } from '../../services/reportingPeriod';
import { getEvidenceSummary } from '../../services/evidenceStatus';

interface DsacComplianceViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
}

export const DsacComplianceView: React.FC<DsacComplianceViewProps> = ({
  entities,
  onSelectEntity,
  onOpenWorkspace
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PUBLIC_ENTITY' | 'NPO'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT' | 'CLEAN_AUDIT'>('ALL');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(entities[0]?.id || 'ent-sahra');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter entities
  const filteredEntities = entities.filter(ent => {
    const matchesSearch = 
      ent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ent.headOfEntity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      typeFilter === 'ALL' || ent.type === typeFilter;

    let matchesStatus = true;
    if (statusFilter === 'COMPLIANT') matchesStatus = ent.overallComplianceScore >= 80;
    else if (statusFilter === 'AT_RISK') matchesStatus = ent.overallComplianceScore >= 65 && ent.overallComplianceScore < 80;
    else if (statusFilter === 'NON_COMPLIANT') matchesStatus = ent.overallComplianceScore < 65;
    else if (statusFilter === 'CLEAN_AUDIT') matchesStatus = ent.auditOutcome === 'CLEAN_AUDIT';

    return matchesSearch && matchesType && matchesStatus;
  });

  const selectedEntity = entities.find(e => e.id === selectedEntityId) || entities[0];

  // Stats calculation
  const totalEntities = entities.length;
  const publicEntitiesCount = entities.filter(e => e.type === 'PUBLIC_ENTITY').length;
  const nposCount = entities.filter(e => e.type === 'NPO').length;
  const avgCompliance = Math.round(
    entities.reduce((acc, e) => acc + e.overallComplianceScore, 0) / (totalEntities || 1)
  );
  const compliantCount = entities.filter(e => e.overallComplianceScore >= 80).length;
  const atRiskCount = entities.filter(e => e.overallComplianceScore >= 65 && e.overallComplianceScore < 80).length;
  const nonCompliantCount = entities.filter(e => e.overallComplianceScore < 65).length;
  const cleanAuditCount = entities.filter(e => e.auditOutcome === 'CLEAN_AUDIT').length;

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeReason, setNoticeReason] = useState('');

  const period = getCurrentReportingPeriod();
  const returns = selectedEntity
    ? (['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => ({
        quarter: q,
        report: store.reports.find(r => r.entityId === selectedEntity.id && r.quarter === q && sameFinancialYear(r.financialYear, period.financialYear)),
        due: isQuarterDue(period.financialYear, q),
      }))
    : [];
  const evidence = selectedEntity ? getEvidenceSummary(selectedEntity.id, period.quarter, period.financialYear) : null;
  const fin = selectedEntity ? store.getEntityFinancialSummary(selectedEntity.id, period.financialYear, period.quarter) : null;

  const returnBadge = (r: typeof returns[number]) => {
    switch (r.report?.submissionStatus) {
      case 'APPROVED': return { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800', ok: true };
      case 'SUBMITTED':
      case 'UNDER_REVIEW': return { label: 'Under DSAC review', cls: 'bg-amber-100 text-amber-800', ok: false };
      case 'CORRECTION_REQUIRED': return { label: 'Sent back', cls: 'bg-rose-100 text-rose-800', ok: false };
      case 'OVERDUE': return { label: 'Overdue', cls: 'bg-rose-100 text-rose-800', ok: false };
      case 'DRAFT': return { label: 'Draft', cls: 'bg-slate-100 text-slate-700', ok: false };
      default: return r.due ? { label: 'Not lodged', cls: 'bg-rose-100 text-rose-800', ok: false } : { label: 'Not yet due', cls: 'bg-slate-100 text-slate-600', ok: false };
    }
  };

  /** Records the next escalation stage against the organisation. Nothing is e-mailed from this build. */
  const handleIssueNotice = () => {
    if (!selectedEntity) return;
    const reason = noticeReason.trim();
    if (!reason) {
      setActionNotice('Enter the reason for the notice first.');
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }
    const stage = Math.min(4, (selectedEntity.statutoryDefaultStage ?? 0) + 1) as 1 | 2 | 3 | 4;
    store.issueStatutoryNotice(selectedEntity.id, stage, reason);
    const recorded = store.entities.find(e => e.id === selectedEntity.id)?.statutoryDefaultStage === stage;
    setActionNotice(
      recorded
        ? `Stage ${stage} notice recorded against ${selectedEntity.shortCode}. It is not e-mailed automatically in this build, so send the letter through your normal channel.`
        : 'Only DSAC officials can issue a statutory notice.'
    );
    setNoticeOpen(false);
    setNoticeReason('');
    setTimeout(() => setActionNotice(null), 7000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Statutory Compliance Monitoring
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              PFMA Section 38(1)(j) Written Assurance &amp; Oversight across all {publicEntitiesCount} Public Entities and {nposCount} Subsidized NPOs ({totalEntities} Total)
            </p>
          </div>

          {actionNotice && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}
        </div>

        {/* 5 Quick Compliance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">Portfolio Average</div>
            <div className="text-xl font-black text-emerald-800 mt-0.5">{avgCompliance}%</div>
            <div className="text-[10px] text-slate-400">Target: ≥85%</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
            <div className="text-[11px] font-semibold text-emerald-800">Compliant (≥80%)</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{compliantCount}</div>
            <div className="text-[10px] text-emerald-600 font-medium">{Math.round((compliantCount / totalEntities) * 100)}% of portfolio</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70">
            <div className="text-[11px] font-semibold text-amber-800">At-Risk Submissions</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">{atRiskCount}</div>
            <div className="text-[10px] text-amber-600 font-medium">Monitoring Required</div>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/70">
            <div className="text-[11px] font-semibold text-rose-800">Non-Compliant (&lt;65%)</div>
            <div className="text-xl font-black text-rose-700 mt-0.5">{nonCompliantCount}</div>
            <div className="text-[10px] text-rose-600 font-medium">Intervention Notices</div>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200/70">
            <div className="text-[11px] font-semibold text-teal-800">AGSA Clean Audits</div>
            <div className="text-xl font-black text-teal-700 mt-0.5">{cleanAuditCount}</div>
            <div className="text-[10px] text-teal-600 font-medium">Unqualified Opinion</div>
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
              placeholder="Search by entity name, code, or CEO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Entity Type Filter */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                typeFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({totalEntities})
            </button>
            <button
              onClick={() => setTypeFilter('PUBLIC_ENTITY')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                typeFilter === 'PUBLIC_ENTITY' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Public Entities ({publicEntitiesCount})
            </button>
            <button
              onClick={() => setTypeFilter('NPO')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                typeFilter === 'NPO' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NPOs ({nposCount})
            </button>
          </div>

          {/* Compliance Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Compliance Levels</option>
            <option value="COMPLIANT">Compliant (≥80%)</option>
            <option value="AT_RISK">At Risk (65–79%)</option>
            <option value="NON_COMPLIANT">Non-Compliant (&lt;65%)</option>
            <option value="CLEAN_AUDIT">Clean Audit Only</option>
          </select>
        </div>
      </div>

      {/* MASTER-DETAIL SIDE VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT PANE: Master List of 26 Entities & 6 NPOs (5 cols on lg) */}
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
              const isHighRisk = entity.riskLevel === 'HIGH' || entity.overallComplianceScore < 65;

              return (
                <div
                  key={entity.id}
                  onClick={() => setSelectedEntityId(entity.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-400/40'
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
                      <div className={`text-xs font-black ${
                        entity.overallComplianceScore >= 80 ? 'text-emerald-700' :
                        entity.overallComplianceScore >= 65 ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {entity.overallComplianceScore}%
                      </div>
                      <div className="text-[9px] text-slate-400">Compliance</div>
                    </div>
                  </div>

                  {/* Progress Bar & Indicators */}
                  <div className="mt-2.5">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          entity.overallComplianceScore >= 80 ? 'bg-emerald-500' :
                          entity.overallComplianceScore >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${entity.overallComplianceScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      {isCleanAudit ? (
                        <span className="text-teal-700 font-semibold flex items-center gap-0.5">
                          <Check className="w-3 h-3 text-teal-600" /> Clean Audit
                        </span>
                      ) : (
                        <span className="text-slate-600">{entity.auditOutcome.replace(/_/g, ' ')}</span>
                      )}
                    </span>
                    {entity.overdueReportsCount > 0 && (
                      <span className="text-rose-600 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> {entity.overdueReportsCount} Overdue
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
              
              {/* Entity Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                      selectedEntity.type === 'PUBLIC_ENTITY' ? 'bg-teal-100 text-teal-900 border border-teal-200' : 'bg-sky-100 text-sky-900 border border-sky-200'
                    }`}>
                      {selectedEntity.type === 'PUBLIC_ENTITY' ? 'Statutory Public Entity' : 'Subsidized Cultural NPO'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Cluster: <strong className="text-slate-700">{selectedEntity.cluster}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {selectedEntity.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Executive: <strong className="text-slate-800">{selectedEntity.headOfEntity}</strong> • Reporting: {selectedEntity.reportingOfficerName} ({selectedEntity.contactEmail})
                  </p>
                </div>

                {/* Circular / Large Score Badge */}
                <div className="text-center p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                  <div className={`text-2xl font-black leading-none ${
                    selectedEntity.overallComplianceScore >= 80 ? 'text-emerald-700' :
                    selectedEntity.overallComplianceScore >= 65 ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {selectedEntity.overallComplianceScore}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                    PFMA Index
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {onOpenWorkspace && (
                    <button
                      onClick={() => onOpenWorkspace(selectedEntity.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open compliance page</span>
                    </button>
                  )}
                  <button
                    onClick={() => setNoticeOpen(o => !o)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                    <span>Issue Section 38 Notice</span>
                  </button>
                </div>
                {noticeOpen && (
                  <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-rose-50/50 border border-rose-200">
                    <input
                      value={noticeReason}
                      onChange={(e) => setNoticeReason(e.target.value)}
                      placeholder={`Reason for the stage ${Math.min(4, (selectedEntity.statutoryDefaultStage ?? 0) + 1)} notice (required)`}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-rose-200 bg-white focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                    <button onClick={handleIssueNotice} className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer">
                      Record notice
                    </button>
                  </div>
                )}
              </div>

              {/* Statutory standing */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-slate-500">Funding status</div>
                  <div className={`font-bold mt-0.5 ${selectedEntity.trancheStatus === 'WITHHELD' ? 'text-rose-700' : selectedEntity.trancheStatus === 'CONDITIONAL_HOLD' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {(selectedEntity.trancheStatus || 'RELEASED').replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Notice stage</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedEntity.statutoryDefaultStage ? `Stage ${selectedEntity.statutoryDefaultStage} of 4` : 'None issued'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] text-slate-500">AGSA audit opinion ({selectedEntity.auditYear})</div>
                  <div className="font-bold text-slate-900 mt-0.5 capitalize">{selectedEntity.auditOutcome.replace(/_/g, ' ').toLowerCase()}</div>
                </div>
              </div>

              {/* Performance returns for the current financial year */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Quarterly performance returns ({period.financialYear})</span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {returns.filter(r => r.report?.submissionStatus === 'APPROVED').length} of {returns.filter(r => r.due).length} due approved
                  </span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {returns.map(r => {
                    const badge = returnBadge(r);
                    return (
                      <div key={r.quarter} className="p-2.5 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                          {badge.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                          <div>
                            <div className="font-bold text-slate-800">{r.quarter} statutory performance report</div>
                            <div className="text-[10px] text-slate-500">
                              {r.report ? `Due ${new Date(r.report.dueDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}` : 'No return on record'}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${badge.cls}`}>{badge.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Evidence required for the current quarter */}
              {evidence && (
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Evidence required for {period.quarter} {period.financialYear}</span>
                    <span className="text-[11px] font-semibold text-emerald-700">{evidence.verifiedMandatory} of {evidence.totalMandatory} mandatory verified</span>
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {evidence.slots.map(slot => (
                      <div key={slot.id} className="p-2.5 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${slot.status === 'VERIFIED' ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 truncate">{slot.title}</div>
                            {slot.detail && <div className="text-[10px] text-slate-500 truncate">{slot.detail}</div>}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] shrink-0 ${
                          slot.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800'
                          : slot.status === 'MANUAL_REVIEW' || slot.status === 'VALIDATING' ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                        }`}>
                          {slot.status === 'VERIFIED' ? 'Verified' : slot.status === 'MANUAL_REVIEW' || slot.status === 'VALIDATING' ? 'Under review' : slot.status === 'REJECTED' ? 'Rejected' : 'Missing'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Tax clearance, B-BBEE certificates and APP tabling are not tracked in this build, so they are not shown.
                  </p>
                </div>
              )}

              {/* Funding snapshot, from the same engine as every dashboard */}
              {fin && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800">Vote 37 funding</span>
                    <span className="text-[11px] text-slate-500">{period.financialYear} to {period.quarter}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2.5 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500">Approved budget</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">{formatZAR(fin.approvedAmount)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Disbursed ({fin.disbursementRate.toFixed(1)}%)</div>
                      <div className="text-xs font-bold text-teal-700 mt-0.5">{formatZAR(fin.disbursedToDate)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Reported spend</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">{formatZAR(fin.ytdActual)}</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              Select an entity from the list to view compliance status
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
