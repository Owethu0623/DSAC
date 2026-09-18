import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Coins, 
  Clock, 
  ChevronRight, 
  Send, 
  CheckCircle2, 
  HelpCircle,
  X,
  FileCheck,
  Building2,
  Lock,
  Unlock,
  AlertOctagon
} from 'lucide-react';
import { PublicEntity } from '../types';
import { store } from '../services/store';

interface StatutoryNonSubmissionPolicyCardProps {
  entity: PublicEntity;
  onOpenSubmitStepper?: () => void;
  isDsacOfficer?: boolean;
  className?: string;
}

export const StatutoryNonSubmissionPolicyCard: React.FC<StatutoryNonSubmissionPolicyCardProps> = ({
  entity,
  onOpenSubmitStepper,
  isDsacOfficer = false,
  className = '',
}) => {
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionDays, setExtensionDays] = useState(7);
  const [extensionReason, setExtensionReason] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const trancheAmount = entity.trancheAmountZAR || Math.round((entity.budgetAllocationZAR || 40000000) / 4);
  const isWithheld = entity.trancheStatus === 'WITHHELD' || (entity.statutoryDefaultStage || 0) >= 2;
  const isUnderReview = entity.trancheStatus === 'UNDER_REVIEW';
  const isConditional = entity.trancheStatus === 'CONDITIONAL_HOLD';
  const isCompliant = !isWithheld && !isConditional && !isUnderReview;

  const handleRequestExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionReason.trim()) return;
    store.requestComplianceExtension(entity.id, extensionDays, extensionReason);
    setShowExtensionModal(false);
    setExtensionReason('');
    setFeedbackMessage(`7-Day Statutory Extension registered for ${entity.shortCode}. Conditional hold applied.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDsacToggleWithholding = () => {
    if (isWithheld) {
      store.liftTrancheWithholding(entity.id, 'Ministerial verification complete. Statutory clearance issued.');
      setFeedbackMessage(`Tranche hold lifted for ${entity.shortCode}. Grant release authorized on BAS.`);
    } else {
      store.enforceTrancheWithholding(entity.id, 'Non-submission of verified Q3 performance return and certified PoE.');
      setFeedbackMessage(`PFMA Section 38(1)(j) Tranche Freeze enforced for ${entity.shortCode}.`);
    }
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className={`rounded-2xl border transition-all ${
      isWithheld 
        ? 'bg-rose-50/80 border-rose-300 shadow-sm' 
        : isUnderReview
        ? 'bg-amber-50/80 border-amber-300 shadow-sm'
        : isConditional
        ? 'bg-blue-50/80 border-blue-300 shadow-sm'
        : 'bg-emerald-50/60 border-emerald-200'
    } p-4 sm:p-5 ${className}`}>

      {feedbackMessage && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between shadow-md">
          <span>{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isWithheld 
              ? 'bg-rose-600 text-white animate-pulse' 
              : isUnderReview
              ? 'bg-amber-500 text-white'
              : isConditional
              ? 'bg-blue-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}>
            {isWithheld ? <AlertOctagon className="w-5 h-5" /> : isCompliant ? <ShieldCheck className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                isWithheld 
                  ? 'bg-rose-200 text-rose-900 border border-rose-300' 
                  : isUnderReview
                  ? 'bg-amber-200 text-amber-900 border border-amber-300'
                  : isConditional
                  ? 'bg-blue-200 text-blue-900 border border-blue-300'
                  : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
              }`}>
                PFMA Section 38(1)(j) Policy
              </span>
              <span className="text-xs font-bold text-slate-800">
                {isWithheld 
                  ? 'Stage 2: Tranche Disbursement Freeze Enforced' 
                  : isUnderReview
                  ? 'Return Submitted • Clearance Under Review'
                  : isConditional
                  ? 'Conditional 7-Day Extension Active'
                  : 'Statutory Compliance Clearance Valid'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              {isWithheld 
                ? (entity.statutoryDefaultReason || 'Quarterly performance return overdue past 30 days. Grant transfer suspended on National Treasury BAS.')
                : isCompliant
                ? 'All required statutory reports and Portfolios of Evidence (PoE) are certified and up to date.'
                : 'Performance verification is actively in progress with the DSAC Monitoring Directorate.'}
            </p>
          </div>
        </div>

        {/* Tranche at stake indicator */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 bg-white/80 px-3 py-1.5 rounded-xl border border-black/5 shadow-2xs">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              {isWithheld ? 'Frozen Tranche Amount' : 'Quarterly Vote 40 Transfer'}
            </div>
            <div className={`text-sm font-black font-mono ${isWithheld ? 'text-rose-700' : 'text-slate-900'}`}>
              R {(trancheAmount / 1_000_000).toFixed(2)}M
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Read Statutory Policy"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4-Stage Statutory Non-Submission Escalation Timeline (Visual & Scannable) */}
      <div className="py-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Statutory Non-Submission Enforcement Ladder (PFMA &amp; Treasury Reg 21.2)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          
          {/* Stage 1 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            (entity.statutoryDefaultStage || 0) >= 1
              ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-medium'
              : 'bg-white/60 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
              <span>Stage 1</span>
              <span>Day 1–7</span>
            </div>
            <div className="font-bold text-slate-900 leading-snug">7-Day Warning</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Automated notice to CEO &amp; CFO</div>
          </div>

          {/* Stage 2 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            (entity.statutoryDefaultStage || 0) >= 2 || isWithheld
              ? 'bg-rose-100 border-rose-400 text-rose-950 font-medium ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white/60 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
              <span className="text-rose-800 font-extrabold">Stage 2 (Active)</span>
              <span>Day 8–15</span>
            </div>
            <div className="font-bold text-rose-900 leading-snug flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>Tranche Freeze</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">PFMA Sec 38(1)(j) BAS hold</div>
          </div>

          {/* Stage 3 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            (entity.statutoryDefaultStage || 0) >= 3
              ? 'bg-rose-100 border-rose-300 text-rose-950 font-medium'
              : 'bg-white/60 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
              <span>Stage 3</span>
              <span>Day 16–30</span>
            </div>
            <div className="font-bold text-slate-900 leading-snug">Board Censure</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Summons to Council &amp; Audit Comm.</div>
          </div>

          {/* Stage 4 */}
          <div className={`p-2.5 rounded-xl border transition-all ${
            (entity.statutoryDefaultStage || 0) >= 4
              ? 'bg-rose-100 border-rose-300 text-rose-950 font-medium'
              : 'bg-white/60 border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
              <span>Stage 4</span>
              <span>Day 30+</span>
            </div>
            <div className="font-bold text-slate-900 leading-snug">AGSA Referral</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Reported to Parliament Portfolio</div>
          </div>

        </div>
      </div>

      {/* Action Bar */}
      <div className="pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
          <FileCheck className="w-4 h-4 text-slate-400" />
          <span>
            {isWithheld
              ? 'Action Required: Submit certified return and evidence to lift tranche freeze.'
              : 'Next Statutory Return Due: 30 April 2026 (Q4 & Annual Draft).'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Entity Actions */}
          {!isDsacOfficer && isWithheld && onOpenSubmitStepper && (
            <button
              type="button"
              onClick={onOpenSubmitStepper}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Return to Lift Hold</span>
            </button>
          )}

          {!isDsacOfficer && !isWithheld && onOpenSubmitStepper && (
            <button
              type="button"
              onClick={onOpenSubmitStepper}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Performance Return</span>
            </button>
          )}

          {!isDsacOfficer && (
            <button
              type="button"
              onClick={() => setShowExtensionModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              Request 7-Day Grace
            </button>
          )}

          {/* DSAC Officer Actions */}
          {isDsacOfficer && (
            <button
              type="button"
              onClick={handleDsacToggleWithholding}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                isWithheld
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
              }`}
            >
              {isWithheld ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isWithheld ? 'Issue Clearance & Lift Hold' : 'Enforce Section 38(1)(j) Freeze'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Policy Terms
          </button>
        </div>
      </div>

      {/* MODAL 1: STATUTORY POLICY DETAILS (Simple, Straightforward, No fluff) */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">PFMA Section 38(1)(j) Statutory Policy</h3>
                  <p className="text-[11px] text-slate-500">National Treasury Transfer Grant Compliance Directive</p>
                </div>
              </div>
              <button onClick={() => setShowPolicyModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">Legal Statutory Mandate:</div>
                <p className="leading-relaxed">
                  Under the <strong>Public Finance Management Act (Act 1 of 1999) Section 38(1)(j)</strong> and <strong>Treasury Regulation 21.2.4</strong>, the Accounting Officer of DSAC is legally forbidden from releasing quarterly grant transfers unless the entity provides verified assurance and certified quarterly performance returns.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900">Consequences of Non-Submission:</div>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                  <li><strong>Disbursement Suspension:</strong> BAS operational transfers (Vote 40) are automatically withheld.</li>
                  <li><strong>Council Notification:</strong> Formal default notices are served to the Chairperson of Council and Audit Committee.</li>
                  <li><strong>Auditor-General Listing:</strong> Unsubmitted returns are classified as non-compliance audit findings in the AGSA annual report.</li>
                  <li><strong>Parliamentary Scrutiny:</strong> Listed in the quarterly report to the Portfolio Committee on Sport, Arts and Culture.</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <div className="font-bold mb-0.5">How to Restore Clearance:</div>
                <div>Upload the verified Performance Return and signed Portfolio of Evidence (PoE). Tranche disbursement is released within 48 hours of DSAC analyst sign-off.</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST 7-DAY EXTENSION */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleRequestExtension} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Request Statutory Grace Extension</h3>
              </div>
              <button type="button" onClick={() => setShowExtensionModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <p className="text-slate-600">
                Entities experiencing unforeseen delays in compiling Portfolios of Evidence may request an official <strong>7-Day Statutory Extension</strong> under Treasury Regulation 21.2.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Extension Period</label>
                <select
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold"
                >
                  <option value={7}>7 Working Days (Standard Grace)</option>
                  <option value={14}>14 Calendar Days (Exceptional Circumstances)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivation / Reason for Delay</label>
                <textarea
                  rows={3}
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="e.g., Awaiting signed regional workshop registers from Eastern Cape cluster..."
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExtensionModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Submit Official Request
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
