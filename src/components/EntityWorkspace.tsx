import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Clock, 
  Send, 
  History, 
  Check, 
  X, 
  ArrowRight,
  PlusCircle,
  FileCheck,
  ShieldAlert,
  ChevronDown,
  Layers,
  Sparkles,
  LogOut,
  Coins,
  Download,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { store } from '../services/store';
import { formatZAR } from '../services/financialService';
import { financialYearStart, getCurrentReportingPeriod, isFinancialYearClosed, normalizeFinancialYear, pct1, toLongFinancialYear } from '../services/reportingPeriod';
import { 
  PublicEntity, 
  KPIRecord, 
  QuarterlyReport, 
  EntityDocument, 
  CorrectiveTask,
  ReportItem 
} from '../types';
import { DocumentVerificationDossier } from './DocumentVerificationDossier';
import { EntityFinancialView } from './features/EntityFinancialView';
import { EntityVisualAnalytics } from './features/EntityVisualAnalytics';
import { EntityOverviewTab } from './entity/EntityOverviewTab';
import { EntityPerformanceTab } from './entity/EntityPerformanceTab';
import { EntityFinanceTab } from './entity/EntityFinanceTab';
import { EntityComplianceTab } from './entity/EntityComplianceTab';
import { EntityProfileTab } from './entity/EntityProfileTab';
import { fmtDate } from './entity/parts';
import { EntityTab } from '../services/attention';

interface EntityWorkspaceProps {
  entityId: string;
  onBackToDashboard: () => void;
  financialYear?: string;
  /** Tab to open on. */
  initialTab?: EntityTab;
  backLabel?: string;
}

const TAB_LABEL: Record<EntityTab, string> = {
  overview: 'Overview',
  performance: 'Performance',
  finance: 'Finance',
  compliance: 'Compliance',
  reports: 'Reports',
  profile: 'Profile',
};

