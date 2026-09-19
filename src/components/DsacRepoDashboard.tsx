import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  FileText,
  AlertTriangle,
  Search,
  Bell,
  BarChart3,
  LogOut,
  Settings,
  HelpCircle,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { store } from '../services/store';
import { SouthAfricanCoatOfArms, DsacOfficialLogo } from './SouthAfricanCoatOfArms';
import { DsacPerformanceView } from './features/DsacPerformanceView';
import { DsacComplianceView } from './features/DsacComplianceView';
import { DsacSupportView } from './features/DsacSupportView';
import { DsacFinancialDashboard } from './features/DsacFinancialDashboard';
import { DsacReportsView } from './features/DsacReportsView';
import { DsacRiskView } from './features/DsacRiskView';
import { DsacAnalyticsView } from './features/DsacAnalyticsView';
import { DsacSettingsView } from './features/DsacSettingsView';
import { DsacOverviewView } from './features/DsacOverviewView';
import { DsacEntitiesView } from './features/DsacEntitiesView';
import { DsacQueriesView } from './features/DsacQueriesView';
import { DsacNotificationsView } from './features/DsacNotificationsView';
import { SecurityPrivacyView } from './features/SecurityPrivacyView';
import { SectionTabs } from './features/SectionTabs';
import { AIPerformanceAnalyst } from './AIPerformanceAnalyst';
import { TaskManagementView } from './TaskManagementView';
import { AuditLogView } from './AuditLogView';
import { DocumentRepositoryView } from './DocumentRepositoryView';
import { EntityWorkspace } from './EntityWorkspace';
import { PresentationDemoMode } from './PresentationDemoMode';
import { SystemGuideModal } from './SystemGuideModal';
import { DSAC_SECTIONS, DsacSectionId, getSection, resolveDsacRoute } from '../config/dsacNavigation';
import { EntityTab, getPortfolioAlerts } from '../services/attention';
import { isPortfolioMember } from '../services/financialService';

interface DsacRepoDashboardProps {
  onNavigateToSection?: (section: string) => void;
  onLogout?: () => void;
  initialSection?: string;
}

const SECTION_ICON: Record<DsacSectionId, React.ComponentType<{ className?: string }>> = {
  dashboard: BarChart3,
  entities: Building2,
  reports: FileText,
  requests: HelpCircle,
  alerts: AlertTriangle,
  admin: Settings,
};

/** The older "feature" names some screens still link with, and where each now leads. */
const FEATURE_LINK: Record<string, { tab: EntityTab; section: string }> = {
  compliance: { tab: 'compliance', section: 'compliance' },
  performance: { tab: 'performance', section: 'performance' },
  support: { tab: 'finance', section: 'support' },
  reports: { tab: 'reports', section: 'reports' },
  entities: { tab: 'overview', section: 'entities' },
  risks: { tab: 'overview', section: 'risks' },
};

