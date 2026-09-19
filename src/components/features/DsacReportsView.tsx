import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Search,
  ExternalLink,
  Check,
  RotateCcw,
  FolderLock,
  Inbox,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';
import { formatZAR, isPortfolioMember } from '../../services/financialService';
import { downloadStatutoryDocument } from '../../services/downloadHelper';
import { getCurrentReportingPeriod, normalizeFinancialYear } from '../../services/reportingPeriod';
import { getEvidenceSummary } from '../../services/evidenceStatus';

interface DsacReportsViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
  initialSubtab?: 'submissions' | 'documents' | 'review';
}

type RecordStatus = 'VERIFIED' | 'UNDER_REVIEW' | 'REQUIRES_AMENDMENT' | 'OVERDUE';
type RecordQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ANNUAL';

/**
 * One row of the reporting centre. Every row is derived from the store: structured quarterly returns and the
 * documents entities have actually uploaded. (The previous version appended a typed list of invented reports and
 * showed the same "all verified" evidence checklist for every report, even overdue ones.)
 */
interface ReportRecord {
  id: string;
  kind: 'REPORT' | 'DOCUMENT';
  entityId: string;
  entityName: string;
  quarter: RecordQuarter;
  year: string;
  title: string;
  type: string;
  status: RecordStatus;
  submittedDate: string;
  format: string;
  sizeLabel: string;
  officer: string;
  summary: string;
}

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  STRATEGIC_PLAN: 'Strategic Plan',
  ANNUAL_PERFORMANCE_PLAN: 'Annual Performance Plan (APP)',
  OPERATIONAL_PLAN: 'Operational Plan',
  QUARTERLY_REPORT: 'Quarterly Report (document)',
  ANNUAL_REPORT: 'Annual Report',
  FINANCIAL_REPORT: 'Financial Statements (AFS)',
  PORTFOLIO_OF_EVIDENCE: 'Portfolio of Evidence (PoE)',
  GOVERNANCE_CHARTER: 'Governance Document',
  TAX_AND_BANKING: 'Tax & Banking Record',
};
const QPR_TYPE = 'Quarterly Performance Report (QPR)';
const QUARTER_RANK: Record<RecordQuarter, number> = { ANNUAL: 5, Q4: 4, Q3: 3, Q2: 2, Q1: 1 };

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

const STATUS_BADGE: Record<RecordStatus, { label: string; cls: string }> = {
  VERIFIED: { label: 'Verified', cls: 'bg-emerald-100 text-emerald-800' },
  UNDER_REVIEW: { label: 'Reviewing', cls: 'bg-amber-100 text-amber-800' },
  REQUIRES_AMENDMENT: { label: 'Amendment', cls: 'bg-rose-100 text-rose-800' },
  OVERDUE: { label: 'Overdue', cls: 'bg-slate-800 text-white' },
};

const SLOT_BADGE: Record<string, { label: string; cls: string }> = {
  VERIFIED: { label: 'Verified', cls: 'text-emerald-700 bg-emerald-100' },
  MANUAL_REVIEW: { label: 'Manual review', cls: 'text-amber-800 bg-amber-100' },
  VALIDATING: { label: 'Validating', cls: 'text-amber-800 bg-amber-100' },
  REJECTED: { label: 'Rejected', cls: 'text-rose-800 bg-rose-100' },
  MISSING: { label: 'Missing', cls: 'text-rose-800 bg-rose-100' },
};

