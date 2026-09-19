/**
 * DSAC navigation: one definition of the sidebar, the sub-tabs inside each item, and where every older section id
 * now lands. The shell renders from this, and other screens (App routing, guided demo, the system guide, drill-down
 * links) keep using their existing ids because resolveDsacRoute() maps them.
 *
 * The functional specification asks for six primary items. Everything that used to be a sidebar item is now a
 * sub-tab inside one of them, so no screen was removed.
 */
export type DsacSectionId = 'dashboard' | 'entities' | 'reports' | 'requests' | 'alerts' | 'admin';

export interface DsacTab {
  id: string;
  label: string;
  /** Legacy destinations can remain routable without taking space in the primary navigation. */
  visible?: boolean;
}

export interface DsacSection {
  id: DsacSectionId;
  label: string;
  desc: string;
  tabs: DsacTab[];
}

export const DSAC_SECTIONS: DsacSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    desc: 'Portfolio status',
    tabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'performance', label: 'Performance' },
      { id: 'finance', label: 'Finance' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'ai', label: 'AI', visible: false },
    ],
  },
  {
    id: 'entities',
    label: 'Entities',
    desc: 'Institution view',
    tabs: [],
  },
  {
    id: 'reports',
    label: 'Reports',
    desc: 'Submissions',
    tabs: [
      { id: 'quarterly', label: 'Quarterly' },
      { id: 'vault', label: 'Evidence' },
      { id: 'parliament', label: 'Queries', visible: false },
    ],
  },
  {
    id: 'requests',
    label: 'Support',
    desc: 'Funding & requests',
    tabs: [
      { id: 'support', label: 'Support' },
      { id: 'directives', label: 'Directives' },
    ],
  },
  {
    id: 'alerts',
    label: 'Alerts',
    desc: 'Risks & actions',
    tabs: [
      { id: 'risks', label: 'Risks' },
      { id: 'deadlines', label: 'Compliance' },
      { id: 'tasks', label: 'Tasks' },
      { id: 'notifications', label: 'Alerts', visible: false },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    desc: 'Settings',
    tabs: [
      { id: 'audit', label: 'Audit' },
      { id: 'settings', label: 'Settings' },
      { id: 'security', label: 'Security', visible: false },
    ],
  },
];

export interface DsacRoute {
  section: DsacSectionId;
  tab?: string;
  /** Reports screen sub-view, when a legacy id named one. */
  reportsView?: 'submissions' | 'documents' | 'review';
  /** Finance screen sub-view, when a legacy id named one. */
  financeView?: 'portfolio' | 'approvals' | 'reviews' | 'support';
}

/** Every id the app has ever navigated with, and where it lands now. */
const LEGACY_ROUTES: Record<string, DsacRoute> = {
  overview: { section: 'dashboard', tab: 'overview' },
  executive: { section: 'dashboard', tab: 'performance' },
  performance: { section: 'dashboard', tab: 'performance' },
  kpis: { section: 'dashboard', tab: 'performance' },
  targets: { section: 'dashboard', tab: 'performance' },
  financials: { section: 'dashboard', tab: 'finance', financeView: 'portfolio' },
  transfers: { section: 'dashboard', tab: 'finance', financeView: 'approvals' },
  variance: { section: 'dashboard', tab: 'finance', financeView: 'reviews' },
  analytics: { section: 'dashboard', tab: 'analytics' },
  ai: { section: 'dashboard', tab: 'ai' },
  'dashboard/performance': { section: 'dashboard', tab: 'performance' },
  'dashboard/finance': { section: 'dashboard', tab: 'finance' },
  'dashboard/analytics': { section: 'dashboard', tab: 'analytics' },

  entities: { section: 'entities' },

  reports: { section: 'reports', tab: 'quarterly', reportsView: 'submissions' },
  'reports/quarterly': { section: 'reports', tab: 'quarterly', reportsView: 'submissions' },
  'reports/vault': { section: 'reports', tab: 'vault' },
  submissions: { section: 'reports', tab: 'quarterly', reportsView: 'submissions' },
  review: { section: 'reports', tab: 'quarterly', reportsView: 'review' },
  documents: { section: 'reports', tab: 'vault' },
  queries: { section: 'reports', tab: 'parliament' },

  support: { section: 'requests', tab: 'support' },
  'requests/support': { section: 'requests', tab: 'support' },
  'requests/directives': { section: 'requests', tab: 'directives' },
  tasks: { section: 'requests', tab: 'directives' },
  approvals: { section: 'requests', tab: 'directives' },
  'action-centre': { section: 'requests', tab: 'directives' },
  action_centre: { section: 'requests', tab: 'directives' },

  risks: { section: 'alerts', tab: 'risks' },
  'alerts/risks': { section: 'alerts', tab: 'risks' },
  'alerts/deadlines': { section: 'alerts', tab: 'deadlines' },
  radar: { section: 'alerts', tab: 'risks' },
  'early-warning': { section: 'alerts', tab: 'risks' },
  compliance: { section: 'alerts', tab: 'deadlines' },
  notifications: { section: 'alerts', tab: 'notifications' },
  'alert-tasks': { section: 'alerts', tab: 'tasks' },

  audit: { section: 'admin', tab: 'audit' },
  'admin/audit': { section: 'admin', tab: 'audit' },
  'admin/settings': { section: 'admin', tab: 'settings' },
  audit_logs: { section: 'admin', tab: 'audit' },
  'audit-logs': { section: 'admin', tab: 'audit' },
  settings: { section: 'admin', tab: 'settings' },
  security: { section: 'admin', tab: 'security' },
};

export const LEGACY_SECTION_IDS = Object.keys(LEGACY_ROUTES);

export function getSection(id: DsacSectionId): DsacSection {
  return DSAC_SECTIONS.find(s => s.id === id)!;
}

/** Resolves any section id (new or legacy) to a section and tab. Unknown ids land on the dashboard overview. */
export function resolveDsacRoute(id: string): DsacRoute {
  const legacy = LEGACY_ROUTES[id];
  if (legacy) return legacy;
  const section = DSAC_SECTIONS.find(s => s.id === id);
  if (section) return { section: section.id, tab: section.tabs[0]?.id };
  return { section: 'dashboard', tab: 'overview' };
}