export const DsacRepoDashboard: React.FC<DsacRepoDashboardProps> = ({
  onNavigateToSection,
  onLogout,
  initialSection = 'overview',
}) => {
  const initialRoute = resolveDsacRoute(initialSection);
  const [section, setSection] = useState<DsacSectionId>(initialRoute.section);
  const [tab, setTab] = useState<string | undefined>(initialRoute.tab);
  const [reportsView, setReportsView] = useState<'submissions' | 'documents' | 'review'>(initialRoute.reportsView ?? 'submissions');
  const [financeView, setFinanceView] = useState<'portfolio' | 'approvals' | 'reviews' | 'support'>(initialRoute.financeView ?? 'portfolio');
  /** The organisation whose page is open inside the Entities section, if any. */
  const [openEntity, setOpenEntity] = useState<{ id: string; tab: EntityTab } | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Record<DsacSectionId, boolean>>({
    dashboard: true,
    entities: false,
    reports: false,
    requests: false,
    alerts: false,
    admin: false,
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isDemoModeOpen, setIsDemoModeOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Real-time store subscription
  const [tick, setTick] = useState(0);
  useEffect(() => store.subscribe(() => setTick(t => t + 1)), []);

  /** Go to any section by id. Accepts the new ids and every older one (see config/dsacNavigation). */
  const handleNavSelect = (sectionId: string) => {
    const route = resolveDsacRoute(sectionId);
    setSection(route.section);
    setTab(route.tab);
    setExpandedSections(current => ({ ...current, [route.section]: true }));
    if (route.reportsView) setReportsView(route.reportsView);
    if (route.financeView) setFinanceView(route.financeView);
    setOpenEntity(null);
    setIsMobileMenuOpen(false);
    setShowNotifications(false);
    if (onNavigateToSection && sectionId !== 'overview') onNavigateToSection(sectionId);
  };

  // Follow routing changes from outside (for example the address or a guided demo step).
  useEffect(() => {
    if (initialSection) handleNavSelect(initialSection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSection]);

  /** Every drill-down to one organisation lands on the same page, inside this shell. */
  const openEntityPage = (entityId: string, entityTab: EntityTab = 'overview') => {
    setSection('entities');
    setTab(undefined);
    setOpenEntity({ id: entityId, tab: entityTab });
    setIsMobileMenuOpen(false);
    setShowNotifications(false);
    setSearchQuery('');
    setShowSearch(false);
  };

  /** Links written for the old side panel: with an organisation they open its page, without one the section. */
  const handleFeatureLink = (feature: string, entityId?: string) => {
    const link = FEATURE_LINK[feature] ?? FEATURE_LINK.entities;
    if (entityId) openEntityPage(entityId, link.tab);
    else handleNavSelect(link.section);
  };

  const entities = store.entities;
  const members = entities.filter(isPortfolioMember);
  const pulse = useMemo(() => store.getPerformancePulse(), [tick]);
  const deptFinancialAgg = useMemo(() => store.getDepartmentFinancialAggregation(), [tick]);
  const alerts = useMemo(() => getPortfolioAlerts(), [tick]);
  const highRiskEntities = entities.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL');

  const formatZAR = (val: number) => {
    if (val >= 1_000_000_000) return `R ${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `R ${(val / 1_000_000).toFixed(1)}M`;
    return `R ${val.toLocaleString()}`;
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter(e => e.name.toLowerCase().includes(q) || e.shortCode.toLowerCase().includes(q) || e.headOfEntity.toLowerCase().includes(q))
      .slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, tick]);

  const initials = store.currentUser?.name
    ? store.currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'DS';

  const sectionBadges: Partial<Record<DsacSectionId, { count: number; color: string }>> = {
    reports: { count: pulse.currentQuarterOutstandingCount, color: 'bg-amber-500/30 text-amber-300' },
    alerts: { count: pulse.highRiskEntitiesCount, color: 'bg-rose-500/30 text-rose-300' },
  };

  const tabCounts: Record<string, number | undefined> = {
    'reports/vault': store.documents.length,
    'requests/directives': pulse.openTasksCount || undefined,
    'alerts/risks': pulse.highRiskEntitiesCount || undefined,
  };

  const activeEntityRecord = openEntity ? entities.find(e => e.id === openEntity.id) : undefined;

  const TITLES: Record<string, { title: string; subtitle: string }> = {
    'dashboard/overview': { title: 'Executive Oversight Dashboard', subtitle: 'National portfolio monitoring, delivery tracking, and early risk detection' },
    'dashboard/performance': { title: 'Performance & Target Oversight', subtitle: 'Target attainment, delivery pacing, and milestone verification' },
    'dashboard/finance': { title: 'Financial Monitoring & Vote 37 Transfers', subtitle: 'Approved parliamentary subventions, transfer tranches, and expenditure burn rates' },
    'dashboard/analytics': { title: 'Comparative Analytics & Multi-Year Trends', subtitle: 'Cross-entity delivery correlations and trend analyses' },
    'dashboard/ai': { title: 'AI Performance Analyst', subtitle: 'Rule-based analysis of the portfolio data, with every answer traceable to a figure' },
    entities: { title: 'Public Entities & Subsidized NPOs', subtitle: `${members.length} institutions: choose one to see its performance, finance, compliance and reports` },
    'reports/quarterly': { title: 'Quarterly Reporting & Clearances', subtitle: 'Statutory quarterly performance and expenditure submission clearances' },
    'reports/vault': { title: 'Document Vault & Evidence Repository', subtitle: 'Portfolio of Evidence (PoE) dossiers and verified statutory filings' },
    'reports/parliament': { title: 'Parliamentary Questions & Stakeholder Queries', subtitle: 'Ministerial inquiries, parliamentary questions, and oversight audits' },
    'requests/support': { title: 'Support Requests', subtitle: 'Capacity and funding support requested by institutions' },
    'requests/directives': { title: 'Directives & Tasks', subtitle: 'Ministerial directives, remedial actions, and task execution tracking' },
    'alerts/risks': { title: 'Risk Radar & Early Warning System', subtitle: 'Early detection of target slippage, reporting delays, and governance issues' },
    'alerts/deadlines': { title: 'Statutory Compliance & PFMA Deadlines', subtitle: 'Filing calendars, Section 38 PFMA requirements, and statutory milestones' },
    'alerts/tasks': { title: 'My Actions & Tasks', subtitle: 'Unresolved DSAC actions and tasks assigned to the logged-in official' },
    'alerts/notifications': { title: 'Notifications & Early Alerts', subtitle: 'What has happened across the portfolio that needs a response' },
    'admin/audit': { title: 'PFMA Statutory Audit Trail', subtitle: 'Log of official reviews, clearances, and directives' },
    'admin/settings': { title: 'System Administration & Access Control', subtitle: 'Role-based access permissions, workflow configurations, and statutory profiles' },
    'admin/security': { title: 'Security & Privacy', subtitle: 'How access, data and audit are protected in this system' },
  };
  const page = openEntity && activeEntityRecord
    ? { title: `${activeEntityRecord.shortCode} • Entity page`, subtitle: `${activeEntityRecord.type === 'PUBLIC_ENTITY' ? 'Public entity' : 'Non-profit organisation'} • ${activeEntityRecord.cluster}` }
    : TITLES[tab ? `${section}/${tab}` : section] ?? { title: 'DSAC Executive Oversight', subtitle: 'Department of Sport, Arts and Culture' };

  const current = getSection(section);
  const asTabs = current.tabs.filter(t => t.visible !== false).map(t => ({ ...t, count: tabCounts[`${section}/${t.id}`] }));
  const wrap = (node: React.ReactNode) => <div className="p-4 sm:p-6 overflow-y-auto flex-1 w-full">{node}</div>;

  const navContent = (item: any, isActive: boolean) => (
    <div className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-950/40 text-emerald-400/80 group-hover:text-emerald-300'
      }`}>
        <item.icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-xs truncate leading-snug">{item.label}</div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (section === 'entities') {
      return wrap(
        openEntity ? (
          <EntityWorkspace
            key={openEntity.id}
            entityId={openEntity.id}
            initialTab={openEntity.tab}
            onBackToDashboard={() => setOpenEntity(null)}
            backLabel="← All entities"
          />
        ) : (
          <DsacEntitiesView entities={entities} onOpenWorkspace={openEntityPage} />
        )
      );
    }

    switch (`${section}/${tab}`) {
      case 'dashboard/overview':
        return (
          <DsacOverviewView
            entities={entities}
            reportsOutstanding={pulse.currentQuarterOutstandingCount}
            highRiskEntitiesCount={pulse.highRiskEntitiesCount}
            highRiskEntities={highRiskEntities}
            totalApprovedBudget={deptFinancialAgg.totalApprovedBudget}
            totalTransferredToDate={deptFinancialAgg.totalTransferredToDate}
            totalReportedExpenditure={deptFinancialAgg.totalReportedExpenditure}
            remainingDisbursement={deptFinancialAgg.remainingDisbursement}
            transferRate={deptFinancialAgg.transferRate}
            expenditureRate={deptFinancialAgg.expenditureRate}
            formatZAR={formatZAR}
            onNavigate={handleNavSelect}
            onInvestigateEntity={(id: string) => openEntityPage(id)}
            onOpenDemo={() => setIsDemoModeOpen(true)}
            onOpenGuide={() => setIsGuideModalOpen(true)}
          />
        );
      case 'dashboard/performance':
        return wrap(<DsacPerformanceView entities={entities} onSelectEntity={openEntityPage} onOpenWorkspace={openEntityPage} />);
      case 'dashboard/finance':
        return wrap(
          <DsacFinancialDashboard
            key={financeView}
            onSelectEntity={openEntityPage}
            onOpenWorkspace={openEntityPage}
            initialTab={financeView}
          />
        );
      case 'dashboard/analytics':
        return wrap(<DsacAnalyticsView entities={entities} onSelectEntity={openEntityPage} onOpenWorkspace={openEntityPage} onOpenSideView={handleFeatureLink} />);
      case 'dashboard/ai':
        return wrap(<AIPerformanceAnalyst />);

      case 'reports/quarterly':
        return wrap(<DsacReportsView key={reportsView} entities={entities} onSelectEntity={openEntityPage} onOpenWorkspace={openEntityPage} initialSubtab={reportsView} />);
      case 'reports/vault':
        return wrap(<DocumentRepositoryView />);
      case 'reports/parliament':
        return wrap(<DsacQueriesView entities={entities} onSelectEntity={openEntityPage} onOpenWorkspace={openEntityPage} />);

      case 'requests/support':
        return wrap(<DsacSupportView entities={entities} onSelectEntity={openEntityPage} onOpenWorkspace={openEntityPage} onOpenSideView={handleFeatureLink} />);
      case 'requests/directives':
        return wrap(<TaskManagementView />);

      case 'alerts/risks':
        return wrap(<DsacRiskView entities={entities} onSelectEntity={openEntityPage} onOpenWorkspace={openEntityPage} />);
      case 'alerts/deadlines':
        return wrap(<DsacComplianceView entities={entities} onSelectEntity={openEntityPage} onOpenWorkspace={(id) => openEntityPage(id, 'compliance')} />);
      case 'alerts/tasks':
        return wrap(<TaskManagementView />);
      case 'alerts/notifications':
        return wrap(<DsacNotificationsView entities={entities} onSelectEntity={openEntityPage} onOpenWorkspace={openEntityPage} onNavigateToSection={handleNavSelect} />);

      case 'admin/audit':
        return wrap(<AuditLogView />);
      case 'admin/settings':
        return wrap(<DsacSettingsView />);
      case 'admin/security':
        return wrap(<SecurityPrivacyView />);
      default:
        return wrap(<p className="text-sm text-slate-500">This section is not available.</p>);
    }
  };

  return (
    <div className="flex flex-row min-h-screen w-full bg-slate-100">

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar: the six primary items */}
      <aside className={`fixed md:sticky top-0 bottom-0 left-0 z-40 md:z-30 w-64 lg:w-72 shrink-0 bg-[#044332] text-emerald-100 flex flex-col justify-between select-none border-r border-emerald-950 h-screen transition-transform duration-200 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 border-b border-emerald-800/60 flex items-center justify-between gap-3 shrink-0 bg-[#033628]/40">
            <div onClick={() => handleNavSelect('overview')} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center p-1 shadow-inner shrink-0 group-hover:border-emerald-400 transition-colors">
                <SouthAfricanCoatOfArms size={30} variant="gold" />
              </div>
              <div>
                <div className="font-black text-white text-xs tracking-wider font-['Cabinet_Grotesk']">DSAC REPO</div>
                <div className="text-[10px] text-emerald-300/90 font-medium">Public Entities Oversight</div>
              </div>
            </div>

            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/60 rounded-lg cursor-pointer" title="Close menu">
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar" aria-label="Primary">
            {DSAC_SECTIONS.map(item => {
              if (item.id === 'admin' && store.currentUser?.role !== 'DSAC_ADMIN') return null;
              const Icon = SECTION_ICON[item.id];
              const isActive = section === item.id;
              const badge = sectionBadges[item.id];
              const hasTabs = item.tabs.length > 0;
              const isExpanded = expandedSections[item.id];
              return (
                <div key={item.id} className="space-y-1">
                <div
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all text-left group ${
                    isActive ? 'bg-[#0c5943] text-white shadow-sm font-bold ring-1 ring-emerald-400/40' : 'text-emerald-200/80 hover:bg-[#07533f] hover:text-white font-medium'
                  }`}
                >
                <button
                  key={item.id}
                  onClick={() => handleNavSelect(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                >
                  {navContent({ icon: Icon, label: item.label }, isActive)}
                </button>
                {badge && badge.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    badge.color || (isActive ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40')
                  }`}>
                    {badge.count}
                  </span>
                )}
                {hasTabs && (
                  <button
                    onClick={() => setExpandedSections(current => ({ ...current, [item.id]: !current[item.id] }))}
                    className="p-1 rounded text-emerald-300/70 hover:text-white hover:bg-emerald-700/60 cursor-pointer"
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label}`}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
                </div>
                {isExpanded && hasTabs && (
                  <div className="ml-5 pl-5 border-l border-emerald-800/70 space-y-0.5">
                    {item.tabs.filter(subtab => subtab.visible !== false).map(subtab => {
                      const isSubtabActive = isActive && tab === subtab.id;
                      const subtabCount = tabCounts[`${item.id}/${subtab.id}`];
                      return (
                        <button
                          key={subtab.id}
                          onClick={() => handleNavSelect(subtab.id === 'tasks' ? 'alert-tasks' : `${item.id}/${subtab.id}`)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-[11px] text-left cursor-pointer ${
                            isSubtabActive ? 'bg-emerald-700/70 text-white font-semibold' : 'text-emerald-300/75 hover:bg-emerald-900/70 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{subtab.label}</span>
                          {subtabCount !== undefined && subtabCount > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200">{subtabCount}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 border-t border-emerald-800/60 shrink-0 bg-[#033628]/40">
          <div className="space-y-0.5 text-[10px] font-semibold tracking-wider text-emerald-300/80 uppercase">
            <div className="text-white font-bold text-[11px]">Culture • Heritage • People</div>
            <div className="text-emerald-400 font-bold">Department of Sport, Arts and Culture</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">

        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3.5 min-w-0">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Toggle Menu">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <DsacOfficialLogo variant="light" />
            <div className="hidden sm:block h-7 w-px bg-slate-200" />
            <div className="truncate">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">{page.title}</h1>
              <p className="text-[11px] text-slate-500 font-medium truncate">{page.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search organisations */}
            <div className="relative hidden md:block w-48 lg:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                aria-label="Search organisations"
                placeholder="Search entities and NPOs..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 150)}
                onKeyDown={(e) => { if (e.key === 'Enter' && searchResults[0]) openEntityPage(searchResults[0].id); }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
              {showSearch && searchQuery.trim() && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  {searchResults.length === 0 ? (
                    <div className="px-3 py-2.5 text-xs text-slate-400">No organisation matches "{searchQuery.trim()}".</div>
                  ) : (
                    searchResults.map(e => (
                      <button key={e.id} onMouseDown={() => openEntityPage(e.id)} className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{e.name}</div>
                        <div className="text-[10px] text-slate-500">{e.shortCode} • {e.type === 'PUBLIC_ENTITY' ? 'Public entity' : 'NPO'} • {e.cluster}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Alerts: derived from the data, most serious first */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Items needing attention"
                aria-label={`${alerts.length} items need attention`}
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {alerts.length > 99 ? '99+' : alerts.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-xs text-slate-900">Needs attention</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${alerts.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {alerts.length} {alerts.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs max-h-80 overflow-y-auto">
                    {alerts.length === 0 && <div className="text-slate-500 py-3 text-center">Nothing needs attention right now.</div>}
                    {alerts.slice(0, 5).map(a => (
                      <div
                        key={a.id}
                        onClick={() => openEntityPage(a.entityId, a.tab)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          a.level === 'critical' ? 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-100/70' : 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/70'
                        }`}
                      >
                        <div className={`font-bold ${a.level === 'critical' ? 'text-rose-900' : 'text-amber-900'}`}>
                          {a.shortCode}: {a.title}
                        </div>
                        <p className={`text-[11px] mt-0.5 ${a.level === 'critical' ? 'text-rose-800' : 'text-amber-800'}`}>{a.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button onClick={() => handleNavSelect('risks')} className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer inline-flex items-center gap-1">
                      <span>Open Risk &amp; Early Warning</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button onClick={() => setShowNotifications(false)} className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer">Close</button>
                  </div>
                </div>
              )}
            </div>

            {/* User & sign out */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#044332] text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-700/50 shadow-xs shrink-0">
                {initials}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-bold text-slate-800 leading-none">{store.currentUser?.name || 'DSAC official'}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{store.currentUser?.designation || 'Public Entities Oversight'}</div>
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

        {/* Sub-tabs of the current section (none for the entity list and for an open entity page) */}
        {current.tabs.length > 0 && !openEntity && tab && (
          <SectionTabs tabs={asTabs} active={tab} onChange={(id) => { setTab(id); setOpenEntity(null); }} />
        )}

        {renderContent()}

        <footer className="mt-auto bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">DSAC REPO</span>
            <span>|</span>
            <span>One Portfolio. A Stronger Creative and Sporting Nation.</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Data as at {new Date().toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </footer>

        <PresentationDemoMode
          isOpen={isDemoModeOpen}
          onClose={() => setIsDemoModeOpen(false)}
          onNavigateToSection={(s) => handleNavSelect(s)}
          onNavigateToEntity={(id) => openEntityPage(id)}
        />

        <SystemGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
          onNavigateToSection={(s) => handleNavSelect(s)}
        />
      </div>
    </div>
  );
};
