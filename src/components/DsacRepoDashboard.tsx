import React, { useState, useEffect, useMemo } from 'react';
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
  Settings,
  HelpCircle,
  FolderLock,
  History,
  Award,
  Menu,
  X,
  Shield
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
import { DsacFinancialDashboard } from './features/DsacFinancialDashboard';
import { DsacReportsView } from './features/DsacReportsView';
import { DsacRiskView } from './features/DsacRiskView';
import { DsacAnalyticsView } from './features/DsacAnalyticsView';
import { DsacSettingsView } from './features/DsacSettingsView';
import { DsacOverviewView } from './features/DsacOverviewView';
import { AIPerformanceAnalyst } from './AIPerformanceAnalyst';
import { TaskManagementView } from './TaskManagementView';
import { AuditLogView } from './AuditLogView';
import { DsacQueriesView } from './features/DsacQueriesView';
import { DocumentRepositoryView } from './DocumentRepositoryView';
import { DsacNotificationsView } from './features/DsacNotificationsView';
import { PresentationDemoMode } from './PresentationDemoMode';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('This Financial Year');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [selectedDrawerEntity, setSelectedDrawerEntity] = useState<PublicEntity | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [kpiFilter, setKpiFilter] = useState<'ALL' | 'PUBLIC_ENTITY' | 'NPO'>('ALL');
  const [isDemoModeOpen, setIsDemoModeOpen] = useState<boolean>(false);
  const [showPulseExplanation, setShowPulseExplanation] = useState<boolean>(false);

  // Sub-navigation tab states for progressive disclosure in primary views
  const [reportingSubtab, setReportingSubtab] = useState<'reports' | 'compliance' | 'queries'>('reports');
  const [performanceSubtab, setPerformanceSubtab] = useState<'performance' | 'kpis' | 'targets'>('performance');
  const [financeSubtab, setFinanceSubtab] = useState<'financials' | 'support'>('financials');
  const [actionSubtab, setActionSubtab] = useState<'tasks' | 'risks' | 'notifications'>('tasks');
  const [insightsSubtab, setInsightsSubtab] = useState<'ai' | 'analytics'>('ai');
  const [adminSubtab, setAdminSubtab] = useState<'settings' | 'audit'>('settings');

  // Keep activeSidebar in sync with initialSection changes from routing
  useEffect(() => {
    if (initialSection) {
      handleNavSelect(initialSection);
      setIsSideViewOpen(false);
    }
  }, [initialSection]);

  // Real-time store subscription
  const [, setTick] = useState(0);
  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  // Dedicated Side View feature state (supplementary inspector drawer)
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
  };

  // Direct full-page workspace navigation with intelligent sub-tab mapping
  const handleNavSelect = (sectionId: string) => {
    setIsSideViewOpen(false);
    setIsMobileMenuOpen(false);

    // Progressive routing to 9 primary sections with active subtabs
    if (sectionId === 'reports' || sectionId === 'compliance' || sectionId === 'queries') {
      setActiveSidebar('reports');
      setReportingSubtab(sectionId as any);
    } else if (sectionId === 'performance' || sectionId === 'kpis' || sectionId === 'targets') {
      setActiveSidebar('performance');
      setPerformanceSubtab(sectionId as any);
    } else if (sectionId === 'financials' || sectionId === 'support') {
      setActiveSidebar('financials');
      setFinanceSubtab(sectionId as any);
    } else if (
      sectionId === 'tasks' ||
      sectionId === 'approvals' ||
      sectionId === 'action-centre' ||
      sectionId === 'action_centre' ||
      sectionId === 'risks' ||
      sectionId === 'radar' ||
      sectionId === 'early-warning' ||
      sectionId === 'notifications'
    ) {
      setActiveSidebar('tasks');
      if (sectionId === 'risks' || sectionId === 'radar' || sectionId === 'early-warning') {
        setActionSubtab('risks');
      } else if (sectionId === 'notifications') {
        setActionSubtab('notifications');
      } else {
        setActionSubtab('tasks');
      }
    } else if (sectionId === 'ai' || sectionId === 'analytics') {
      setActiveSidebar('ai');
      setInsightsSubtab(sectionId as any);
    } else if (sectionId === 'settings' || sectionId === 'audit' || sectionId === 'audit_logs' || sectionId === 'audit-logs') {
      setActiveSidebar('settings');
      setAdminSubtab(sectionId === 'settings' ? 'settings' : 'audit');
    } else {
      setActiveSidebar(sectionId);
    }

    if (onNavigateToSection && sectionId !== 'overview') {
      onNavigateToSection(sectionId);
    }
  };

  const entities = store.entities;
  const pulse = store.getPerformancePulse();

  // Department Aggregations from Central Authoritative Calculation Engine
  const deptFinancialAgg = useMemo(() => {
    return store.getDepartmentFinancialAggregation(selectedYear, 'Q3');
  }, [selectedYear]);

  const deptPerfAgg = useMemo(() => {
    return store.getDepartmentPerformanceAggregation(selectedYear, 'Q3', kpiFilter);
  }, [selectedYear, kpiFilter]);

  // Aggregate calculations across all 26 Public Entities and 6 NPOs from authoritative aggregation
  const totalApprovedBudget = deptFinancialAgg.totalApprovedBudget;
  const totalTransferredToDate = deptFinancialAgg.totalTransferredToDate;
  const totalReportedExpenditure = deptFinancialAgg.totalReportedExpenditure;
  const remainingDisbursement = deptFinancialAgg.remainingDisbursement;
  const transferRate = deptFinancialAgg.transferRate;
  const expenditureRate = deptFinancialAgg.expenditureRate;
  const highRiskEntitiesCount = pulse.highRiskEntitiesCount;
  const highRiskEntities = entities.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL');

  // Institution category breakdowns for graphs
  const peEntities = entities.filter(e => e.type === 'PUBLIC_ENTITY');
  const npoEntities = entities.filter(e => e.type === 'NPO');
  const peBudget = deptFinancialAgg.peBudget;
  const npoBudget = deptFinancialAgg.npoBudget;
  const peTransfer = deptFinancialAgg.peTransfer;
  const npoTransfer = deptFinancialAgg.npoTransfer;
  const pePercentage = deptFinancialAgg.pePercentage;
  const npoPercentage = deptFinancialAgg.npoPercentage;

  const reportsSubmitted = pulse.q3SubmittedCount;
  const reportsOutstanding = pulse.q3OutstandingCount;
  const reportsSubmittedPercent = entities.length > 0 ? Math.round((reportsSubmitted / entities.length) * 100) : 0;
  const reportsOutstandingPercent = 100 - reportsSubmittedPercent;

  const formatZAR = (val: number) => {
    if (val >= 1_000_000_000) {
      return `R ${(val / 1_000_000_000).toFixed(2)}B`;
    }
    if (val >= 1_000_000) {
      return `R ${(val / 1_000_000).toFixed(1)}M`;
    }
    return `R ${val.toLocaleString()}`;
  };

  // Year-based calculations for Budget Utilization card matching authoritative calculation engine
  const yearMetrics = {
    label: deptFinancialAgg.financialYear,
    approved: deptFinancialAgg.totalApprovedBudget,
    utilized: deptFinancialAgg.totalReportedExpenditure,
    remaining: deptFinancialAgg.remainingDisbursement,
    utilPercent: deptFinancialAgg.utilPercent,
    remPercent: deptFinancialAgg.remPercent,
    statusTitle: deptFinancialAgg.statusTitle,
  };

  const currentUser = store.currentUser || {
    name: 'Sicelo Sakhile Mkhize',
    role: 'DSAC_ADMIN',
    designation: 'Chief Director: Public Entities Governance & Support',
    email: 'sakhilesicelo94@gmail.com'
  };

  // Authoritative Entity Performance Breakdown from Calculation Engine
  const displayedEntityKpis = deptPerfAgg.entityBreakdown;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number | string;
    badge?: string;
    badgeColor?: string;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  // Simplified 9-Section Navigation Architecture (Simple on surface, intelligent underneath)
  const navGroups: NavGroup[] = [
    {
      title: 'Department Oversight',
      items: [
        { id: 'overview', label: 'Overview', icon: Building2 },
        { id: 'entities', label: 'Entities', icon: Users, count: pulse.totalEntities },
        { id: 'reports', label: 'Reporting', icon: FileText, count: pulse.q3OutstandingCount > 0 ? pulse.q3OutstandingCount : undefined, badgeColor: 'bg-amber-500/30 text-amber-300' },
        { id: 'performance', label: 'Performance', icon: Target },
        { id: 'financials', label: 'Finance', icon: Coins },
        { id: 'tasks', label: 'Actions', icon: FileCheck, count: store.tasks.filter(t => t.status === 'OPEN').length > 0 ? store.tasks.filter(t => t.status === 'OPEN').length : undefined, badgeColor: 'bg-rose-500/30 text-rose-300' },
      ],
    },
    {
      title: 'Intelligence & Administration',
      items: [
        { id: 'ai', label: 'Insights', icon: Sparkles, badge: 'AI', badgeColor: 'bg-teal-500/30 text-teal-300' },
        { id: 'documents', label: 'Documents', icon: FolderLock, count: store.documents.length },
        { id: 'settings', label: 'Administration', icon: Settings },
      ],
    },
  ];

  const getPageTitle = (id: string): { title: string; subtitle: string } => {
    switch (id) {
      case 'overview': return { title: 'Executive Oversight Dashboard', subtitle: 'Report → Monitor → Identify → Act' };
      case 'entities': return { title: '26 Public Entities & 6 NPOs Directory', subtitle: 'Statutory Entities and Subsidized Cultural Non-Profits' };
      case 'reports':
      case 'compliance':
      case 'queries': return { title: 'Statutory Reporting & Compliance', subtitle: 'Submit, review and track periodic performance reports across all 32 institutions' };
      case 'performance':
      case 'kpis':
      case 'targets': return { title: 'Performance Oversight', subtitle: 'Monitor entity progress against targets and identify areas requiring attention' };
      case 'financials':
      case 'support': return { title: 'Financial Monitoring & Grants', subtitle: 'Monitor approved budgets, expenditure and financial utilisation' };
      case 'tasks':
      case 'approvals':
      case 'action-centre':
      case 'action_centre':
      case 'risks':
      case 'radar':
      case 'early-warning':
      case 'notifications': return { title: 'Action Centre & Directives', subtitle: 'Track issues, corrective actions and formal departmental directives' };
      case 'ai':
      case 'analytics': return { title: 'Intelligence & Portfolio Insights', subtitle: 'Understand trends, detect anomalies, and investigate performance using system data' };
      case 'documents': return { title: 'Document Vault & Evidence Repository', subtitle: 'Statutory evidence repository and verification dossier' };
      case 'settings':
      case 'audit':
      case 'audit_logs':
      case 'audit-logs': return { title: 'Department Administration', subtitle: 'Users, permissions, configuration and statutory PFMA audit history' };
      default: return { title: 'DSAC Executive Oversight', subtitle: 'Department of Sport, Arts and Culture' };
    }
  };

  const currentPage = getPageTitle(activeSidebar);

  return (
    <div className="flex flex-row min-h-screen w-full bg-slate-100">
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 1. Official DSAC Dark Green Sidebar (Always positioned on left of content) */}
      <aside className={`fixed md:sticky top-0 bottom-0 left-0 z-40 md:z-30 w-60 lg:w-64 shrink-0 bg-[#044332] text-emerald-100 flex flex-col justify-between select-none border-r border-emerald-950 h-screen transition-transform duration-200 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Logo & Header in Sidebar */}
          <div className="p-3.5 border-b border-emerald-800/60 flex items-center justify-between gap-3 shrink-0">
            <div 
              onClick={() => handleNavSelect('overview')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center p-1 shadow-inner shrink-0 group-hover:border-emerald-400 transition-colors">
                <SouthAfricanCoatOfArms size={30} variant="gold" />
              </div>
              <div>
                <div className="font-black text-white text-xs tracking-wider font-['Cabinet_Grotesk']">DSAC REPO</div>
                <div className="text-[10px] text-emerald-300/80 font-medium">Statutory Oversight</div>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/60 rounded-lg cursor-pointer"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="flex-1 overflow-y-auto p-2.5 space-y-4 custom-scrollbar">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSidebar === item.id ||
                    (item.id === 'performance' && (activeSidebar === 'kpis' || activeSidebar === 'targets')) ||
                    (item.id === 'financials' && activeSidebar === 'support') ||
                    (item.id === 'risks' && (activeSidebar === 'radar' || activeSidebar === 'early-warning')) ||
                    (item.id === 'tasks' && (activeSidebar === 'approvals' || activeSidebar === 'action-centre' || activeSidebar === 'notifications'));
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavSelect(item.id)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0c5943] text-white shadow-sm font-bold ring-1 ring-emerald-400/40'
                          : 'text-emerald-200/80 hover:bg-[#07533f] hover:text-white font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-300' : 'text-emerald-400/80'}`} />
                        <span className="truncate text-left">{item.label}</span>
                      </div>
                      
                      {item.count !== undefined && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                          item.badgeColor || (isActive ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40')
                        }`}>
                          {item.count}
                        </span>
                      )}

                      {item.badge && (
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                          item.badgeColor || 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Slogan Motif */}
        <div className="p-3.5 border-t border-emerald-800/60 shrink-0 bg-[#033628]/40">
          <div className="space-y-0.5 text-[10px] font-semibold tracking-wider text-emerald-300/80 uppercase">
            <div className="text-white font-bold text-[11px]">Culture • Heritage • People</div>
            <div className="text-emerald-400 font-bold">A Better South Africa</div>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <DsacOfficialLogo variant="light" />
            <div className="hidden sm:block h-7 w-px bg-slate-200" />
            <div className="truncate">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                {currentPage.title}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {currentPage.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Presentation Demo Mode Trigger */}
            <button
              onClick={() => setIsDemoModeOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-all cursor-pointer hover:scale-102"
              title="Launch Guided Presentation Demo Scenario (Report → Monitor → Identify → Act)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Presentation Mode</span>
            </button>

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

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Statutory Alerts & Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-xs text-slate-900">Statutory Early Alerts</span>
                    </div>
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                      3 Active
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div 
                      onClick={() => {
                        setShowNotifications(false);
                        handleNavSelect('risks');
                      }}
                      className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/80 hover:bg-rose-100/70 cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-rose-900 flex items-center justify-between">
                        <span>Boxing SA (BSA)</span>
                        <span className="text-[9px] text-rose-600 font-normal">Today</span>
                      </div>
                      <p className="text-[11px] text-rose-800 mt-0.5">Critical PFMA variance: Governance report 18 days overdue.</p>
                    </div>

                    <div 
                      onClick={() => {
                        setShowNotifications(false);
                        handleNavSelect('queries');
                      }}
                      className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-amber-900 flex items-center justify-between">
                        <span>Parliamentary Question</span>
                        <span className="text-[9px] text-amber-600 font-normal">Yesterday</span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">DSAC-PQ-2026/048 regarding SAHRA archaeological permits requires DG sign-off.</p>
                    </div>

                    <div 
                      onClick={() => {
                        setShowNotifications(false);
                        handleNavSelect('tasks');
                      }}
                      className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200/80 hover:bg-teal-100/70 cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-teal-900 flex items-center justify-between">
                        <span>Compliance Action Required</span>
                        <span className="text-[9px] text-teal-600 font-normal">2 days ago</span>
                      </div>
                      <p className="text-[11px] text-teal-800 mt-0.5">PACOFS corrective action directive awaiting Department verification.</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        handleNavSelect('tasks');
                      }}
                      className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
                    >
                      View Action Centre & Directives →
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
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
          <DsacOverviewView
            entities={entities}
            reportsOutstanding={reportsOutstanding}
            highRiskEntitiesCount={highRiskEntitiesCount}
            highRiskEntities={highRiskEntities}
            totalApprovedBudget={totalApprovedBudget}
            totalTransferredToDate={totalTransferredToDate}
            remainingDisbursement={remainingDisbursement}
            transferRate={transferRate}
            expenditureRate={expenditureRate}
            formatZAR={formatZAR}
            onNavigate={handleNavSelect}
            onInvestigateEntity={onNavigateToEntity}
            onOpenDemo={() => setIsDemoModeOpen(true)}
          />
        )}

        {/* VIEW 2: ENTITIES & NPOS */}
        {(activeSidebar === 'entities' || activeSidebar === 'public-entities') && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <DsacEntitiesView
              entities={entities}
              onSelectEntity={(entId) => {
                if (onNavigateToEntity) onNavigateToEntity(entId);
              }}
              onOpenWorkspace={(entId) => {
                if (onNavigateToEntity) onNavigateToEntity(entId);
              }}
              onNavigateToTab={(tab) => handleNavSelect(tab)}
            />
          </div>
        )}

        {/* VIEW 3: PERFORMANCE, KPIS & TARGETS */}
        {(activeSidebar === 'performance' || activeSidebar === 'kpis' || activeSidebar === 'targets') && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <DsacPerformanceView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
            />
          </div>
        )}

        {/* VIEW 4: COMPLIANCE */}
        {activeSidebar === 'compliance' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <DsacComplianceView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
            />
          </div>
        )}

        {/* VIEW 5: FINANCIAL MONITORING & BUDGET UTILISATION */}
        {activeSidebar === 'financials' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <DsacFinancialDashboard
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
              initialTab={
                financeSubtab === 'transfers' ? 'approvals' :
                financeSubtab === 'variance' ? 'reviews' :
                financeSubtab === 'support' ? 'support' : 'portfolio'
              }
            />
          </div>
        )}

        {/* VIEW 5B: CAPACITY & SUPPORT SUBVENTIONS */}
        {activeSidebar === 'support' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <DsacSupportView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
              onOpenSideView={(feature) => handleNavSelect(feature === 'support' ? 'financials' : feature)}
            />
          </div>
        )}

        {/* VIEW 6: REPORTS */}
        {activeSidebar === 'reports' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <DsacReportsView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
              initialSubtab={reportingSubtab}
            />
          </div>
        )}

        {/* VIEW 7: RISK & EARLY WARNINGS */}
        {(activeSidebar === 'risks' || activeSidebar === 'radar' || activeSidebar === 'early-warning') && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <DsacRiskView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
            />
          </div>
        )}

        {/* VIEW 8: QUERIES & INQUIRIES */}
        {activeSidebar === 'queries' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <DsacQueriesView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
            />
          </div>
        )}

        {/* VIEW 9: DOCUMENTS */}
        {activeSidebar === 'documents' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <DocumentRepositoryView />
          </div>
        )}

        {/* VIEW 10: TASKS, APPROVALS & ACTION CENTRE */}
        {(activeSidebar === 'tasks' || activeSidebar === 'approvals' || activeSidebar === 'action-centre' || activeSidebar === 'action_centre') && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <TaskManagementView />
          </div>
        )}

        {/* VIEW 11: NOTIFICATIONS & EARLY ALERTS */}
        {activeSidebar === 'notifications' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <DsacNotificationsView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
              onNavigateToSection={(sec) => handleNavSelect(sec)}
            />
          </div>
        )}

        {/* VIEW 12: ANALYTICS */}
        {activeSidebar === 'analytics' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <DsacAnalyticsView
              entities={entities}
              onSelectEntity={onNavigateToEntity}
              onOpenWorkspace={onNavigateToEntity}
              onOpenSideView={(feature) => handleNavSelect(feature === 'support' ? 'financials' : feature)}
            />
          </div>
        )}

        {/* VIEW 13: AUDIT LOGS */}
        {(activeSidebar === 'audit' || activeSidebar === 'audit_logs' || activeSidebar === 'audit-logs') && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <AuditLogView />
          </div>
        )}

        {/* VIEW 14: AI PERFORMANCE ANALYST */}
        {activeSidebar === 'ai' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
            <AIPerformanceAnalyst />
          </div>
        )}

        {/* VIEW 15: SETTINGS */}
        {activeSidebar === 'settings' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">
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
