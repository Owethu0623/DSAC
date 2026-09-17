import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  ShieldCheck, 
  Target, 
  Coins, 
  FileText, 
  ExternalLink,
  Mail,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Award
} from 'lucide-react';
import { PublicEntity } from '../../types';

interface EntityInspectionDrawerProps {
  entity: PublicEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenWorkspace?: (entityId: string) => void;
  onNavigateToFeature?: (featureId: string) => void;
}

export const EntityInspectionDrawer: React.FC<EntityInspectionDrawerProps> = ({
  entity,
  isOpen,
  onClose,
  onOpenWorkspace,
  onNavigateToFeature
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'performance' | 'support' | 'reports'>('overview');

  if (!isOpen || !entity) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slideLeft"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                entity.type === 'PUBLIC_ENTITY' ? 'bg-teal-100 text-teal-900' : 'bg-sky-100 text-sky-900'
              }`}>
                {entity.type === 'PUBLIC_ENTITY' ? 'Statutory Public Entity' : 'Subsidized Cultural NPO'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {entity.shortCode}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              {entity.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cluster: {entity.cluster} • Accounting Officer: {entity.headOfEntity}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Navigation Tabs inside the Side View */}
        <div className="flex items-center border-b border-slate-200 px-4 bg-white overflow-x-auto text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-2.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`py-3 px-2.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'compliance'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Compliance ({entity.overallComplianceScore}%)
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-3 px-2.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'performance'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Performance
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`py-3 px-2.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'support'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Support &amp; Funding
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-2.5 border-b-2 transition-all whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'reports'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Reports
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Statutory Budget</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    R {(entity.budgetAllocationZAR / 1_000_000).toFixed(1)}M ZAR
                  </div>
                  <div className="text-[10px] text-teal-700 font-semibold mt-1">
                    75% Transferred: R {(entity.transferredAmountZAR / 1_000_000).toFixed(1)}M
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">AGSA Audit Outcome</div>
                  <div className="text-sm font-black text-emerald-800 mt-0.5 truncate">
                    {entity.auditOutcome.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Year: {entity.auditYear}
                  </div>
                </div>
              </div>

              {/* Leadership */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Governance &amp; Executive Leadership
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Chief Executive Officer</span>
                  <span className="font-bold text-slate-900">{entity.headOfEntity}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Reporting Officer / CFO</span>
                  <span className="font-bold text-slate-900">{entity.reportingOfficerName}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Contact Email</span>
                  <span className="text-teal-700 font-semibold">{entity.contactEmail}</span>
                </div>
              </div>

              {/* Jobs & Sector Delivery */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  MTSF Job Creation &amp; Transformation
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div>
                    <div className="text-[10px] text-slate-500">Permanent Jobs</div>
                    <div className="font-black text-slate-900 text-sm mt-0.5">{entity.jobStats.permanentJobs}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Youth Jobs</div>
                    <div className="font-black text-sky-700 text-sm mt-0.5">{entity.jobStats.youthJobsCreated}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Practitioners</div>
                    <div className="font-black text-teal-700 text-sm mt-0.5">{entity.jobStats.creativeSectorPractitionersSupported}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. COMPLIANCE TAB */}
          {activeTab === 'compliance' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-900">PFMA Section 38 Compliance Index</div>
                  <div className="text-[11px] text-emerald-700">Official oversight assurance score</div>
                </div>
                <div className="text-xl font-black text-emerald-800">{entity.overallComplianceScore}%</div>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Section 38(1)(j) Written Assurance
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Compliant</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Annual Performance Plan (APP) Tabled
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Approved</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Q1 Statutory Performance Report
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Verified</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Q2 Statutory Performance Report
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Verified</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> SARS Tax Pin &amp; B-BBEE
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Level 1 Valid</span>
                </div>
              </div>

              {onNavigateToFeature && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToFeature('compliance');
                  }}
                  className="w-full py-2 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors"
                >
                  View Full Compliance Feature →
                </button>
              )}
            </div>
          )}

          {/* 3. PERFORMANCE TAB */}
          {activeTab === 'performance' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                <div className="font-bold text-teal-900">Target Delivery Status</div>
                <div className="text-[11px] text-teal-700 mt-0.5">MTSF Sector Targets for 2024/25</div>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Target Delivery Ratio</span>
                    <span className="text-teal-700">76%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: '76%' }}></div>
                  </div>
                </div>
              </div>

              {onNavigateToFeature && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToFeature('performance');
                  }}
                  className="w-full py-2 rounded-lg bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition-colors"
                >
                  View Full Performance Feature →
                </button>
              )}
            </div>
          )}

          {/* 4. SUPPORT & FUNDING TAB */}
          {activeTab === 'support' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <div className="font-bold text-blue-900">Departmental Support Status</div>
                <div className="text-[11px] text-blue-700 mt-0.5">Statutory support, technical grants &amp; capacity</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <div className="font-bold text-slate-800">Intervention Packages</div>
                <div className="text-slate-500 mt-1">Financial subsidy tranches, governance task team advisories, and IT support.</div>
              </div>

              {onNavigateToFeature && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToFeature('support');
                  }}
                  className="w-full py-2 rounded-lg bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition-colors"
                >
                  View Full Support &amp; Funding Feature →
                </button>
              )}
            </div>
          )}

          {/* 5. REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="font-bold text-emerald-900">Submitted Statutory Submissions</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">Quarterly reports, APPs &amp; Portfolios of Evidence</div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                <div className="font-bold text-slate-900">Q2 Performance Report &amp; PoE</div>
                <div className="text-slate-500 text-[11px]">Submitted &amp; Formally Verified</div>
              </div>

              {onNavigateToFeature && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToFeature('reports');
                  }}
                  className="w-full py-2 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors"
                >
                  View Full Reports Feature →
                </button>
              )}
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {entity.shortCode} • DSAC REPO
          </span>
          {onOpenWorkspace && (
            <button
              onClick={() => {
                onClose();
                onOpenWorkspace(entity.id);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Workspace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
