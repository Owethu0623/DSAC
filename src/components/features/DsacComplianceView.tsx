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

  const handleVerifyCompliance = () => {
    if (!selectedEntity) return;
    const updated = { ...selectedEntity, overallComplianceScore: Math.min(100, selectedEntity.overallComplianceScore + 4) };
    store.updateEntity(updated);
    setActionNotice(`Compliance verification recorded for ${selectedEntity.shortCode}. Score updated.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleIssueNotice = () => {
    if (!selectedEntity) return;
    setActionNotice(`Official PFMA Section 38 Letter of Demand dispatched to ${selectedEntity.headOfEntity} (${selectedEntity.contactEmail}).`);
    setTimeout(() => setActionNotice(null), 5000);
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleVerifyCompliance}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify Compliance</span>
                </button>
                <button
                  onClick={handleIssueNotice}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  <span>Issue Section 38 Notice</span>
                </button>
                {onOpenWorkspace && (
                  <button
                    onClick={() => onOpenWorkspace(selectedEntity.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Open Entity Workspace</span>
                  </button>
                )}
              </div>

              {/* Statutory Section 38 Deliverables Checklist */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Mandatory Statutory Submissions (2024/2025)</span>
                  <span className="text-[11px] font-semibold text-emerald-700">7 of 8 Validated</span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {/* Row 1 */}
                  <div className="p-2.5 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">PFMA Section 38(1)(j) Written Assurance</div>
                        <div className="text-[10px] text-slate-500">Submitted annually prior to grant disbursement</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                      Compliant
                    </span>
                  </div>

                  {/* Row 2 */}
                  <div className="p-2.5 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">Annual Performance Plan (APP) 2024/25</div>
                        <div className="text-[10px] text-slate-500">Tabled in Parliament via Minister of Sport, Arts and Culture</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                      Tabled &amp; Approved
                    </span>
                  </div>

                  {/* Row 3 */}
                  <div className="p-2.5 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">Q1 Statutory Performance Report</div>
                        <div className="text-[10px] text-slate-500">Verified with Portfolio of Evidence (PoE)</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                      Verified On-Time
                    </span>
                  </div>

                  {/* Row 4 */}
                  <div className="p-2.5 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">Q2 Statutory Performance Report</div>
                        <div className="text-[10px] text-slate-500">Audited against MTSF priorities and targets</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                      Verified On-Time
                    </span>
                  </div>

                  {/* Row 5 */}
                  <div className="p-2.5 flex items-center justify-between bg-amber-50/40">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">Q3 Statutory Performance Report</div>
                        <div className="text-[10px] text-slate-500">Due within 30 days of quarter end</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px]">
                      Under DSAC Review
                    </span>
                  </div>

                  {/* Row 6 */}
                  <div className="p-2.5 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">Audited Annual Financial Statements (AFS)</div>
                        <div className="text-[10px] text-slate-500">AGSA Opinion: {selectedEntity.auditOutcome.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                      selectedEntity.auditOutcome === 'CLEAN_AUDIT' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {selectedEntity.auditOutcome === 'CLEAN_AUDIT' ? 'Clean Audit' : 'Submitted'}
                    </span>
                  </div>

                  {/* Row 7 */}
                  <div className="p-2.5 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">SARS Tax Compliance Status (TCS PIN)</div>
                        <div className="text-[10px] text-slate-500">Valid eFiling PIN for government funding disbursement</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                      Valid &amp; Good Standing
                    </span>
                  </div>

                  {/* Row 8 */}
                  <div className="p-2.5 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">B-BBEE Transformation Certificate</div>
                        <div className="text-[10px] text-slate-500">B-BBEE Act compliance and equity scorecard</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                      Level 1 Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Compliance Snapshot */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">Statutory Vote 37 Funding Compliance</span>
                  <span className="text-[11px] text-slate-500">Audited 2024/2025</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2.5 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500">Approved Budget</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      R {(selectedEntity.budgetAllocationZAR / 1_000_000).toFixed(1)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Transferred (75%)</div>
                    <div className="text-xs font-bold text-teal-700 mt-0.5">
                      R {(selectedEntity.transferredAmountZAR / 1_000_000).toFixed(1)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Expenditure</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      R {(selectedEntity.reportedExpenditureZAR / 1_000_000).toFixed(1)}M
                    </div>
                  </div>
                </div>
              </div>

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
