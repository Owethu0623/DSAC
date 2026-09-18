import React, { useState, useMemo } from 'react';
import {
  Coins,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  PlusCircle,
  Building2,
  TrendingUp,
  FileCheck2,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  X,
  Check,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { store } from '../../services/store';
import { 
  FinancialQuarter, 
  EntityFinancialSummary, 
  DepartmentFinancialKPIs,
  QuarterlyFinancialSubmission,
  BudgetProfileStatus
} from '../../types/financial';
import { 
  formatZAR, 
  getQuarterDates, 
  getFinancialStatusBadge,
  generateFinancialExportCSV 
} from '../../services/financialService';
import { EntityFinancialView } from './EntityFinancialView';
import { DsacSupportView } from './DsacSupportView';

interface DsacFinancialDashboardProps {
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
}

export const DsacFinancialDashboard: React.FC<DsacFinancialDashboardProps> = ({
  onSelectEntity,
  onOpenWorkspace,
}) => {
  const [, setTick] = useState(0);

  // Filters & State
  const [selectedYear, setSelectedYear] = useState<string>('2026/27');
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialQuarter | 'FULL_YEAR'>('Q3');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PUBLIC_ENTITY' | 'NPO'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'portfolio' | 'approvals' | 'reviews' | 'categories' | 'support'>('portfolio');

  // Drawer / Inspection
  const [inspectedEntityId, setInspectedEntityId] = useState<string | null>(null);

  // Review Modals
  const [reviewSubmissionModal, setReviewSubmissionModal] = useState<QuarterlyFinancialSubmission | null>(null);
  const [reviewSubmissionDecision, setReviewSubmissionDecision] = useState<'APPROVE' | 'REQUEST_CORRECTION'>('APPROVE');
  const [reviewSubmissionNotes, setReviewSubmissionNotes] = useState<string>('');

  // Budget Request Approval Modal
  const [reviewBudgetProfileModal, setReviewBudgetProfileModal] = useState<any | null>(null);
  const [budgetApprovalAmount, setBudgetApprovalAmount] = useState<string>('0');
  const [budgetApprovalNotes, setBudgetApprovalNotes] = useState<string>('');

  // New Category Modal
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Department Aggregated KPIs
  const departmentKPIs: DepartmentFinancialKPIs = useMemo(() => {
    return store.getDepartmentFinancialKPIs(selectedYear, selectedQuarter);
  }, [selectedYear, selectedQuarter]);

  // All entity summaries
  const allSummaries: EntityFinancialSummary[] = useMemo(() => {
    return store.entities.map(e => store.getEntityFinancialSummary(e.id, selectedYear, selectedQuarter));
  }, [selectedYear, selectedQuarter]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return allSummaries.filter(s => {
      const matchesSearch = s.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.shortCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'ALL' || s.entityType === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || s.financialStatus === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allSummaries, searchQuery, typeFilter, statusFilter]);

  // Submissions pending review
  const pendingSubmissions = useMemo(() => {
    return store.quarterlyFinancialSubmissions.filter(s => s.financialYear === selectedYear && s.status === 'SUBMITTED');
  }, [selectedYear]);

  // Budget profiles pending approval
  const pendingBudgetProfiles = useMemo(() => {
    return store.budgetProfiles.filter(p => p.financialYear === selectedYear && p.status === 'SUBMITTED');
  }, [selectedYear]);

  // Export CSV
  const handleExportAllCSV = () => {
    const csv = generateFinancialExportCSV(filteredSummaries, selectedYear);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GovTrack_DSAC_Financial_Oversight_${selectedYear.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Execute Submission Review
  const handleExecuteReviewSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewSubmissionModal) return;

    store.reviewQuarterlyFinancialReturn(
      reviewSubmissionModal.id,
      reviewSubmissionDecision,
      reviewSubmissionNotes || (reviewSubmissionDecision === 'APPROVE' ? 'Statutory expenditure verified and reconciled with Section 38 records.' : 'Correction required on itemized receipts.')
    );

    setReviewSubmissionModal(null);
    setReviewSubmissionNotes('');
    setNotificationMsg(`Quarterly Return for ${reviewSubmissionModal.entityName} (${reviewSubmissionModal.quarter}) ${reviewSubmissionDecision === 'APPROVE' ? 'APPROVED' : 'marked for correction'}.`);
    setTimeout(() => setNotificationMsg(null), 4000);
    setTick(t => t + 1);
  };

  // Execute Budget Profile Approval
  const handleExecuteBudgetReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBudgetProfileModal) return;

    const approvedAmt = parseFloat(budgetApprovalAmount) || 0;
    const lines = reviewBudgetProfileModal.lines.map((l: any) => ({
      categoryId: l.categoryId,
      categoryName: l.categoryName,
      annualBudget: Math.round((approvedAmt / reviewBudgetProfileModal.lines.length) / 1000) * 1000,
    }));

    store.reviewBudgetRequest(
      reviewBudgetProfileModal.id,
      'APPROVED',
      approvedAmt,
      budgetApprovalNotes || 'National Treasury Vote 37 appropriation gazetted and confirmed.',
      lines
    );

    setReviewBudgetProfileModal(null);
    setBudgetApprovalNotes('');
    setNotificationMsg(`Budget allocation of ${formatZAR(approvedAmt)} approved for ${reviewBudgetProfileModal.entityName}.`);
    setTimeout(() => setNotificationMsg(null), 4000);
    setTick(t => t + 1);
  };

  // Execute Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    store.createExpenseCategory(
      newCatCode.trim() || `EXP_${Date.now()}`,
      newCatName.trim(),
      newCatDesc.trim() || 'Custom departmental operational expense category.'
    );

    setShowAddCategoryModal(false);
    setNewCatCode('');
    setNewCatName('');
    setNewCatDesc('');
    setNotificationMsg(`New Chart of Accounts category "${newCatName}" created successfully.`);
    setTimeout(() => setNotificationMsg(null), 4000);
    setTick(t => t + 1);
  };

  // If inspecting a specific entity, render the deep-dive entity financial view!
  if (inspectedEntityId) {
    return (
      <div className="space-y-4">
        <EntityFinancialView
          entityId={inspectedEntityId}
          financialYear={selectedYear}
          readOnly={false}
          onBack={() => setInspectedEntityId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Header & Year / Benchmark Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-xs">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Budget &amp; Financial Utilisation Oversight
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  National Vote 37 Appropriation, Quarterly Expenditure Ledger &amp; Fiscal Trajectory Monitoring
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Financial Year Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold">
              <span>FY:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent border-0 font-bold text-slate-800 cursor-pointer focus:outline-hidden"
              >
                <option value="2026/27">2026/27 (Active Cycle)</option>
                <option value="2025/26">2025/26 (Prior Cycle)</option>
                <option value="2024/25">2024/25 (Audited AFS)</option>
              </select>
            </div>

            {/* Quarter Benchmark Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold">
              <span>Benchmark:</span>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value as any)}
                className="bg-transparent border-0 font-bold text-slate-800 cursor-pointer focus:outline-hidden"
              >
                <option value="Q1">Q1 Trajectory (25%)</option>
                <option value="Q2">Q2 Trajectory (50%)</option>
                <option value="Q3">Q3 Trajectory (75%)</option>
                <option value="Q4">Q4 Full Year (100%)</option>
                <option value="FULL_YEAR">Cumulative Full Year</option>
              </select>
            </div>

            <button
              onClick={handleExportAllCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Action Notification Alert */}
        {notificationMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* 6 High-Level Department Financial Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
          {/* Metric 1: Total Requested */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Requested</span>
            <div className="text-base font-black text-slate-900 mt-1">
              {formatZAR(departmentKPIs.totalRequested)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">32 Entities &amp; NPOs</div>
          </div>

          {/* Metric 2: Total Approved Budget */}
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
            <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">Approved Budget</span>
            <div className="text-base font-black text-emerald-950 mt-1">
              {formatZAR(departmentKPIs.totalApproved)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">
              Net Gap: {formatZAR(departmentKPIs.totalFundingGap)}
            </div>
          </div>

          {/* Metric 3: Cumulative Expended to Date */}
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80">
            <span className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider block">Cumulative YTD Spend</span>
            <div className="text-base font-black text-blue-950 mt-1">
              {formatZAR(departmentKPIs.totalActualYTD)}
            </div>
            <div className="text-[10px] text-blue-600 mt-0.5">
              Through {selectedQuarter === 'FULL_YEAR' ? 'Q4' : selectedQuarter}
            </div>
          </div>

          {/* Metric 4: Remaining Appropriation */}
          <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/80">
            <span className="text-[10px] font-semibold text-teal-800 uppercase tracking-wider block">Remaining Balance</span>
            <div className="text-base font-black text-teal-950 mt-1">
              {formatZAR(departmentKPIs.totalRemaining)}
            </div>
            <div className="text-[10px] text-teal-700 mt-0.5">
              {(100 - departmentKPIs.departmentUtilisationPercent).toFixed(1)}% of Budget
            </div>
          </div>

          {/* Metric 5: Department Burn Rate % */}
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider">Burn Rate</span>
              <span className="text-[10px] font-bold text-indigo-600">Target: {departmentKPIs.targetTrajectoryPercent}%</span>
            </div>
            <div className="text-base font-black text-indigo-950 mt-1">
              {departmentKPIs.departmentUtilisationPercent}%
            </div>
            <div className="w-full bg-indigo-200/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{ width: `${Math.min(departmentKPIs.departmentUtilisationPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Metric 6: Risk Watchlist Summary */}
          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200/80">
            <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider block">Fiscal Alert Triggers</span>
            <div className="flex items-center gap-3 mt-1">
              <div>
                <span className="text-base font-black text-rose-900 leading-none">{departmentKPIs.overspendingEntitiesCount}</span>
                <span className="text-[9px] text-rose-600 font-bold ml-1">Overspend</span>
              </div>
              <div className="h-4 w-px bg-rose-200"></div>
              <div>
                <span className="text-base font-black text-amber-900 leading-none">{departmentKPIs.underUtilisingEntitiesCount}</span>
                <span className="text-[9px] text-amber-600 font-bold ml-1">Lagging</span>
              </div>
            </div>
            <div className="text-[10px] text-rose-700 mt-0.5 font-medium">
              {departmentKPIs.pendingSubmissionsCount} returns in review
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'portfolio'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Entities Financial Ledger</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-200 px-1.5 py-0.2 rounded-full">
              {allSummaries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'approvals'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Budget Requests</span>
            {pendingBudgetProfiles.length > 0 && (
              <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                {pendingBudgetProfiles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'reviews'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Quarterly Return Reviews</span>
            {pendingSubmissions.length > 0 && (
              <span className="text-[10px] bg-amber-500 text-amber-950 px-1.5 py-0.2 rounded-full font-bold">
                {pendingSubmissions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'categories'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Chart of Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'support'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Support Subventions</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: PORTFOLIO ENTITIES LEDGER ================= */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by entity name or code..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 font-medium">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All (26 PEs + 6 NPOs)</option>
                  <option value="PUBLIC_ENTITY">Public Entities Only</option>
                  <option value="NPO">Subsidized NPOs Only</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="ALL">All Financial Statuses</option>
                  <option value="ON_TRACK">On Track</option>
                  <option value="OVERSPENT">Overspent</option>
                  <option value="UNDER_UTILISING">Under-Utilising</option>
                  <option value="REQUIRES_REVIEW">Requires Review</option>
                  <option value="MISSING_SUBMISSION">Missing Submission</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master Financial Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Entity &amp; Classification</th>
                    <th className="p-3 text-right">Requested</th>
                    <th className="p-3 text-right">Approved Budget</th>
                    <th className="p-3 text-right">Q1 Actual</th>
                    <th className="p-3 text-right">Q2 Actual</th>
                    <th className="p-3 text-right">Q3 Actual</th>
                    <th className="p-3 text-right">Cumulative YTD</th>
                    <th className="p-3 text-right">Remaining</th>
                    <th className="p-3 text-right">Utilisation</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSummaries.map((summary) => {
                    const badge = getFinancialStatusBadge(summary.financialStatus);
                    const isOver = summary.isOverspent;
                    const q1Spend = summary.quarterlyTimeline.find(t => t.quarter === 'Q1')?.actualExpenditure || 0;
                    const q2Spend = summary.quarterlyTimeline.find(t => t.quarter === 'Q2')?.actualExpenditure || 0;
                    const q3Spend = summary.quarterlyTimeline.find(t => t.quarter === 'Q3')?.actualExpenditure || 0;

                    return (
                      <tr 
                        key={summary.entityId}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => setInspectedEntityId(summary.entityId)}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                                {summary.entityName}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                <span className="font-bold text-slate-700">{summary.shortCode}</span> • {summary.entityType === 'PUBLIC_ENTITY' ? 'PFMA 3A' : 'Cultural NPO'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-right text-slate-500 font-medium">
                          {formatZAR(summary.requestedAmount)}
                        </td>

                        <td className="p-3 text-right font-bold text-emerald-950">
                          {formatZAR(summary.approvedAmount)}
                        </td>

                        <td className="p-3 text-right text-slate-600">
                          {formatZAR(q1Spend)}
                        </td>

                        <td className="p-3 text-right text-slate-600">
                          {formatZAR(q2Spend)}
                        </td>

                        <td className="p-3 text-right text-slate-600">
                          {formatZAR(q3Spend)}
                        </td>

                        <td className="p-3 text-right font-black text-blue-900">
                          {formatZAR(summary.ytdActual)}
                        </td>

                        <td className={`p-3 text-right font-bold ${
                          isOver ? 'text-rose-600' : 'text-slate-800'
                        }`}>
                          {isOver ? `-${formatZAR(summary.overspendAmount)}` : formatZAR(summary.remainingBudget)}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-bold text-slate-900">{summary.utilisationPercent}%</span>
                          </div>
                          <div className="w-16 bg-slate-200 h-1 rounded-full ml-auto mt-1 overflow-hidden">
                            <div 
                              className={`h-full ${isOver ? 'bg-rose-600' : 'bg-emerald-600'}`}
                              style={{ width: `${Math.min(summary.utilisationPercent, 100)}%` }}
                            />
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setInspectedEntityId(summary.entityId)}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            title="Inspect Entity Financial Ledger"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                  <tr>
                    <td className="p-3">Department Aggregate Total</td>
                    <td className="p-3 text-right">{formatZAR(departmentKPIs.totalRequested)}</td>
                    <td className="p-3 text-right text-emerald-950">{formatZAR(departmentKPIs.totalApproved)}</td>
                    <td className="p-3 text-right text-slate-600">
                      {formatZAR(filteredSummaries.reduce((sum, s) => sum + (s.quarterlyTimeline.find(t => t.quarter === 'Q1')?.actualExpenditure || 0), 0))}
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      {formatZAR(filteredSummaries.reduce((sum, s) => sum + (s.quarterlyTimeline.find(t => t.quarter === 'Q2')?.actualExpenditure || 0), 0))}
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      {formatZAR(filteredSummaries.reduce((sum, s) => sum + (s.quarterlyTimeline.find(t => t.quarter === 'Q3')?.actualExpenditure || 0), 0))}
                    </td>
                    <td className="p-3 text-right text-blue-900">{formatZAR(departmentKPIs.totalActualYTD)}</td>
                    <td className="p-3 text-right">{formatZAR(departmentKPIs.totalRemaining)}</td>
                    <td className="p-3 text-right">{departmentKPIs.departmentUtilisationPercent}%</td>
                    <td className="p-3 text-center" colSpan={2}>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {filteredSummaries.length} Records
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: BUDGET REQUESTS QUEUE ================= */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Annual Budget Requests &amp; Vote 37 Subventions ({selectedYear})
              </h3>
              <p className="text-[11px] text-slate-500">
                Entity budget requests submitted for National Treasury Vote 37 appropriation and Department review.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {store.budgetProfiles.filter(p => p.financialYear === selectedYear).map(profile => (
              <div
                key={profile.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-slate-50/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">{profile.entityName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      profile.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : profile.status === 'SUBMITTED'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {profile.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    <span className="font-semibold text-slate-800">Motivation: </span>
                    {profile.justification}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>Requested: {formatZAR(profile.requestedAmount)}</span>
                    <span>Approved: {formatZAR(profile.approvedAmount)}</span>
                    <span>Variance: {formatZAR(profile.fundingGap)}</span>
                    <span>Date: {profile.requestDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {profile.status === 'SUBMITTED' ? (
                    <button
                      onClick={() => {
                        setReviewBudgetProfileModal(profile);
                        setBudgetApprovalAmount(profile.requestedAmount.toString());
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Review &amp; Approve</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setReviewBudgetProfileModal(profile);
                        setBudgetApprovalAmount(profile.approvedAmount.toString());
                      }}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-lg cursor-pointer"
                    >
                      Adjust Allocation
                    </button>
                  )}

                  <button
                    onClick={() => setInspectedEntityId(profile.entityId)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="View Entity Ledger"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: QUARTERLY RETURNS REVIEWS ================= */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Quarterly Expenditure Submissions Awaiting Sign-Off
              </h3>
              <p className="text-[11px] text-slate-500">
                Verified returns certified by public entity Accounting Officers under PFMA Section 38.
              </p>
            </div>
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="font-bold text-slate-700">All quarterly financial returns are reviewed and up to date!</div>
              <p className="text-slate-400 mt-1">No pending submissions require departmental decision at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.map(sub => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">{sub.entityName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        {sub.quarter} SUBMISSION
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-3">
                      <span>Submitted: {sub.submittedAt.split('T')[0]}</span>
                      <span>By: {sub.submittedByName}</span>
                      <span>Lines: {sub.lines.length} categories</span>
                    </div>

                    {sub.accountingOfficerName && (
                      <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Certified PFMA Declaration by {sub.accountingOfficerName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Disbursed Amount</div>
                      <div className="text-base font-black text-slate-900">
                        {formatZAR(sub.totalQuarterlyActual)}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setReviewSubmissionModal(sub);
                        setReviewSubmissionDecision('APPROVE');
                        setReviewSubmissionNotes('');
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Review &amp; Sign Off</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: CHART OF ACCOUNTS ================= */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Standard Chart of Accounts (SCOA) Expense Categories
              </h3>
              <p className="text-[11px] text-slate-500">
                Configurable reporting categories mapped to National Treasury PFMA financial classifications.
              </p>
            </div>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Custom Category</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                <tr>
                  <th className="p-3">Category Code</th>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">PFMA Description</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {store.getExpenseCategories().map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-700">{cat.code}</td>
                    <td className="p-3 font-bold text-slate-900">{cat.name}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{cat.description}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cat.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {cat.active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          store.toggleExpenseCategory(cat.id, !cat.active);
                          setTick(t => t + 1);
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        {cat.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 5: SUPPORT SUBVENTIONS ================= */}
      {activeTab === 'support' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <DsacSupportView
            entities={store.entities}
            onSelectEntity={onSelectEntity}
            onOpenWorkspace={onOpenWorkspace}
          />
        </div>
      )}

      {/* ================= MODAL: REVIEW QUARTERLY RETURN ================= */}
      {reviewSubmissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 sm:p-6 my-8 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Review {reviewSubmissionModal.quarter} Financial Return
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {reviewSubmissionModal.entityName} • {reviewSubmissionModal.financialYear}
                </p>
              </div>
              <button
                onClick={() => setReviewSubmissionModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReviewSubmission} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total Claimed Expenditure:</span>
                  <span className="font-black text-base text-slate-900">
                    {formatZAR(reviewSubmissionModal.totalQuarterlyActual)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Certified by: {reviewSubmissionModal.accountingOfficerName || 'Accounting Officer'}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewSubmissionDecision('APPROVE')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      reviewSubmissionDecision === 'APPROVE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Approve Return
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewSubmissionDecision('REQUEST_CORRECTION')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      reviewSubmissionDecision === 'REQUEST_CORRECTION'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Request Correction
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Oversight Feedback &amp; Verification Note
                </label>
                <textarea
                  value={reviewSubmissionNotes}
                  onChange={(e) => setReviewSubmissionNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="State audit findings or reasons for sign-off..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewSubmissionModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Save Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REVIEW BUDGET REQUEST ================= */}
      {reviewBudgetProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 sm:p-6 my-8 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Approve Annual Budget Allocation ({reviewBudgetProfileModal.financialYear})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {reviewBudgetProfileModal.entityName}
                </p>
              </div>
              <button
                onClick={() => setReviewBudgetProfileModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteBudgetReview} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Requested by Entity:</span>
                <span className="text-base font-black text-slate-900">
                  {formatZAR(reviewBudgetProfileModal.requestedAmount)}
                </span>
                <p className="text-[11px] text-slate-600 mt-1 italic">
                  "{reviewBudgetProfileModal.justification}"
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  National Treasury Approved Annual Amount (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R</span>
                  <input
                    type="number"
                    value={budgetApprovalAmount}
                    onChange={(e) => setBudgetApprovalAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-base font-black text-emerald-950"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Appropriation Commentary &amp; Conditions
                </label>
                <textarea
                  value={budgetApprovalNotes}
                  onChange={(e) => setBudgetApprovalNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="Note Vote 37 gazetting details or conditional grants..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewBudgetProfileModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Approve Vote 37 Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD EXPENSE CATEGORY ================= */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 my-8 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Add Chart of Accounts Category
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Code</label>
                <input
                  type="text"
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value)}
                  placeholder="e.g. EXP_RESEARCH"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Research &amp; Policy Formulation"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Statutory scope of disbursements under this line item..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
