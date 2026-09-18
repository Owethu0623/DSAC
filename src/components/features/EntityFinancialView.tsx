import React, { useState, useMemo } from 'react';
import {
  Coins,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Download,
  PlusCircle,
  HelpCircle,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Building2,
  Check,
  X,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { store } from '../../services/store';
import { 
  FinancialQuarter, 
  ExpenseCategory, 
  EntityFinancialSummary,
  EntityBudgetProfile,
  QuarterlyFinancialSubmission
} from '../../types/financial';
import { 
  formatZAR, 
  getQuarterDates, 
  getQuarterName,
  getFinancialStatusBadge,
  generateFinancialExportCSV
} from '../../services/financialService';

interface EntityFinancialViewProps {
  entityId: string;
  financialYear?: string;
  readOnly?: boolean;
  onBack?: () => void;
}

export const EntityFinancialView: React.FC<EntityFinancialViewProps> = ({
  entityId,
  financialYear = '2026/27',
  readOnly = false,
  onBack,
}) => {
  const [, setTick] = useState(0);
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialQuarter | 'FULL_YEAR'>('Q3');
  const [activeTab, setActiveTab] = useState<'matrix' | 'categories' | 'submissions' | 'requests'>('matrix');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showBudgetRequestModal, setShowBudgetRequestModal] = useState(false);
  const [selectedSubmissionForDetails, setSelectedSubmissionForDetails] = useState<QuarterlyFinancialSubmission | null>(null);

  // Submission Form State
  const [formQuarter, setFormQuarter] = useState<FinancialQuarter>('Q3');
  const [formCategoryActuals, setFormCategoryActuals] = useState<{ [categoryId: string]: number }>({});
  const [formSupportingDocId, setFormSupportingDocId] = useState<string>('');
  const [formAffirmation, setFormAffirmation] = useState<boolean>(false);
  const [formSignOffOfficer, setFormSignOffOfficer] = useState<string>(
    store.currentUser?.name || 'Chief Financial Officer'
  );

  // Budget Request Form State
  const [reqAmount, setReqAmount] = useState<string>('24000000');
  const [reqJustification, setReqJustification] = useState<string>('');
  const [reqLines, setReqLines] = useState<{ [categoryId: string]: number }>({});

  const entity = store.entities.find(e => e.id === entityId) || store.entities[0];
  const expenseCategories = store.getExpenseCategories().filter(c => c.active);
  const budgetProfile = store.getBudgetProfileForEntity(entity.id, financialYear);
  const quarterlySubmissions = store.getQuarterlyFinancialSubmissionsForEntity(entity.id, financialYear);

  // Compute live financial summary using the authoritative calculation engine
  const summary: EntityFinancialSummary = useMemo(() => {
    return store.getEntityFinancialSummary(entity.id, financialYear, selectedQuarter);
  }, [entity.id, financialYear, selectedQuarter]);

  const statusBadge = getFinancialStatusBadge(summary.financialStatus);

  // Initialize return form category amounts with planned amounts or existing values
  const handleOpenSubmitModal = (quarter: FinancialQuarter) => {
    setFormQuarter(quarter);
    const existing = quarterlySubmissions.find(s => s.quarter === quarter);
    const initialAmounts: { [categoryId: string]: number } = {};

    expenseCategories.forEach(cat => {
      if (existing) {
        const line = existing.lines.find(l => l.categoryId === cat.id);
        initialAmounts[cat.id] = line ? line.actualAmount : 0;
      } else {
        const profileLine = budgetProfile?.lines.find(l => l.categoryId === cat.id);
        const plannedQuarterly = profileLine ? Math.round(profileLine.annualBudget * 0.25) : 0;
        initialAmounts[cat.id] = plannedQuarterly;
      }
    });

    setFormCategoryActuals(initialAmounts);
    setFormAffirmation(false);
    setShowSubmitModal(true);
  };

  const handleOpenBudgetRequestModal = () => {
    const initialLineAmounts: { [categoryId: string]: number } = {};
    const total = budgetProfile?.requestedAmount || 24000000;
    setReqAmount(total.toString());
    setReqJustification(budgetProfile?.justification || 'Annual statutory allocation request aligned to strategic performance plan.');
    
    expenseCategories.forEach((cat, i) => {
      const line = budgetProfile?.lines.find(l => l.categoryId === cat.id);
      if (line) {
        initialLineAmounts[cat.id] = line.requestedAmount;
      } else {
        // default distribution
        initialLineAmounts[cat.id] = Math.round((total / expenseCategories.length) / 10000) * 10000;
      }
    });
    setReqLines(initialLineAmounts);
    setShowBudgetRequestModal(true);
  };

  // Live calculation for submission modal
  const formTotalQuarterActual = useMemo(() => {
    return Object.values(formCategoryActuals).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [formCategoryActuals]);

  // Projected YTD actual if this submission is saved
  const projectedYtdActual = useMemo(() => {
    const otherQuartersSpend = quarterlySubmissions
      .filter(s => s.quarter !== formQuarter && s.status === 'APPROVED')
      .reduce((sum, s) => sum + s.totalQuarterlyActual, 0);
    return otherQuartersSpend + formTotalQuarterActual;
  }, [quarterlySubmissions, formQuarter, formTotalQuarterActual]);

  const projectedRemaining = summary.approvedAmount - projectedYtdActual;
  const projectedOverspend = projectedRemaining < 0 ? Math.abs(projectedRemaining) : 0;

  // Execute Quarterly Financial Return Submission
  const handleExecuteReturnSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAffirmation) {
      alert('Please check the Accounting Officer statutory declaration checkbox to certify this financial return.');
      return;
    }

    const lines = expenseCategories.map(cat => {
      const actual = Number(formCategoryActuals[cat.id]) || 0;
      const profileLine = budgetProfile?.lines.find(l => l.categoryId === cat.id);
      const planned = profileLine ? Math.round(profileLine.annualBudget * 0.25) : Math.round(actual * 0.9);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        actualAmount: actual,
        plannedAmount: planned,
        budgetLineId: profileLine?.id,
      };
    });

    store.submitQuarterlyFinancialReturn({
      entityId: entity.id,
      entityName: entity.name,
      financialYear,
      quarter: formQuarter,
      totalQuarterlyActual: formTotalQuarterActual,
      lines,
      supportingDocumentIds: formSupportingDocId ? [formSupportingDocId] : [],
      accountingOfficerAffirmation: formAffirmation,
      accountingOfficerName: formSignOffOfficer,
    });

    setShowSubmitModal(false);
    setSuccessMessage(`Quarter ${formQuarter} Financial Return of ${formatZAR(formTotalQuarterActual)} successfully certified and recorded.`);
    setTimeout(() => setSuccessMessage(null), 5000);
    setTick(t => t + 1);
  };

  // Execute Budget Request Submission
  const handleExecuteBudgetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotal = parseFloat(reqAmount) || 0;
    if (parsedTotal <= 0) {
      alert('Please enter a valid requested budget amount.');
      return;
    }

    const lines = expenseCategories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      requestedAmount: Number(reqLines[cat.id]) || 0,
    }));

    store.submitBudgetRequest({
      entityId: entity.id,
      entityName: entity.name,
      financialYear,
      requestedAmount: parsedTotal,
      justification: reqJustification.trim() || 'Annual statutory appropriation motivation for Vote 37.',
      lines,
    });

    setShowBudgetRequestModal(false);
    setSuccessMessage(`Budget Request of ${formatZAR(parsedTotal)} for ${financialYear} submitted for DSAC National approval.`);
    setTimeout(() => setSuccessMessage(null), 5000);
    setTick(t => t + 1);
  };

  // Export CSV
  const handleExportCSV = () => {
    const csv = generateFinancialExportCSV([summary], financialYear);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GovTrack_Financial_${entity.shortCode}_${financialYear.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const quarters: FinancialQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <div className="space-y-5">
      {/* Top Bar with Entity Info & Actions */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors mt-0.5"
                title="Go Back"
              >
                ← Back
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-base shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {entity.name}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {entity.shortCode}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {entity.type === 'PUBLIC_ENTITY' ? 'PFMA Schedule 3A Entity' : 'Subsidized Cultural NPO'} • Financial Utilisation &amp; Quarterly Expenditure Ledger ({financialYear})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {!readOnly && (
              <>
                <button
                  onClick={handleOpenBudgetRequestModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Budget Request</span>
                </button>

                <button
                  onClick={() => handleOpenSubmitModal('Q3')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Submit Quarterly Return</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 6 Executive Financial Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
          {/* Card 1: Requested Budget */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Requested Budget</span>
            <div className="text-base font-black text-slate-800 mt-1">
              {formatZAR(summary.requestedAmount)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Status: {budgetProfile?.status || 'SUBMITTED'}
            </div>
          </div>

          {/* Card 2: Approved Budget */}
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
            <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">Approved Budget</span>
            <div className="text-base font-black text-emerald-900 mt-1">
              {formatZAR(summary.approvedAmount)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">
              Gap: {formatZAR(summary.fundingGap)}
            </div>
          </div>

          {/* Card 3: Cumulative YTD Actual */}
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80">
            <span className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider block">Cumulative YTD Spend</span>
            <div className="text-base font-black text-blue-900 mt-1">
              {formatZAR(summary.ytdActual)}
            </div>
            <div className="text-[10px] text-blue-600 mt-0.5">
              Through {selectedQuarter === 'FULL_YEAR' ? 'Q4' : selectedQuarter}
            </div>
          </div>

          {/* Card 4: Remaining Budget (Explicit Overspend Warning) */}
          <div className={`p-3 rounded-xl border ${
            summary.isOverspent
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-teal-50/70 border-teal-200/80 text-teal-900'
          }`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider block">
              {summary.isOverspent ? 'Budget Overspent' : 'Remaining Budget'}
            </span>
            <div className="text-base font-black mt-1">
              {summary.isOverspent ? `-${formatZAR(summary.overspendAmount)}` : formatZAR(summary.remainingBudget)}
            </div>
            <div className="text-[10px] mt-0.5 font-bold">
              {summary.isOverspent ? 'CRITICAL DEFICIT' : `${(100 - summary.utilisationPercent).toFixed(1)}% Available`}
            </div>
          </div>

          {/* Card 5: Utilisation % */}
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider">Utilisation</span>
              <span className="text-[10px] font-bold text-indigo-600">Benchmark: {summary.targetTrajectoryPercent}%</span>
            </div>
            <div className="text-base font-black text-indigo-950 mt-1">
              {summary.utilisationPercent}%
            </div>
            <div className="w-full bg-indigo-200/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  summary.isOverspent ? 'bg-rose-600' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(summary.utilisationPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Card 6: Variance against Expected Trajectory */}
          <div className={`p-3 rounded-xl border ${
            summary.variancePercent > 15
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : summary.variancePercent < -15
              ? 'bg-orange-50 border-orange-300 text-orange-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider block">Trajectory Variance</span>
            <div className="text-base font-black mt-1">
              {summary.variancePercent > 0 ? `+${summary.variancePercent}%` : `${summary.variancePercent}%`}
            </div>
            <div className="text-[10px] mt-0.5 font-medium">
              {summary.variancePercent > 0 ? 'Ahead of Benchmark' : 'Lagging Benchmark'}
            </div>
          </div>
        </div>

        {/* Section 23: Performance vs Finance Correlation Signal */}
        {summary.performanceFinanceSignal && (
          <div className={`mt-3.5 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            summary.performanceFinanceSignal.status === 'REQUIRES_REVIEW'
              ? 'bg-rose-50/80 border-rose-200 text-rose-900'
              : summary.performanceFinanceSignal.status === 'COMMENDABLE'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${
              summary.performanceFinanceSignal.status === 'REQUIRES_REVIEW' ? 'text-rose-600' : 'text-emerald-600'
            }`} />
            <div>
              <span className="font-bold">PFMA Section 23 Operational Alignment: </span>
              <span>{summary.performanceFinanceSignal.commentary}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            Quarterly Progression Matrix (Q1–Q4)
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            Expenditure by Category
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'submissions'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <span>Verified Return Dossiers</span>
            <span className="text-[10px] bg-slate-300 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
              {quarterlySubmissions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            MTEF Budget Requests &amp; Approval Notes
          </button>
        </div>

        {/* Quarter Filter Selector */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Active Benchmark:</span>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value as any)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-bold text-slate-800 cursor-pointer focus:outline-hidden"
          >
            <option value="Q1">Q1 (25% Trajectory)</option>
            <option value="Q2">Q2 (50% Trajectory)</option>
            <option value="Q3">Q3 (75% Trajectory)</option>
            <option value="Q4">Q4 (100% Full Year)</option>
            <option value="FULL_YEAR">Full Financial Year</option>
          </select>
        </div>
      </div>

      {/* ================= TAB 1: QUARTERLY PROGRESSION MATRIX ================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quarters.map((q, idx) => {
              const qData = summary.quarterlyTimeline.find(t => t.quarter === q);
              const qSubmission = quarterlySubmissions.find(s => s.quarter === q);
              const isPastOrCurrent = q === 'Q1' || q === 'Q2' || q === 'Q3';
              const benchmarkPercent = (idx + 1) * 25;

              return (
                <div
                  key={q}
                  className={`bg-white rounded-xl p-4 border transition-all flex flex-col justify-between shadow-xs ${
                    qData?.isSubmitted
                      ? 'border-slate-200 hover:border-emerald-300'
                      : 'border-dashed border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="font-black text-sm text-slate-900">{getQuarterName(q)}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        qSubmission?.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : qSubmission?.status === 'SUBMITTED'
                          ? 'bg-blue-100 text-blue-800'
                          : qSubmission?.status === 'CORRECTION_REQUIRED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {qSubmission ? qSubmission.status : 'AWAITING'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mb-3">
                      {getQuarterDates(q, financialYear)}
                    </div>

                    {/* Financial Figures */}
                    <div className="space-y-2 text-xs py-2 border-y border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Quarter Actual:</span>
                        <span className="font-bold text-slate-900">
                          {qData ? formatZAR(qData.actualExpenditure) : 'R 0'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Planned Benchmark:</span>
                        <span className="font-medium text-slate-700">
                          {qData ? formatZAR(qData.plannedExpenditure) : 'R 0'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-50 font-bold">
                        <span className="text-slate-700">Cumulative YTD:</span>
                        <span className="text-blue-700">
                          {qData ? formatZAR(qData.cumulativeYtdExpenditure) : 'R 0'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Remaining Budget:</span>
                        <span className={qData?.remainingBudget !== undefined && qData.remainingBudget < 0 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                          {qData ? (qData.remainingBudget < 0 ? `-${formatZAR(Math.abs(qData.remainingBudget))}` : formatZAR(qData.remainingBudget)) : 'R 0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="mt-3 pt-2">
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="text-slate-500">Milestone Utilisation:</span>
                      <span className="font-bold text-slate-800">{qData?.utilisationPercent || 0}%</span>
                    </div>

                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${
                          (qData?.utilisationPercent || 0) > benchmarkPercent ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(qData?.utilisationPercent || 0, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {qSubmission ? (
                        <button
                          onClick={() => setSelectedSubmissionForDetails(qSubmission)}
                          className="w-full py-1.5 text-xs text-slate-700 hover:text-emerald-800 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View Voucher Dossier</span>
                        </button>
                      ) : !readOnly ? (
                        <button
                          onClick={() => handleOpenSubmitModal(q)}
                          className="w-full py-1.5 text-xs text-white bg-emerald-700 hover:bg-emerald-800 font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Submit {q} Return</span>
                        </button>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic text-center w-full">
                          Pending submission
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Realistic Statutory Reporting Guidance Note */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p className="font-bold">PFMA Section 38 Statutory Flow Notice:</p>
              <p>
                Quarterly expenditures are sequential milestones linked to your approved Vote 37 appropriation. Cumulative YTD amounts, remaining balances, and burn rates are calculated authoritatively upon submission of verified expense returns.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: EXPENDITURE BY CATEGORY ================= */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Expenditure by Chart of Accounts Category
              </h3>
              <p className="text-[11px] text-slate-500">
                Category allocation, quarterly actual drawdown, cumulative YTD expenditure and remaining balances.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Expense Category</th>
                  <th className="p-3 text-right">Annual Budget</th>
                  <th className="p-3 text-right">Q1 Actual</th>
                  <th className="p-3 text-right">Q2 Actual</th>
                  <th className="p-3 text-right">Q3 Actual</th>
                  <th className="p-3 text-right">Q4 Actual</th>
                  <th className="p-3 text-right">Cumulative YTD</th>
                  <th className="p-3 text-right">Remaining</th>
                  <th className="p-3 text-right">Utilisation</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.categories.map((catPerf) => {
                  const isCatOver = catPerf.remainingBudget < 0;
                  return (
                    <tr key={catPerf.categoryId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                          <span>{catPerf.categoryName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700">
                        {formatZAR(catPerf.annualBudget)}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {formatZAR(catPerf.q1Actual)}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {formatZAR(catPerf.q2Actual)}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {formatZAR(catPerf.q3Actual)}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {formatZAR(catPerf.q4Actual)}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-900">
                        {formatZAR(catPerf.ytdActual)}
                      </td>
                      <td className={`p-3 text-right font-bold ${
                        isCatOver ? 'text-rose-600' : 'text-slate-800'
                      }`}>
                        {isCatOver ? `-${formatZAR(Math.abs(catPerf.remainingBudget))}` : formatZAR(catPerf.remainingBudget)}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`font-bold ${
                          catPerf.utilisationPercent > 100 ? 'text-rose-600' : 'text-slate-800'
                        }`}>
                          {catPerf.utilisationPercent}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isCatOver
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : catPerf.utilisationPercent > 80
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isCatOver ? 'OVERSPENT' : catPerf.utilisationPercent > 80 ? 'HIGH BURN' : 'ON TRACK'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                <tr>
                  <td className="p-3">Total Expenditure</td>
                  <td className="p-3 text-right">{formatZAR(summary.approvedAmount)}</td>
                  <td className="p-3 text-right">
                    {formatZAR(summary.quarterlyTimeline.find(t => t.quarter === 'Q1')?.actualExpenditure || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatZAR(summary.quarterlyTimeline.find(t => t.quarter === 'Q2')?.actualExpenditure || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatZAR(summary.quarterlyTimeline.find(t => t.quarter === 'Q3')?.actualExpenditure || 0)}
                  </td>
                  <td className="p-3 text-right">
                    {formatZAR(summary.quarterlyTimeline.find(t => t.quarter === 'Q4')?.actualExpenditure || 0)}
                  </td>
                  <td className="p-3 text-right text-blue-900">{formatZAR(summary.ytdActual)}</td>
                  <td className={`p-3 text-right ${summary.isOverspent ? 'text-rose-600' : 'text-slate-900'}`}>
                    {summary.isOverspent ? `-${formatZAR(summary.overspendAmount)}` : formatZAR(summary.remainingBudget)}
                  </td>
                  <td className="p-3 text-right">{summary.utilisationPercent}%</td>
                  <td className="p-3 text-center">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: VERIFIED SUBMISSIONS LIST ================= */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Quarterly Financial Return Submissions
              </h3>
              <p className="text-[11px] text-slate-500">
                Statutory expenditure submissions logged with Accounting Officer PFMA declarations.
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={() => handleOpenSubmitModal('Q3')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Quarterly Return</span>
              </button>
            )}
          </div>

          {quarterlySubmissions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No quarterly expenditure returns logged for {financialYear}.
            </div>
          ) : (
            <div className="space-y-3">
              {quarterlySubmissions.map(sub => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {getQuarterName(sub.quarter)} Expenditure Return
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        sub.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Submitted: {sub.submittedAt ? sub.submittedAt.split('T')[0] : 'Pending'}</span>
                      <span>By: {sub.submittedByName}</span>
                      <span>Lines: {sub.lines.length} categories</span>
                    </div>
                    {sub.accountingOfficerAffirmation && (
                      <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Certified PFMA Section 38 Declaration by {sub.accountingOfficerName || 'Accounting Officer'}</span>
                      </div>
                    )}
                    {sub.reviewNotes && (
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded-md border border-slate-200 mt-1">
                        <span className="font-bold">Oversight Review Note:</span> {sub.reviewNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 sm:text-right shrink-0">
                    <div>
                      <div className="text-xs text-slate-500">Verified Spend</div>
                      <div className="text-base font-black text-emerald-900">
                        {formatZAR(sub.totalQuarterlyActual)}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSubmissionForDetails(sub)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: MTEF REQUESTS & PROFILE ================= */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                MTEF Budget Request Profile ({financialYear})
              </h3>
              <p className="text-[11px] text-slate-500">
                Statutory appropriation request, approved allocation, and National Treasury vote breakdown.
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={handleOpenBudgetRequestModal}
                className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg"
              >
                Amend Budget Request
              </button>
            )}
          </div>

          {budgetProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Requested Amount:</span>
                  <div className="text-base font-black text-slate-900 mt-1">
                    {formatZAR(budgetProfile.requestedAmount)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Date: {budgetProfile.requestDate}</div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-800 font-semibold">Approved Budget:</span>
                  <div className="text-base font-black text-emerald-950 mt-1">
                    {formatZAR(budgetProfile.approvedAmount)}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">Approval Date: {budgetProfile.approvalDate || 'Pending'}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Funding Gap / Variance:</span>
                  <div className="text-base font-black text-slate-900 mt-1">
                    {formatZAR(budgetProfile.fundingGap)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Reviewed By: {budgetProfile.reviewedByName || 'DSAC CFO'}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block mb-1">Entity Justification &amp; Strategic Motivation:</span>
                <p className="text-slate-700 leading-relaxed">{budgetProfile.justification}</p>
              </div>

              {budgetProfile.comments && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                  <span className="font-bold block mb-1">DSAC Reviewer Feedback:</span>
                  <p>{budgetProfile.comments}</p>
                </div>
              )}

              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-900 mb-2">Approved Budget Allocation by Line Item</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-right">Requested</th>
                        <th className="p-2.5 text-right">Approved Annual Budget</th>
                        <th className="p-2.5 text-right">Proportion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {budgetProfile.lines.map(l => (
                        <tr key={l.id}>
                          <td className="p-2.5 font-semibold text-slate-900">{l.categoryName}</td>
                          <td className="p-2.5 text-right text-slate-600">{formatZAR(l.requestedAmount)}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-900">{formatZAR(l.annualBudget)}</td>
                          <td className="p-2.5 text-right text-slate-500">
                            {budgetProfile.approvedAmount > 0
                              ? `${Math.round((l.annualBudget / budgetProfile.approvedAmount) * 100)}%`
                              : '0%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              No budget request profile found for this entity.
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: SUBMIT QUARTERLY FINANCIAL RETURN ================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 my-8 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  <span>Submit {getQuarterName(formQuarter)} Verified Actual Expenditure</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {entity.name} • {financialYear} Financial Return
                </p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReturnSubmission} className="space-y-4 text-xs">
              {/* Quarter Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reporting Quarter</label>
                  <select
                    value={formQuarter}
                    onChange={(e) => handleOpenSubmitModal(e.target.value as FinancialQuarter)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-hidden"
                  >
                    <option value="Q1">Quarter 1 (Apr – Jun)</option>
                    <option value="Q2">Quarter 2 (Jul – Sep)</option>
                    <option value="Q3">Quarter 3 (Oct – Dec)</option>
                    <option value="Q4">Quarter 4 (Jan – Mar)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Certifying Accounting Officer</label>
                  <input
                    type="text"
                    value={formSignOffOfficer}
                    onChange={(e) => setFormSignOffOfficer(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                    placeholder="Full name & title"
                    required
                  />
                </div>
              </div>

              {/* Category-by-Category Actual Entry Table */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">
                    Expenditure Actuals by Category (ZAR)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Enter verified actual disbursements
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {expenseCategories.map(cat => {
                    const currentVal = formCategoryActuals[cat.id] || 0;
                    const profileLine = budgetProfile?.lines.find(l => l.categoryId === cat.id);
                    const plannedQuarterly = profileLine ? Math.round(profileLine.annualBudget * 0.25) : 0;
                    const varPct = plannedQuarterly > 0
                      ? Math.round(((currentVal - plannedQuarterly) / plannedQuarterly) * 100)
                      : 0;

                    return (
                      <div key={cat.id} className="p-2.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/70">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900">{cat.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Planned benchmark: {formatZAR(plannedQuarterly)}
                            {varPct > 10 && (
                              <span className="text-amber-700 font-bold ml-1.5">
                                (+{varPct}% variance)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-40">
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold">R</span>
                            <input
                              type="number"
                              value={formCategoryActuals[cat.id] ?? ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setFormCategoryActuals({
                                  ...formCategoryActuals,
                                  [cat.id]: val,
                                });
                              }}
                              className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-right font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                              placeholder="0"
                              min="0"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Summary Calculation Box */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900">Total {formQuarter} Actual Expenditure:</span>
                  <span className="text-base font-black text-emerald-950">
                    {formatZAR(formTotalQuarterActual)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
                  <span className="text-slate-600">Resulting Projected YTD Spend:</span>
                  <span className="font-bold text-slate-900">
                    {formatZAR(projectedYtdActual)} ({summary.approvedAmount > 0 ? Math.round((projectedYtdActual / summary.approvedAmount) * 100) : 0}% utilisation)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Remaining Annual Balance:</span>
                  <span className={`font-bold ${projectedOverspend > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                    {projectedOverspend > 0 ? `Overspend of ${formatZAR(projectedOverspend)}` : formatZAR(projectedRemaining)}
                  </span>
                </div>
              </div>

              {/* Supporting Evidence Document */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Attached Financial Evidence / Bank Voucher Dossier
                </label>
                <select
                  value={formSupportingDocId}
                  onChange={(e) => setFormSupportingDocId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="">-- Select uploaded Section 38 voucher / bank statement --</option>
                  {store.documents
                    .filter(d => d.entityId === entity.id)
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.fileName || 'PDF'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Statutory PFMA Declaration Checkbox */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="affirmation"
                  checked={formAffirmation}
                  onChange={(e) => setFormAffirmation(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="affirmation" className="text-[11px] text-amber-950 leading-relaxed cursor-pointer">
                  <span className="font-bold">PFMA Section 38(1)(j) Statutory Assurance: </span>
                  I solemnly declare that the expenditures listed above have been disbursed strictly against gazetted Vote 37 programme allocations, are supported by audited source vouchers, and reconcile with the official bank records.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formAffirmation}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Certify &amp; Submit Return</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BUDGET REQUEST SUBMISSION ================= */}
      {showBudgetRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 sm:p-6 my-8 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Submit MTEF Annual Budget Request ({financialYear})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  PFMA Vote 37 Appropriation Motivation
                </p>
              </div>
              <button
                onClick={() => setShowBudgetRequestModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteBudgetRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Total Requested Allocation (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R</span>
                  <input
                    type="number"
                    value={reqAmount}
                    onChange={(e) => setReqAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-base font-black text-slate-900"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Strategic Motivation &amp; Programme Justification
                </label>
                <textarea
                  value={reqJustification}
                  onChange={(e) => setReqJustification(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="Describe programme outputs, staffing requirements, and expected impact..."
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Category Distribution Breakdown
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {expenseCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-lg">
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <div className="w-36 relative">
                        <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">R</span>
                        <input
                          type="number"
                          value={reqLines[cat.id] ?? ''}
                          onChange={(e) => {
                            setReqLines({
                              ...reqLines,
                              [cat.id]: parseFloat(e.target.value) || 0,
                            });
                          }}
                          className="w-full pl-6 pr-2 py-1 bg-white border border-slate-300 rounded text-right font-bold"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBudgetRequestModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Submit Budget Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: INSPECT SUBMISSION DETAILS ================= */}
      {selectedSubmissionForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 sm:p-6 my-8 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {getQuarterName(selectedSubmissionForDetails.quarter)} Expenditure Return Dossier
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted: {selectedSubmissionForDetails.submittedAt ? selectedSubmissionForDetails.submittedAt.split('T')[0] : 'Pending'} • Status: {selectedSubmissionForDetails.status}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmissionForDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-bold">
                <span className="text-emerald-900">Total Verified Expenditure:</span>
                <span className="text-base text-emerald-950 font-black">
                  {formatZAR(selectedSubmissionForDetails.totalQuarterlyActual)}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Planned</th>
                      <th className="p-2.5 text-right">Actual Verified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSubmissionForDetails.lines.map(line => (
                      <tr key={line.id}>
                        <td className="p-2.5 font-semibold text-slate-800">{line.categoryName}</td>
                        <td className="p-2.5 text-right text-slate-500">{formatZAR(line.plannedAmount)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatZAR(line.actualAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedSubmissionForDetails.accountingOfficerName && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                  <div className="font-bold text-slate-900 mb-0.5">Statutory Sign-Off:</div>
                  <div>Certified by: {selectedSubmissionForDetails.accountingOfficerName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Affirmation Timestamp: {selectedSubmissionForDetails.submittedAt}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedSubmissionForDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
