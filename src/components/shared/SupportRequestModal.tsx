import React, { useState } from 'react';
import { X, HandCoins, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SupportRequestCategory } from '../../types';
import { store } from '../../services/store';

interface SupportRequestModalProps {
  entityId: string;
  entityName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SupportRequestModal: React.FC<SupportRequestModalProps> = ({
  entityId,
  entityName,
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<SupportRequestCategory>('ADDITIONAL_FUNDING');
  const [title, setTitle] = useState('');
  const [motivation, setMotivation] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [amountRequested, setAmountRequested] = useState<number | ''>('');
  const [linkedProgramme, setLinkedProgramme] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const categoryOptions: { value: SupportRequestCategory; label: string; desc: string }[] = [
    {
      value: 'ADDITIONAL_FUNDING',
      label: 'Additional Funding',
      desc: 'Supplementary grant or shortfall relief for unexpected project demands',
    },
    {
      value: 'BUDGET_REQUEST',
      label: 'Budget Request',
      desc: 'Formal request for baseline adjustments or advance tranche release',
    },
    {
      value: 'TECHNICAL_SUPPORT',
      label: 'Technical Support',
      desc: 'Assistance with reporting systems, PoE registers, or IT integration',
    },
    {
      value: 'GOVERNANCE_ASSISTANCE',
      label: 'Governance Assistance',
      desc: 'PFMA Section 38 compliance, internal audit advice, or charter reviews',
    },
    {
      value: 'PROGRAMME_SUPPORT',
      label: 'Programme Support',
      desc: 'Inter-institutional collaboration, national venue access, or artist clearances',
    },
    {
      value: 'CAPACITY_BUILDING',
      label: 'Capacity Building',
      desc: 'Financial management training, staff skills development, or mentorship',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !motivation.trim()) return;

    setIsSubmitting(true);
    try {
      store.submitSupportRequest({
        entityId,
        entityName,
        category,
        title: title.trim(),
        motivation: motivation.trim(),
        expectedOutcome: expectedOutcome.trim() || 'Enhanced compliance and program delivery',
        amountRequested: typeof amountRequested === 'number' && amountRequested > 0 ? amountRequested : undefined,
        linkedProgramme: linkedProgramme.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error submitting support request', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <HandCoins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Submit Support or Budget Request</h3>
              <p className="text-[11px] text-slate-500">{entityName} • DSAC Oversight Directorate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Request Category (PFMA Support Register)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categoryOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setCategory(opt.value)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    category === opt.value
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Request Title / Subject
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Funding request for Community Outreach Workshops"
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Amount and Linked Programme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Requested Amount in ZAR (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={amountRequested}
                onChange={(e) => setAmountRequested(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="e.g. 250000"
                className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Linked Programme / Strategic Objective (Optional)
              </label>
              <input
                type="text"
                value={linkedProgramme}
                onChange={(e) => setLinkedProgramme(e.target.value)}
                placeholder="e.g. Programme 3: Arts & Culture Promotion"
                className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Motivation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivation &amp; Detailed Explanation
            </label>
            <textarea
              required
              rows={3}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Provide context, justification, and background on why this support is requested..."
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Expected Outcome */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expected Strategic Outcome &amp; Impact
            </label>
            <textarea
              rows={2}
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              placeholder="Describe what will be achieved once this support or funding is approved..."
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Requests are logged in the National Register, assigned a formal tracking reference, and routed directly to the DSAC Directorate for review.
            </span>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Submitted!</span>
                </>
              ) : isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <span>Submit Request</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
