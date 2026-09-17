import React, { useState } from 'react';
import {
  Theater,
  Calendar,
  AlertCircle,
  Target,
  Coins,
  CheckCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  HandCoins,
  BarChart3,
  UploadCloud,
  Bell,
  ChevronDown,
  Building,
  ShieldCheck,
  FolderLock,
  MessageSquare,
  HelpCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  User,
  X,
  Upload
} from 'lucide-react';
import { store } from '../services/store';
import { UbuntuArtsLogo } from './UbuntuArtsLogo';

interface EntityPortalDashboardProps {
  entityId?: string;
  onOpenWorkspace?: () => void;
  onBackToDsac?: () => void;
  onNavigateToSection?: (section: string) => void;
  onOpenAuth?: () => void;
}

export const EntityPortalDashboard: React.FC<EntityPortalDashboardProps> = ({
  entityId,
  onOpenWorkspace,
  onBackToDsac,
  onNavigateToSection,
  onOpenAuth,
}) => {
  const [activeSidebar, setActiveSidebar] = useState<string>('overview');
  const [selectedYear, setSelectedYear] = useState<string>('2025/26 Financial Year');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  // Modals for interactive actions
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('Quarter 2 Performance Report (PoE)');
  const [supportType, setSupportType] = useState('Financial Support');
  const [supportAmount, setSupportAmount] = useState('150000');
  const [supportMotivation, setSupportMotivation] = useState('Funding for provincial community arts roadshow workshops');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const currentUser = store.currentUser || {
    name: 'Lerato Phiri',
    role: 'ENTITY_OFFICER',
    designation: 'Organisation Admin',
    email: 'l.phiri@ubuntuarts.org.za',
    entityName: 'Ubuntu Arts NPO',
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'organisation', label: 'My Organisation', icon: Building },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'kpis', label: 'Targets & KPIs', icon: Target },
    { id: 'budget', label: 'Budget & Utilization', icon: Coins },
    { id: 'support', label: 'Support Requests', icon: HandCoins },
    { id: 'submissions', label: 'Reports Submission', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FolderLock },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: 2 },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionSuccess('Support Request submitted successfully to DSAC Oversight Directorate.');
    setTimeout(() => {
      setActionSuccess(null);
      setActiveModal(null);
    }, 1500);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionSuccess('Quarterly Report submitted and timestamped under PFMA audit ledger.');
    setTimeout(() => {
      setActionSuccess(null);
      setActiveModal(null);
    }, 1500);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[920px] bg-slate-100 rounded-xl overflow-hidden border border-slate-300/80 shadow-md">
      
      {/* 1. LEFT SIDEBAR (Deep Royal Indigo) */}
      <aside className="w-full lg:w-56 bg-[#1e1b4b] text-indigo-100 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Top Organization Header */}
          <div className="p-4 border-b border-indigo-900/60">
            <div className="flex items-center gap-3">
              <UbuntuArtsLogo size={32} className="shrink-0" />
              <div>
                <div className="font-bold text-white text-xs tracking-wide">Ubuntu Arts NPO</div>
                <div className="text-[10px] text-indigo-300/80 font-medium">Entity Portal</div>
              </div>
            </div>
          </div>

          {/* Navigation items */}
          <nav className="p-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSidebar === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id);
                    if (onNavigateToSection && item.id !== 'overview') {
                      onNavigateToSection(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#3730a3] text-white shadow-sm font-semibold'
                      : 'text-indigo-200/80 hover:bg-[#2e266f] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-indigo-400/80'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Decorative Section */}
        <div className="p-4 pt-6 border-t border-indigo-900/60 relative overflow-hidden">
          <div className="space-y-0.5 text-[11px] font-semibold tracking-wider text-indigo-300 uppercase">
            <div className="text-white font-bold text-xs">Create</div>
            <div>Preserve</div>
            <div>Empower</div>
            <div className="text-amber-400 font-bold">Thrive</div>
          </div>

          {/* Bottom Rainbow Gradient Line as in Screenshot */}
          <div className="h-1.5 w-full mt-3 rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 via-sky-400 to-purple-500" />

          <div className="mt-2.5 flex items-center justify-between text-[10px] text-indigo-300/70">
            <span>DSAC Vote 37 Funded</span>
            {onBackToDsac && (
              <button 
                onClick={onBackToDsac}
                className="text-amber-400 hover:text-amber-300 underline font-semibold"
              >
                Go to DSAC →
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col bg-slate-50 min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          {/* Logo & Entity Name */}
          <div className="flex items-center gap-3.5">
            <UbuntuArtsLogo size={44} className="shrink-0" />
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Ubuntu Arts NPO
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Inspiring Communities Through Creative Arts
              </p>
            </div>
          </div>

          {/* Right Controls: Notifications & Profile */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  2
                </span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-30 text-xs">
                  <div className="font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span>Notifications</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">2 New</span>
                  </div>
                  <div className="py-2 space-y-2">
                    <div className="p-2 rounded bg-indigo-50 border border-indigo-100 text-indigo-900 text-[11px]">
                      DSAC Finance approved Q1 tranche release.
                    </div>
                    <div className="p-2 rounded bg-amber-50 border border-amber-100 text-amber-900 text-[11px]">
                      Reminder: Q2 Report deadline in 5 days.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-700 text-white font-bold text-[10px] flex items-center justify-center">
                  LP
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[11px] font-bold text-slate-800 leading-tight">Lerato Phiri</div>
                  <div className="text-[9px] text-indigo-700 font-medium leading-none">Organisation Admin</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-30 text-xs">
                  <div className="p-2 border-b border-slate-100">
                    <div className="font-bold text-slate-800">Lerato Phiri</div>
                    <div className="text-[10px] text-slate-500">l.phiri@ubuntuarts.org.za</div>
                    <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">Ubuntu Arts NPO</div>
                  </div>
                  {onOpenAuth && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenAuth();
                      }}
                      className="w-full text-left px-2.5 py-2 hover:bg-slate-50 rounded-lg text-slate-700 text-xs font-medium mt-1"
                    >
                      Switch Account / Sign Out
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="p-4 sm:p-6 space-y-5">
          
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Welcome back, Lerato
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Here's your current status and what needs your attention.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden"
              >
                <option>2025/26 Financial Year</option>
                <option>2024/25 Financial Year</option>
                <option>2023/24 Financial Year</option>
              </select>
            </div>
          </div>

          {/* TOP ROW: 5 QUICK STATUS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Card 1: Compliance Status */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-medium text-slate-500 mb-2">Compliance Status</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="text-base font-bold text-emerald-600">On Track</div>
              </div>
            </div>

            {/* Card 2: Upcoming Due Dates */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-medium text-slate-500 mb-2">Upcoming Due Dates</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900 leading-none">2</div>
                  <div className="text-[10px] text-slate-500 font-medium">Next 30 days</div>
                </div>
              </div>
            </div>

            {/* Card 3: Overdue Items */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-medium text-slate-500 mb-2">Overdue Items</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900 leading-none">1</div>
                  <div className="text-[10px] text-slate-500 font-medium">Requires attention</div>
                </div>
              </div>
            </div>

            {/* Card 4: KPIs Achieved */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="text-xs font-medium text-slate-500 mb-2">KPIs Achieved</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900 leading-none">6/8</div>
                  <div className="text-[10px] text-teal-700 font-bold">75%</div>
                </div>
              </div>
            </div>

            {/* Card 5: Budget Utilized */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="text-xs font-medium text-slate-500 mb-1">Budget Utilized</div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-slate-900">R 3.2M</span>
                  <span className="text-[10px] text-slate-400">of R 5.0M</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '64%' }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">64%</span>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE ROW: TARGETS & UPCOMING DUE DATES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left: My Key Targets (2025/26) */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">My Key Targets (2025/26)</h3>
                <button 
                  onClick={() => onNavigateToSection && onNavigateToSection('kpis')}
                  className="text-xs text-indigo-700 hover:text-indigo-800 font-semibold"
                >
                  View All
                </button>
              </div>

              <div className="py-3 space-y-4">
                {/* Target 1 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Community arts programmes</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">12 / 15</span>
                      <span className="font-bold text-emerald-700 text-[11px]">80%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>

                {/* Target 2 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Youth participants</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">850 / 1 000</span>
                      <span className="font-bold text-emerald-700 text-[11px]">85%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                {/* Target 3 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Workshops conducted</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">18 / 20</span>
                      <span className="font-bold text-emerald-700 text-[11px]">90%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>

                {/* Target 4 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Partnerships established</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono">3 / 5</span>
                      <span className="font-bold text-amber-600 text-[11px]">60%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Upcoming Due Dates */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Upcoming Due Dates</h3>
                <button 
                  onClick={() => onNavigateToSection && onNavigateToSection('calendar')}
                  className="text-xs text-indigo-700 hover:text-indigo-800 font-semibold"
                >
                  View Calendar
                </button>
              </div>

              <div className="py-3 space-y-3">
                {/* Due Date 1 */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Quarter 2 Report</div>
                      <div className="text-[11px] text-slate-400">15 Aug 2025</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    5 days left
                  </span>
                </div>

                {/* Due Date 2 */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Budget Utilization Report</div>
                      <div className="text-[11px] text-slate-400">31 Aug 2025</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    21 days left
                  </span>
                </div>

                {/* Due Date 3 */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Strategic Plan Update</div>
                      <div className="text-[11px] text-slate-400">30 Sep 2025</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    51 days left
                  </span>
                </div>

                {/* Due Date 4 */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Annual Report</div>
                      <div className="text-[11px] text-slate-400">31 Mar 2026</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    On track
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* BOTTOM ROW 1: BUDGET OVERVIEW & SUPPORT REQUESTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left: Budget Overview */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Budget Overview</h3>
                <button 
                  onClick={() => onNavigateToSection && onNavigateToSection('budget')}
                  className="text-xs text-indigo-700 hover:text-indigo-800 font-semibold"
                >
                  View Details
                </button>
              </div>

              <div className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-800">
                    R 3.2M <span className="font-normal text-slate-500 text-xs">of R 5.0M utilized</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">64%</span>
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: '64%' }}></div>
                </div>

                {/* 3 Metric columns */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div>
                    <div className="text-sm font-black text-slate-900">R 5.0M</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">Approved</div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-teal-700">R 3.2M</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">Utilized</div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">R 1.8M</div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">Remaining</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Support Requests */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Support Requests</h3>
                <button 
                  onClick={() => setActiveModal('support')}
                  className="px-3 py-1 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Request</span>
                </button>
              </div>

              {/* 4 Status Squares in a row */}
              <div className="grid grid-cols-4 gap-2.5 py-2">
                {/* Submitted */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-black text-slate-900 leading-none">3</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">Submitted</div>
                </div>

                {/* Under Review */}
                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-black text-slate-900 leading-none">1</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">Under Review</div>
                </div>

                {/* Approved */}
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-black text-slate-900 leading-none">1</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">Approved</div>
                </div>

                {/* Rejected */}
                <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-1">
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-black text-slate-900 leading-none">0</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">Rejected</div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-right pt-1 border-t border-slate-100">
                Direct statutory assistance channel with DSAC
              </div>
            </div>

          </div>

          {/* BOTTOM ROW 2: RECENT MESSAGES & QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left: Recent Messages */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Recent Messages</h3>
                <button 
                  onClick={() => onNavigateToSection && onNavigateToSection('messages')}
                  className="text-xs text-indigo-700 hover:text-indigo-800 font-semibold"
                >
                  View All
                </button>
              </div>

              <div className="py-2 space-y-3">
                {/* Message 1 */}
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800 truncate">Feedback on Q1 Report</div>
                      <span className="text-[10px] text-slate-400 shrink-0">2 days ago</span>
                    </div>
                    <div className="text-[11px] text-slate-500">DSAC Reviewer</div>
                  </div>
                </div>

                {/* Message 2 */}
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800 truncate">Budget request under review</div>
                      <span className="text-[10px] text-slate-400 shrink-0">4 days ago</span>
                    </div>
                    <div className="text-[11px] text-slate-500">DSAC Finance</div>
                  </div>
                </div>

                {/* Message 3 */}
                <div className="flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800 truncate">Reminder: Q2 Report due soon</div>
                      <span className="text-[10px] text-slate-400 shrink-0">5 days ago</span>
                    </div>
                    <div className="text-[11px] text-slate-500">DSAC Compliance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Actions (4 Action Buttons) */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
              </div>

              {/* 4 Action Cards (2x2 grid) */}
              <div className="grid grid-cols-2 gap-3 py-2">
                {/* 1. Submit a Report */}
                <button
                  onClick={() => setActiveModal('report')}
                  className="p-3.5 rounded-xl bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200/80 text-left transition-all group flex flex-col items-center justify-center text-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                    Submit a Report
                  </span>
                </button>

                {/* 2. Request Support */}
                <button
                  onClick={() => setActiveModal('support')}
                  className="p-3.5 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200/80 text-left transition-all group flex flex-col items-center justify-center text-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <HandCoins className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-amber-900">
                    Request Support
                  </span>
                </button>

                {/* 3. Update KPI Data */}
                <button
                  onClick={() => setActiveModal('kpi')}
                  className="p-3.5 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200/80 text-left transition-all group flex flex-col items-center justify-center text-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                    Update KPI Data
                  </span>
                </button>

                {/* 4. Upload Documents */}
                <button
                  onClick={() => setActiveModal('upload')}
                  className="p-3.5 rounded-xl bg-sky-50/60 hover:bg-sky-100/70 border border-sky-200/80 text-left transition-all group flex flex-col items-center justify-center text-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-sky-900">
                    Upload Documents
                  </span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Footer (matches bottom bar of right dashboard in reference image) */}
        <footer className="mt-auto bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>Partnering for a Vibrant, Inclusive and United Cultural and Creative Sector.</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span className="font-semibold text-slate-600">Ubuntu Arts NPO</span>
            <span>|</span>
            <span>Last login: 09 Aug 2025 09:42</span>
          </div>
        </footer>

      </div>

      {/* ================= INTERACTIVE MODALS ================= */}

      {/* 1. Request Support Modal */}
      {activeModal === 'support' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">New Support Request (DSAC Vote 37)</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-indigo-200 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSupportSubmit} className="p-5 space-y-4 text-xs">
              {actionSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{actionSuccess}</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Support Category</label>
                    <select
                      value={supportType}
                      onChange={(e) => setSupportType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    >
                      <option>Financial Support</option>
                      <option>Capacity Building</option>
                      <option>Technical Support</option>
                      <option>Governance Support</option>
                      <option>Programme Support</option>
                      <option>Infrastructure Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Estimated Budget (ZAR)</label>
                    <input
                      type="number"
                      value={supportAmount}
                      onChange={(e) => setSupportAmount(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      placeholder="e.g. 150000"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Motivation & Expected Deliverables</label>
                    <textarea
                      rows={3}
                      value={supportMotivation}
                      onChange={(e) => setSupportMotivation(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      placeholder="Detail why this statutory support is required..."
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg font-semibold shadow-xs"
                    >
                      Submit Request
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 2. Submit a Report Modal */}
      {activeModal === 'report' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">Submit Statutory Report & PoE</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-emerald-200 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="p-5 space-y-4 text-xs">
              {actionSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{actionSuccess}</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Report Description</label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Reporting Period</label>
                    <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                      <option>Quarter 2 (Jul - Sep 2025)</option>
                      <option>Quarter 3 (Oct - Dec 2025)</option>
                      <option>Annual Performance Report (2024/25)</option>
                    </select>
                  </div>

                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <div className="font-semibold text-slate-700">Attach Verified Portfolio of Evidence (PDF)</div>
                    <div className="text-[10px] text-slate-400">Section 38 PFMA compliance audit document</div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold shadow-xs"
                    >
                      Sign & Transmit
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 3. Update KPI Data Modal */}
      {activeModal === 'kpi' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Update Active Quarterly KPIs</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-800">Community arts programmes</div>
                <div className="text-[11px] text-slate-500 mb-1">Target: 15 programmes | Achieved: 12</div>
                <input type="number" defaultValue="12" className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs" />
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-800">Youth participants</div>
                <div className="text-[11px] text-slate-500 mb-1">Target: 1 000 youth | Achieved: 850</div>
                <input type="number" defaultValue="850" className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 border rounded-lg text-slate-600">
                Close
              </button>
              <button 
                onClick={() => {
                  setActionSuccess('KPI records updated.');
                  setTimeout(() => {
                    setActionSuccess(null);
                    setActiveModal(null);
                  }, 1200);
                }} 
                className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg font-semibold"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Upload Documents Modal */}
      {activeModal === 'upload' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-sky-600" />
                <span>Upload Statutory Governance Documents</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-2">
              <UploadCloud className="w-8 h-8 text-sky-500 mx-auto" />
              <div className="font-bold text-slate-800">Drag & drop files here, or click to browse</div>
              <div className="text-[10px] text-slate-400">Supports PDF, XLSX, DOCX (Max 25MB)</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 border rounded-lg text-slate-600">
                Cancel
              </button>
              <button 
                onClick={() => {
                  setActionSuccess('File uploaded to DSAC Statutory Repository.');
                  setTimeout(() => {
                    setActionSuccess(null);
                    setActiveModal(null);
                  }, 1200);
                }} 
                className="px-4 py-1.5 bg-sky-600 text-white rounded-lg font-semibold"
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
