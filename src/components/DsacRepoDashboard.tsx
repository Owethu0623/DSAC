import React, { useState } from 'react';
import {
  Building2,
  Users,
  Layers,
  FileCheck,
  AlertCircle,
  Target,
  CheckCircle2,
  Clock,
  XCircle,
  Coins,
  FileText,
  Wallet,
  AlertTriangle,
  Search,
  Bell,
  ChevronDown,
  Calendar,
  Sparkles,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  ExternalLink,
  Filter,
  Check,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { store } from '../services/store';
import { SouthAfricanCoatOfArms, DsacOfficialLogo } from './SouthAfricanCoatOfArms';
import { PublicEntity } from '../types';
import { DsacFeatureSideView, DsacFeatureId } from './features/DsacFeatureSideView';
import { EntityInspectionDrawer } from './features/EntityInspectionDrawer';

interface DsacRepoDashboardProps {
  onNavigateToEntity?: (entityId: string) => void;
  onNavigateToSection?: (section: string) => void;
  onNavigateToEntitiesList?: () => void;
  onOpenReportDetails?: () => void;
  onOpenAuth?: () => void;
}

export const DsacRepoDashboard: React.FC<DsacRepoDashboardProps> = ({
  onNavigateToEntity,
  onNavigateToSection,
  onNavigateToEntitiesList,
  onOpenReportDetails,
  onOpenAuth,
}) => {
  const [activeSidebar, setActiveSidebar] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('This Financial Year');
  const [supportFilter, setSupportFilter] = useState<string>('This Year');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [selectedDrawerEntity, setSelectedDrawerEntity] = useState<PublicEntity | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Dedicated Side View feature state (covers all 26 Public Entities & 6 NPOs)
  const [sideViewFeature, setSideViewFeature] = useState<DsacFeatureId>('compliance');
  const [isSideViewOpen, setIsSideViewOpen] = useState<boolean>(false);
  const [selectedSideViewEntityId, setSelectedSideViewEntityId] = useState<string>('ent-sahra');

  const openFeatureInSideView = (feature: DsacFeatureId, entityId?: string) => {
    setSideViewFeature(feature);
    if (entityId) {
      setSelectedSideViewEntityId(entityId);
    }
    setIsSideViewOpen(true);
    setActiveSidebar(feature);
  };

  const entities = store.entities;

  const currentUser = store.currentUser || {
    name: 'Sicelo Sakhile Mkhize',
    role: 'DSAC_ADMIN',
    designation: 'Chief Director: Public Entities Oversight & Governance',
    email: 'sakhilesicelo94@gmail.com'
  };

  // Stacked KPI Performance by Entity
  const entityKpiData = [
    { name: 'Entity A (SAHRA)', achieved: 65, inProgress: 20, notAchieved: 15, id: 'ent-sahra' },
    { name: 'Entity B (NAC)', achieved: 48, inProgress: 27, notAchieved: 25, id: 'ent-nac' },
    { name: 'Entity C (NFVF)', achieved: 74, inProgress: 16, notAchieved: 10, id: 'ent-nfvf' },
    { name: 'Entity D (Freedom Park)', achieved: 38, inProgress: 32, notAchieved: 30, id: 'ent-fp' },
    { name: 'Entity E (Ubuntu Arts)', achieved: 82, inProgress: 11, notAchieved: 7, id: 'ent-ubuntu-arts' },
  ];

  // Support Given by Type
  const supportTypeData = [
    { type: 'Financial Support', count: 18, color: 'bg-blue-500', max: 20 },
    { type: 'Capacity Building', count: 12, color: 'bg-teal-500', max: 20 },
    { type: 'Technical Support', count: 10, color: 'bg-amber-400', max: 20 },
    { type: 'Governance Support', count: 6, color: 'bg-indigo-600', max: 20 },
    { type: 'Programme Support', count: 5, color: 'bg-rose-400', max: 20 },
    { type: 'Infrastructure Support', count: 3, color: 'bg-yellow-500', max: 20 },
  ];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'entities', label: 'Entities & NPOs', icon: Users },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'support', label: 'Support & Funding', icon: Coins },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'risks', label: 'Risk & Alerts', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'approvals', label: 'Approvals', icon: FileCheck },
    { id: 'settings', label: 'Settings', icon: Filter },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[920px] bg-slate-100 rounded-xl overflow-hidden border border-slate-300/80 shadow-md">
      
      {/* 1. LEFT SIDEBAR (Forest Green with African Motif) */}
      <aside className="w-full lg:w-56 bg-[#044332] text-emerald-100 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Top Logo Watermark in Sidebar */}
          <div className="p-4 border-b border-emerald-800/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-950/90 border border-emerald-500/40 flex items-center justify-center p-1 shadow-inner shrink-0">
                <SouthAfricanCoatOfArms size={32} variant="gold" />
              </div>
              <div>
                <div className="font-bold text-white text-xs tracking-wide">DSAC REPO</div>
                <div className="text-[10px] text-emerald-300/80 font-medium">Statutory Oversight</div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                (!isSideViewOpen && activeSidebar === item.id) ||
                (isSideViewOpen &&
                  (sideViewFeature === item.id ||
                    (item.id === 'analytics' && sideViewFeature === 'performance') ||
                    (item.id === 'approvals' && sideViewFeature === 'reports')));

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'overview') {
                      setIsSideViewOpen(false);
                      setActiveSidebar('overview');
                    } else if (
                      item.id === 'compliance' ||
                      item.id === 'performance' ||
                      item.id === 'support' ||
                      item.id === 'reports' ||
                      item.id === 'entities' ||
                      item.id === 'risks'
                    ) {
                      openFeatureInSideView(item.id as DsacFeatureId);
                    } else if (item.id === 'analytics') {
                      openFeatureInSideView('performance');
                    } else if (item.id === 'approvals') {
                      openFeatureInSideView('reports');
                    } else {
                      setActiveSidebar(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#0c5943] text-white shadow-sm font-semibold ring-1 ring-emerald-400/30'
                      : 'text-emerald-200/80 hover:bg-[#07533f] hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-emerald-400/80'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {['compliance', 'performance', 'support', 'reports', 'entities', 'risks'].includes(item.id) && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950/60 text-emerald-300/80 font-mono">
                      Side
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Geometric Motif & Slogan */}
        <div className="p-4 pt-6 border-t border-emerald-800/50 relative overflow-hidden">
          {/* Subtle South African Geometric Background lines */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-40 h-40 text-emerald-200 fill-current">
              <polygon points="50,0 100,50 50,100 0,50" />
              <polygon points="50,20 80,50 50,80 20,50" />
            </svg>
          </div>

          <div className="relative z-10 space-y-0.5 text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">
            <div className="text-white font-bold text-xs">Culture</div>
            <div>Heritage</div>
            <div>People</div>
            <div className="text-emerald-400 font-bold pt-1">A Better South Africa</div>
          </div>

          <div className="mt-3 pt-2 border-t border-emerald-700/40 flex items-center gap-1.5 text-[10px] text-emerald-300/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live REPO System</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col bg-slate-50 min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          {/* Official DSAC Coat of Arms & Titles */}
          <div className="flex items-center gap-4">
            {/* South African DSAC Brand Official Logo Lockup */}
            <DsacOfficialLogo variant="light" />

            <div className="hidden md:block h-8 w-px bg-slate-200"></div>

            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-none">
                DSAC REPO Dashboard
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Oversight. Insight. Greater Impact.
              </p>
            </div>
          </div>

          {/* Right Controls: Search, Notifications, Profile */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Search input */}
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search entities, reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-30 text-xs">
                  <div className="font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span>Oversight Alerts</span>
                    <span className="text-[10px] text-rose-600 font-semibold">3 Unread</span>
                  </div>
                  <div className="py-2 space-y-2">
                    <div className="p-1.5 rounded bg-rose-50 border border-rose-100 text-rose-900 text-[11px]">
                      Entity B (NAC) missed Q3 deadline.
                    </div>
                    <div className="p-1.5 rounded bg-amber-50 border border-amber-100 text-amber-900 text-[11px]">
                      NPO C low budget utilization flag.
                    </div>
                    <div className="p-1.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-900 text-[11px]">
                      Ubuntu Arts NPO uploaded Q2 PoE.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-teal-800 text-white font-bold text-[10px] flex items-center justify-center">
                  {currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-1">{currentUser.name}</div>
                  <div className="text-[9px] text-emerald-700 font-medium leading-none">
                    {currentUser.role === 'DSAC_ADMIN' ? 'DSAC Admin' : 'DSAC Official'}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-30 text-xs">
                  <div className="p-2 border-b border-slate-100">
                    <div className="font-bold text-slate-800">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">{currentUser.designation}</div>
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
          
          {/* DSAC Official Feature Toolbar: Click any feature to open dedicated Side View for all 26 PEs and 6 NPOs */}
          <div className="bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
              <div>
                <span className="font-extrabold text-slate-900 tracking-wide text-xs">
                  Statutory Oversight Features
                </span>
                <span className="text-[11px] text-slate-500 block sm:inline sm:ml-2">
                  (Side-View Inspector across all 26 Public Entities &amp; 6 NPOs)
                </span>
              </div>
            </div>

            {/* Quick Feature Switcher Buttons for Side View */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'compliance', label: 'Compliance', icon: ShieldCheck, color: 'text-emerald-700' },
                { id: 'performance', label: 'Performance', icon: Target, color: 'text-teal-700' },
                { id: 'support', label: 'Support & Funding', icon: Coins, color: 'text-blue-700' },
                { id: 'reports', label: 'Reports & PoE', icon: FileText, color: 'text-indigo-700' },
                { id: 'entities', label: '26 PEs & 6 NPOs', icon: Building2, color: 'text-slate-700' },
                { id: 'risks', label: 'Risk & Alerts', icon: AlertTriangle, color: 'text-amber-700' },
              ].map(feat => {
                const Icon = feat.icon;
                const isCurrentActive = isSideViewOpen && sideViewFeature === feat.id;
                return (
                  <button
                    key={feat.id}
                    onClick={() => openFeatureInSideView(feat.id as DsacFeatureId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isCurrentActive
                        ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-400/40'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isCurrentActive ? 'text-emerald-300' : feat.color}`} />
                    <span>{feat.label}</span>
                    {isCurrentActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    )}
                  </button>
                );
              })}

              {isSideViewOpen && (
                <button
                  onClick={() => {
                    setIsSideViewOpen(false);
                    setActiveSidebar('overview');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
                  title="Close Side View"
                >
                  Close Side View ✕
                </button>
              )}
            </div>
          </div>

          {/* OVERVIEW DASHBOARD CONTENT (Always rendered) */}
          <div className="space-y-5">
          
          {/* ROW 1: 5 STAT CARDS (Portfolio Overview) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Card 1: 26 Public Entities */}
            <div 
              onClick={() => openFeatureInSideView('entities')}
              className="bg-teal-50/70 hover:bg-teal-50 border border-teal-200/80 rounded-xl p-3.5 flex flex-col justify-between transition-shadow hover:shadow-xs cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 leading-none">26</div>
                <div className="text-xs font-medium text-slate-600 mt-1 flex items-center justify-between">
                  <span>Public Entities</span>
                  <span className="text-[10px] text-teal-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Side View →</span>
                </div>
              </div>
            </div>

            {/* Card 2: 6 NPOs */}
            <div 
              onClick={() => openFeatureInSideView('entities')}
              className="bg-sky-50/70 hover:bg-sky-50 border border-sky-200/80 rounded-xl p-3.5 flex flex-col justify-between transition-shadow hover:shadow-xs cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 leading-none">6</div>
                <div className="text-xs font-medium text-slate-600 mt-1 flex items-center justify-between">
                  <span>NPOs</span>
                  <span className="text-[10px] text-sky-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Side View →</span>
                </div>
              </div>
            </div>

            {/* Card 3: 32 Total Organisations */}
            <div 
              onClick={() => openFeatureInSideView('entities')}
              className="bg-blue-50/70 hover:bg-blue-50 border border-blue-200/80 rounded-xl p-3.5 flex flex-col justify-between transition-shadow hover:shadow-xs cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 leading-none">32</div>
                <div className="text-xs font-medium text-slate-600 mt-1 flex items-center justify-between">
                  <span>Total Organisations</span>
                  <span className="text-[10px] text-blue-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">All 32 Side View →</span>
                </div>
              </div>
            </div>

            {/* Card 4: 24 Reports Submitted (75%) */}
            <div 
              onClick={() => openFeatureInSideView('reports')}
              className="bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex flex-col justify-between transition-shadow hover:shadow-xs cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 leading-none">24</div>
                <div className="text-xs font-medium text-slate-600 mt-1 flex items-center justify-between">
                  <div>Reports Submitted <span className="text-emerald-700 font-bold block sm:inline">This Quarter (75%)</span></div>
                  <span className="text-[10px] text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Side View →</span>
                </div>
              </div>
            </div>

            {/* Card 5: 8 Reports Outstanding (25%) */}
            <div 
              onClick={() => openFeatureInSideView('compliance')}
              className="bg-rose-50/70 hover:bg-rose-50 border border-rose-200/80 rounded-xl p-3.5 flex flex-col justify-between transition-shadow hover:shadow-xs col-span-2 sm:col-span-1 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 leading-none">8</div>
                <div className="text-xs font-medium text-slate-600 mt-1 flex items-center justify-between">
                  <div>Reports Outstanding <span className="text-rose-700 font-bold block sm:inline">(25%)</span></div>
                  <span className="text-[10px] text-rose-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Side View →</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: 4 STAT CARDS (KPI Delivery Breakdown) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total KPIs */}
            <div 
              onClick={() => openFeatureInSideView('performance')}
              className="bg-blue-50/50 hover:bg-blue-50/80 border border-blue-200/60 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-none">132</div>
                <div className="text-xs text-slate-600 font-medium">Total KPIs (Side View)</div>
              </div>
            </div>

            {/* Achieved */}
            <div 
              onClick={() => openFeatureInSideView('performance')}
              className="bg-emerald-50/50 hover:bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-none">
                  78 <span className="text-xs font-semibold text-emerald-700">(59%)</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">Achieved (Inspect)</div>
              </div>
            </div>

            {/* In Progress */}
            <div 
              onClick={() => openFeatureInSideView('performance')}
              className="bg-amber-50/50 hover:bg-amber-50/80 border border-amber-200/60 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-none">
                  36 <span className="text-xs font-semibold text-amber-700">(27%)</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">In Progress (Inspect)</div>
              </div>
            </div>

            {/* Not Achieved */}
            <div 
              onClick={() => openFeatureInSideView('risks')}
              className="bg-rose-50/50 hover:bg-rose-50/80 border border-rose-200/60 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 leading-none">
                  18 <span className="text-xs font-semibold text-rose-700">(14%)</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">Not Achieved (Risks)</div>
              </div>
            </div>
          </div>

          {/* ROW 3: 4 STAT CARDS (Financial & High Risk Summary) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Support Approved */}
            <div 
              onClick={() => openFeatureInSideView('support')}
              className="bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 leading-none">R 125.4M</div>
                <div className="text-xs text-slate-600 font-medium">Support &amp; Funding →</div>
              </div>
            </div>

            {/* Total Amount Utilized */}
            <div 
              onClick={() => openFeatureInSideView('support')}
              className="bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200/80 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 leading-none">
                  R 98.6M <span className="text-xs font-semibold text-indigo-700">(79%)</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">Tranches &amp; Utilization →</div>
              </div>
            </div>

            {/* Remaining Balance */}
            <div 
              onClick={() => openFeatureInSideView('support')}
              className="bg-cyan-50/70 hover:bg-cyan-50 border border-cyan-200/80 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 leading-none">
                  R 26.8M <span className="text-xs font-semibold text-cyan-700">(21%)</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">Disbursements Pending →</div>
              </div>
            </div>

            {/* Entities at High Risk */}
            <div 
              onClick={() => openFeatureInSideView('risks')}
              className="bg-rose-50/70 hover:bg-rose-50 border border-rose-200/80 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-black text-rose-700 leading-none">5</div>
                <div className="text-xs text-slate-600 font-medium">Entities at High Risk →</div>
              </div>
            </div>
          </div>

          {/* ROW 4: CHARTS (KPI Performance by Entity & Budget Utilization Donut) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* KPI Performance by Entity (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">KPI Performance by Entity</h2>
                <button 
                  onClick={() => openFeatureInSideView('performance')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>Side View</span>
                  <span>→</span>
                </button>
              </div>

              {/* Stacked Horizontal Bar Chart */}
              <div className="py-4 space-y-3">
                {entityKpiData.map((ent) => (
                  <div 
                    key={ent.id} 
                    onClick={() => openFeatureInSideView('performance', ent.id)}
                    className="space-y-1 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                    title={`Inspect ${ent.name} in Performance Side View`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <span className="font-bold text-slate-800 group-hover:text-emerald-700 flex items-center gap-1">
                        {ent.name}
                        <span className="text-[10px] text-slate-400 group-hover:text-emerald-600">→</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {ent.achieved}% Achieved
                      </span>
                    </div>

                    {/* Stacked Bar */}
                    <div className="h-4 w-full bg-slate-100 rounded-md overflow-hidden flex shadow-inner">
                      <div 
                        style={{ width: `${ent.achieved}%` }}
                        className="bg-emerald-500 h-full transition-all duration-500 hover:opacity-90"
                        title={`Achieved: ${ent.achieved}%`}
                      />
                      <div 
                        style={{ width: `${ent.inProgress}%` }}
                        className="bg-amber-400 h-full transition-all duration-500 hover:opacity-90"
                        title={`In Progress: ${ent.inProgress}%`}
                      />
                      <div 
                        style={{ width: `${ent.notAchieved}%` }}
                        className="bg-rose-500 h-full transition-all duration-500 hover:opacity-90"
                        title={`Not Achieved: ${ent.notAchieved}%`}
                      />
                    </div>
                  </div>
                ))}

                {/* X Axis scale */}
                <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>0</span>
                  <span>20</span>
                  <span>40</span>
                  <span>60</span>
                  <span>80</span>
                  <span>100</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 pt-2 text-xs border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600 font-medium">Achieved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="text-slate-600 font-medium">In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-slate-600 font-medium">Not Achieved</span>
                </div>
              </div>
            </div>

            {/* Budget Utilization Donut (1 col) */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Budget Utilization</h2>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1"
                >
                  <option>This Financial Year</option>
                  <option>2024/2025</option>
                  <option>2023/2024</option>
                </select>
              </div>

              {/* SVG Donut Chart with Center Metric */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Background Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f1f5f9"
                      strokeWidth="15"
                      fill="none"
                    />
                    {/* Utilized Segment (79%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#0ea5e9"
                      strokeWidth="15"
                      strokeDasharray="238.76"
                      strokeDashoffset="50.14" // 79%
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Remaining Segment (21%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f43f5e"
                      strokeWidth="15"
                      strokeDasharray="238.76"
                      strokeDashoffset="188.62" // 21%
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-black text-slate-900 leading-none">R 98.6M</span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Utilized</span>
                    <span className="text-xs font-bold text-emerald-600 mt-0.5">(79%)</span>
                  </div>
                </div>
              </div>

              {/* Legend with Values */}
              <div className="space-y-1.5 pt-2 text-xs border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600">R 125.4M Approved</span>
                  </div>
                  <span className="font-semibold text-slate-800">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span className="text-slate-600">R 98.6M Utilized</span>
                  </div>
                  <span className="font-semibold text-slate-800">79%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-slate-600">R 26.8M Remaining</span>
                  </div>
                  <span className="font-semibold text-slate-800">21%</span>
                </div>
              </div>
            </div>

          </div>

          {/* ROW 5: 3 COLUMNS (Compliance Status, Support Given by Type, Risk Overview) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Column 1: Compliance Status */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Compliance Status</h3>
                <button 
                  onClick={() => openFeatureInSideView('compliance')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>Side View</span>
                  <span>→</span>
                </button>
              </div>

              {/* Circular Gauge */}
              <div 
                onClick={() => openFeatureInSideView('compliance')}
                className="flex items-center justify-center py-4 cursor-pointer group"
                title="Inspect Compliance in Side View"
              >
                <div className="relative w-32 h-32 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f1f5f9"
                      strokeWidth="14"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#10b981"
                      strokeWidth="14"
                      strokeDasharray="251.32"
                      strokeDashoffset="62.83" // 75%
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-base font-black text-slate-900 leading-tight">75%</span>
                    <span className="text-[10px] font-bold text-emerald-700 leading-none">Compliant</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Click to view</span>
                  </div>
                </div>
              </div>

              {/* Legend with counts */}
              <div className="space-y-1 text-xs border-t border-slate-100 pt-2">
                <div 
                  onClick={() => openFeatureInSideView('compliance')}
                  className="flex items-center justify-between p-1 rounded hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600">Compliant</span>
                  </div>
                  <span className="font-bold text-slate-900">24</span>
                </div>
                <div 
                  onClick={() => openFeatureInSideView('compliance')}
                  className="flex items-center justify-between p-1 rounded hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="text-slate-600">At Risk</span>
                  </div>
                  <span className="font-bold text-slate-900">5</span>
                </div>
                <div 
                  onClick={() => openFeatureInSideView('compliance')}
                  className="flex items-center justify-between p-1 rounded hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-slate-600">Overdue</span>
                  </div>
                  <span className="font-bold text-slate-900">3</span>
                </div>
              </div>
            </div>

            {/* Column 2: Support Given by Type */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Support Given by Type</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openFeatureInSideView('support')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <span>Side View</span>
                    <span>→</span>
                  </button>
                  <select 
                    value={supportFilter}
                    onChange={(e) => setSupportFilter(e.target.value)}
                    className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                  >
                    <option>This Year</option>
                    <option>All Time</option>
                  </select>
                </div>
              </div>

              {/* Bars */}
              <div className="py-2 space-y-2.5">
                {supportTypeData.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => openFeatureInSideView('support')}
                    className="space-y-0.5 p-1 rounded hover:bg-slate-50 cursor-pointer group"
                    title={`Open ${item.type} in Support Side View`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="font-medium text-[11px] truncate group-hover:text-emerald-700">{item.type}</span>
                      <span className="font-bold text-slate-900 text-xs">{item.count}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${(item.count / item.max) * 100}%` }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-slate-400 text-right pt-1 border-t border-slate-100">
                Aggregate Statutory Capacity Support
              </div>
            </div>

            {/* Column 3: Risk Overview */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Risk Overview</h3>
                <button 
                  onClick={() => openFeatureInSideView('risks')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>Side View</span>
                  <span>→</span>
                </button>
              </div>

              {/* Risk Items */}
              <div className="py-2 space-y-2">
                <div 
                  onClick={() => openFeatureInSideView('risks')}
                  className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 cursor-pointer group transition-colors"
                  title="Open Low Risk in Side View"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-semibold text-emerald-900 group-hover:underline">Low Risk</span>
                  </div>
                  <span className="font-black text-sm text-emerald-950">18</span>
                </div>

                <div 
                  onClick={() => openFeatureInSideView('risks')}
                  className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100 hover:bg-amber-50 cursor-pointer group transition-colors"
                  title="Open Medium Risk in Side View"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="text-xs font-semibold text-amber-900 group-hover:underline">Medium Risk</span>
                  </div>
                  <span className="font-black text-sm text-amber-950">9</span>
                </div>

                <div 
                  onClick={() => openFeatureInSideView('risks')}
                  className="flex items-center justify-between p-2 rounded-lg bg-orange-50/60 border border-orange-100 hover:bg-orange-50 cursor-pointer group transition-colors"
                  title="Open High Risk in Side View"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span className="text-xs font-semibold text-orange-900 group-hover:underline">High Risk</span>
                  </div>
                  <span className="font-black text-sm text-orange-950">4</span>
                </div>

                <div 
                  onClick={() => openFeatureInSideView('risks')}
                  className="flex items-center justify-between p-2 rounded-lg bg-rose-50/60 border border-rose-100 hover:bg-rose-50 cursor-pointer group transition-colors"
                  title="Open Critical Risk in Side View"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <span className="text-xs font-semibold text-rose-900 group-hover:underline">Critical Risk</span>
                  </div>
                  <span className="font-black text-sm text-rose-950">1</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-100">
                Section 38 PFMA Risk Classifications
              </div>
            </div>

          </div>

          {/* ROW 6: UPCOMING DEADLINES & RECENT ALERTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Upcoming Deadlines</span>
                </h3>
                <button 
                  onClick={() => openFeatureInSideView('reports')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>Side View</span>
                  <span>→</span>
                </button>
              </div>

              <div className="py-3 space-y-3">
                {/* Q2 Reports */}
                <div 
                  onClick={() => openFeatureInSideView('reports')}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Q2 Reports – 5 entities</div>
                      <div className="text-[11px] text-slate-400">15 Aug 2025</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    5 days left
                  </span>
                </div>

                {/* Annual Reports */}
                <div 
                  onClick={() => openFeatureInSideView('reports')}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Annual Reports – 3 entities</div>
                      <div className="text-[11px] text-slate-400">31 Aug 2025</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    21 days left
                  </span>
                </div>

                {/* Budget Submissions */}
                <div 
                  onClick={() => openFeatureInSideView('reports')}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Budget Submissions – 4 NPOs</div>
                      <div className="text-[11px] text-slate-400">31 Aug 2025</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    21 days left
                  </span>
                </div>

                {/* Audit Reports */}
                <div 
                  onClick={() => openFeatureInSideView('reports')}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Audit Reports – 2 entities</div>
                      <div className="text-[11px] text-slate-400">30 Sep 2025</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                    51 days left
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Recent Alerts</span>
                </h3>
                <button 
                  onClick={() => openFeatureInSideView('risks')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>Side View</span>
                  <span>→</span>
                </button>
              </div>

              <div className="py-3 space-y-3">
                {/* Alert 1 */}
                <div 
                  onClick={() => openFeatureInSideView('compliance')}
                  className="flex items-start justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  title="Inspect non-compliant reporting in Side View"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]">
                      !
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 hover:text-rose-700">Entity B has missed two consecutive reporting periods</div>
                      <div className="text-[11px] text-slate-400">2 hours ago · Click to inspect in Compliance Side View</div>
                    </div>
                  </div>
                </div>

                {/* Alert 2 */}
                <div 
                  onClick={() => openFeatureInSideView('support')}
                  className="flex items-start justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  title="Inspect NPO budget utilization in Support Side View"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]">
                      !
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 hover:text-amber-700">NPO C budget utilization is below 40%</div>
                      <div className="text-[11px] text-slate-400">5 hours ago · Click to inspect in Support Side View</div>
                    </div>
                  </div>
                </div>

                {/* Alert 3 */}
                <div 
                  onClick={() => openFeatureInSideView('risks')}
                  className="flex items-start justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  title="Inspect unresolved audit findings in Risk Side View"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]">
                      !
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 hover:text-rose-700">Entity D has 3 unresolved audit findings</div>
                      <div className="text-[11px] text-slate-400">1 day ago · Click to inspect in Risk Side View</div>
                    </div>
                  </div>
                </div>

                {/* Alert 4 */}
                <div 
                  onClick={() => openFeatureInSideView('compliance')}
                  className="flex items-start justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  title="Inspect governance documents in Compliance Side View"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]">
                      !
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 hover:text-amber-700">5 entities have outstanding governance documents</div>
                      <div className="text-[11px] text-slate-400">1 day ago · Click to inspect in Compliance Side View</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          </div>

        </div>

        {/* Universal DSAC Feature Side View (Covers Compliance, Performance, Support & Funding, Reports, 32 Entities, and Risks) */}
        <DsacFeatureSideView
          isOpen={isSideViewOpen}
          onClose={() => {
            setIsSideViewOpen(false);
            setActiveSidebar('overview');
          }}
          activeFeature={sideViewFeature}
          onChangeFeature={(feat) => {
            setSideViewFeature(feat);
            setActiveSidebar(feat);
          }}
          selectedEntityId={selectedSideViewEntityId}
          onSelectEntityId={(id) => setSelectedSideViewEntityId(id)}
          onOpenWorkspace={onNavigateToEntity}
        />

        {/* Entity Inspection Drawer (fallback for direct entity clicks if needed) */}
        <EntityInspectionDrawer
          entity={selectedDrawerEntity}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onOpenWorkspace={onNavigateToEntity}
          onNavigateToFeature={(feat) => openFeatureInSideView(feat as DsacFeatureId)}
        />

        {/* Footer (matches bottom bar of left dashboard in reference image) */}
        <footer className="mt-auto bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">DSAC REPO</span>
            <span>|</span>
            <span>One Portfolio. A Stronger Creative and Sporting Nation.</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Last updated: 09 Aug 2025 10:24
          </div>
        </footer>

      </div>

    </div>
  );
};
