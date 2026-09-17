import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  ExternalLink, 
  FileSpreadsheet, 
  Check, 
  RotateCcw,
  Eye,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';
import { PublicEntity, QuarterlyReport } from '../../types';
import { store } from '../../services/store';

interface DsacReportsViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
}

interface ReportItemRecord {
  id: string;
  entityId: string;
  entityName: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ANNUAL';
  year: string;
  title: string;
  type: 'Quarterly Performance Report (QPR)' | 'Annual Performance Plan (APP)' | 'Portfolio of Evidence (PoE)' | 'Audited Financial Statements (AFS)' | 'Strategic Plan';
  status: 'VERIFIED' | 'UNDER_REVIEW' | 'REQUIRES_AMENDMENT';
  submittedDate: string;
  fileFormat: 'PDF' | 'XLSX';
  fileSize: string;
  reportingOfficer: string;
  executiveSummary: string;
}

const INITIAL_REPORTS_LIST: ReportItemRecord[] = [
  {
    id: 'rep-001',
    entityId: 'ent-ubuntu-arts',
    entityName: 'Ubuntu Arts NPO',
    quarter: 'Q2',
    year: '2024/25',
    title: 'Ubuntu Arts NPO - Q2 Statutory Performance & Expenditure Report',
    type: 'Quarterly Performance Report (QPR)',
    status: 'VERIFIED',
    submittedDate: '28 Jul 2026',
    fileFormat: 'PDF',
    fileSize: '4.8 MB',
    reportingOfficer: 'Lerato Phiri',
    executiveSummary: 'Full reconciliation of Q2 youth theater masterclasses, audience outreach metrics across 12 township centers, and grant expenditure against approved budget vote.'
  },
  {
    id: 'rep-002',
    entityId: 'ent-ubuntu-arts',
    entityName: 'Ubuntu Arts NPO',
    quarter: 'Q2',
    year: '2024/25',
    title: 'Ubuntu Arts NPO - Q2 Portfolio of Evidence (PoE) Dossier',
    type: 'Portfolio of Evidence (PoE)',
    status: 'VERIFIED',
    submittedDate: '28 Jul 2026',
    fileFormat: 'PDF',
    fileSize: '18.4 MB',
    reportingOfficer: 'Lerato Phiri',
    executiveSummary: 'Comprehensive portfolio containing participant attendance registers, photo documentation of performances, independent auditor expenditure vouchers, and tax compliance receipts.'
  },
  {
    id: 'rep-003',
    entityId: 'ent-sahra',
    entityName: 'South African Heritage Resources Agency (SAHRA)',
    quarter: 'Q2',
    year: '2024/25',
    title: 'SAHRA Q2 National Heritage Grading & SAHRIS Registry Report',
    type: 'Quarterly Performance Report (QPR)',
    status: 'VERIFIED',
    submittedDate: '30 Jul 2026',
    fileFormat: 'PDF',
    fileSize: '6.2 MB',
    reportingOfficer: 'Kagiso Mokoena',
    executiveSummary: 'Audit of 14 national heritage landmarks inspected, 42 export permits evaluated, and maritime archaeology surveys along the Agulhas coastline.'
  },
  {
    id: 'rep-004',
    entityId: 'ent-sahra',
    entityName: 'South African Heritage Resources Agency (SAHRA)',
    quarter: 'Q3',
    year: '2024/25',
    title: 'SAHRA Q3 Interim Performance & Statutory Compliance Report',
    type: 'Quarterly Performance Report (QPR)',
    status: 'UNDER_REVIEW',
    submittedDate: '10 Sep 2026',
    fileFormat: 'PDF',
    fileSize: '5.1 MB',
    reportingOfficer: 'Kagiso Mokoena',
    executiveSummary: 'Draft Q3 delivery status covering Section 27 site gazetting, community consultative forums in Limpopo, and expenditure tracking.'
  },
  {
    id: 'rep-005',
    entityId: 'ent-nac',
    entityName: 'National Arts Council of South Africa (NAC)',
    quarter: 'Q2',
    year: '2024/25',
    title: 'NAC Q2 Grant Disbursements & Sector Beneficiaries Report',
    type: 'Quarterly Performance Report (QPR)',
    status: 'VERIFIED',
    submittedDate: '31 Jul 2026',
    fileFormat: 'PDF',
    fileSize: '7.9 MB',
    reportingOfficer: 'Sibusiso Ndlovu',
    executiveSummary: 'Statistical breakdown of individual artist project grants, provincial allocation quotas, and transformation benchmarks.'
  },
  {
    id: 'rep-006',
    entityId: 'ent-nac',
    entityName: 'National Arts Council of South Africa (NAC)',
    quarter: 'Q3',
    year: '2024/25',
    title: 'NAC Q3 Interim Financial Statements & Grant Audit Reconciliation',
    type: 'Audited Financial Statements (AFS)',
    status: 'REQUIRES_AMENDMENT',
    submittedDate: '02 Sep 2026',
    fileFormat: 'XLSX',
    fileSize: '3.4 MB',
    reportingOfficer: 'Sibusiso Ndlovu',
    executiveSummary: 'Quarterly ledger reconciliation returned by DSAC Oversight due to discrepancy between provincial commitments and National Treasury disbursement thresholds.'
  },
  {
    id: 'rep-007',
    entityId: 'ent-nfvf',
    entityName: 'National Film and Video Foundation (NFVF)',
    quarter: 'Q2',
    year: '2024/25',
    title: 'NFVF Q2 Feature Film & Documentary Production Funding Report',
    type: 'Quarterly Performance Report (QPR)',
    status: 'VERIFIED',
    submittedDate: '29 Jul 2026',
    fileFormat: 'PDF',
    fileSize: '5.8 MB',
    reportingOfficer: 'Thabang Phetla',
    executiveSummary: 'Review of 22 South African motion pictures supported, international market delegations, and employment creation in scriptwriting and cinematography.'
  },
  {
    id: 'rep-008',
    entityId: 'ent-bsa',
    entityName: 'Boxing South Africa (BSA)',
    quarter: 'Q2',
    year: '2024/25',
    title: 'BSA Q2 Tournament Sanctioning & Boxer Safety Compliance Report',
    type: 'Quarterly Performance Report (QPR)',
    status: 'UNDER_REVIEW',
    submittedDate: '12 Aug 2026',
    fileFormat: 'PDF',
    fileSize: '3.1 MB',
    reportingOfficer: 'Lwazi Mwandla',
    executiveSummary: 'Overview of 18 professional boxing tournaments sanctioned across 5 provinces, medical clearance compliance, and ringside safety audits.'
  },
  {
    id: 'rep-009',
    entityId: 'ent-artscape',
    entityName: 'Artscape Theatre Centre',
    quarter: 'Q2',
    year: '2024/25',
    title: 'Artscape Q2 Performing Arts & Audience Diversity Report',
    type: 'Quarterly Performance Report (QPR)',
    status: 'VERIFIED',
    submittedDate: '25 Jul 2026',
    fileFormat: 'PDF',
    fileSize: '8.2 MB',
    reportingOfficer: 'Simone Adams',
    executiveSummary: 'Staging of 64 theatre productions, youth accessibility school buses, and operational venue safety audits.'
  },
  {
    id: 'rep-010',
    entityId: 'ent-iziko',
    entityName: 'Iziko Museums of South Africa',
    quarter: 'Q2',
    year: '2024/25',
    title: 'Iziko Museums Q2 Curatorial & Visitor Metrics Report',
    type: 'Quarterly Performance Report (QPR)',
    status: 'VERIFIED',
    submittedDate: '27 Jul 2026',
    fileFormat: 'PDF',
    fileSize: '9.5 MB',
    reportingOfficer: 'Fatima Davids',
    executiveSummary: 'Curatorial exhibitions, educational visits by 14,000 learners, and heritage artifact conservation audits.'
  }
];

