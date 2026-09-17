import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  LogOut,
  Settings
} from 'lucide-react';
import { store } from '../services/store';
import { SouthAfricanCoatOfArms, DsacOfficialLogo } from './SouthAfricanCoatOfArms';
import { PublicEntity } from '../types';
import { DsacFeatureSideView, DsacFeatureId } from './features/DsacFeatureSideView';
import { EntityInspectionDrawer } from './features/EntityInspectionDrawer';
import { DsacEntitiesView } from './features/DsacEntitiesView';
import { DsacPerformanceView } from './features/DsacPerformanceView';
import { DsacComplianceView } from './features/DsacComplianceView';
import { DsacSupportView } from './features/DsacSupportView';
import { DsacReportsView } from './features/DsacReportsView';
import { DsacRiskView } from './features/DsacRiskView';
import { DsacAnalyticsView } from './features/DsacAnalyticsView';
import { DsacSettingsView } from './features/DsacSettingsView';
import { AIPerformanceAnalyst } from './AIPerformanceAnalyst';
import { TaskManagementView } from './TaskManagementView';
import { AuditLogView } from './AuditLogView';

interface DsacRepoDashboardProps {
  onNavigateToEntity?: (entityId: string) => void;
  onNavigateToSection?: (section: string) => void;
  onNavigateToEntitiesList?: () => void;
  onOpenReportDetails?: () => void;
  onLogout?: () => void;
  initialSection?: string;
}

