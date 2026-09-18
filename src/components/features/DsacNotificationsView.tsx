import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  ArrowRight, 
  Building2, 
  ShieldAlert, 
  FileText, 
  ExternalLink,
  Check,
  Send,
  Calendar,
  Layers
} from 'lucide-react';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';

interface DsacNotificationsViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
  onNavigateToSection?: (section: string) => void;
}

interface StatutoryNotification {
  id: string;
  entityId: string;
  entityName: string;
  shortCode: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  category: 'PFMA_COMPLIANCE' | 'PERFORMANCE_LAG' | 'AUDIT_FINDING' | 'OVERDUE_REPORT' | 'FINANCIAL_RISK';
  statutoryReference: string;
  read: boolean;
  targetSection: string;
}

const INITIAL_NOTIFICATIONS: StatutoryNotification[] = [
  {
    id: 'notif-001',
    entityId: 'ent-bsa',
    entityName: 'Boxing South Africa',
    shortCode: 'BSA',
    title: 'Ministerial Intervention Team Convened for Sanctioned Tournaments',
    description: 'Sanctioned tournament compliance rate currently at 40%. Mandatory Section 38 PFMA governance review triggered by Director-General.',
    timestamp: '2 hours ago',
    severity: 'CRITICAL',
    category: 'PFMA_COMPLIANCE',
    statutoryReference: 'PFMA Section 38(1)(a)(i) & Boxing Act No. 11 of 2001',
    read: false,
    targetSection: 'risks'
  },
  {
    id: 'notif-002',
    entityId: 'ent-nac',
    entityName: 'National Arts Council',
    shortCode: 'NAC',
    title: 'Artist Grant Disbursement Lag & Overdue Q3 Performance Filing',
    description: 'Artist grant disbursement rate (51.7%) lagging behind statutory targets. Statutory Q3 quarterly report submission is overdue by 14 days.',
    timestamp: '35 mins ago',
    severity: 'HIGH',
    category: 'OVERDUE_REPORT',
    statutoryReference: 'National Arts Council Act No. 56 of 1997 & Treasury Reg 30.2',
    read: false,
    targetSection: 'performance'
  },
  {
    id: 'notif-003',
    entityId: 'ent-pacofs',
    entityName: 'Performing Arts Centre of the Free State',
    shortCode: 'PACOFS',
    title: '3 AGSA Audit Findings on Fixed Asset Register Outstanding >90 Days',
    description: 'Auditor-General finding regarding theatre capital equipment asset register reconciliation remains unaddressed past statutory 90-day grace period.',
    timestamp: '5 hours ago',
    severity: 'HIGH',
    category: 'AUDIT_FINDING',
    statutoryReference: 'Public Audit Act No. 25 of 2004 Section 5(1)',
    read: false,
    targetSection: 'risks'
  },
  {
    id: 'notif-004',
    entityId: 'ent-ubuntu-arts',
    entityName: 'Ubuntu Arts Community NPO',
    shortCode: 'UBUNTU',
    title: 'Community Touring Subvention Tranche 2 Verification Required',
    description: 'Touring subvention expenditure at 41% pending Bizana & Flagstaff venue verification reports. Section 38(1)(j) certificate clearance pending.',
    timestamp: '1 day ago',
    severity: 'MEDIUM',
    category: 'FINANCIAL_RISK',
    statutoryReference: 'PFMA Section 38(1)(j) & NPO Act No. 71 of 1997',
    read: true,
    targetSection: 'financials'
  },
  {
    id: 'notif-005',
    entityId: 'ent-sahra',
    entityName: 'South African Heritage Resources Agency',
    shortCode: 'SAHRA',
    title: 'Heritage Site Grading Assessment Target Deviation',
    description: 'Sarah Baartman district heritage grading milestone logged 8 of 15 expected assessments. Remedial timeline requested by Oversight Branch.',
    timestamp: '2 days ago',
    severity: 'MEDIUM',
    category: 'PERFORMANCE_LAG',
    statutoryReference: 'National Heritage Resources Act No. 25 of 1999',
    read: true,
    targetSection: 'performance'
  },
  {
    id: 'notif-006',
    entityId: 'ent-nfvf',
    entityName: 'National Film and Video Foundation',
    shortCode: 'NFVF',
    title: 'Parliamentary Portfolio Committee Information Request Logged',
    description: 'Portfolio Committee on Sport, Arts and Culture submitted inquiry regarding rural film production distribution incentives and funding quotas.',
    timestamp: '3 days ago',
    severity: 'INFO',
    category: 'PFMA_COMPLIANCE',
    statutoryReference: 'Parliamentary Rule 138 & NFVF Act No. 73 of 1997',
    read: true,
    targetSection: 'queries'
  }
];

