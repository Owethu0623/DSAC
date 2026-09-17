import React, { useState } from 'react';
import { 
  Building2, 
  Shield, 
  UserCheck, 
  Bell, 
  Clock, 
  Layers, 
  ChevronDown, 
  LogOut, 
  UserPlus, 
  CheckCircle2, 
  FileText, 
  Landmark,
  RefreshCw,
  Key
} from 'lucide-react';
import { UserRole } from '../types';
import { store } from '../services/store';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuthModal,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [syncConfirm, setSyncConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentUser = store.currentUser;
  const pulse = store.getPerformancePulse();
  const deadlines = store.deadlines;
  const overdueCount = pulse.overdueReportsCount;

  const handleSyncBaseline = () => {
    store.reseedOfficialBaseline();
    setSyncConfirm(true);
    setTimeout(() => setSyncConfirm(false), 3000);
  };

  const handleLogout = () => {
    store.logout();
    setProfileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top Republic of South Africa Government Bar */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse"></span>
          <span className="font-semibold text-slate-200">REPUBLIC OF SOUTH AFRICA</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">Department of Sport, Arts and Culture (DSAC)</span>
          <span className="hidden md:inline text-slate-600">•</span>
          <span className="hidden md:inline text-emerald-400 font-medium">
            Official Statutory Oversight Portal (PFMA Section 38 &amp; Vote 37)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded text-[11px]">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="font-mono font-medium">Q3 Statutory Submission Window Active</span>
          </div>

          <button
            onClick={handleSyncBaseline}
            className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
            title="Re-synchronize with National Treasury gazetted baseline allocations"
          >
            <RefreshCw className={`w-3 h-3 ${syncConfirm ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            <span>Sync Treasury Baseline</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Platform Tagline */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center shadow-lg border border-emerald-400/30">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white font-['Cabinet_Grotesk']">
                  GovTrack <span className="text-emerald-400">SA</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  DSAC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 font-medium">
                National Public Entities &amp; NPOs Statutory Performance Management
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'dashboard' 
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Executive Pulse
            </button>

            <button
              onClick={() => onSelectTab('radar')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentTab === 'radar' 
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>Early Warning</span>
              {pulse.highRiskEntitiesCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
                  {pulse.highRiskEntitiesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('entities')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'entities' 
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              26 Entities &amp; 6 NPOs
            </button>

            <button
              onClick={() => onSelectTab('workspace')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'workspace' 
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Entity Workspace
            </button>

            <button
              onClick={() => onSelectTab('documents')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'documents' 
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Documents &amp; PoE
            </button>

            <button
              onClick={() => onSelectTab('tasks')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentTab === 'tasks' 
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>Directives</span>
              {pulse.openTasksCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold">
                  {pulse.openTasksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('ai')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentTab === 'ai' 
                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/60 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grounded Analyst</span>
            </button>

            <button
              onClick={() => onSelectTab('audit')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentTab === 'audit' 
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Audit Trail
            </button>
          </nav>

          {/* Right Action Tools: Notifications, Official Profile Dropdown */}
          <div className="flex items-center gap-2">
            
            {/* Regulatory Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors border border-slate-700"
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

              {/* Dropdown notifications */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-semibold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Statutory Deadlines
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">PFMA Schedule</span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {deadlines.map(d => (
                      <div key={d.id} className="p-2 rounded bg-slate-800/70 border border-slate-700/60">
                        <div className="font-medium text-slate-200">{d.title}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{d.description}</div>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
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

            {/* Official User Profile & Security Session Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-600/50 px-3 py-1.5 rounded-lg text-left text-xs transition-all shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] border border-emerald-500/40">
                    {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-semibold text-white truncate max-w-[130px]">{currentUser.name}</div>
                    <div className="text-[10px] text-emerald-400 font-medium truncate max-w-[130px]">
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
                        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                          {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
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

                    {/* Actions: Switch / Register / Sign Out */}
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
                <span>Official Sign In</span>
              </button>
            )}

          </div>

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