export const EntityWorkspace: React.FC<EntityWorkspaceProps> = ({
  entityId,
  onBackToDashboard,
  financialYear: initialYear = getCurrentReportingPeriod().financialYear,
  initialTab = 'overview',
  backLabel = '← Back to Previous Overview',
}) => {
  const [workspaceYear, setWorkspaceYear] = useState<string>(initialYear);
  const currentUser = store.currentUser;
  const isDSACReviewer = currentUser ? (currentUser.role === 'DSAC_ADMIN' || currentUser.role === 'DSAC_MANAGEMENT') : false;

  const entity = store.entities.find(e => e.id === entityId) || store.entities[0];
  const entityKPIs = store.kpis.filter(k => k.entityId === entity.id);
  const entityReports = store.reports.filter(r => r.entityId === entity.id);
  const entityDocs = store.documents.filter(d => d.entityId === entity.id);
  const entityTasks = store.tasks.filter(t => t.entityId === entity.id);

  React.useEffect(() => { setActiveTab(initialTab); }, [entityId, initialTab]);

  // Years this organisation has a budget for, newest first. The current year is always offered.
  const yearOptions = Array.from(new Set([
    normalizeFinancialYear(getCurrentReportingPeriod().financialYear),
    ...store.getBudgetProfiles().filter(p => p.entityId === entityId).map(p => normalizeFinancialYear(p.financialYear)),
  ])).sort().reverse();

  const badgeFor: Partial<Record<EntityTab, number>> = {
    reports: entityReports.filter(r => r.submissionStatus === 'OVERDUE' || r.submissionStatus === 'CORRECTION_REQUIRED').length,
    compliance: entityTasks.filter(t => t.status !== 'COMPLETED').length,
  };
  const TAB_ICON: Record<EntityTab, React.ComponentType<{ className?: string }>> = {
    overview: BarChart3,
    performance: Layers,
    finance: Coins,
    compliance: ShieldCheck,
    reports: FileText,
    profile: Building2,
  };

  // Tabs inside Workspace
  const [activeTab, setActiveTab] = useState<EntityTab>(initialTab);
  const [docSubTab, setDocSubTab] = useState<'verification' | 'repository' | 'directives'>('verification');

  // Report Review State (for DSAC Admin)
  const [reviewReportModal, setReviewReportModal] = useState<QuarterlyReport | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVE' | 'REQUEST_CORRECTION'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // Document Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<EntityDocument['category']>('PORTFOLIO_OF_EVIDENCE');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocSummary, setNewDocSummary] = useState('');

  // Document Versioning State
  const [versionModalDoc, setVersionModalDoc] = useState<EntityDocument | null>(null);
  const [versionFileName, setVersionFileName] = useState('');
  const [versionSummary, setVersionSummary] = useState('');

  // Document Commentary
  const [activeCommentDoc, setActiveCommentDoc] = useState<EntityDocument | null>(null);
  const [commentText, setCommentText] = useState('');

  // Task Resolution
  const [resolvingTask, setResolvingTask] = useState<CorrectiveTask | null>(null);
  const [taskResolutionNotes, setTaskResolutionNotes] = useState('');

  // Review Report (DSAC Admin Action)
  const handleExecuteReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewReportModal || !reviewNotes) return;

    store.reviewReport(reviewReportModal.id, reviewDecision, reviewNotes);
    setReviewReportModal(null);
    setReviewNotes('');
  };

  // Demonstration uploads attach no real file in this build, so a nominal size is recorded.
  const SIMULATED_UPLOAD_BYTES = 4 * 1024 * 1024;

  // Upload New Version
  const handleUploadVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionModalDoc || !versionFileName || !versionSummary) return;

    store.uploadDocumentVersion(versionModalDoc.id, versionFileName, SIMULATED_UPLOAD_BYTES, versionSummary);
    setVersionModalDoc(null);
    setVersionFileName('');
    setVersionSummary('');
  };

  // Upload New Document
  const handleCreateNewDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle || !newDocFileName) return;

    store.createNewDocument(
      entity.id,
      newDocTitle,
      newDocCategory,
      toLongFinancialYear(getCurrentReportingPeriod().financialYear),
      newDocFileName,
      SIMULATED_UPLOAD_BYTES,
      newDocSummary || 'Initial version submitted'
    );
    setShowUploadModal(false);
    setNewDocTitle('');
    setNewDocFileName('');
    setNewDocSummary('');
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentDoc || !commentText.trim()) return;

    store.addDocumentComment(activeCommentDoc.id, commentText.trim());
    setCommentText('');
  };

  // Resolve Task
  const handleResolveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTask || !taskResolutionNotes.trim()) return;

    store.resolveTask(resolvingTask.id, taskResolutionNotes.trim());
    setResolvingTask(null);
    setTaskResolutionNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Workspace Header & Entity Profile Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl font-['Cabinet_Grotesk'] border border-slate-700 shadow shrink-0">
              {entity.shortCode}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {entity.type === 'PUBLIC_ENTITY' ? 'Statutory Public Entity' : 'Non-Profit Organisation'}
                </span>
                <span className="text-xs text-slate-500">• {entity.cluster}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-['Cabinet_Grotesk']">
                {entity.name}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Head of Institution: <strong className="text-slate-800">{entity.headOfEntity}</strong> • Reporting Officer: <strong className="text-slate-800">{entity.reportingOfficerName}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onBackToDashboard}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {backLabel}
            </button>
            
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${
              entity.riskLevel === 'LOW'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : entity.riskLevel === 'MEDIUM'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {entity.riskLevel === 'LOW' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              {entity.riskLevel === 'MEDIUM' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
              {(entity.riskLevel === 'HIGH' || entity.riskLevel === 'CRITICAL') && <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
              <span>Risk Status: {entity.riskLevel} ({entity.riskScore}/100)</span>
            </div>
          </div>
        </div>

        {/* Tabs: the same six on every entity page */}
        <div className="flex items-end justify-between gap-3 border-b border-slate-200 mt-6 -mb-6 flex-wrap">
          <div role="tablist" className="flex overflow-x-auto">
            {(Object.keys(TAB_LABEL) as EntityTab[]).map(tab => {
              const Icon = TAB_ICON[tab];
              const badge = badgeFor[tab];
              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === tab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{TAB_LABEL[tab]}</span>
                  {badge ? <span className="text-[10px] px-1.5 rounded-full bg-amber-100 text-amber-800 font-black">{badge}</span> : null}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 pb-2 text-[11px] font-semibold text-slate-500">
            <span>Financial year</span>
            <select
              value={normalizeFinancialYear(workspaceYear)}
              onChange={(e) => setWorkspaceYear(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* OVERVIEW: headline figures, what needs attention, and the charts */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <EntityOverviewTab entity={entity} financialYear={workspaceYear} onGoToTab={setActiveTab} />
          <EntityVisualAnalytics
            entityId={entity.id}
            financialYear={workspaceYear}
            initialQuarter={isFinancialYearClosed(normalizeFinancialYear(workspaceYear)) ? 'FULL_YEAR' : getCurrentReportingPeriod().quarter}
            showQuarterSelector={true}
            showYearSelector={false}
          />
        </div>
      )}

      {activeTab === 'performance' && <EntityPerformanceTab entity={entity} financialYear={workspaceYear} />}

      {activeTab === 'finance' && <EntityFinanceTab entity={entity} financialYear={workspaceYear} isDsac={isDSACReviewer} />}

      {activeTab === 'profile' && <EntityProfileTab entity={entity} />}

      {/* TAB 1: REPORTS (THE CORE GOVERNMENT REPORTING & REVIEW WORKFLOW) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          
          {/* Statutory December Budget Mandates Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-xl p-6 border border-emerald-900/60 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-emerald-800/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-emerald-700 text-emerald-100">
                    Statutory PFMA &amp; Treasury Mandate
                  </span>
                  <span className="text-xs text-emerald-300 font-bold">
                    Section 38(1)(j) Compliance
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-1">
                  December Statutory Budget Submissions
                </h2>
                <p className="text-xs text-emerald-200/80">
                  Statutory Rule: Current financial year budget must be submitted in <strong>December into 4 quarters</strong>. Budget for the following year must be submitted in <strong>December</strong>.
                </p>
              </div>

              <span className="self-start md:self-auto px-3 py-1 rounded-md text-xs font-bold bg-emerald-800/80 border border-emerald-500/40 text-emerald-200">
                December Statutory Submissions
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
              {(() => {
                const fy = getCurrentReportingPeriod().financialYear;
                const start = financialYearStart(fy);
                const nextFy = `${start + 1}/${String((start + 2) % 100).padStart(2, '0')}`;
                const ledger = store.getDisbursements(entity.id, fy).slice().sort((a, b) => a.tranche.localeCompare(b.tranche));
                const nextProfile = store.getBudgetProfileForEntity(entity.id, nextFy);
                const months: Record<string, string> = { Q1: 'Apr–Jun', Q2: 'Jul–Sep', Q3: 'Oct–Dec', Q4: 'Jan–Mar' };
                return (
                  <>
                    {/* Box 1: current year allocation by quarter, from the disbursement ledger */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                          Current Year Budget ({fy}) • by Quarter
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {ledger.filter(d => d.status === 'RELEASED').length} of {ledger.length} released
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        Approved Annual Baseline: <strong className="text-white">{formatZAR(entity.budgetAllocationZAR)}</strong>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {ledger.map(d => (
                          <div key={d.id} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                            <div className={`text-[10px] font-bold ${d.status === 'RELEASED' ? 'text-emerald-300' : d.status === 'WITHHELD' ? 'text-rose-300' : 'text-sky-300'}`}>
                              {d.tranche} Tranche ({pct1(d.amountZAR, entity.budgetAllocationZAR)}%)
                            </div>
                            <div className="text-sm font-black text-white">{formatZAR(d.amountZAR)}</div>
                            <div className="text-[10px] text-slate-400">
                              {months[d.tranche]} • {d.status === 'RELEASED' ? 'Disbursed' : d.status === 'WITHHELD' ? 'Withheld' : 'Scheduled'}
                            </div>
                          </div>
                        ))}
                        {ledger.length === 0 && <div className="text-[11px] text-slate-400 col-span-2">No tranches are scheduled for this financial year.</div>}
                      </div>
                    </div>

                    {/* Box 2: following year budget request, from the budget workflow */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-teal-300">
                          Following Year Budget ({nextFy} MTEF)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {nextProfile ? nextProfile.status.replace(/_/g, ' ') : 'Not submitted'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Statutory Deadline:</span>
                          <strong className="text-white">31 December {start}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Submission on record:</span>
                          <strong className={nextProfile ? 'text-emerald-300' : 'text-amber-300'}>{nextProfile ? nextProfile.requestDate : 'None recorded'}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Requested Following Year Baseline:</span>
                          <strong className="text-white">{nextProfile ? formatZAR(nextProfile.requestedAmount) : '-'}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Accounting Officer:</span>
                          <strong className="text-white">{entity.headOfEntity}</strong>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Active Submissions List */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Statutory Quarterly Performance Returns
                </h2>
                <p className="text-xs text-slate-500">
                  Formal reporting workflow under the National Treasury Framework for Managing Programme Performance Information (FMPPI).
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              {entityReports.map(report => (
                <div 
                  key={report.id}
                  className={`p-5 rounded-xl border transition-all ${
                    report.submissionStatus === 'CORRECTION_REQUIRED'
                      ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300'
                      : report.submissionStatus === 'APPROVED'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : report.submissionStatus === 'OVERDUE'
                      ? 'bg-rose-50/50 border-rose-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900">
                          {report.quarter} Performance Report ({report.financialYear})
                        </span>
                        
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          report.submissionStatus === 'APPROVED'
                            ? 'bg-emerald-600 text-white'
                            : report.submissionStatus === 'CORRECTION_REQUIRED'
                            ? 'bg-amber-600 text-white'
                            : report.submissionStatus === 'OVERDUE'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {report.submissionStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1">
                        Due Date: <strong className="text-slate-800">{fmtDate(report.dueDate)}</strong> • Submitted by: {report.submittedBy || 'Pending Submission'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* DSAC Admin Review Button */}
                      {isDSACReviewer && report.submissionStatus !== 'APPROVED' && (
                        <button
                          onClick={() => {
                            setReviewReportModal(report);
                            setReviewNotes(report.reviewNotes || '');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Review Submission</span>
                        </button>
                      )}

                      {/* Entity Officer Resubmit Guidance */}
                      {!isDSACReviewer && report.submissionStatus === 'CORRECTION_REQUIRED' && (
                        <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Rectify via Entity Portal</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review notes / Rejection Reason feedback banner */}
                  {report.reviewNotes && (
                    <div className="mt-3 p-3 bg-white/80 rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span>DSAC Review Feedback ({report.reviewedBy || 'Reviewer'}):</span>
                      </div>
                      <p className="text-slate-700 mt-1 leading-relaxed">{report.reviewNotes}</p>
                    </div>
                  )}

                  {/* Report KPI Items List */}
                  {report.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200/60">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Reported Indicators Breakdown:
                      </div>
                      <div className="space-y-2">
                        {report.items.map(item => (
                          <div key={item.id} className="p-2.5 bg-white rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                            <div>
                              <div className="font-semibold text-slate-900">{item.kpiName}</div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                Target to date: {item.targetToDate} {item.unit} | Actual Achieved: <strong>{item.actualAchieved} {item.unit}</strong>
                              </div>
                              {item.varianceReason && (
                                <div className="text-[11px] text-slate-600 mt-1 italic">
                                  Variance Note: {item.varianceReason}
                                </div>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold self-start sm:self-center ${
                              item.status === 'ON_TRACK'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status.replace(/_/g, ' ')} ({item.variancePercentage > 0 ? `+${item.variancePercentage}` : item.variancePercentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Statutory Oversight Guidance: Submissions Managed via Entity Portal */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Statutory Return Ingestion Managed in Entity Portal
                </h4>
                <p className="text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Quarterly indicator actuals, variance justifications, and Portfolio of Evidence (PoE) are captured and submitted directly by {entity.name} via the Entity / NPO Self-Reporting Portal. DSAC reviews and audits these figures upon submission.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                PFMA Section 38(1)(j) Oversight
              </span>
            </div>
          </div>

        </div>
      )}

      {/* COMPLIANCE: statutory standing, evidence, verification, archive and directives */}
      {activeTab === 'compliance' && (
        <EntityComplianceTab entity={entity} financialYear={workspaceYear} isDsac={isDSACReviewer}>
        <div className="space-y-6">
          {/* Sub-navigation between Automated Verification Dossier and Multi-Version Archive */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl max-w-fit">
            <button
              onClick={() => setDocSubTab('verification')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                docSubTab === 'verification'
                  ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Section 38 Statutory Verification Dossier</span>
            </button>

            <button
              onClick={() => setDocSubTab('repository')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                docSubTab === 'repository'
                  ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-slate-600" />
              <span>Multi-Version Ledger Archive ({entityDocs.length})</span>
            </button>

            <button
              onClick={() => setDocSubTab('directives')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                docSubTab === 'directives'
                  ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Directives &amp; Tasks ({entityTasks.length})</span>
            </button>
          </div>

          {docSubTab === 'verification' && (
            <DocumentVerificationDossier
              entityId={entity.id}
              quarter={isFinancialYearClosed(normalizeFinancialYear(workspaceYear)) ? 'Q4' : getCurrentReportingPeriod().quarter}
              financialYear={toLongFinancialYear(workspaceYear)}
              isDSACReviewer={isDSACReviewer}
            />
          )}

          {docSubTab === 'directives' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Assigned Corrective Directives & Tasks
              </h2>
              <p className="text-xs text-slate-500">
                Action-oriented oversight: formal tasks issued downward from DSAC or tracked internally by entity management.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {entityTasks.map(task => (
              <div 
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  task.status === 'COMPLETED'
                    ? 'bg-slate-50 border-slate-200 opacity-80'
                    : task.status === 'OVERDUE'
                    ? 'bg-rose-50/50 border-rose-300'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {task.priority} Priority
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {task.direction === 'DSAC_TO_ENTITY' ? 'DSAC Ministerial Directive' : 'Entity Internal Action'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mt-1">{task.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{task.description}</p>
                    
                    <div className="text-[11px] text-slate-500 mt-2">
                      Assigned To: <strong className="text-slate-800">{task.assignedToName}</strong> • Due: <strong className="text-slate-800 font-mono">{fmtDate(task.dueDate)}</strong>
                    </div>

                    {task.resolutionNotes && (
                      <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900">
                        <strong>Resolution Evidence:</strong> {task.resolutionNotes} (Resolved on {fmtDate(task.completedAt)})
                      </div>
                    )}
                  </div>

                  <div>
                    {task.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => {
                          setResolvingTask(task);
                          setTaskResolutionNotes('');
                        }}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
          )}

          {docSubTab === 'repository' && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Statutory Document Repository & Multi-Version Ledger
                </h2>
                <p className="text-xs text-slate-500">
                  Version-controlled repository for Strategic Plans, APPs, Operational Plans, and Portfolios of Evidence.
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload New Statutory Document</span>
              </button>
            </div>

            <div className="space-y-4 mt-5">
              {entityDocs.map(doc => (
                <div key={doc.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{doc.title}</h3>
                          <span className="bg-slate-900 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                            Version {doc.currentVersion}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Category: {doc.category.replace(/_/g, ' ')} • Period: {doc.financialYear}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setVersionModalDoc(doc);
                          setVersionFileName('');
                          setVersionSummary('');
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        <span>Upload Version {doc.currentVersion + 1}</span>
                      </button>

                      <button
                        onClick={() => setActiveCommentDoc(doc)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>Comments ({doc.comments.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Version Ledger History List */}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Version Audit Ledger:
                    </div>
                    <div className="space-y-1.5">
                      {doc.versions.map((ver) => (
                        <div key={ver.versionNumber} className="p-2 bg-white rounded border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                              v{ver.versionNumber}
                            </span>
                            <span className="font-medium text-slate-800">{ver.fileName}</span>
                            <span className="text-slate-400 text-[11px]">({(ver.fileSizeBytes / 1_000_000).toFixed(1)} MB)</span>
                          </div>
                          <div className="text-[11px] text-slate-500 italic">
                            "{ver.changeSummary}" • {fmtDate(ver.uploadedAt)} by {ver.uploadedBy}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
        </EntityComplianceTab>
      )}

      {/* MODAL: DSAC Review Action (Approve or Correction Required) */}
      {reviewReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                DSAC Review: {reviewReportModal.quarter} Return ({reviewReportModal.entityName})
              </h3>
              <button onClick={() => setReviewReportModal(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleExecuteReview} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Review Determination</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('APPROVE')}
                    className={`p-3 rounded-lg border font-bold text-center transition-all ${
                      reviewDecision === 'APPROVE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✓ APPROVE SUBMISSION
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision('REQUEST_CORRECTION')}
                    className={`p-3 rounded-lg border font-bold text-center transition-all ${
                      reviewDecision === 'REQUEST_CORRECTION'
                        ? 'bg-amber-600 text-white border-amber-600 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚠ REQUEST CORRECTION
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Review Justification / Direction (Mandatory)
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide precise statutory reasoning or identify missing evidence sheets..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                ></textarea>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-600 leading-relaxed">
                <strong>Statutory Rule:</strong> Requesting correction automatically sets report status to <code>CORRECTION_REQUIRED</code> and assigns a Corrective Action Task to the accounting officer.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewReportModal(null)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow"
                >
                  Commit Official Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Upload New Document Version */}
      {versionModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Increment Version for "{versionModalDoc.title}"
              </h3>
              <button onClick={() => setVersionModalDoc(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleUploadVersion} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Version File Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. SAHRA_APP_2025_v3_Amended.pdf"
                  value={versionFileName}
                  onChange={(e) => setVersionFileName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Summary of Modifications (Audit Trail)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe amendments made in response to DSAC reviewer comments..."
                  value={versionSummary}
                  onChange={(e) => setVersionSummary(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVersionModalDoc(null)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow"
                >
                  Register Version {versionModalDoc.currentVersion + 1}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Upload New Document */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Upload New Statutory Document
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateNewDocument} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  required
                  type="text"
                  placeholder={`e.g. Operational Plan ${toLongFinancialYear(getCurrentReportingPeriod().financialYear)}`}
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Category</label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="STRATEGIC_PLAN">Strategic Plan (5 Year)</option>
                  <option value="ANNUAL_PERFORMANCE_PLAN">Annual Performance Plan (APP)</option>
                  <option value="OPERATIONAL_PLAN">Operational Plan</option>
                  <option value="QUARTERLY_REPORT">Quarterly Report</option>
                  <option value="FINANCIAL_REPORT">Financial Report / Audited Statements</option>
                  <option value="PORTFOLIO_OF_EVIDENCE">Portfolio of Evidence (PoE)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">File Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Operational_Plan_Final_Signed.pdf"
                  value={newDocFileName}
                  onChange={(e) => setNewDocFileName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Submission Purpose</label>
                <input
                  type="text"
                  placeholder="Brief note on content"
                  value={newDocSummary}
                  onChange={(e) => setNewDocSummary(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow"
                >
                  Upload & Stamp Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Comments Thread on Document */}
      {activeCommentDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Comments on "{activeCommentDoc.title}"
                </h3>
              </div>
              <button onClick={() => setActiveCommentDoc(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="my-4 overflow-y-auto space-y-3 flex-1 pr-1 text-xs">
              {activeCommentDoc.comments.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No review comments yet. Start a discussion below.
                </div>
              ) : (
                activeCommentDoc.comments.map(c => (
                  <div key={c.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{c.authorName} <span className="text-[10px] text-slate-500 font-normal">({c.authorEntity || c.authorRole})</span></span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(c.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-700 mt-1.5 leading-relaxed">{c.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 shrink-0 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type a compliance or review comment..."
                className="flex-1 p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Resolve Corrective Task */}
      {resolvingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Resolve Corrective Directive
              </h3>
              <button onClick={() => setResolvingTask(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleResolveTask} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800">{resolvingTask.title}</div>
                <div className="text-slate-600 mt-0.5">{resolvingTask.description}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resolution Notes & Evidence Summary (Mandatory)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail the remedial actions implemented and reference the uploaded evidence..."
                  value={taskResolutionNotes}
                  onChange={(e) => setTaskResolutionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingTask(null)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Resolved & Notify DSAC</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