export const DsacNotificationsView: React.FC<DsacNotificationsViewProps> = ({
  entities,
  onSelectEntity,
  onOpenWorkspace,
  onNavigateToSection
}) => {
  const [notifications, setNotifications] = useState<StatutoryNotification[]>(INITIAL_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredNotifs = notifications.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || n.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.severity === 'CRITICAL').length;
  const highCount = notifications.filter(n => n.severity === 'HIGH').length;

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setActionNotice('All statutory notifications marked as acknowledged.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleToggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const getSeverityBadge = (severity: StatutoryNotification['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'INFO':
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <Bell className="w-5 h-5" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Department Statutory Alert System
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-['Cabinet_Grotesk'] tracking-tight">
                  Statutory Alerts &amp; Priority Notifications
                </h1>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 max-w-3xl">
              Real-time feed of Section 38 early warning triggers, overdue quarterly reports, AGSA audit findings, and urgent ministerial directives across all 32 institutions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Acknowledge All</span>
            </button>
          </div>
        </div>

        {actionNotice && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* 4 Metric Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500">Active Notifications</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{notifications.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{unreadCount} unacknowledged</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
            <div className="text-[11px] font-semibold text-rose-700">Critical PFMA Warnings</div>
            <div className="text-2xl font-black text-rose-700 mt-1">{criticalCount}</div>
            <div className="text-[10px] text-rose-600 mt-0.5">Ministerial escalation</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-700">High Risk Submissions</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{highCount}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Overdue / Audit findings</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-700">Total Entities Monitored</div>
            <div className="text-2xl font-black text-emerald-800 mt-1">32</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">26 PEs + 6 Subsidized NPOs</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search alerts by title, entity, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'].map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                  severityFilter === sev
                    ? 'bg-[#044332] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev === 'ALL' ? 'All Alerts' : sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No matching notifications</h3>
            <p className="text-xs text-slate-500 mt-1">All filtered statutory alerts have been processed.</p>
          </div>
        ) : (
          filteredNotifs.map(notif => (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all bg-white shadow-xs ${
                !notif.read ? 'border-emerald-300 ring-1 ring-emerald-500/20' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    notif.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                    notif.severity === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                    notif.severity === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {notif.severity === 'CRITICAL' || notif.severity === 'HIGH' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getSeverityBadge(notif.severity)}`}>
                        {notif.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {notif.entityName} ({notif.shortCode})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • {notif.timestamp}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Unread alert" />
                      )}
                    </div>

                    <h2 className="text-sm font-bold text-slate-900 mt-1">
                      {notif.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notif.description}
                    </p>

                    <div className="mt-2 text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Reference: {notif.statutoryReference}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col gap-2 shrink-0 self-end sm:self-start">
                  <button
                    onClick={() => {
                      if (onNavigateToSection) onNavigateToSection(notif.targetSection);
                    }}
                    className="px-3 py-1.5 bg-[#044332] hover:bg-[#033527] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleToggleRead(notif.id)}
                    className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  >
                    {notif.read ? 'Mark Unread' : 'Acknowledge'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
