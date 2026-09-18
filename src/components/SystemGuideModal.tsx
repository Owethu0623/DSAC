import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  BookOpen, 
  Building2, 
  FileText, 
  Target, 
  Coins, 
  AlertTriangle, 
  ShieldCheck, 
  FileCheck, 
  HelpCircle as QuestionIcon, 
  FolderLock, 
  Sparkles, 
  History, 
  ArrowRight, 
  CheckCircle2, 
  Compass, 
  Lightbulb,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface SystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection: (sectionId: string) => void;
}

export const SystemGuideModal: React.FC<SystemGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSection
}) => {
  const [activeTab, setActiveTab] = useState<'how-it-works' | 'sidebar-map' | 'glossary' | 'shortcuts'>('how-it-works');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fadeIn select-none">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#044332] text-white flex items-center justify-between border-b border-emerald-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Beginner Friendly Guide
                </span>
                <span className="text-xs text-emerald-300/80 font-medium">GovTrack SA</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                How to Use This System
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-emerald-300 hover:text-white hover:bg-emerald-800/60 rounded-xl transition-colors cursor-pointer"
            title="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-2.5 sm:px-5 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('how-it-works')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'how-it-works'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>1. How It Works (4 Steps)</span>
          </button>

          <button
            onClick={() => setActiveTab('sidebar-map')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'sidebar-map'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Sidebar &amp; Menu Map</span>
          </button>

          <button
            onClick={() => setActiveTab('glossary')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'glossary'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>3. Plain-English Glossary</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'shortcuts'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>4. "I Want To..." Shortcuts</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-800">
          
          {/* TAB 1: HOW IT WORKS */}
          {activeTab === 'how-it-works' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-950 leading-relaxed">
                <div className="font-black text-sm text-emerald-900 mb-1 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-emerald-700" />
                  <span>What is this system in simple words?</span>
                </div>
                The Department of Sport, Arts and Culture (DSAC) gives money each year to <strong>32 national institutions</strong> (theatres, museums, sports councils, and arts foundations). This system is where the Department <strong>tracks what each institution does</strong>, checks if they achieved their goals, verifies their spending, and steps in early if an organization falls behind.
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">
                  The 4 Steps of the System:
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Step 1 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">1</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Every 3 Months</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">Institutions Submit Reports</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Each organization uploads what they completed (how many theatre shows, festivals, sports bouts, or exhibits) plus documents proving it actually happened.
                    </p>
                    <button
                      onClick={() => { onNavigateToSection('reports'); onClose(); }}
                      className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>See Submitted Reports</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center">2</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Automatic Check</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">System Monitors Progress</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      The system calculates how close they are to their yearly goals and compares how much money they spent with their real results on the ground.
                    </p>
                    <button
                      onClick={() => { onNavigateToSection('performance'); onClose(); }}
                      className="mt-3 text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Check Delivery Rates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-all shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">3</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Early Warning</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">System Spots Problems Early</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      If an entity is 15+ days late, spends money without proof, or misses targets, the system automatically flags them under "Priority Attention".
                    </p>
                    <button
                      onClick={() => { onNavigateToSection('risks'); onClose(); }}
                      className="mt-3 text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Risk Radar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Step 4 */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-rose-300 transition-all shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center">4</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Department Action</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">Officials Resolve &amp; Direct</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Department managers clear good reports, issue written directives to fix issues, or hold back future payouts until compliance is satisfied.
                    </p>
                    <button
                      onClick={() => { onNavigateToSection('tasks'); onClose(); }}
                      className="mt-3 text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Action Centre &amp; Directives</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIDEBAR & MENU MAP */}
          {activeTab === 'sidebar-map' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Here is a simple explanation of every button on the left sidebar so you know exactly where to click:
              </p>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'overview',
                    name: 'Dashboard Overview',
                    icon: Building2,
                    purpose: 'The executive home screen. Shows high-level totals, overall health, and the 3 entities that need attention right now.',
                    when: 'Start here to see the big picture.'
                  },
                  {
                    id: 'entities',
                    name: 'All Institutions (32)',
                    icon: Building2,
                    purpose: 'A directory of all 26 statutory entities and 6 subsidized NPOs funded by the Department (names, leaders, budgets, contacts).',
                    when: 'Look up an individual organization, like Robben Island, Boxing SA, or Artscape.'
                  },
                  {
                    id: 'reports',
                    name: 'Quarterly Reports',
                    icon: FileText,
                    purpose: 'The list of quarterly reports submitted by each organization for this period, showing which ones are reviewed and approved.',
                    when: 'See if an organization submitted on time or approve their report.'
                  },
                  {
                    id: 'performance',
                    name: 'Targets & Delivery (KPIs)',
                    icon: Target,
                    purpose: 'Tracks whether organizations are hitting their promises (how many theatre shows, festivals, sports events, jobs created).',
                    when: 'Check if an entity is on track or lagging behind their annual goals.'
                  },
                  {
                    id: 'financials',
                    name: 'Budgets & Money Spent',
                    icon: Coins,
                    purpose: 'Shows the government budget given to each institution, how much was transferred to their bank account, and how much was spent.',
                    when: 'See if government money is being spent at the right speed.'
                  },
                  {
                    id: 'risks',
                    name: 'Risk & Early Warning',
                    icon: AlertTriangle,
                    purpose: 'The radar that detects who is in danger of failing (e.g. late submissions, audit issues, or budget disputes).',
                    when: 'Find out which institutions need help or intervention immediately.'
                  },
                  {
                    id: 'compliance',
                    name: 'Compliance & PFMA Rules',
                    icon: ShieldCheck,
                    purpose: 'The legal calendar showing submission deadlines and compliance with South African government finance rules (PFMA).',
                    when: 'Check upcoming cut-off dates and statutory deadlines.'
                  },
                  {
                    id: 'tasks',
                    name: 'Action Directives & Tasks',
                    icon: FileCheck,
                    purpose: 'Formal remedial tasks and instructions sent by the Department to an institution requiring them to fix an issue.',
                    when: 'Send an instruction, issue a ministerial directive, or track task resolution.'
                  },
                  {
                    id: 'queries',
                    name: 'Parliamentary Questions',
                    icon: QuestionIcon,
                    purpose: 'Formal questions asked by Members of Parliament or the public about an institution, with answers and status.',
                    when: 'Prepare or sign off answers to Parliament.'
                  },
                  {
                    id: 'documents',
                    name: 'Evidence Vault (PoE)',
                    icon: FolderLock,
                    purpose: 'The file cabinet containing verified proof documents (signed attendance registers, photos, invoices, contracts).',
                    when: 'Verify physical proof that an event or program actually happened.'
                  },
                  {
                    id: 'ai',
                    name: 'AI Performance Analyst',
                    icon: Sparkles,
                    purpose: 'An intelligent assistant that answers questions, finds hidden trends, and explains why an organization is struggling.',
                    when: 'Ask any question like "Why is Boxing SA at risk?" or "Which entities are spending too fast?".'
                  },
                  {
                    id: 'audit',
                    name: 'PFMA Audit Trail',
                    icon: History,
                    purpose: 'An official, tamper-proof record of every single change, approval, directive, or login that ever happened in the system.',
                    when: 'Prove to auditors (AGSA) who made a decision and when.'
                  }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{item.name}</div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{item.purpose}</p>
                          <div className="text-[10px] text-emerald-800 font-semibold mt-1">
                            💡 Use when: {item.when}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => { onNavigateToSection(item.id); onClose(); }}
                        className="self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PLAIN ENGLISH GLOSSARY */}
          {activeTab === 'glossary' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Government documents use lots of abbreviations. Here is what they actually mean in simple everyday English:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    term: 'Public Entity',
                    plain: 'A state-owned organization established by law to run public services (e.g. National Arts Council, Boxing SA, Artscape, Robben Island Museum).'
                  },
                  {
                    term: 'NPO (Non-Profit Organisation)',
                    plain: 'A subsidized cultural non-profit that receives financial support from the Department to deliver community arts and heritage work.'
                  },
                  {
                    term: 'KPI (Key Performance Indicator)',
                    plain: 'A specific goal or target agreed for the year (e.g. "deliver 10 sports events", "host 50 theatre productions", "create 200 jobs").'
                  },
                  {
                    term: 'PoE (Portfolio of Evidence)',
                    plain: 'Physical proof that a job was actually done—like signed attendance sheets, festival photos, artist contracts, or bank statements.'
                  },
                  {
                    term: 'PFMA (Public Finance Management Act)',
                    plain: 'The national law in South Africa that regulates how government departments and entities must spend, manage, and account for public funds.'
                  },
                  {
                    term: 'Directive',
                    plain: 'A formal legal instruction issued by the Department ordering an entity to immediately fix an audit failure, breach, or performance delay.'
                  },
                  {
                    term: 'Vote 40',
                    plain: 'The official code number for the Department of Sport, Arts and Culture in the South African National Parliament budget.'
                  },
                  {
                    term: 'Subvention',
                    plain: 'The grant money transferred in quarterly batches from the Department to an entity to pay for their staff, operations, and programs.'
                  },
                  {
                    term: 'AGSA (Auditor-General of South Africa)',
                    plain: 'The independent supreme audit institution that checks every government entity to ensure no corruption or irregular spending occurred.'
                  },
                  {
                    term: 'APP (Annual Performance Plan)',
                    plain: 'The formal contract signed each year between the Minister and each entity specifying their targets and budget for the upcoming 12 months.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="font-bold text-xs text-emerald-950 block">{item.term}</span>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.plain}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: QUICK SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Click any of these common tasks to jump directly to the right place:
              </p>

              <div className="space-y-2.5">
                {[
                  {
                    label: 'I want to see all 32 institutions and who runs them',
                    desc: 'View full directory with CEO names, board info, budgets, and cluster sectors.',
                    sectionId: 'entities',
                    icon: Building2
                  },
                  {
                    label: 'I want to see who is late or having trouble right now',
                    desc: 'Check the 3 flagged institutions (Boxing SA, National Arts Council, and PACOFS).',
                    sectionId: 'risks',
                    icon: AlertTriangle
                  },
                  {
                    label: 'I want to review the reports submitted this quarter',
                    desc: 'Inspect submitted Q3 performance and financial reports awaiting clearance.',
                    sectionId: 'reports',
                    icon: FileText
                  },
                  {
                    label: 'I want to see how much money was given to each entity and spent',
                    desc: 'Vote 40 budget breakdown, transfers to date, and remaining funds.',
                    sectionId: 'financials',
                    icon: Coins
                  },
                  {
                    label: 'I want to ask questions or get an automatic summary from AI',
                    desc: 'Ask questions like "Who created the most jobs?" or "Which entity has audit problems?".',
                    sectionId: 'ai',
                    icon: Sparkles
                  },
                  {
                    label: 'I want to see the official proof documents (attendance registers, photos)',
                    desc: 'Inspect verified digital documents in the Evidence Vault.',
                    sectionId: 'documents',
                    icon: FolderLock
                  },
                  {
                    label: 'I want to see when the next submission deadline is',
                    desc: 'Check statutory cut-off dates and the annual compliance calendar.',
                    sectionId: 'compliance',
                    icon: ShieldCheck
                  }
                ].map((shortcut, idx) => {
                  const Icon = shortcut.icon;
                  return (
                    <div 
                      key={idx}
                      onClick={() => { onNavigateToSection(shortcut.sectionId); onClose(); }}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer transition-all flex items-center justify-between gap-3 group shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-950">
                            {shortcut.label}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {shortcut.desc}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 shrink-0">
                        <span className="hidden sm:inline">Go</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Need more help? You can re-open this guide anytime from the sidebar or header.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );
};
