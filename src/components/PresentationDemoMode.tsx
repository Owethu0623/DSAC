import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  X,
  FileText,
  Target,
  ShieldAlert,
  Send,
  ListTodo,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { store } from '../services/store';

export interface PresentationDemoModeProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection: (section: string) => void;
  onNavigateToEntity?: (entityId: string) => void;
}

interface DemoStep {
  number: number;
  stage: 'REPORT' | 'MONITOR' | 'IDENTIFY' | 'ACT';
  stageColor: string;
  title: string;
  shortDesc: string;
  talkingPoints: string[];
  actionLabel: string;
  targetSection: string;
  targetEntityId?: string;
  demonstrationNotes: string;
}

export const PresentationDemoMode: React.FC<PresentationDemoModeProps> = ({
  isOpen,
  onClose,
  onNavigateToSection,
  onNavigateToEntity,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [hasTriggeredAction, setHasTriggeredAction] = useState<boolean>(false);

  const steps: DemoStep[] = [
    {
      number: 1,
      stage: 'REPORT',
      stageColor: 'bg-blue-600 text-white',
      title: 'Public Entity Submits Quarterly Report',
      shortDesc: 'Entity officers upload performance figures, financial actuals, and PoE.',
      talkingPoints: [
        'All 26 Public Entities and 6 NPOs submit quarterly reports through their dedicated portal.',
        'Required proof of expenditure (PoE), bank statements, and target registers are validated.',
        'Example: Boxing South Africa (BSA) has submitted its statutory Q3 figures.',
      ],
      actionLabel: 'View Reporting Submissions',
      targetSection: 'reports',
      demonstrationNotes: 'Shows the standardized digital reporting pipeline replacing email attachments.',
    },
    {
      number: 2,
      stage: 'MONITOR',
      stageColor: 'bg-teal-600 text-white',
      title: 'DSAC National Oversight Ingests Data',
      shortDesc: 'Authoritative aggregation computes performance, finances, and deadlines.',
      talkingPoints: [
        'National headquarters receives submissions in real-time.',
        'PFMA Section 38 calculations aggregate total portfolio delivery (64% achieved, R3.1B spent).',
        'Executive Pulse continuously tracks 32 institutions against annual targets.',
      ],
      actionLabel: 'Inspect Executive Dashboard',
      targetSection: 'overview',
      demonstrationNotes: 'All 32 entities are aggregated in one single source of truth.',
    },
    {
      number: 3,
      stage: 'IDENTIFY',
      stageColor: 'bg-amber-600 text-white',
      title: 'Performance Falls Below Expected Progress',
      shortDesc: 'GovTrack flags an institution failing to achieve quarterly milestone.',
      talkingPoints: [
        'Boxing South Africa (BSA) achieves only 40% on sanctioned tournament compliance.',
        'National benchmark requires 75% progress by Q3.',
        'Target deviation is automatically highlighted without manual spreadsheet reviews.',
      ],
      actionLabel: 'Inspect BSA Target Progress',
      targetSection: 'performance',
      targetEntityId: 'ent-bsa',
      demonstrationNotes: 'Manager does not need to search for the problem — system surfaces it instantly.',
    },
    {
      number: 4,
      stage: 'IDENTIFY',
      stageColor: 'bg-rose-600 text-white',
      title: 'Early Warning Risk Detection Triggers',
      shortDesc: 'Multi-factor risk engine classifies BSA as High Risk requiring intervention.',
      talkingPoints: [
        'Risk radar triggers: tournament compliance lag + AGSA audit findings.',
        'Status changes from "On Track" to "Requires Attention (High Risk)".',
        'Alert is broadcast on the national Department oversight radar.',
      ],
      actionLabel: 'Review Early Warning Radar',
      targetSection: 'risks',
      targetEntityId: 'ent-bsa',
      demonstrationNotes: 'Deterministic risk engine flags hazards before parliamentary or audit crises.',
    },
    {
      number: 5,
      stage: 'IDENTIFY',
      stageColor: 'bg-purple-600 text-white',
      title: 'The System Explains "WHY"',
      shortDesc: 'Transparent diagnostic explains exact variance: Actual 40% vs Target 100%.',
      talkingPoints: [
        'Explains why BSA requires attention in plain language, not black-box AI jargon.',
        'Factor 1: Sanctioned tournaments 4/10 delivered (40% vs 75% expected).',
        'Factor 2: Unresolved AGSA governance note on promoter licensing revenue.',
      ],
      actionLabel: 'Ask AI Performance Analyst',
      targetSection: 'ai',
      demonstrationNotes: 'Provides immediate executive explainability for Director-General briefings.',
    },
    {
      number: 6,
      stage: 'ACT',
      stageColor: 'bg-emerald-700 text-white',
      title: 'DSAC Issues Formal Corrective Action Directive',
      shortDesc: 'Department issues binding PFMA directive with assigned owner & due date.',
      talkingPoints: [
        'Chief Director issues statutory directive to Boxing SA CEO.',
        'Directive: "Submit Remedial Tournament Sanctioning & Governance Plan".',
        'Assignee: BSA Accounting Authority • Due Date: 14 Days • Tracked formally.',
      ],
      actionLabel: 'Issue Demo Directive Now',
      targetSection: 'tasks',
      demonstrationNotes: 'Moves seamlessly from discovery to action in one unified platform.',
    },
    {
      number: 7,
      stage: 'ACT',
      stageColor: 'bg-emerald-800 text-white',
      title: 'Action Tracked to Resolution in Action Centre',
      shortDesc: 'Directive is monitored until entity completes remedial action with proof.',
      talkingPoints: [
        'Directive logged in the Action Centre with live countdown.',
        'Entity receives instant notification and uploads remedial action plan.',
        'Audit trail records the full intervention history for parliamentary accountability.',
      ],
      actionLabel: 'View Action Centre',
      targetSection: 'tasks',
      demonstrationNotes: 'Proves the complete loop: REPORT → MONITOR → IDENTIFY → ACT.',
    },
  ];

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];

  const handleExecuteStep = () => {
    // If step 6, optionally create the demonstration directive in the store
    if (currentStep.number === 6 && !hasTriggeredAction) {
      const bsa = store.entities.find(e => e.id === 'ent-bsa') || store.entities[0];
      store.createTask({
        entityId: bsa.id,
        entityName: bsa.name,
        title: 'Statutory Directive: Remedial Tournament Sanctioning & Financial Recovery Plan',
        description: 'Under Section 38 of PFMA: Submit remedial plan for sanctioned tournament compliance (currently 40%) and AGSA licensing revenue reconciliation within 14 calendar days.',
        assignedToName: 'Chief Executive Officer (BSA)',
        priority: 'CRITICAL',
        status: 'OPEN',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        direction: 'DSAC_TO_ENTITY',
      });
      setHasTriggeredAction(true);
    }

    if (currentStep.targetEntityId && onNavigateToEntity) {
      onNavigateToEntity(currentStep.targetEntityId);
    }
    onNavigateToSection(currentStep.targetSection);
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = steps[nextIdx];
      onNavigateToSection(nextStep.targetSection);
      if (nextStep.targetEntityId && onNavigateToEntity) {
        onNavigateToEntity(nextStep.targetEntityId);
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevStep = steps[prevIdx];
      onNavigateToSection(prevStep.targetSection);
      if (prevStep.targetEntityId && onNavigateToEntity) {
        onNavigateToEntity(prevStep.targetEntityId);
      }
    }
  };

  const handleJumpToStep = (index: number) => {
    setCurrentStepIndex(index);
    const step = steps[index];
    onNavigateToSection(step.targetSection);
    if (step.targetEntityId && onNavigateToEntity) {
      onNavigateToEntity(step.targetEntityId);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 sm:right-6 left-3 sm:left-auto z-50 max-w-2xl w-full select-none animate-fadeIn">
      {/* Minimized Pill */}
      {isMinimized ? (
        <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-emerald-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-xs">Demo Mode Active: Step {currentStep.number} of 7 ({currentStep.stage})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(false)}
              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-[11px] font-bold cursor-pointer"
            >
              Expand Guide
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              title="Close Demo Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Guided Controller */
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border-2 border-emerald-500/60 overflow-hidden">
          {/* Top Header Bar */}
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <span>GovTrack SA — Interactive Presentation Scenario</span>
                  <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.2 rounded-full font-mono border border-emerald-700/50">
                    Live Demo
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Scenario: "An Entity is Falling Behind" (Report → Monitor → Identify → Act)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-md cursor-pointer"
              >
                Minimize
              </button>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md cursor-pointer"
                title="Exit Demo Mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper Navigation Tracker */}
          <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between gap-1 overflow-x-auto">
            {steps.map((s, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isPassed = idx < currentStepIndex;
              return (
                <button
                  key={s.number}
                  onClick={() => handleJumpToStep(idx)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/50 ring-1 ring-emerald-500/30'
                      : isPassed
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={s.title}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isCurrent ? 'bg-emerald-500 text-slate-950' : isPassed ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {s.number}
                  </span>
                  <span className="text-[10px] hidden sm:inline uppercase tracking-wider font-semibold">
                    {s.stage}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Step Body */}
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${currentStep.stageColor}`}>
                    Stage: {currentStep.stage}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    Step {currentStep.number} of 7
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {currentStep.title}
                </h3>
                <p className="text-xs text-emerald-300 font-medium mt-0.5">
                  {currentStep.shortDesc}
                </p>
              </div>

              <button
                onClick={handleExecuteStep}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 hover:scale-102"
              >
                <span>{currentStep.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Presenter Talking Points Card */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                What to say to Judges / Audience:
              </div>
              <ul className="space-y-1 text-xs text-slate-300">
                {currentStep.talkingPoints.map((pt, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="text-[10px] text-slate-400 italic">
                {currentStep.demonstrationNotes}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentStepIndex === 0}
                  onClick={handlePrev}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  disabled={currentStepIndex === steps.length - 1}
                  onClick={handleNext}
                  className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