export const DsacReportsView: React.FC<DsacReportsViewProps> = ({
  entities,
  onSelectEntity,
  onOpenWorkspace
}) => {
  const [reports, setReports] = useState<ReportItemRecord[]>(INITIAL_REPORTS_LIST);
  const [selectedReportId, setSelectedReportId] = useState<string>(INITIAL_REPORTS_LIST[0].id);
  const [quarterFilter, setQuarterFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredReports = reports.filter(rep => {
    const matchesSearch = 
      rep.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuarter = quarterFilter === 'ALL' || rep.quarter === quarterFilter;
    const matchesType = typeFilter === 'ALL' || rep.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || rep.status === statusFilter;
    return matchesSearch && matchesQuarter && matchesType && matchesStatus;
  });

  const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0];

  const handleVerify = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'VERIFIED' } : r));
    setActionNotice(`Report formally verified and logged in statutory repository.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRequestRevision = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'REQUIRES_AMENDMENT' } : r));
    setActionNotice(`Report flagged for clarification. Notification sent to ${selectedReport?.reportingOfficer}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDownload = () => {
    setActionNotice(`Downloading authentic departmental copy of "${selectedReport?.title}"...`);
    setTimeout(() => setActionNotice(null), 3500);
  };

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
              <h2 className="text-lg font-black text-slate-900">
                Statutory Reports Repository
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Quarterly Performance Reports (QPR), Annual Performance Plans (APP), Portfolios of Evidence &amp; Financial Statements across all 26 Public Entities and 6 NPOs (32 Total)
            </p>
          </div>

          {actionNotice && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}
        </div>

        {/* 4 Summary Document Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="text-[11px] font-semibold text-slate-500">Repository Documents</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">86 Reports</div>
            <div className="text-[10px] text-slate-400">All 32 Institutions</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/70">
            <div className="text-[11px] font-semibold text-emerald-800">Verified &amp; Approved</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">68 Reports</div>
            <div className="text-[10px] text-emerald-600 font-medium">PoE Validated</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70">
            <div className="text-[11px] font-semibold text-amber-800">Under DSAC Review</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">12 Reports</div>
            <div className="text-[10px] text-amber-600 font-medium">In Evaluation</div>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/70">
            <div className="text-[11px] font-semibold text-rose-800">Requires Amendment</div>
            <div className="text-xl font-black text-rose-700 mt-0.5">6 Reports</div>
            <div className="text-[10px] text-rose-600 font-medium">Feedback Issued</div>
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
            <option value="Q1">Q1 Performance</option>
            <option value="Q2">Q2 Performance</option>
            <option value="Q3">Q3 Performance</option>
            <option value="ANNUAL">Annual Report</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Report Types</option>
            <option value="Quarterly Performance Report (QPR)">Quarterly Reports (QPR)</option>
            <option value="Portfolio of Evidence (PoE)">Portfolios of Evidence (PoE)</option>
            <option value="Audited Financial Statements (AFS)">Financial Statements (AFS)</option>
            <option value="Annual Performance Plan (APP)">Annual Performance Plans</option>
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
          </select>
        </div>
      </div>

      {/* MASTER-DETAIL SIDE VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT PANE: Master List of Reports (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col h-[740px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reports ({filteredReports.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Click to inspect in side view</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredReports.map((rep) => {
              const isSelected = rep.id === selectedReportId;

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
                        <span className="text-[10px] text-slate-400 font-semibold">{rep.fileFormat}</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">
                        {rep.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        {rep.entityName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        rep.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                        rep.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {rep.status === 'VERIFIED' ? 'Verified' : rep.status === 'UNDER_REVIEW' ? 'Reviewing' : 'Amendment'}
                      </span>
                      <div className="text-[9px] text-slate-400 mt-1">{rep.fileSize}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>Submitted: {rep.submittedDate}</span>
                    <span>Officer: {rep.reportingOfficer}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE: Side View Detail Dossier (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-20">
          {selectedReport ? (
            <div className="space-y-5">
              
              {/* Header */}
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
                  <h3 className="text-lg font-black text-slate-900 mt-1.5">
                    {selectedReport.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Submitting Entity: <strong className="text-slate-800">{selectedReport.entityName}</strong> • Submitted: {selectedReport.submittedDate}
                  </p>
                </div>

                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                  <div className="text-lg font-black text-slate-900 leading-none">
                    {selectedReport.fileSize}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                    {selectedReport.fileFormat} File
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official File</span>
                </button>

                {selectedReport.status !== 'VERIFIED' && (
                  <button
                    onClick={() => handleVerify(selectedReport.id)}
                    className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-teal-600" />
                    <span>Verify &amp; Sign-Off</span>
                  </button>
                )}

                {selectedReport.status !== 'REQUIRES_AMENDMENT' && (
                  <button
                    onClick={() => handleRequestRevision(selectedReport.id)}
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

              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Executive Summary &amp; Statutory Scope
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedReport.executiveSummary}
                </p>
              </div>

              {/* Portfolio of Evidence Verification Details */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Portfolio of Evidence (PoE) Verification Checklist</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">AGSA Compliant</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Audited Attendance Registers &amp; Participant Rosters
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Financial Invoices, Payroll Proof &amp; Bank Statements
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Executive Director / CEO Sign-off Certificate
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Attached &amp; Signed
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      MTSF Alignment &amp; Job Creation Vouchers
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Compliant
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              Select a report to preview in side view
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
