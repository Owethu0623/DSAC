import React, { useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  Check, 
  ShieldAlert, 
  Filter,
  Layers,
  ChevronRight,
  TrendingDown,
  Info,
  DollarSign
} from 'lucide-react';
import { store } from '../services/store';
import { RiskAlert, RiskLevel } from '../types';

interface EarlyWarningRadarProps {
  onNavigateToEntity: (entityId: string) => void;
  onOpenCreateTaskModal: (entityId: string, alertTitle: string) => void;
}

export const EarlyWarningRadar: React.FC<EarlyWarningRadarProps> = ({
  onNavigateToEntity,
  onOpenCreateTaskModal,
}) => {
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [activeExplainAlert, setActiveExplainAlert] = useState<RiskAlert | null>(null);

  const riskAlerts = store.riskAlerts;
  const deadlines = store.deadlines;

  const filteredAlerts = selectedRiskFilter === 'ALL'
    ? riskAlerts
    : riskAlerts.filter(a => a.riskLevel === selectedRiskFilter);

  // Calculate countdown time strings
  const getCountdownString = (isoDate: string) => {
    const diffMs = new Date(isoDate).getTime() - Date.now();
    if (diffMs <= 0) return { text: 'OVERDUE', isOverdue: true, bracket: 'OVERDUE' };
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return { 
        text: `${diffHours} hours remaining`, 
        isOverdue: false, 
        bracket: 'HOURLY_URGENT',
        badge: 'Hourly Urgency'
      };
    } else if (diffDays <= 15) {
      return { 
        text: `${diffDays} days remaining`, 
        isOverdue: false, 
        bracket: '15_DAYS',
        badge: '15-Day Reminder'
      };
    } else {
      return { 
        text: `${diffDays} days remaining`, 
        isOverdue: false, 
        bracket: '30_DAYS',
        badge: '30-Day Reminder'
      };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title & Regulatory Mandate */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-rose-800 bg-rose-50 w-fit px-2.5 py-1 rounded border border-rose-200">
              Deterministic Early Warning Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Cabinet_Grotesk'] tracking-tight">
              Early Warning & Statutory Risk Radar
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Transparent, risk-based alerts that evaluate KPI delivery trajectories, historical delays, and regulatory closing dates before deadlines are missed.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 max-w-xs">
            <strong className="text-slate-800">Public Sector Principle:</strong> Risk signals are management indicators for proactive support, never proof of wrongdoing.
          </div>
        </div>

        {/* Regulatory Due Dates Countdown Tracker (30 Days / 15 Days / Hourly) */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Statutory Due Dates & Multi-Stage Countdowns</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deadlines.map(deadline => {
              const countdown = getCountdownString(deadline.dueDate);

              return (
                <div 
                  key={deadline.id}
                  className={`p-4 rounded-xl border transition-all ${
                    countdown.bracket === 'HOURLY_URGENT'
                      ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300'
                      : countdown.bracket === '15_DAYS'
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      countdown.bracket === 'HOURLY_URGENT'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : countdown.bracket === '15_DAYS'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {countdown.badge}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {new Date(deadline.dueDate).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{deadline.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{deadline.description}</p>

                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono font-semibold">
                    <span className="text-slate-500">Time to Close:</span>
                    <span className={countdown.bracket === 'HOURLY_URGENT' ? 'text-rose-700 font-bold' : 'text-slate-800'}>
                      {countdown.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Risk Alert Registry with Explainer & Action Triggers */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Active Performance Risk Alerts ({filteredAlerts.length})
            </h2>
            <p className="text-xs text-slate-500">
              Triggered automatically when performance variance or reporting non-compliance crosses statutory thresholds.
            </p>
          </div>

          {/* Filter by severity */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedRiskFilter(lvl)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  selectedRiskFilter === lvl
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl === 'ALL' ? 'All Alerts' : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Alert Cards List */}
        <div className="space-y-4 mt-6">
          {filteredAlerts.map(alert => (
            <div 
              key={alert.id}
              className={`p-5 rounded-xl border transition-all ${
                alert.riskLevel === 'CRITICAL'
                  ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                  : alert.riskLevel === 'HIGH'
                  ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                  : 'bg-blue-50/40 border-blue-200 hover:border-blue-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                      alert.riskLevel === 'CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : alert.riskLevel === 'HIGH'
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {alert.riskLevel === 'CRITICAL' ? <AlertOctagon className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{alert.riskLevel} Risk • Score {alert.riskScore}/100</span>
                    </span>

                    <button
                      onClick={() => onNavigateToEntity(alert.entityId)}
                      className="text-xs font-bold text-slate-800 hover:text-emerald-700 underline"
                    >
                      {alert.entityName}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{alert.title}</h3>
                  <p className="text-xs text-slate-700 leading-relaxed">{alert.reason}</p>

                  {/* Contributing factors chips */}
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Contributing Evidence Factors:
                    </div>
                    <ul className="space-y-1">
                      {alert.contributingFactors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Action Box: "Why am I seeing this?" & "What should I do next?" */}
                <div className="lg:w-80 shrink-0 bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
                  
                  <div>
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1 text-emerald-800">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                      Recommended Action:
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {alert.recommendedAction}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setActiveExplainAlert(alert)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Why am I seeing this alert?</span>
                    </button>

                    <button
                      onClick={() => onOpenCreateTaskModal(alert.entityId, alert.title)}
                      className="w-full text-xs font-bold py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Assign Corrective Task</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EXPLAINABILITY MODAL: "Why am I seeing this alert?" */}
      {activeExplainAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Explainable Risk Breakdown
                </h3>
              </div>
              <button 
                onClick={() => setActiveExplainAlert(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-800">{activeExplainAlert.entityName}</div>
                <div className="text-slate-600 mt-0.5">{activeExplainAlert.title}</div>
              </div>

              {(() => {
                const explanation = store.explainEntityRisk(activeExplainAlert.entityId);
                if (!explanation || explanation.factors.length === 0) {
                  return (
                    <div>
                      <div className="font-bold text-slate-800 mb-2">Deterministic Risk Breakdown:</div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                        Entity compliance indicators are currently within stable operating boundaries (Risk Score: {activeExplainAlert.riskScore}/100).
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">Dynamic Risk Factor Decomposition:</span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Deterministic Total: {explanation.riskScore}/100
                      </span>
                    </div>

                    <div className="space-y-2">
                      {explanation.factors.map((factor, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                          <div className="flex items-center justify-between text-slate-900 font-semibold mb-1">
                            <span className="text-slate-800">{factor.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              factor.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              factor.severity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              +{factor.scoreContribution} pts • {factor.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {factor.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 leading-relaxed">
                <div className="font-bold mb-1">Responsible AI & Data Governance Guarantee:</div>
                This calculation uses deterministic arithmetic based on verified departmental returns (KPI achievement trajectory, Section 38 drawdowns, and AGSA audit outcomes). It represents a managerial risk signal designed to provide proactive departmental assistance before non-compliance crystallises.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveExplainAlert(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
