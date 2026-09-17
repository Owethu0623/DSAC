import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Calendar, 
  Bell, 
  User, 
  Check, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Search, 
  Lock, 
  Save, 
  Sliders, 
  Building2, 
  Mail, 
  Key, 
  RefreshCw,
  HelpCircle,
  Eye,
  FileText
} from 'lucide-react';
import { store } from '../../services/store';

export const DsacSettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'profile' | 'notifications' | 'audit'>('general');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Settings State - General & Statutory
  const [budgetSubmissionMonth, setBudgetSubmissionMonth] = useState('December');
  const [budgetStructure, setBudgetStructure] = useState('4 Quarters (25% each)');
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [criticalRiskThreshold, setCriticalRiskThreshold] = useState(60);
  const [targetComplianceRate, setTargetComplianceRate] = useState(85);
  const [displayCurrency, setDisplayCurrency] = useState('ZAR_MILLIONS');
  const [autoRefreshCadence, setAutoRefreshCadence] = useState('60');

  // Settings State - Profile & Security
  const [officialName, setOfficialName] = useState('Sicelo Sakhile Mkhize');
  const [officialTitle, setOfficialTitle] = useState('Chief Director: Public Entity Governance & Oversight');
  const [officialEmail, setOfficialEmail] = useState('s.mkhize@dsac.gov.za');
  const [twoFactorActive, setTwoFactorActive] = useState(true);

  // Settings State - Notifications
  const [notifications, setNotifications] = useState({
    overdueQuarterlyAlerts: true,
    criticalRiskEscalations: true,
    trancheDisbursementNotices: true,
    section38ExpiryWarnings: true,
    weeklyExecutiveDigest: true,
    auditFindingAlerts: true
  });

  // Audit Log State
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [selectedAuditAction, setSelectedAuditAction] = useState<string>('ALL');

  const logs = store.auditLogs;

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.userName.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                          l.details.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                          (l.entityName && l.entityName.toLowerCase().includes(auditSearchQuery.toLowerCase()));
    const matchesAction = selectedAuditAction === 'ALL' || l.action === selectedAuditAction;
    return matchesSearch && matchesAction;
  });

  const handleSave = (sectionName: string) => {
    setSaveToast(`${sectionName} successfully updated and applied across DSAC REPO.`);
    setTimeout(() => {
      setSaveToast(null);
    }, 4000);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    handleSave('Notification Preferences');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      
      {/* Top Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              System Settings &amp; Administration
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Departmental oversight rules, statutory submission parameters, notification thresholds, user profile, and audit logs
          </p>
        </div>

        {saveToast && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{saveToast}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs (KISS: Clear, simple, distinct) */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'general'
              ? 'bg-white text-slate-900 shadow-2xs font-bold ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
          <span>General &amp; Statutory Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-2xs font-bold ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <User className="w-3.5 h-3.5 text-blue-600" />
          <span>Official Profile &amp; Role</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-white text-slate-900 shadow-2xs font-bold ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-amber-500" />
          <span>Alerts &amp; Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-white text-slate-900 shadow-2xs font-bold ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Governance Audit Trail ({logs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GENERAL & STATUTORY RULES */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="space-y-5">
          
          {/* Statutory Deadlines Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Statutory Reporting Rules &amp; Deadlines
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Governed by PFMA Section 38(1)(j), Treasury Regulations, and DSAC Oversight Mandate
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                Active Statutory Rules
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Annual Budget Submission Rule */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Annual Budget Submission Due Month</span>
                  <span className="text-emerald-800 font-extrabold bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                    December
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  The budget for the following financial year must be submitted in <strong>December</strong>. The budget for the current year is submitted in <strong>December into 4 equal quarters (25% each)</strong>.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Enforced across all 26 Public Entities &amp; 6 Subsidized NPOs</span>
                </div>
              </div>

              {/* Quarterly Report Submission Rule */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Quarterly Performance Reports Due Date</span>
                  <span className="text-blue-800 font-extrabold bg-blue-100/70 px-2 py-0.5 rounded text-[11px]">
                    After 3 Months on Last Day
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Quarterly performance and expenditure reports are due after every 3 months on the last day:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-medium text-slate-700 pt-0.5">
                  <div className="bg-white p-1.5 rounded border border-slate-200">Q1: 31 July (Apr – Jun)</div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">Q2: 31 October (Jul – Sep)</div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">Q3: 31 January (Oct – Dec)</div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">Q4: 30 April (Jan – Mar)</div>
                </div>
              </div>

            </div>

            {/* Editable Statutory Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Budget Submission Structure
                </label>
                <select
                  value={budgetStructure}
                  onChange={(e) => {
                    setBudgetStructure(e.target.value);
                    handleSave('Statutory Parameters');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="4 Quarters (25% each)">4 Quarters (25% each Tranche)</option>
                  <option value="2 Halves (50% each)">2 Halves (50% each)</option>
                  <option value="Special Subvention Tranches">Special Subvention Tranches</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resubmission Grace Period
                </label>
                <select
                  value={gracePeriodDays}
                  onChange={(e) => {
                    setGracePeriodDays(Number(e.target.value));
                    handleSave('Grace Period');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value={5}>5 Business Days</option>
                  <option value={7}>7 Business Days (Statutory Default)</option>
                  <option value={10}>10 Business Days</option>
                  <option value={14}>14 Business Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Portfolio Compliance
                </label>
                <select
                  value={targetComplianceRate}
                  onChange={(e) => {
                    setTargetComplianceRate(Number(e.target.value));
                    handleSave('Target Compliance');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value={80}>80% Compliance Benchmark</option>
                  <option value={85}>85% Compliance Benchmark (National Standard)</option>
                  <option value={90}>90% Compliance Benchmark</option>
                </select>
              </div>
            </div>
          </div>

          {/* Early Warning Risk Calculation Thresholds */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    PFMA Early Warning &amp; Risk Escalation Thresholds
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Automated flags for Ministerial briefing, Section 100 intervention, and tranche withholding
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Satisfactory (Low Risk)</span>
                </div>
                <div className="text-base font-black text-emerald-900 mt-1">Score ≥ 80%</div>
                <p className="text-[10px] text-emerald-700 mt-1">
                  Unconditional tranche release approved via National Treasury BAS.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Monitoring (Medium Risk)</span>
                </div>
                <div className="text-base font-black text-amber-900 mt-1">Score 60% – 79%</div>
                <p className="text-[10px] text-amber-700 mt-1">
                  Target variation &gt;10% or single overdue report. Watchlist active.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                <div className="font-bold text-rose-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                  <span>Critical Risk (Escalation)</span>
                </div>
                <div className="text-base font-black text-rose-900 mt-1">Score &lt; 60%</div>
                <p className="text-[10px] text-rose-700 mt-1">
                  Audit disclaimer, qualified findings, or tranche freeze recommended.
                </p>
              </div>
            </div>
          </div>

          {/* System Display & Cache Preferences */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Display &amp; Data Refresh Cadence
              </h3>
              <button
                onClick={() => handleSave('Display Preferences')}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save General Settings</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Financial Representation
                </label>
                <select
                  value={displayCurrency}
                  onChange={(e) => {
                    setDisplayCurrency(e.target.value);
                    handleSave('Currency Formatting');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="ZAR_MILLIONS">South African Rand (Millions - R M)</option>
                  <option value="ZAR_EXACT">Full Exact Value (R 1,200,000.00)</option>
                  <option value="ZAR_BILLIONS">Portfolio Billions (R 3.82B)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Automated Oversight Refresh Interval
                </label>
                <select
                  value={autoRefreshCadence}
                  onChange={(e) => {
                    setAutoRefreshCadence(e.target.value);
                    handleSave('Refresh Cadence');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="30">Every 30 Seconds (Live Realtime)</option>
                  <option value="60">Every 60 Seconds (Recommended)</option>
                  <option value="300">Every 5 Minutes</option>
                  <option value="manual">Manual Refresh Only</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OFFICIAL PROFILE & ROLE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-5">
          
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Oversight Official Credentials &amp; Delegation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Department of Sport, Arts and Culture National Head Office (Pretoria)
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                DSAC_ADMIN Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name &amp; Title
                </label>
                <input
                  type="text"
                  value={officialName}
                  onChange={(e) => setOfficialName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Statutory Role
                </label>
                <input
                  type="text"
                  value={officialTitle}
                  onChange={(e) => setOfficialTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Statutory Delegations */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Assigned Statutory Delegations &amp; Permissions:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800">Section 38(1)(j) Signoff</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800">Tranche Disbursement Authorization</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800">Ministerial Escalation Notice</span>
                </div>
              </div>
            </div>

            {/* Save Profile Button */}
            <div className="pt-3 flex justify-end">
              <button
                onClick={() => handleSave('Official Profile')}
                className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>

          {/* Security & Authentication */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Security &amp; Single Sign-On (SSO)
                </h3>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                National Treasury AD Active
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Two-Factor Authentication (2FA)</div>
                <div className="text-[11px] text-slate-500">Required for ministerial report approvals and budget adjustments</div>
              </div>
              <button
                onClick={() => {
                  setTwoFactorActive(!twoFactorActive);
                  handleSave('2FA Security Setting');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  twoFactorActive 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {twoFactorActive ? 'Enabled (Active)' : 'Disabled'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ALERTS & NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Automated Oversight Notification Rules
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure which critical statutory triggers notify the Directorate and Director-General
                </p>
              </div>
              <button
                onClick={() => handleSave('Notification Preferences')}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </button>
            </div>

            <div className="space-y-3">
              
              {/* Item 1 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="font-bold text-slate-900">Overdue Quarterly Performance Returns</div>
                  <div className="text-[11px] text-slate-500">Trigger immediate escalation when Q1, Q2, Q3, or Q4 return exceeds the last-day deadline</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.overdueQuarterlyAlerts}
                  onChange={() => toggleNotification('overdueQuarterlyAlerts')}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="font-bold text-slate-900">Critical Risk Level Escalations (Score &lt; 60%)</div>
                  <div className="text-[11px] text-slate-500">Notify Accounting Officer and generate Ministerial briefing brief automatically</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.criticalRiskEscalations}
                  onChange={() => toggleNotification('criticalRiskEscalations')}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="font-bold text-slate-900">National Treasury BAS Tranche Disbursement Confirmations</div>
                  <div className="text-[11px] text-slate-500">Receive confirmation when quarterly 25% grant tranches are released to entity bank accounts</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.trancheDisbursementNotices}
                  onChange={() => toggleNotification('trancheDisbursementNotices')}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Item 4 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="font-bold text-slate-900">Section 38(1)(j) Written Assurance Expiry Notices</div>
                  <div className="text-[11px] text-slate-500">Send 30-day advance warning prior to annual certificate renewal expiration</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.section38ExpiryWarnings}
                  onChange={() => toggleNotification('section38ExpiryWarnings')}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Item 5 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="font-bold text-slate-900">Weekly Executive Oversight Digest (Mondays 08:00)</div>
                  <div className="text-[11px] text-slate-500">Receive comprehensive portfolio health summary across all 32 entities</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.weeklyExecutiveDigest}
                  onChange={() => toggleNotification('weeklyExecutiveDigest')}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Item 6 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="font-bold text-slate-900">Auditor-General (AGSA) Material Finding Alerts</div>
                  <div className="text-[11px] text-slate-500">Flag qualified opinions or Section 38 audit non-compliance issues</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.auditFindingAlerts}
                  onChange={() => toggleNotification('auditFindingAlerts')}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GOVERNANCE AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                  PFMA Section 38 Governance Logs
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Immutable Governance Audit Trail
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tamper-evident chronological log of every administrative decision, report review, and statutory action
                </p>
              </div>

              <div className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                <span className="text-slate-500">Total Logged Records: </span>
                <strong className="text-slate-900">{logs.length} Events</strong>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by official, entity, or action details..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <select
                  value={selectedAuditAction}
                  onChange={(e) => setSelectedAuditAction(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="ALL">All Audit Actions ({logs.length})</option>
                  <option value="REPORT_SUBMITTED">Report Submitted</option>
                  <option value="REPORT_APPROVED">Report Approved</option>
                  <option value="REPORT_CORRECTION_REQUIRED">Correction Required</option>
                  <option value="TASK_CREATED">Task Created</option>
                  <option value="TASK_RESOLVED">Task Resolved</option>
                  <option value="EARLY_WARNING_TRIGGERED">Early Warning Triggered</option>
                  <option value="USER_LOGIN">User Persona Switched / Login</option>
                </select>
              </div>
            </div>

            {/* Audit Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp (UTC)</th>
                    <th className="py-2.5 px-3">Official / Actor</th>
                    <th className="py-2.5 px-3">Entity</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.userName}</div>
                        <div className="text-[10px] text-slate-400">{log.userRole}</div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-medium">
                        {log.entityName || 'DSAC National'}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-700 leading-relaxed max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
