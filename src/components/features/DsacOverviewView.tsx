import React, { useState } from 'react';
import {
  Building2,
  FileCheck,
  AlertTriangle,
  AlertCircle,
  Calendar,
  ArrowRight,
  ChevronDown,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { PublicEntity } from '../../types';

interface DsacOverviewViewProps {
  entities: PublicEntity[];
  reportsOutstanding: number;
  highRiskEntitiesCount: number;
  highRiskEntities: PublicEntity[];
  totalApprovedBudget: number;
  totalTransferredToDate: number;
  remainingDisbursement: number;
  transferRate: number;
  expenditureRate: number;
  formatZAR: (val: number) => string;
  onNavigate: (section: string, subtab?: string) => void;
  onInvestigateEntity?: (entityId: string) => void;
  onOpenDemo: () => void;
}

export const DsacOverviewView: React.FC<DsacOverviewViewProps> = ({
  entities,
  reportsOutstanding,
  highRiskEntitiesCount,
  highRiskEntities,
  totalApprovedBudget,
  totalTransferredToDate,
  remainingDisbursement,
  transferRate,
  expenditureRate,
  formatZAR,
  onNavigate,
  onInvestigateEntity,
  onOpenDemo
}) => {
  const [showPulseExplanation, setShowPulseExplanation] = useState(false);
  const [selectedYear, setSelectedYear] = useState('This Financial Year');

  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 w-full max-w-7xl mx-auto">
      
      {/* 4-STAGE STATUTORY WORKFLOW BANNER: REPORT → MONITOR → IDENTIFY → ACT */}
      <div className="bg-gradient-to-r from-[#044332] via-[#06533f] to-[#044332] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-emerald-700/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                Statutory Operating Cycle
              </span>
              <span className="text-xs text-emerald-200/80">Oversight Pipeline</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-1">
              The DSAC REPO Oversight Lifecycle
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all cursor-pointer shadow-xs hover:scale-102"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Run Guided Demo Scenario</span>
            </button>
          </div>
        </div>

        {/* 4 Connected Stages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Stage 1: REPORT */}
          <div
            onClick={() => onNavigate('reports')}
            className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-black flex items-center justify-center border border-emerald-400/30">1</span>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Submissions</span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-black text-white group-hover:text-emerald-200 flex items-center gap-1">
                <span>REPORT</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-1 leading-snug">
                Entities submit quarterly performance, expenditure &amp; verification evidence.
              </p>
            </div>
          </div>

          {/* Stage 2: MONITOR */}
          <div
            onClick={() => onNavigate('performance')}
            className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-black flex items-center justify-center border border-emerald-400/30">2</span>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Real-Time</span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-black text-white group-hover:text-emerald-200 flex items-center gap-1">
                <span>MONITOR</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-1 leading-snug">
                Live tracking of milestone delivery rates and Vote 40 budget utilisation.
              </p>
            </div>
          </div>

          {/* Stage 3: IDENTIFY */}
          <div
            onClick={() => onNavigate('risks')}
            className="bg-amber-500/20 hover:bg-amber-500/25 border border-amber-400/30 rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center">3</span>
              <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">Early Warning</span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-black text-white group-hover:text-amber-200 flex items-center gap-1">
                <span>IDENTIFY</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-1 leading-snug">
                System flags delivery variances, overdue filings, and PFMA governance risks.
              </p>
            </div>
          </div>

          {/* Stage 4: ACT */}
          <div
            onClick={() => onNavigate('tasks')}
            className="bg-rose-500/20 hover:bg-rose-500/25 border border-rose-400/30 rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.01] group"
          >
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-rose-400 text-white text-xs font-black flex items-center justify-center">4</span>
              <span className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">Resolution</span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-black text-white group-hover:text-rose-200 flex items-center gap-1">
                <span>ACT</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-emerald-100/80 mt-1 leading-snug">
                Issue formal directives, remedial tasks, and enforce Section 38 compliance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 1: TOP 4 SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Portfolio Institutions */}
        <div 
          onClick={() => onNavigate('entities')}
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              Portfolio Directory
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">32</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Portfolio Institutions</div>
            <div className="text-[11px] text-slate-500">26 Public Entities · 6 Subsidized NPOs</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-800">
            <span>View All Institutions</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Reports Pending Review */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Review Required
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">{reportsOutstanding}</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Reports Pending Review</div>
            <div className="text-[11px] text-slate-500">Awaiting department clearance</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:text-amber-800">
            <span>Review Reports</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Entities Requiring Attention */}
        <div 
          onClick={() => onNavigate('risks')}
          className="bg-white border-2 border-rose-200/90 rounded-xl p-4 flex flex-col justify-between hover:border-rose-300 hover:shadow-xs cursor-pointer transition-all group bg-rose-50/20"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
              Priority Watchlist
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-rose-700 tracking-tight leading-none">{highRiskEntitiesCount}</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Entities Requiring Attention</div>
            <div className="text-[11px] text-rose-700 font-medium">BSA, NAC &amp; PACOFS flagged</div>
          </div>
          <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-xs font-bold text-rose-700 group-hover:text-rose-800">
            <span>Inspect Attention Area</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Upcoming Statutory Deadlines */}
        <div 
          onClick={() => onNavigate('compliance')}
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              PFMA Cutoff
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">31 Jan 2026</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Upcoming Deadline</div>
            <div className="text-[11px] text-slate-500">Q3 Quarterly Review Clearance</div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:text-blue-800">
            <span>Compliance Calendar</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* ROW 2: ATTENTION REQUIRED (Most prominent executive decision area) */}
      <div className="bg-white border-2 border-rose-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Attention Required</h2>
                <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                  3 Immediate Items
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Critical deviations identified by system validation requiring departmental intervention
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('risks')}
            className="text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View Full Risk Radar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Prominent Attention Cards with Progressive Disclosure */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Entity 1: Boxing South Africa */}
          <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/30 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Public Entity</div>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">Boxing South Africa (BSA)</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0">
                  At Risk
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-rose-900 block">Issue:</span>
                  <p className="text-slate-800 font-medium leading-snug">
                    Performance below expected progress (40% achieved vs 75% target milestone).
                  </p>
                </div>

                <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Why:</span>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    Only 4 of 10 sanctioned tournaments delivered due to promoter licensing disputes; unresolved AGSA governance finding.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-200/60 flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => onInvestigateEntity ? onInvestigateEntity('ent-bsa') : onNavigate('entities')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
              >
                Investigate
              </button>
              <button
                onClick={() => onNavigate('tasks')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                Issue Directive
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Review Report
              </button>
            </div>
          </div>

          {/* Entity 2: National Arts Council */}
          <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/30 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Public Entity</div>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">National Arts Council (NAC)</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                  Requires Review
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-amber-900 block">Issue:</span>
                  <p className="text-slate-800 font-medium leading-snug">
                    Financial utilisation differs from reported performance milestones.
                  </p>
                </div>

                <div className="bg-white/80 p-2 rounded-lg border border-amber-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Why:</span>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    Grant disbursements released at 82% pacing while project verification dossiers sit at 58% completion.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => onInvestigateEntity ? onInvestigateEntity('ent-nac') : onNavigate('entities')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
              >
                Investigate
              </button>
              <button
                onClick={() => onNavigate('tasks')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
              >
                Issue Directive
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Review Report
              </button>
            </div>
          </div>

          {/* Entity 3: Performing Arts Centre of the Free State */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Public Entity</div>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">PACOFS (Free State)</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0">
                  Overdue Action
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-900 block">Issue:</span>
                  <p className="text-slate-800 font-medium leading-snug">
                    3 unresolved AGSA audit findings outstanding &gt;90 days.
                  </p>
                </div>

                <div className="bg-white/80 p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Why:</span>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    Theatre sound and lighting assets valuation reconciliation delayed past statutory audit timeline.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => onInvestigateEntity ? onInvestigateEntity('ent-pacofs') : onNavigate('entities')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
              >
                Investigate
              </button>
              <button
                onClick={() => onNavigate('tasks')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer"
              >
                Issue Directive
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: PERFORMANCE PULSE & FINANCIAL OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Column: Performance Pulse (Simplified Decision Support) (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">Performance Pulse</h2>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                    Quarterly
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Real-time status of portfolio milestone delivery</p>
              </div>
            </div>

            {/* Decision-Support Status Banner */}
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Portfolio Status</span>
                <div className="text-lg font-black text-amber-950 mt-0.5">
                  REQUIRES ATTENTION
                </div>
                <div className="text-xs text-amber-900 mt-0.5">
                  3 institutions flagged for target or compliance deviations
                </div>
              </div>
              <button
                onClick={() => setShowPulseExplanation(!showPulseExplanation)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-amber-900 border border-amber-300 shadow-2xs hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>{showPulseExplanation ? 'Hide' : 'Why?'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPulseExplanation ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Explanatory "Why?" Dropdown Panel */}
            {showPulseExplanation && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-fadeIn">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Diagnostic Breakdown:</span>
                </div>
                <ul className="space-y-1.5 text-slate-700 pl-4 list-disc text-[11px]">
                  <li><strong className="text-slate-900">2 Key Targets Below Expected Pace:</strong> Boxing SA tournament sanctioning (40%) and Ubuntu Arts touring programme (41%).</li>
                  <li><strong className="text-slate-900">1 Quarterly Report Overdue:</strong> Boxing SA Q3 governance submission (18 days overdue).</li>
                  <li><strong className="text-slate-900">3 Unresolved AGSA Audit Findings:</strong> PACOFS theatre fixed asset register reconciliation outstanding &gt;90 days.</li>
                </ul>
              </div>
            )}

            {/* Delivery Progress Metric */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700">Portfolio Target Delivery Rate</span>
                <span className="font-black text-slate-900 font-mono">64.2%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: '64.2%' }} className="h-full bg-emerald-500 transition-all" />
                <div style={{ width: '18%' }} className="h-full bg-amber-400 transition-all" />
                <div style={{ width: '17.8%' }} className="h-full bg-rose-500 transition-all" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span>Achieved (64.2%)</span>
                <span>In Progress (18.0%)</span>
                <span>Lagging (17.8%)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('performance')}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Detailed Performance Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Financial Overview (Answers the 4 Simple Questions) (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">Financial Overview</h2>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                    Vote 40
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Approved budget, transfers and expenditure status</p>
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 cursor-pointer focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
              >
                <option>This Financial Year</option>
                <option>2024/2025</option>
              </select>
            </div>

            {/* 4 Clear Financial Questions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {/* Q1: How much approved? */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1. Approved</div>
                <div className="text-lg font-black text-slate-900 mt-1">{formatZAR(totalApprovedBudget)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Parliamentary Vote 40</div>
              </div>

              {/* Q2: How much spent? */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">2. Transferred</div>
                <div className="text-lg font-black text-indigo-950 mt-1">{formatZAR(totalTransferredToDate)}</div>
                <div className="text-[10px] text-indigo-700 font-bold mt-0.5">{transferRate.toFixed(1)}% of budget</div>
              </div>

              {/* Q3: How much remains? */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">3. Remaining</div>
                <div className="text-lg font-black text-slate-900 mt-1">{formatZAR(remainingDisbursement)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Q4 Disbursal Balance</div>
              </div>

              {/* Q4: Progressing as expected? */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">4. Pacing</div>
                <div className="text-lg font-black text-emerald-950 mt-1">{expenditureRate.toFixed(1)}%</div>
                <div className="text-[10px] text-emerald-800 font-bold mt-0.5">On Track for Q3</div>
              </div>
            </div>

            {/* Financial Attention Callout */}
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950">
                <strong className="font-bold">Financial Attention:</strong> Spending is progressing faster than reported milestone achievements in 2 entities (NAC &amp; SAHRA). Review is recommended prior to releasing remaining Q4 subvention tranches.
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Authoritative PFMA Section 38 audit verification</span>
            <button
              onClick={() => onNavigate('financials')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Financial Monitoring</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ROW 4: EXECUTIVE INSIGHTS (AI PERFORMANCE ANALYST) & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Column: AI Performance Analyst Insights (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-teal-800/60">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Executive Insights</h3>
                  <p className="text-[11px] text-teal-200/70">AI Performance Analyst</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('ai')}
                className="text-xs text-teal-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Open Analyst</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pre-computed System Diagnostic Highlight */}
            <div className="mt-4 p-3.5 rounded-xl bg-teal-950/60 border border-teal-800/40 text-xs text-teal-100 leading-relaxed">
              "Portfolio milestone attainment is healthy across 29 of 32 institutions. Early departmental intervention is recommended for <strong className="text-white">Boxing South Africa</strong> and <strong className="text-white">National Arts Council</strong> to prevent year-end subvention retentions."
            </div>

            {/* Clickable Question Chips */}
            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block">Suggested Inquiries:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onNavigate('ai')}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer text-left"
                >
                  Which entities require immediate attention?
                </button>
                <button
                  onClick={() => onNavigate('ai')}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer text-left"
                >
                  Why is Boxing SA at risk?
                </button>
                <button
                  onClick={() => onNavigate('ai')}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer text-left"
                >
                  Are grant disbursements progressing on schedule?
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-teal-800/60 text-[11px] text-teal-300/80 flex items-center justify-between">
            <span>Continuous statutory data correlation</span>
            <span className="text-teal-400 font-bold">Updated live</span>
          </div>
        </div>

        {/* Right Column: Recent Activity & Directives (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Recent Statutory Activity</h3>
                <p className="text-[11px] text-slate-500">Submissions, clearances, and directives</p>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Action Centre</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {/* Item 1 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">Artscape Theatre Centre</span>
                    <span className="text-[10px] text-slate-400">1 hour ago</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">Q3 Performance and Expenditure report reviewed and cleared by oversight analyst.</p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">Boxing South Africa</span>
                    <span className="text-[10px] text-rose-600 font-bold">Directive Issued</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">Ministerial corrective directive #DIR-2026-08 issued regarding tournament sanctioning compliance.</p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">National Film &amp; Video Foundation</span>
                    <span className="text-[10px] text-slate-400">Yesterday</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">Film development tranche 2 grant clearance approved following beneficiary dossier verification.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">All actions recorded in immutable PFMA audit trail</span>
            <button
              onClick={() => onNavigate('audit')}
              className="text-emerald-700 hover:text-emerald-800 font-bold text-xs cursor-pointer"
            >
              View Audit Trail →
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
