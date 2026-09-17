import React, { useState } from 'react';
import { 
  Menu,
  Bell, 
  Clock, 
  ChevronDown, 
  LogOut, 
  UserPlus, 
  CheckCircle2, 
  RefreshCw,
  Key,
  Search,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers
} from 'lucide-react';
import { store } from '../services/store';

export interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuthModal: () => void;
  onToggleMobileSidebar: () => void;
  onSelectEntity?: (entityId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuthModal,
  onToggleMobileSidebar,
  onSelectEntity,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [syncConfirm, setSyncConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const currentUser = store.currentUser;
  const pulse = store.getPerformancePulse();
  const deadlines = store.deadlines;
  const overdueCount = pulse.overdueReportsCount;
  const entities = store.entities;

  const handleSyncBaseline = () => {
    store.reseedOfficialBaseline();
    setSyncConfirm(true);
    setTimeout(() => setSyncConfirm(false), 3000);
  };

  const handleLogout = () => {
    store.logout();
    setProfileMenuOpen(false);
  };

  const getTabInfo = (tab: string) => {
    switch (tab) {
      case 'dsac-repo':
      case 'dashboard':
        return {
          title: 'DSAC REPO Oversight Dashboard',
          badge: 'Statutory Overview',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          subtitle: 'Official Performance, Compliance & Financial Monitoring for 26 Public Entities & 6 NPOs',
        };
      case 'entity-portal':
        return {
          title: 'Entity / NPO Self-Reporting Portal',
          badge: 'Ubuntu Arts NPO',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          subtitle: 'Quarterly PoE Uploads, KPI Trajectories & Grant Reconciliation',
        };
      case 'side-by-side':
        return {
          title: 'Dual Statutory Oversight Architecture',
          badge: 'Side-by-Side View',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          subtitle: 'Comparative View: Left DSAC REPO Oversight • Right Ubuntu Arts NPO Portal',
        };
      case 'entities':
        return {
          title: '26 Public Entities & 6 Funded NPOs',
          badge: '32 Institutions',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          subtitle: 'Statutory Registry, Responsible Accounting Officers & Council Compliance',
        };
      case 'executive':
        return {
          title: 'Executive Performance Pulse',
          badge: 'PFMA Vote 37',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          subtitle: 'National Treasury Baseline Delivery vs Operational Expenditure Rate',
        };
      case 'radar':
      case 'early-warning':
        return {
          title: 'Early Warning Risk & Intervention Radar',
          badge: 'Statutory Risk Index',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          subtitle: 'Automated Early Detection of Non-Delivery, PFMA Breaches & Budget Drawdowns',
        };
      case 'tasks':
        return {
          title: 'Statutory Directives & Corrective Actions',
          badge: 'Directives Ledger',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          subtitle: 'Section 38 PFMA Corrective Actions & Departmental Instructions',
        };
      case 'workspace':
        return {
          title: 'Entity Review Workspace & Portfolio of Evidence',
          badge: 'Audit Inspection',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          subtitle: 'Detailed Quarterly Milestones, Variance Explanations & Supporting Documentation',
        };
      case 'documents':
        return {
          title: 'Document & Evidence PoE Repository',
          badge: 'Secure Storage',
          badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          subtitle: 'Annual Performance Plans (APP), Strategic Plans & Signed PFMA Guarantees',
        };
      case 'ai':
      case 'ai-analyst':
        return {
          title: 'AI Statutory Performance Analyst',
          badge: 'Grounded Intelligence',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          subtitle: 'Grounded Natural Language Inquiries Over Real-Time Baseline Data',
        };
      case 'audit':
        return {
          title: 'PFMA Statutory Audit Trail',
          badge: 'Immutable Ledger',
          badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          subtitle: 'Cryptographic & Time-Stamped Log of Submissions, Reviews & Directives',
        };
      default:
        return {
          title: 'DSAC REPO System',
          badge: 'Statutory Portal',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          subtitle: 'Republic of South Africa Department of Sport, Arts and Culture',
        };
    }
  };

  const tabInfo = getTabInfo(currentTab);

  const filteredEntities = searchQuery.trim()
    ? entities.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.cluster.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      
      {/* 1. Official Government Top Strip */}
      <div className="bg-slate-950 px-3 sm:px-6 py-1.5 border-b border-slate-800/80 text-[11px] flex flex-wrap items-center justify-between gap-2 text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse"></span>
          <span className="font-semibold text-slate-200">REPUBLIC OF SOUTH AFRICA</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline">Department of Sport, Arts and Culture (DSAC)</span>
          <span className="hidden md:inline text-slate-600">•</span>
          <span className="hidden md:inline text-emerald-400 font-medium">
            Vote 37 Oversight Architecture (PFMA Act 1 of 1999)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded text-[10px] sm:text-[11px]">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="font-mono font-medium">Q3 Submission Window Active</span>
          </div>

          <button
            onClick={handleSyncBaseline}
            className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium transition-colors"
            title="Re-synchronize with National Treasury gazetted baseline allocations"
          >
            <RefreshCw className={`w-3 h-3 ${syncConfirm ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Sync Treasury Baseline</span>
            <span className="sm:hidden">Sync</span>
          </button>
        </div>
      </div>

      {/* 2. Main Top Bar: Breadcrumb + Search + Actions */}
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left: Mobile Sidebar Toggle + Breadcrumb / View Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700 shrink-0"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 hidden sm:flex">
              <span>DSAC Statutory Oversight</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-slate-300 font-medium">{tabInfo.badge}</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                {tabInfo.title}
              </h1>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border hidden md:inline shrink-0 ${tabInfo.badgeColor}`}>
                {tabInfo.badge}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Search + Quick Portal Jump + Alerts + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Quick Search with Dropdown */}
          <div className="relative hidden md:block w-44 lg:w-64">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search entities, codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-hidden focus:bg-slate-800 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Live Search Results */}
            {searchFocused && searchQuery.trim() && (
              <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs max-h-64 overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Public Entities &amp; NPOs ({filteredEntities.length})
                </div>
                {filteredEntities.length > 0 ? (
                  filteredEntities.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        if (onSelectEntity) onSelectEntity(e.id);
                        onSelectTab('workspace');
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200 transition-colors"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-white">{e.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({e.shortCode})</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                        e.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                        e.riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {e.riskLevel}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    No matching entities found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Statutory Deadlines & Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              title="Regulatory Deadlines & Compliance Alerts"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {overdueCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Statutory Deadlines &amp; Alerts
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">PFMA Schedule</span>
                </div>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {deadlines.map((d) => (
                    <div key={d.id} className="p-2 rounded-lg bg-slate-800/70 border border-slate-700/60">
                      <div className="font-medium text-slate-200">{d.title}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{d.description}</div>
                      <div className="flex items-center justify-between mt-1.5 text-[10px]">
                        <span className="text-amber-400 font-mono font-medium">
                          Due: {new Date(d.dueDate).toLocaleDateString('en-ZA')}
                        </span>
                        <span className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                          {d.isStatutory ? 'Statutory PFMA' : 'Administrative'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 px-2.5 py-1.5 rounded-lg text-left text-xs transition-all shadow-xs"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-[11px] border border-emerald-500/40 shrink-0">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-semibold text-white truncate max-w-[110px] leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium truncate max-w-[110px]">
                    {currentUser.entityName ? currentUser.entityName.split('(')[0] : 'DSAC National'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs">
                  {/* User Identity Info */}
                  <div className="pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                        {currentUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-white text-sm truncate">{currentUser.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                        <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                          {currentUser.designation}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 px-2.5 py-1.5 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Institutional Unit:</span>
                      <span className="font-semibold text-slate-200 truncate ml-2">
                        {currentUser.entityName || 'DSAC National Headquarters'}
                      </span>
                    </div>
                  </div>

                  {/* Security & Access Status */}
                  <div className="py-2.5 px-1 border-b border-slate-800 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Statutory Role:</span>
                      <span className="font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-[10px]">
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">PFMA Oversight Clearance:</span>
                      <span className="text-emerald-300 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Verified Statutory Official</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 space-y-1">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full text-left p-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 text-slate-300 text-xs transition-colors"
                    >
                      <Key className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Switch Account / Sign In</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full text-left p-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 text-slate-300 text-xs transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                      <span>Register New Official Account</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left p-2 rounded-lg flex items-center gap-2 hover:bg-rose-950/50 text-rose-300 text-xs transition-colors border border-transparent hover:border-rose-900"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Out of Departmental Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-lg shadow-md transition-all"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>

      </div>

      {/* Baseline Synchronization Toast */}
      {syncConfirm && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-1.5 text-center font-medium shadow-inner flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Statutory baseline re-synchronized with National Treasury Vote 37 gazetted appropriations.</span>
        </div>
      )}
    </header>
  );
};
