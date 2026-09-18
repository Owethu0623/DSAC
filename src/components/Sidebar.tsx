import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Theater,
  Columns2,
  ShieldAlert,
  Target,
  FileText,
  FolderLock,
  ListTodo,
  Bot,
  History,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  LogOut,
  UserCheck,
  Building,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Coins,
  Settings
} from 'lucide-react';
import { store } from '../services/store';
import { SouthAfricanCoatOfArms } from './SouthAfricanCoatOfArms';
import { UbuntuArtsLogo } from './UbuntuArtsLogo';

export interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenAuthModal: () => void;
  onOpenEntityAuthModal?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  count?: number;
  countColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenAuthModal,
  onOpenEntityAuthModal,
}) => {
  const currentUser = store.currentUser;
  const pulse = store.getPerformancePulse();
  const openTasksCount = store.tasks.filter(t => t.status === 'OPEN').length;

  const isEntityPortal = currentTab === 'entity-portal';
  const isEntityUser = store.currentUser?.role === 'ENTITY_OFFICER';

  // Primary navigation items - filtered strictly by authenticated actor portal
  const portalItems = isEntityUser
    ? [
        {
          id: 'entity-portal',
          label: 'Entity / NPO Portal',
          sublabel: store.currentUser?.entityName || 'Entity Workspace',
          icon: Theater,
          badge: 'NPO',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        },
      ]
    : [
        {
          id: 'dsac-repo',
          label: 'DSAC REPO Oversight',
          sublabel: 'National Headquarters',
          icon: LayoutDashboard,
          badge: 'Live',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        },
      ];

  const navSections: NavSection[] = isEntityUser
    ? [
        {
          title: 'Institutional Portal',
          items: portalItems,
        },
        {
          title: 'Entity Workspace',
          items: [
            {
              id: 'workspace',
              label: 'Quarterly Review & PoE',
              sublabel: 'Reports & Evidentiary Registers',
              icon: Building,
            },
            {
              id: 'documents',
              label: 'Document Vault',
              sublabel: 'Statutory Uploads',
              icon: FolderLock,
              count: store.documents.length,
            },
          ],
        },
      ]
    : [
        {
          title: 'Primary Oversight',
          items: [
            {
              id: 'dsac-repo',
              label: 'Overview',
              sublabel: 'Executive Performance Radar',
              icon: LayoutDashboard,
              badge: 'Live',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            },
            {
              id: 'reports',
              label: 'Reporting',
              sublabel: 'Submissions, Review & Clearance',
              icon: FileText,
              count: pulse.q3OutstandingCount > 0 ? pulse.q3OutstandingCount : undefined,
              countColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            },
            {
              id: 'performance',
              label: 'Performance',
              sublabel: 'KPIs, Targets & Pulse',
              icon: Target,
            },
            {
              id: 'financials',
              label: 'Finance',
              sublabel: 'Budgets, Expenditure & Grants',
              icon: Coins,
            },
            {
              id: 'tasks',
              label: 'Actions',
              sublabel: 'Directives, Risks & Tasks',
              icon: ListTodo,
              count: openTasksCount > 0 ? openTasksCount : undefined,
              countColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            },
          ],
        },
        {
          title: 'Intelligence & Administration',
          items: [
            {
              id: 'ai',
              label: 'Insights',
              sublabel: 'AI Analyst & Comparative Trends',
              icon: Bot,
              badge: 'AI',
              badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
            },
            {
              id: 'documents',
              label: 'Documents',
              sublabel: 'Evidence Vault & Verification',
              icon: FolderLock,
              count: store.documents.length,
            },
            {
              id: 'settings',
              label: 'Administration',
              sublabel: 'Governance, Roles & Audit',
              icon: Settings,
            },
          ],
        },
      ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 md:static md:z-auto flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 select-none transition-all duration-300 ease-in-out shrink-0 shadow-2xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-[72px]' : 'md:w-[260px]'}`}
      >
        {/* 1. Header & Brand Lockup */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <div
            onClick={() => handleItemClick('dsac-repo')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/50 flex items-center justify-center p-1 shadow-md shrink-0 group-hover:border-emerald-400 transition-colors">
              <SouthAfricanCoatOfArms size={30} variant="gold" />
            </div>

            {!isCollapsed && (
              <div className="leading-tight overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base text-white tracking-tight font-['Cabinet_Grotesk']">
                    GovTrack <span className="text-emerald-400">SA</span>
                  </span>
                  <span className="text-[9px] font-bold tracking-wider uppercase px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                    DSAC
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Statutory Oversight Portal
                </p>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* 2. Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    currentTab === item.id ||
                    (item.id === 'dsac-repo' && currentTab === 'dashboard') ||
                    (item.id === 'radar' && currentTab === 'early-warning');

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                        isActive
                          ? item.id === 'entity-portal'
                            ? 'bg-indigo-700 text-white shadow-md shadow-indigo-900/30 font-semibold ring-1 ring-indigo-400/40'
                            : 'bg-emerald-700 text-white shadow-md shadow-emerald-900/30 font-semibold ring-1 ring-emerald-400/40'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'text-white'
                            : item.id === 'entity-portal'
                            ? 'text-indigo-400'
                            : 'text-slate-400 group-hover:text-emerald-400'
                        }`}
                      />

                      {!isCollapsed && (
                        <div className="flex-1 text-left min-w-0">
                          <div className="truncate font-semibold leading-tight">
                            {item.label}
                          </div>
                          {item.sublabel && (
                            <div
                              className={`text-[10px] truncate ${
                                isActive ? 'text-white/80' : 'text-slate-400'
                              }`}
                            >
                              {item.sublabel}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Badges / Counters */}
                      {!isCollapsed && (
                        <div className="shrink-0 flex items-center gap-1">
                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${item.badgeColor}`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {item.count !== undefined && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                                item.countColor ||
                                (isActive
                                  ? 'bg-white/20 text-white border-white/30'
                                  : 'bg-slate-800 text-slate-300 border-slate-700')
                              }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Active indicator bar on collapsed */}
                      {isCollapsed && isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Statutory Status Footer Widget */}
        {!isCollapsed ? (
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  Q3 Window Active
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">PFMA Sec 38</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                National Treasury Vote 37 compliance cycle in progress.
              </p>
            </div>

            {/* User Session Quick Card */}
            {currentUser && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200 truncate leading-none">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono truncate mt-0.5">
                      {currentUser.role === 'DSAC_ADMIN' ? 'DSAC Admin' : 'Entity Officer'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    store.logout();
                    onOpenAuthModal();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Sign out of session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex flex-col items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"
              title="Q3 Statutory Window Active"
            />
            {currentUser && (
              <div
                className="w-8 h-8 rounded-full bg-emerald-700/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                onClick={onOpenAuthModal}
                title={`${currentUser.name} (${currentUser.role})`}
              >
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