export const DsacRepoDashboard: React.FC<DsacRepoDashboardProps> = ({
  onNavigateToEntity,
  onNavigateToSection,
  onNavigateToEntitiesList,
  onOpenReportDetails,
  onLogout,
  initialSection = 'overview',
}) => {
  const [activeSidebar, setActiveSidebar] = useState<string>(initialSection);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('This Financial Year');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [selectedDrawerEntity, setSelectedDrawerEntity] = useState<PublicEntity | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [kpiFilter, setKpiFilter] = useState<'ALL' | 'PUBLIC_ENTITY' | 'NPO'>('ALL');

  // Real-time store subscription
  const [, setTick] = useState(0);
  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  // Dedicated Side View feature state (covers all 26 Public Entities & 6 NPOs)
  const [sideViewFeature, setSideViewFeature] = useState<DsacFeatureId>('compliance');
  const [isSideViewOpen, setIsSideViewOpen] = useState<boolean>(false);
  const [selectedSideViewEntityId, setSelectedSideViewEntityId] = useState<string>('ent-sahra');
  const [sideViewEntityFilter, setSideViewEntityFilter] = useState<'ALL' | 'PUBLIC_ENTITY' | 'NPO'>('ALL');

  const openFeatureInSideView = (feature: DsacFeatureId, entityId?: string, entityFilter?: 'ALL' | 'PUBLIC_ENTITY' | 'NPO') => {
    setSideViewFeature(feature);
    if (entityFilter) {
      setSideViewEntityFilter(entityFilter);
    }
    if (entityId) {
      setSelectedSideViewEntityId(entityId);
    } else if (feature === 'support') {
      setSelectedSideViewEntityId('ent-sahra');
    }
    setIsSideViewOpen(true);
    setActiveSidebar(feature);
  };

  const entities = store.entities;
  const pulse = store.getPerformancePulse();

  // Aggregate calculations across all 26 Public Entities and 6 NPOs (billions and millions)
  const totalApprovedBudget = entities.reduce((sum, e) => sum + (e.budgetAllocationZAR || 0), 0);
  const totalTransferredToDate = entities.reduce((sum, e) => sum + (e.transferredAmountZAR || 0), 0);
  const totalReportedExpenditure = entities.reduce((sum, e) => sum + (e.reportedExpenditureZAR || 0), 0);
  const remainingDisbursement = Math.max(0, totalApprovedBudget - totalTransferredToDate);
  const transferRate = totalApprovedBudget > 0 ? (totalTransferredToDate / totalApprovedBudget) * 100 : 0;
  const expenditureRate = totalTransferredToDate > 0 ? (totalReportedExpenditure / totalTransferredToDate) * 100 : 0;
  const highRiskEntitiesCount = entities.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL').length;
  const highRiskEntities = entities.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL');

  // Institution category breakdowns for graphs
  const peEntities = entities.filter(e => e.type === 'PUBLIC_ENTITY');
  const npoEntities = entities.filter(e => e.type === 'NPO');
  const peBudget = peEntities.reduce((sum, e) => sum + (e.budgetAllocationZAR || 0), 0);
  const npoBudget = npoEntities.reduce((sum, e) => sum + (e.budgetAllocationZAR || 0), 0);
  const peTransfer = peEntities.reduce((sum, e) => sum + (e.transferredAmountZAR || 0), 0);
  const npoTransfer = npoEntities.reduce((sum, e) => sum + (e.transferredAmountZAR || 0), 0);
  const pePercentage = totalApprovedBudget > 0 ? (peBudget / totalApprovedBudget) * 100 : 87.9;
  const npoPercentage = totalApprovedBudget > 0 ? (npoBudget / totalApprovedBudget) * 100 : 12.1;

  const formatZAR = (val: number) => {
    if (val >= 1_000_000_000) {
      return `R ${(val / 1_000_000_000).toFixed(2)}B`;
    }
    if (val >= 1_000_000) {
      return `R ${(val / 1_000_000).toFixed(1)}M`;
    }
    return `R ${val.toLocaleString()}`;
  };

  // Year-based calculations for Budget Utilization card
  const getYearData = () => {
    if (selectedYear.includes('2024/2025')) {
      const budget = Math.round(totalApprovedBudget * 0.945);
      const spent = Math.round(budget * 0.962);
      const rem = budget - spent;
      return {
        label: '2024/2025 Financial Year',
        approved: budget,
        utilized: spent,
        remaining: rem,
        utilPercent: 96.2,
        remPercent: 3.8,
        statusTitle: 'Audited Expenditure',
      };
    } else if (selectedYear.includes('2023/2024')) {
      const budget = Math.round(totalApprovedBudget * 0.892);
      const spent = Math.round(budget * 0.978);
      const rem = budget - spent;
      return {
        label: '2023/2024 Financial Year',
        approved: budget,
        utilized: spent,
        remaining: rem,
        utilPercent: 97.8,
        remPercent: 2.2,
        statusTitle: 'Audited Expenditure',
      };
    } else {
      return {
        label: '2025/2026 (Current)',
        approved: totalApprovedBudget,
        utilized: totalTransferredToDate,
        remaining: remainingDisbursement,
        utilPercent: Math.round(transferRate * 10) / 10,
        remPercent: Math.round((100 - transferRate) * 10) / 10,
        statusTitle: 'Transferred to Date',
      };
    }
  };

  const yearMetrics = getYearData();

  const currentUser = store.currentUser || {
    name: 'Sicelo Sakhile Mkhize',
    role: 'DSAC_ADMIN',
    designation: 'Chief Director: Public Entities Governance & Support',
    email: 'sakhilesicelo94@gmail.com'
  };

  // Actual Names of Entities and NPOs currently under the Department
  const actualEntityKpis = [
    { name: 'South African Heritage Resources Agency (SAHRA)', shortName: 'SAHRA', type: 'PUBLIC_ENTITY', achieved: 65, inProgress: 20, notAchieved: 15, id: 'ent-sahra' },
    { name: 'National Arts Council of South Africa (NAC)', shortName: 'NAC', type: 'PUBLIC_ENTITY', achieved: 52, inProgress: 23, notAchieved: 25, id: 'ent-nac' },
    { name: 'National Film and Video Foundation (NFVF)', shortName: 'NFVF', type: 'PUBLIC_ENTITY', achieved: 74, inProgress: 16, notAchieved: 10, id: 'ent-nfvf' },
    { name: 'Freedom Park Heritage Destination', shortName: 'Freedom Park', type: 'PUBLIC_ENTITY', achieved: 68, inProgress: 20, notAchieved: 12, id: 'ent-freedom-park' },
    { name: 'The South African State Theatre (Pretoria)', shortName: 'State Theatre', type: 'PUBLIC_ENTITY', achieved: 71, inProgress: 19, notAchieved: 10, id: 'ent-state-theatre' },
    { name: 'Ubuntu Arts Community NPO', shortName: 'Ubuntu Arts NPO', type: 'NPO', achieved: 82, inProgress: 11, notAchieved: 7, id: 'ent-ubuntu-arts' },
    { name: 'Business and Arts South Africa (BASA)', shortName: 'BASA NPO', type: 'NPO', achieved: 88, inProgress: 8, notAchieved: 4, id: 'ent-basa' },
    { name: 'Boxing South Africa (BSA)', shortName: 'Boxing SA', type: 'PUBLIC_ENTITY', achieved: 40, inProgress: 25, notAchieved: 35, id: 'ent-bsa' },
    { name: 'Iziko Museums of South Africa', shortName: 'Iziko Museums', type: 'PUBLIC_ENTITY', achieved: 77, inProgress: 15, notAchieved: 8, id: 'ent-iziko' },
    { name: 'Market Theatre Foundation', shortName: 'Market Theatre', type: 'PUBLIC_ENTITY', achieved: 79, inProgress: 14, notAchieved: 7, id: 'ent-market-theatre' },
    { name: 'South African Cultural Observatory (SACO)', shortName: 'SACO NPO', type: 'NPO', achieved: 85, inProgress: 10, notAchieved: 5, id: 'ent-saco' },
    { name: 'Blind SA Accessible Cultural Media', shortName: 'Blind SA NPO', type: 'NPO', achieved: 80, inProgress: 12, notAchieved: 8, id: 'ent-blind-sa' },
  ];

  const displayedEntityKpis = kpiFilter === 'ALL'
    ? actualEntityKpis
    : actualEntityKpis.filter(e => e.type === kpiFilter);

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
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-row min-h-screen w-full bg-slate-100">
      
      {/* 1. Official DSAC Dark Green Sidebar (Always positioned on left of content) */}
      <aside className="w-48 sm:w-56 shrink-0 bg-[#044332] text-emerald-100 flex flex-col justify-between select-none border-r border-emerald-950 min-h-screen sticky top-0 self-start z-30">
        <div>
          {/* Logo & Header in Sidebar */}
          <div className="p-4 border-b border-emerald-800/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center p-1 shadow-inner shrink-0">
              <SouthAfricanCoatOfArms size={30} variant="gold" />
            </div>
            <div>
              <div className="font-black text-white text-xs tracking-wider">DSAC REPO</div>
              <div className="text-[10px] text-emerald-300/80 font-medium">Statutory Oversight</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSidebar === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'support') {
                      openFeatureInSideView('support', 'ent-sahra');
                    } else if (item.id === 'compliance' || item.id === 'performance' || item.id === 'reports' || item.id === 'risks') {
                      openFeatureInSideView(item.id as DsacFeatureId);
                    } else if (item.id === 'entities') {
                      openFeatureInSideView('entities');
                    } else {
                      setActiveSidebar(item.id);
                    }
                    if (onNavigateToSection && item.id !== 'overview') {
                      onNavigateToSection(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#0c5943] text-white shadow-sm font-bold ring-1 ring-emerald-400/40'
                      : 'text-emerald-200/80 hover:bg-[#07533f] hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-emerald-400/80'}`} />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Slogan Motif (Exact match to image.png) */}
        <div className="p-4 pt-6 border-t border-emerald-800/60 relative overflow-hidden">
          <div className="space-y-0.5 text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">
            <div className="text-white font-bold text-xs">Culture</div>
            <div>Heritage</div>
            <div>People</div>
            <div className="text-emerald-400 font-bold pt-1">A Better South Africa</div>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3.5 min-w-0">
            <DsacOfficialLogo variant="light" />
            <div className="hidden sm:block h-7 w-px bg-slate-200" />
            <div className="truncate">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                DSAC REPO Dashboard
              </h1>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Oversight. Insight. Greater Impact.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search */}
            <div className="relative hidden md:block w-48 lg:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search entities, reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Notification Bell with Badge 3 */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
            </div>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#044332] text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-700/50 shadow-xs shrink-0">
                {store.currentUser?.name
                  ? store.currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  : 'SM'}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-bold text-slate-800 leading-none">
                  {store.currentUser?.name || 'Sicelo Sakhile Mkhize'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {store.currentUser?.designation || 'Chief Director: Oversight'}
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all shadow-xs cursor-pointer ml-1"
                  title="Sign Out of DSAC REPO"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* VIEW 1: OVERVIEW DASHBOARD */}
        {activeSidebar === 'overview' && (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          
          {/* OVERVIEW DASHBOARD CONTENT (Always rendered) */}
          <div className="space-y-5">
          
          {/* ROW 1: 5-ITEM EXECUTIVE CATALOG RIBBON (In one line, beautifully styled) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Card 1: 26 Public Entities */}
              <div 
                onClick={() => openFeatureInSideView('entities', undefined, 'PUBLIC_ENTITY')}
                className="bg-teal-50/60 hover:bg-teal-50 border border-teal-200/70 hover:border-teal-400 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full">
                    PFMA 3A
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">26</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">Public Entities</div>
                  <div className="text-[11px] text-slate-500 font-medium">Statutory Institutions</div>
                </div>
                <div className="pt-2 border-t border-teal-100/80 flex items-center justify-between text-xs font-bold text-teal-800 group-hover:text-teal-900">
                  <span>Side View</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: 6 NPOs */}
              <div 
                onClick={() => openFeatureInSideView('entities', undefined, 'NPO')}
                className="bg-sky-50/60 hover:bg-sky-50 border border-sky-200/70 hover:border-sky-400 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded-full">
                    Subsidized
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">6</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">NPOs</div>
                  <div className="text-[11px] text-slate-500 font-medium">Cultural Non-Profits</div>
                </div>
                <div className="pt-2 border-t border-sky-100/80 flex items-center justify-between text-xs font-bold text-sky-800 group-hover:text-sky-900">
                  <span>Side View</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: 32 Total Organisations */}
              <div 
                onClick={() => openFeatureInSideView('entities', undefined, 'ALL')}
                className="bg-blue-50/60 hover:bg-blue-50 border border-blue-200/70 hover:border-blue-400 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-full">
                    Portfolio
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">32</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">Total Organisations</div>
                  <div className="text-[11px] text-slate-500 font-medium">26 PEs + 6 NPOs</div>
                </div>
                <div className="pt-2 border-t border-blue-100/80 flex items-center justify-between text-xs font-bold text-blue-800 group-hover:text-blue-900">
                  <span>All 32 Side View</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 4: 24 Reports Submitted (75%) */}
              <div 
                onClick={() => openFeatureInSideView('reports')}
                className="bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/70 hover:border-emerald-400 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    75% Compliant
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">24</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">Reports Submitted</div>
                  <div className="text-[11px] font-bold text-emerald-700">This Quarter (75%)</div>
                </div>
                <div className="pt-2 border-t border-emerald-100/80 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-900">
                  <span>Side View</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 5: 8 Reports Outstanding (25%) */}
              <div 
                onClick={() => openFeatureInSideView('compliance')}
                className="bg-rose-50/60 hover:bg-rose-50 border border-rose-200/70 hover:border-rose-400 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-xs col-span-1 sm:col-span-2 md:col-span-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100/70 px-2 py-0.5 rounded-full">
                    25% Pending
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-3xl font-black text-slate-900 tracking-tight leading-none">8</div>
                  <div className="text-xs font-bold text-slate-800 mt-1">Reports Outstanding</div>
                  <div className="text-[11px] font-bold text-rose-700">(25%) Clearance Required</div>
                </div>
                <div className="pt-2 border-t border-rose-100/80 flex items-center justify-between text-xs font-bold text-rose-800 group-hover:text-rose-900">
                  <span>Side View</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: BUDGET UTILIZATION & FINANCIAL PERFORMANCE DECK (Directly after Catalog Feature) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            
            {/* Left Column: Budget Utilization Card (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">Budget Utilization</h2>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Vote 40
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Matched to portfolio allocations</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openFeatureInSideView('support', 'ent-sahra')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1 hover:underline"
                    title="Open Support & Funding Side View"
                  >
                    <span>View All</span>
                  </button>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1.5 cursor-pointer focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                  >
                    <option>This Financial Year</option>
                    <option>2024/2025</option>
                    <option>2023/2024</option>
                  </select>
                </div>
              </div>

              {/* SVG Donut Chart with Center Metric */}
              <div 
                onClick={() => openFeatureInSideView('support', 'ent-sahra')}
                className="flex flex-col items-center justify-center py-4 cursor-pointer group"
                title="Inspect Financial Tranches in Side View"
              >
                <div className="relative w-44 h-44 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Background Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#f1f5f9"
                      strokeWidth="13"
                      fill="none"
                    />
                    {/* Utilized Segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#059669"
                      strokeWidth="13"
                      strokeDasharray="238.76"
                      strokeDashoffset={238.76 * (1 - (yearMetrics.utilPercent / 100))}
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Remaining Segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#0ea5e9"
                      strokeWidth="13"
                      strokeDasharray="238.76"
                      strokeDashoffset={238.76 * (1 - (yearMetrics.remPercent / 100))}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {selectedYear.includes('2024') || selectedYear.includes('2023') ? yearMetrics.label.split(' ')[0] : 'This Financial Year'}
                    </span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight leading-none mt-1">
                      {formatZAR(yearMetrics.utilized)}
                    </span>
                    <span className="text-[11px] text-slate-600 font-semibold mt-1">
                      {yearMetrics.statusTitle}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
                      ({yearMetrics.utilPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantitative Legend & Progress Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="text-slate-700 font-medium">{formatZAR(yearMetrics.approved)} Approved</span>
                    </div>
                    <span className="font-bold text-slate-900">100%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-full rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                      <span className="text-slate-700 font-medium">{formatZAR(yearMetrics.utilized)} {yearMetrics.statusTitle}</span>
                    </div>
                    <span className="font-bold text-emerald-700">{yearMetrics.utilPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div style={{ width: `${yearMetrics.utilPercent}%` }} className="bg-emerald-600 h-full rounded-full transition-all" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0"></span>
                      <span className="text-slate-700 font-medium">{formatZAR(yearMetrics.remaining)} Balance Pending</span>
                    </div>
                    <span className="font-bold text-sky-700">{yearMetrics.remPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div style={{ width: `${yearMetrics.remPercent}%` }} className="bg-sky-500 h-full rounded-full transition-all" />
                  </div>
                </div>

                <button
                  onClick={() => openFeatureInSideView('support', 'ent-sahra')}
                  className="w-full mt-1 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-700 cursor-pointer group"
                >
                  <span>Inspect Tranche Allocation in Side View</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Column: Companion Financial Allocation Graphs & High Risk Card (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col gap-4 justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                {/* Graph 1: Total Approved Budget */}
                <div 
                  onClick={() => openFeatureInSideView('support')}
                  className="bg-white hover:bg-slate-50/70 border border-slate-200/90 hover:border-emerald-300 rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Coins className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                        Statutory Vote 40
                      </span>
                    </div>
                    
                    <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                      {formatZAR(totalApprovedBudget)}
                    </div>
                    <div className="text-xs text-slate-800 font-bold mt-1.5">Total Approved Budget</div>
                    <div className="text-[11px] text-slate-500 font-medium">All 26 PEs &amp; 6 Subsidized NPOs</div>
                  </div>

                  {/* Visual Graph: Allocation Breakdown Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" />
                        26 PEs ({pePercentage.toFixed(0)}%)
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                        6 NPOs ({npoPercentage.toFixed(0)}%)
                      </span>
                    </div>

                    {/* Stacked Progress Bar Graph */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      <div 
                        style={{ width: `${pePercentage}%` }} 
                        className="h-full bg-teal-600 transition-all duration-500" 
                        title={`Public Entities: ${formatZAR(peBudget)} (${pePercentage.toFixed(1)}%)`}
                      />
                      <div 
                        style={{ width: `${npoPercentage}%` }} 
                        className="h-full bg-sky-500 transition-all duration-500" 
                        title={`Subsidized NPOs: ${formatZAR(npoBudget)} (${npoPercentage.toFixed(1)}%)`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>PEs: {formatZAR(peBudget)}</span>
                      <span>NPOs: {formatZAR(npoBudget)}</span>
                    </div>
                  </div>
                </div>

                {/* Graph 2: Transfer to Date & Remaining Disbursal */}
                <div 
                  onClick={() => openFeatureInSideView('support')}
                  className="bg-white hover:bg-slate-50/70 border border-slate-200/90 hover:border-indigo-300 rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                        {transferRate.toFixed(1)}% Disbursed
                      </span>
                    </div>
                    
                    <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                      {formatZAR(totalTransferredToDate)}{' '}
                      <span className="text-base font-bold text-indigo-700">({transferRate.toFixed(1)}%)</span>
                    </div>
                    <div className="text-xs text-slate-800 font-bold mt-1.5">Transfer to Date (Overall)</div>
                    <div className="text-[11px] text-slate-500 font-medium">Combined Disbursed Tranches</div>
                  </div>

                  {/* Visual Graph: 4-Quarter Statutory Tranches Stepper */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>Tranche Milestones</span>
                      <span className="text-indigo-700">3 of 4 Released</span>
                    </div>

                    {/* 4 Tranche Segments Graph */}
                    <div className="grid grid-cols-4 gap-1.5">
                      <div className="h-2 rounded-sm bg-indigo-600" title="Q1 (25%) - Disbursed" />
                      <div className="h-2 rounded-sm bg-indigo-600" title="Q2 (25%) - Disbursed" />
                      <div className="h-2 rounded-sm bg-indigo-600" title="Q3 (25%) - Disbursed" />
                      <div className="h-2 rounded-sm bg-slate-200" title="Q4 (25%) - Pending Release" />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span className="text-emerald-700 font-bold">Q1-Q3 Paid ({formatZAR(totalTransferredToDate)})</span>
                      <span>Q4 Bal ({formatZAR(remainingDisbursement)})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entities at High / Critical Risk (Beautiful Alert Card View) */}
              <div 
                onClick={() => openFeatureInSideView('risks')}
                className="bg-rose-50/60 hover:bg-rose-50 border-2 border-rose-200/90 hover:border-rose-400 rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <AlertTriangle className="w-4 h-4 text-rose-700" />
                      </div>
                      <span className="text-[10px] font-black text-rose-800 bg-rose-100/80 border border-rose-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        High Risk Alert
                      </span>
                    </div>
                    <div className="text-xs text-slate-900 font-bold mt-1">Entities at High Risk</div>
                    <div className="text-[11px] text-slate-600 font-medium">Section 38 PFMA Classifications</div>
                  </div>

                  <div className="flex items-baseline gap-1.5 self-start sm:self-auto">
                    <div className="text-3xl font-black text-rose-700 leading-none">
                      {highRiskEntitiesCount}
                    </div>
                    <span className="text-xs font-bold text-rose-600">Institutions</span>
                  </div>
                </div>

                {/* Watchlist Badges for the High Risk Entities */}
                <div className="mt-3 pt-2.5 border-t border-rose-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mr-1">Watchlist:</span>
                    {highRiskEntities.map(e => (
                      <span 
                        key={e.id}
                        className="px-2 py-0.5 bg-white/90 border border-rose-200 text-rose-800 text-[10px] font-bold rounded-md shadow-2xs"
                      >
                        {e.shortCode}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] font-bold text-rose-700 flex items-center gap-1 group-hover:underline shrink-0">
                    <span>Inspect Risk Register</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: KPI PERFORMANCE BY ENTITY & NPO */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">KPI Performance by Entity &amp; NPO</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Actual statutory institutions reporting to the department</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setKpiFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    kpiFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Institutions
                </button>
                <button
                  onClick={() => setKpiFilter('PUBLIC_ENTITY')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    kpiFilter === 'PUBLIC_ENTITY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Public Entities
                </button>
                <button
                  onClick={() => setKpiFilter('NPO')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    kpiFilter === 'NPO' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Subsidized NPOs
                </button>
              </div>
            </div>

            {/* Stacked Horizontal Bar Chart of Actual Entities */}
            <div className="py-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {displayedEntityKpis.map((ent) => (
                <div 
                  key={ent.id} 
                  onClick={() => openFeatureInSideView('performance', ent.id)}
                  className="space-y-1 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-200/70"
                  title={`Inspect ${ent.name} in Performance Side View`}
                >
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                        {ent.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase shrink-0 ${
                        ent.type === 'NPO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {ent.type === 'NPO' ? 'NPO' : 'Public Entity'}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 font-bold">Inspect →</span>
                    </div>
                    <span className="text-[11px] text-slate-600 font-mono font-bold shrink-0">
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
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 pt-3 text-xs border-t border-slate-100">
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

          {/* ROW 5: 2 COLUMNS (Compliance Status & PFMA Risk Overview - Support Given by Type Removed) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Column 1: Compliance Status */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Compliance Status &amp; Regulatory Standing</h3>
                  <p className="text-[11px] text-slate-500">Across all 26 Public Entities and 6 NPOs</p>
                </div>
                <button 
                  onClick={() => openFeatureInSideView('compliance')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>View All</span>
                </button>
              </div>

              {/* Circular Gauge */}
              <div 
                onClick={() => openFeatureInSideView('compliance')}
                className="flex items-center justify-center py-4 cursor-pointer group"
                title="Inspect Compliance in Side View"
              >
                <div className="relative w-36 h-36 flex items-center justify-center group-hover:scale-105 transition-transform">
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
                      strokeDashoffset={251.32 * (1 - (pulse.averageCompliance / 100))}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-slate-900 leading-tight">{pulse.averageCompliance}%</span>
                    <span className="text-[10px] font-bold text-emerald-700 leading-none">Portfolio Average</span>
                    <span className="text-[9px] text-slate-400 mt-1">PFMA &amp; MOA Scored</span>
                  </div>
                </div>
              </div>

              {/* Legend with dynamic counts */}
              <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-100 pt-3">
                <div 
                  onClick={() => openFeatureInSideView('compliance')}
                  className="flex flex-col items-center p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 cursor-pointer text-center"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mb-1"></span>
                  <span className="text-xs text-slate-600 font-medium">Compliant</span>
                  <span className="font-black text-base text-emerald-900">
                    {entities.filter(e => e.overallComplianceScore >= 80).length}
                  </span>
                </div>
                <div 
                  onClick={() => openFeatureInSideView('compliance')}
                  className="flex flex-col items-center p-2 rounded-lg bg-amber-50/60 border border-amber-100 hover:bg-amber-50 cursor-pointer text-center"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 mb-1"></span>
                  <span className="text-xs text-slate-600 font-medium">At Risk</span>
                  <span className="font-black text-base text-amber-900">
                    {entities.filter(e => e.overallComplianceScore >= 60 && e.overallComplianceScore < 80).length}
                  </span>
                </div>
                <div 
                  onClick={() => openFeatureInSideView('compliance')}
                  className="flex flex-col items-center p-2 rounded-lg bg-rose-50/60 border border-rose-100 hover:bg-rose-50 cursor-pointer text-center"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 mb-1"></span>
                  <span className="text-xs text-slate-600 font-medium">Overdue / Non-Comp</span>
                  <span className="font-black text-base text-rose-900">
                    {entities.filter(e => e.overallComplianceScore < 60 || e.overdueReportsCount > 0).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: PFMA Risk Overview & Early Warning */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">PFMA Risk Overview &amp; Early Warning</h3>
                  <p className="text-[11px] text-slate-500">Section 38 PFMA Risk Classifications</p>
                </div>
                <button 
                  onClick={() => openFeatureInSideView('risks')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>View All</span>
                </button>
              </div>

              {/* Risk Items */}
              <div className="py-2 space-y-2">
                <div 
                  onClick={() => openFeatureInSideView('risks')}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 cursor-pointer group transition-colors"
                  title="Open Low Risk in Side View"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <div>
                      <span className="text-xs font-bold text-emerald-900 group-hover:underline">Low Risk (Stable)</span>
                      <div className="text-[10px] text-slate-500">Fully compliant with PFMA reporting &amp; financial ratios</div>
                    </div>
                  </div>
                  <span className="font-black text-base text-emerald-950">
                    {entities.filter(e => e.riskLevel === 'LOW').length}
                  </span>
                </div>

                <div 
                  onClick={() => openFeatureInSideView('risks')}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/60 border border-amber-100 hover:bg-amber-50 cursor-pointer group transition-colors"
                  title="Open Medium Risk in Side View"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <div>
                      <span className="text-xs font-bold text-amber-900 group-hover:underline">Medium Risk (Watchlist)</span>
                      <div className="text-[10px] text-slate-500">Minor governance lags or single target deviations</div>
                    </div>
                  </div>
                  <span className="font-black text-base text-amber-950">
                    {entities.filter(e => e.riskLevel === 'MEDIUM').length}
                  </span>
                </div>

                <div 
                  onClick={() => openFeatureInSideView('risks')}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50/60 border border-orange-100 hover:bg-orange-50 cursor-pointer group transition-colors"
                  title="Open High Risk in Side View"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <div>
                      <span className="text-xs font-bold text-orange-900 group-hover:underline">High Risk (Intervention Needed)</span>
                      <div className="text-[10px] text-slate-500">AGSA audit findings or critical target delivery lags</div>
                    </div>
                  </div>
                  <span className="font-black text-base text-orange-950">
                    {entities.filter(e => e.riskLevel === 'HIGH').length}
                  </span>
                </div>

                <div 
                  onClick={() => openFeatureInSideView('risks')}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 hover:bg-rose-50 cursor-pointer group transition-colors"
                  title="Open Critical Risk in Side View"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                    <div>
                      <span className="text-xs font-bold text-rose-900 group-hover:underline">Critical Risk (Ministerial Escalation)</span>
                      <div className="text-[10px] text-slate-500">Section 100/38 PFMA recovery interventions active</div>
                    </div>
                  </div>
                  <span className="font-black text-base text-rose-950">
                    {entities.filter(e => e.riskLevel === 'CRITICAL').length}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-100">
                Departmental Oversight &amp; Audit Alert System
              </div>
            </div>

          </div>

          {/* ROW 6: UPCOMING DEADLINES & RECENT ALERTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Upcoming Deadlines (Statutory Rules: Annual & Budget Submission due December; Quarterly reports due after every 3 months on the last day) */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Statutory Reporting Deadlines</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Annual &amp; Budget due Dec • Quarterly reports due after every 3 months on last day
                  </p>
                </div>
                <button 
                  onClick={() => openFeatureInSideView('reports')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>View All</span>
                </button>
              </div>

              <div className="py-3 space-y-2.5">
                {/* 1. Annual Budget Submission */}
                <div 
                  onClick={() => openFeatureInSideView('reports')}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">Budget Submission &amp; Annual Strategic Plan</div>
                      <div className="text-[11px] text-slate-500">All 26 Public Entities &amp; 6 Subsidized NPOs • Due 31 Dec 2026</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    Annual: 31 Dec
                  </span>
                </div>

                {/* 2. Annual Performance Reports */}
                <div 
                  onClick={() => openFeatureInSideView('reports')}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">Annual Performance Report &amp; Audited Statements</div>
                      <div className="text-[11px] text-slate-500">Annual statutory submission to Parliamentary tabling • Due 31 Dec 2026</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    Annual: 31 Dec
                  </span>
                </div>

                {/* 3. Q3 Report */}
                <div 
                  onClick={() => openFeatureInSideView('reports')}
                  className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Q3 Performance &amp; Expenditure Report (Oct – Dec)</div>
                      <div className="text-[11px] text-slate-500">Due after 3 months on last day: 31 Jan 2026</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                    Q3: 31 Jan
                  </span>
                </div>

                {/* 4. Q4 Report */}
                <div 
                  onClick={() => openFeatureInSideView('reports')}
                  className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Q4 Closeout Report (Jan – Mar)</div>
                      <div className="text-[11px] text-slate-500">Due after 3 months on last day: 30 Apr 2026</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                    Q4: 30 Apr
                  </span>
                </div>

                {/* 5. Q1 Report */}
                <div 
                  onClick={() => openFeatureInSideView('reports')}
                  className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-800">Q1 Performance &amp; Expenditure Report (Apr – Jun)</div>
                      <div className="text-[11px] text-slate-500">Due after 3 months on last day: 31 Jul 2026</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                    Q1: 31 Jul
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Alerts (Accurate and relevant to actual entities) */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Relevant Entity Alerts</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Real-time alerts for department oversight</p>
                </div>
                <button 
                  onClick={() => openFeatureInSideView('risks')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>View All</span>
                </button>
              </div>

              <div className="py-3 space-y-2.5">
                {/* Alert 1: National Arts Council */}
                <div 
                  onClick={() => openFeatureInSideView('performance', 'ent-nac')}
                  className="flex items-start justify-between text-xs p-2 rounded-lg bg-rose-50/50 border border-rose-100 hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Inspect National Arts Council in Performance Side View"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]">
                      !
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 hover:text-rose-700">
                        National Arts Council (NAC)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Artist grant disbursement rate (51.7%) lagging behind quarterly targets; overdue Q3 report.
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">35 mins ago · Click to inspect Performance</div>
                    </div>
                  </div>
                </div>

                {/* Alert 2: Boxing South Africa */}
                <div 
                  onClick={() => openFeatureInSideView('risks', 'ent-bsa')}
                  className="flex items-start justify-between text-xs p-2 rounded-lg bg-rose-50/50 border border-rose-100 hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Inspect Boxing South Africa in Risk Side View"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]">
                      !
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 hover:text-rose-700">
                        Boxing South Africa (BSA)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Sanctioned tournament compliance at 40%; Ministerial intervention team convened.
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">2 hours ago · Click to inspect Risk Side View</div>
                    </div>
                  </div>
                </div>

                {/* Alert 3: PACOFS */}
                <div 
                  onClick={() => openFeatureInSideView('risks', 'ent-pacofs')}
                  className="flex items-start justify-between text-xs p-2 rounded-lg bg-amber-50/50 border border-amber-100 hover:bg-amber-50 cursor-pointer transition-colors"
                  title="Inspect PACOFS in Risk Side View"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]">
                      !
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 hover:text-amber-700">
                        Performing Arts Centre of the Free State (PACOFS)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        3 unresolved AGSA findings on theatre fixed asset register reconciliation outstanding &gt;90 days.
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">5 hours ago · Click to inspect Risk Side View</div>
                    </div>
                  </div>
                </div>

                {/* Alert 4: Ubuntu Arts NPO */}
                <div 
                  onClick={() => openFeatureInSideView('support', 'ent-ubuntu-arts')}
                  className="flex items-start justify-between text-xs p-2 rounded-lg bg-amber-50/50 border border-amber-100 hover:bg-amber-50 cursor-pointer transition-colors"
                  title="Inspect Ubuntu Arts in Support Side View"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]">
                      !
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 hover:text-amber-700">
                        Ubuntu Arts Community NPO
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Community arts touring tranche expenditure at 41% pending Bizana venue verification.
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">1 day ago · Click to inspect Support Side View</div>
                    </div>
                  </div>
                </div>

                {/* Alert 5: SAHRA */}
                <div 
                  onClick={() => openFeatureInSideView('performance', 'ent-sahra')}
                  className="flex items-start justify-between text-xs p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
                  title="Inspect SAHRA in Performance Side View"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]">
                      i
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 hover:text-blue-700">
                        South African Heritage Resources Agency (SAHRA)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Heritage site grading lag in Sarah Baartman district (8 of 15 expected assessments logged).
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">2 days ago · Click to inspect Performance</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          </div>

        </div>
        )}

        {/* VIEW 2: ENTITIES & NPOS */}
        {activeSidebar === 'entities' && (
          <div className="p-4 sm:p-6 overflow-y-auto">
            <DsacEntitiesView
              entities={entities}
              onSelectEntity={(entId) => {
                if (onNavigateToEntity) onNavigateToEntity(entId);
              }}
              onOpenWorkspace={(entId) => {
                if (onNavigateToEntity) onNavigateToEntity(entId);
              }}
              onNavigateToTab={(tab) => {
                if (tab === 'reports') setActiveSidebar('reports');
                else if (tab === 'compliance') setActiveSidebar('compliance');
                else if (tab === 'performance') setActiveSidebar('performance');
              }}
            />
          </div>
        )}

        {/* VIEW 3: PERFORMANCE */}
        {activeSidebar === 'performance' && (
          <div className="p-4 sm:p-6 overflow-y-auto">
            <DsacPerformanceView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
            />
          </div>
        )}

        {/* VIEW 4: COMPLIANCE */}
        {activeSidebar === 'compliance' && (
          <div className="p-4 sm:p-6 overflow-y-auto">
            <DsacComplianceView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
            />
          </div>
        )}

        {/* VIEW 5: SUPPORT & FUNDING */}
        {activeSidebar === 'support' && (
          <div className="p-4 sm:p-6 overflow-y-auto">
            <DsacSupportView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
              onOpenSideView={(feature, entityId) => openFeatureInSideView(feature, entityId)}
            />
          </div>
        )}

        {/* VIEW 6: REPORTS */}
        {activeSidebar === 'reports' && (
          <div className="p-4 sm:p-6 overflow-y-auto">
            <DsacReportsView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
            />
          </div>
        )}

        {/* VIEW 7: RISK & ALERTS */}
        {activeSidebar === 'risks' && (
          <div className="p-4 sm:p-6 overflow-y-auto">
            <DsacRiskView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
            />
          </div>
        )}

        {/* VIEW 8: ANALYTICS */}
        {activeSidebar === 'analytics' && (
          <div className="p-4 sm:p-6 overflow-y-auto">
            <DsacAnalyticsView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
              onOpenSideView={(feature, entityId) => openFeatureInSideView(feature, entityId)}
            />
          </div>
        )}

        {/* VIEW 9: APPROVALS */}
        {activeSidebar === 'approvals' && (
          <div className="p-4 sm:p-6 overflow-y-auto">
            <TaskManagementView />
          </div>
        )}

        {/* VIEW 10: SETTINGS */}
        {activeSidebar === 'settings' && (
          <div className="p-4 sm:p-6 overflow-y-auto">
            <DsacSettingsView />
          </div>
        )}

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
          initialEntityFilter={sideViewEntityFilter}
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