export const DsacReportsView: React.FC<DsacReportsViewProps> = ({
  onOpenWorkspace,
  initialSubtab = 'submissions',
}) => {
  const [tick, setTick] = useState(0);
  useEffect(() => store.subscribe(() => setTick(t => t + 1)), []);

  const period = getCurrentReportingPeriod();
  const [activeTab, setActiveTab] = useState<'submissions' | 'documents' | 'review'>(initialSubtab);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [quarterFilter, setQuarterFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const notify = (message: string) => {
    setActionNotice(message);
    setTimeout(() => setActionNotice(null), 4500);
  };

  const reports: ReportRecord[] = useMemo(() => {
    const members = new Set(store.entities.filter(isPortfolioMember).map(e => e.id));
    const nameOf = (id: string, fallback: string) => store.entities.find(e => e.id === id)?.name || fallback;

    const documentRecords: ReportRecord[] = store.documents
      .filter(d => members.has(d.entityId))
      .map(d => {
        const status: RecordStatus =
          d.approvalStatus === 'APPROVED' || d.verificationStatus === 'VERIFIED' ? 'VERIFIED'
          : d.approvalStatus === 'REQUIRES_AMENDMENT' || d.verificationStatus === 'REJECTED' ? 'REQUIRES_AMENDMENT'
          : 'UNDER_REVIEW';
        const fileName = d.fileName || d.title;
        return {
          id: d.id,
          kind: 'DOCUMENT',
          entityId: d.entityId,
          entityName: nameOf(d.entityId, d.entityName),
          quarter: d.quarter ?? 'ANNUAL',
          year: normalizeFinancialYear(d.financialYear),
          title: d.title,
          type: DOCUMENT_TYPE_LABEL[d.category] || 'Document',
          status,
          submittedDate: fmtDate(d.uploadedAt),
          format: (fileName.split('.').pop() || 'FILE').toUpperCase().slice(0, 5),
          sizeLabel: d.fileSize || '—',
          officer: d.uploadedBy || '—',
          summary: d.verificationSummary || 'No verification summary has been recorded for this document.',
        };
      });

    const reportRecords: ReportRecord[] = store.reports
      .filter(r => members.has(r.entityId))
      .map(r => {
        const ent = store.entities.find(e => e.id === r.entityId);
        const status: RecordStatus =
          r.submissionStatus === 'APPROVED' ? 'VERIFIED'
          : r.submissionStatus === 'CORRECTION_REQUIRED' ? 'REQUIRES_AMENDMENT'
          : r.submissionStatus === 'OVERDUE' || r.submissionStatus === 'DRAFT' ? 'OVERDUE'
          : 'UNDER_REVIEW';
        const achieved = r.items.filter(i => i.status === 'COMPLETED' || i.status === 'ON_TRACK').length;
        const facts = r.items.length > 0
          ? `${r.items.length} indicators reported, ${achieved} achieved or on track; expenditure ${formatZAR(r.fundsSpentThisQuarterZAR || 0)}.`
          : 'No indicators have been reported yet.';
        return {
          id: r.id,
          kind: 'REPORT',
          entityId: r.entityId,
          entityName: ent ? ent.name : r.entityName,
          quarter: r.quarter,
          year: normalizeFinancialYear(r.financialYear),
          title: `${ent?.shortCode || ent?.name || 'Institution'} ${r.quarter} Statutory Performance & Expenditure Report`,
          type: QPR_TYPE,
          status,
          submittedDate: fmtDate(r.submittedAt),
          format: 'Return',
          sizeLabel: `${r.items.length} ${r.items.length === 1 ? 'indicator' : 'indicators'}`,
          officer: r.submittedByName || r.submittedBy || '—',
          summary: [r.varianceExplanations || r.reviewNotes, facts].filter(Boolean).join(' '),
        };
      });

    return [...reportRecords, ...documentRecords].sort(
      (a, b) => b.year.localeCompare(a.year) || QUARTER_RANK[b.quarter] - QUARTER_RANK[a.quarter] || a.entityName.localeCompare(b.entityName)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const typeOptions = useMemo(() => Array.from(new Set(reports.map(r => r.type))).sort(), [reports]);

  const filteredReports = reports.filter(rep => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = rep.entityName.toLowerCase().includes(term) || rep.title.toLowerCase().includes(term);
    const matchesQuarter = quarterFilter === 'ALL' || rep.quarter === quarterFilter;
    const matchesType = typeFilter === 'ALL' || rep.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || rep.status === statusFilter;
    const matchesSubtab =
      activeTab === 'submissions' ? rep.kind === 'REPORT'
      : activeTab === 'documents' ? rep.kind === 'DOCUMENT'
      : rep.status === 'UNDER_REVIEW' || rep.status === 'REQUIRES_AMENDMENT';
    return matchesSearch && matchesQuarter && matchesType && matchesStatus && matchesSubtab;
  });

  const selectedReport = filteredReports.find(r => r.id === selectedReportId) || filteredReports[0];

  // Evidence required for the selected period, with the real status of each requirement.
  const checklist = useMemo(() => {
    if (!selectedReport) return null;
    const q = selectedReport.quarter === 'ANNUAL' ? period.quarter : selectedReport.quarter;
    return getEvidenceSummary(selectedReport.entityId, q, selectedReport.year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport?.id, tick]);

  const canDecide =
    !!selectedReport && (selectedReport.kind === 'DOCUMENT' || selectedReport.status === 'UNDER_REVIEW');

  const handleVerify = () => {
    if (!selectedReport) return;
    const note = reviewNote.trim();
    if (selectedReport.kind === 'DOCUMENT') {
      store.verifyDocument(selectedReport.id, 'APPROVED', note || undefined);
      const after = store.documents.find(d => d.id === selectedReport.id);
      notify(after?.approvalStatus === 'APPROVED' ? 'Document verified and logged in the statutory repository.' : 'Only DSAC officials can verify documents.');
    } else {
      const report = store.reports.find(r => r.id === selectedReport.id);
      if (!report) return;
      const before = report.submissionStatus;
      store.reviewReport(report.id, 'APPROVE', note || 'Approved by DSAC oversight reviewer.');
      notify(
        before !== 'APPROVED' && report.submissionStatus === 'APPROVED'
          ? 'Report approved and logged in the statutory repository.'
          : `The report is ${before.replace(/_/g, ' ').toLowerCase()} and cannot be approved in that state.`
      );
    }
    setReviewNote('');
  };

  const handleRequestRevision = () => {
    if (!selectedReport) return;
    const note = reviewNote.trim();
    if (!note) {
      notify('Please enter the correction required before returning it.');
      return;
    }
    if (selectedReport.kind === 'DOCUMENT') {
      store.verifyDocument(selectedReport.id, 'REQUIRES_AMENDMENT', note);
      notify(`Document returned to ${selectedReport.officer} for amendment.`);
    } else {
      const report = store.reports.find(r => r.id === selectedReport.id);
      if (!report) return;
      const before = report.submissionStatus;
      store.reviewReport(report.id, 'REQUEST_CORRECTION', note);
      notify(
        report.submissionStatus === 'CORRECTION_REQUIRED' && before !== 'CORRECTION_REQUIRED'
          ? `Report returned to ${selectedReport.officer} for correction. A corrective task was created.`
          : `The report is ${before.replace(/_/g, ' ').toLowerCase()} and cannot be returned in that state.`
      );
    }
    setReviewNote('');
  };

  const handleDownload = () => {
    if (!selectedReport) return;
    downloadStatutoryDocument(
      `${selectedReport.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`,
      selectedReport.title,
      selectedReport.type,
      selectedReport.entityName
    );
    notify(`Downloaded a summary of "${selectedReport.title}".`);
  };

  const count = (s: RecordStatus) => reports.filter(r => r.status === s).length;
  const institutions = new Set(reports.map(r => r.entityId)).size;

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Reporting Centre</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submissions, evidence dossiers, and statutory review across {store.entities.filter(isPortfolioMember).length} institutions
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                onClick={() => { setActiveTab('submissions'); setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'submissions' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Inbox className="w-3.5 h-3.5 text-emerald-700" />
                <span>Submissions</span>
              </button>
              <button
                onClick={() => { setActiveTab('documents'); setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'documents' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderLock className="w-3.5 h-3.5 text-blue-700" />
                <span>Documents &amp; PoE</span>
              </button>
              <button
                onClick={() => { setActiveTab('review'); setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'review' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Review Queue</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full font-black">
                  {count('UNDER_REVIEW') + count('REQUIRES_AMENDMENT')}
                </span>
              </button>
            </div>

            {actionNotice && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fadeIn" role="status">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{actionNotice}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">Repository</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{reports.length} Records</div>
            <div className="text-[10px] text-slate-400">{institutions} institutions</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
            <div className="text-[11px] font-semibold text-emerald-800">Verified &amp; Approved</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{count('VERIFIED')}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Accepted by DSAC</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70">
            <div className="text-[11px] font-semibold text-amber-800">Under DSAC Review</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">{count('UNDER_REVIEW')}</div>
            <div className="text-[10px] text-amber-600 font-medium">Awaiting a decision</div>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/70">
            <div className="text-[11px] font-semibold text-rose-800">Requires Amendment</div>
            <div className="text-xl font-black text-rose-700 mt-0.5">{count('REQUIRES_AMENDMENT')}</div>
            <div className="text-[10px] text-rose-600 font-medium">Returned to the entity</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300/70">
            <div className="text-[11px] font-semibold text-slate-700">Overdue / Not Lodged</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{count('OVERDUE')}</div>
            <div className="text-[10px] text-slate-500 font-medium">No submission yet</div>
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
              placeholder="Search reports by entity or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={quarterFilter}
            onChange={(e) => setQuarterFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Periods</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
            <option value="ANNUAL">Annual</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Report Types</option>
            {typeOptions.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified &amp; Approved</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REQUIRES_AMENDMENT">Requires Amendment</option>
            <option value="OVERDUE">Overdue / Not Lodged</option>
          </select>
        </div>
      </div>

      {/* MASTER-DETAIL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT PANE: master list */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col h-[740px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Records ({filteredReports.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Click to inspect</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredReports.length === 0 && (
              <div className="text-center py-16 text-xs text-slate-400">No records match the current filters.</div>
            )}
            {filteredReports.map((rep) => {
              const isSelected = rep.id === selectedReport?.id;
              const badge = STATUS_BADGE[rep.status];
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-600 shadow-xs ring-1 ring-emerald-400/40'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                          {rep.quarter} {rep.year}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{rep.format}</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">{rep.title}</h5>
                      <p className="text-[11px] text-slate-500 font-medium truncate">{rep.entityName}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                      <div className="text-[9px] text-slate-400 mt-1">{rep.sizeLabel}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>Submitted: {rep.submittedDate}</span>
                    <span className="truncate ml-2">Officer: {rep.officer}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE: detail */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-20">
          {selectedReport ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                      {selectedReport.type}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      Period: <strong className="text-slate-800">{selectedReport.quarter} {selectedReport.year}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1.5">{selectedReport.title}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Submitting entity: <strong className="text-slate-800">{selectedReport.entityName}</strong> • Submitted: {selectedReport.submittedDate}
                  </p>
                </div>

                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                  <div className="text-lg font-black text-slate-900 leading-none">{selectedReport.sizeLabel}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{selectedReport.format}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{selectedReport.kind === 'DOCUMENT' ? 'Download Document Summary' : 'Download Return Summary'}</span>
                  </button>

                  {canDecide && selectedReport.status !== 'VERIFIED' && (
                    <button
                      onClick={handleVerify}
                      className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                      <span>Verify &amp; Sign-Off</span>
                    </button>
                  )}

                  {canDecide && selectedReport.status !== 'REQUIRES_AMENDMENT' && (
                    <button
                      onClick={handleRequestRevision}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                      <span>Return for Amendment</span>
                    </button>
                  )}

                  {onOpenWorkspace && (
                    <button
                      onClick={() => onOpenWorkspace(selectedReport.entityId)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>Open Entity Workspace</span>
                    </button>
                  )}
                </div>

                {canDecide && selectedReport.status !== 'VERIFIED' && (
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Reviewer note (required when returning for amendment)"
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                )}

                {selectedReport.status === 'OVERDUE' && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>This return has not been lodged, so there is nothing to review yet.</span>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">Summary</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedReport.summary}</p>
              </div>

              {/* Portfolio of Evidence: the real requirement slots for this entity and period */}
              {checklist && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Portfolio of Evidence (PoE) Checklist</span>
                    <span className={`text-[11px] font-semibold ${checklist.verifiedMandatory === checklist.totalMandatory && checklist.totalMandatory > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {checklist.verifiedMandatory} of {checklist.totalMandatory} mandatory items verified
                    </span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    {checklist.slots.map(slot => {
                      const badge = slot.status === 'MISSING' && !slot.mandatory
                        ? { label: 'Not provided', cls: 'text-slate-600 bg-slate-100' }
                        : SLOT_BADGE[slot.status];
                      return (
                        <div key={slot.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="flex items-center gap-2 text-slate-700 min-w-0">
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${slot.status === 'VERIFIED' ? 'text-emerald-600' : 'text-slate-300'}`} />
                            <span className="min-w-0">
                              <span className="block truncate">{slot.title}</span>
                              {slot.detail && <span className="block text-[10px] text-slate-400 truncate">{slot.detail}</span>}
                            </span>
                            {slot.mandatory && <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Mandatory</span>}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>{badge.label}</span>
                        </div>
                      );
                    })}
                    {checklist.slots.length === 0 && <p className="text-slate-400">No evidence requirements are defined for this period.</p>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">Select a record to inspect</div>
          )}
        </div>
      </div>
    </div>
  );
};
