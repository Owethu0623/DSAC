import React, { useMemo, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowRight,
  Check,
} from 'lucide-react';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';
import { isPortfolioMember } from '../../services/financialService';
import { getCurrentReportingPeriod } from '../../services/reportingPeriod';
import { AttentionItem, AttentionLevel, EntityTab, getPortfolioAttention } from '../../services/attention';

interface DsacNotificationsViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string, tab?: EntityTab) => void;
  onNavigateToSection?: (section: string) => void;
}

const ACK_KEY = 'govtrack_ack_notifications';

// Acknowledgement is a per-viewer convenience kept in this browser; it never changes the data.
const readAcknowledged = (): Set<string> => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(ACK_KEY) || '[]'));
  } catch {
    return new Set<string>();
  }
};
const saveAcknowledged = (ids: Set<string>) => {
  try {
    localStorage.setItem(ACK_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage unavailable: acknowledgement lasts for this visit only */
  }
};

const LEVEL_LABEL: Record<AttentionLevel, string> = { critical: 'CRITICAL', warning: 'WARNING', info: 'NOTE' };
const LEVEL_BADGE: Record<AttentionLevel, string> = {
  critical: 'bg-rose-100 text-rose-800 border-rose-300',
  warning: 'bg-amber-100 text-amber-800 border-amber-300',
  info: 'bg-slate-100 text-slate-700 border-slate-300',
};
const LEVEL_ICON: Record<AttentionLevel, string> = {
  critical: 'bg-rose-100 text-rose-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-slate-100 text-slate-700',
};

/**
 * What needs a response across the portfolio. Every line is worked out from the returns, spending, delivery,
 * funding and directive records (see services/attention.ts), so it always agrees with the header bell and with the
 * entity pages. The previous version was a typed list of events, including some that never happened.
 */
export const DsacNotificationsView: React.FC<DsacNotificationsViewProps> = ({
  onOpenWorkspace,
  onNavigateToSection,
}) => {
  const [tick, setTick] = useState(0);
  React.useEffect(() => store.subscribe(() => setTick(t => t + 1)), []);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(readAcknowledged);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | AttentionLevel>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const period = getCurrentReportingPeriod();
  const items = useMemo(() => getPortfolioAttention(), [tick]);
  const members = store.entities.filter(isPortfolioMember);

  const filtered = items.filter(n => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || [n.title, n.entityName, n.shortCode, n.detail, n.category].some(t => t.toLowerCase().includes(q));
    return matchesSearch && (levelFilter === 'ALL' || n.level === levelFilter);
  });

  const unread = items.filter(n => !acknowledged.has(n.id)).length;
  const count = (l: AttentionLevel) => items.filter(n => n.level === l).length;

  const update = (next: Set<string>) => {
    setAcknowledged(next);
    saveAcknowledged(next);
  };
  const handleMarkAll = () => {
    update(new Set([...acknowledged, ...items.map(n => n.id)]));
    setActionNotice('All current items marked as acknowledged.');
    setTimeout(() => setActionNotice(null), 3500);
  };
  const handleToggle = (id: string) => {
    const next = new Set(acknowledged);
    if (next.has(id)) next.delete(id); else next.add(id);
    update(next);
  };
  const inspect = (n: AttentionItem) => {
    if (onOpenWorkspace) onOpenWorkspace(n.entityId, n.tab);
    else onNavigateToSection?.('entities');
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <Bell className="w-5 h-5" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Status as at {period.quarter} {period.financialYear}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-['Cabinet_Grotesk'] tracking-tight">
                  Priority Notifications
                </h1>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 max-w-3xl">
              What needs a response across all {members.length} institutions, worked out from the returns, spending, delivery, funding and directive records.
              An item disappears once the underlying problem is resolved.
            </p>
          </div>

          <button
            onClick={handleMarkAll}
            className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Acknowledge All</span>
          </button>
        </div>

        {actionNotice && (
          <div role="status" className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500">Active items</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{items.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{unread} unacknowledged</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
            <div className="text-[11px] font-semibold text-rose-700">Critical</div>
            <div className="text-2xl font-black text-rose-700 mt-1">{count('critical')}</div>
            <div className="text-[10px] text-rose-600 mt-0.5">Overdue, withheld or overspent</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-700">Warnings</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{count('warning')}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Sent back, lagging or on hold</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-700">Institutions monitored</div>
            <div className="text-2xl font-black text-emerald-800 mt-1">{members.length}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              {members.filter(e => e.type === 'PUBLIC_ENTITY').length} public entities + {members.filter(e => e.type === 'NPO').length} NPOs
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title, institution or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'critical', 'warning', 'info'] as const).map(level => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                  levelFilter === level ? 'bg-[#044332] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {level === 'ALL' ? 'All items' : LEVEL_LABEL[level]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">{items.length === 0 ? 'Nothing needs attention' : 'No matching items'}</h3>
            <p className="text-xs text-slate-500 mt-1">{items.length === 0 ? 'Every institution is up to date for this period.' : 'Change the search or filter to see more.'}</p>
          </div>
        ) : (
          filtered.map(n => {
            const read = acknowledged.has(n.id);
            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all bg-white shadow-xs ${!read ? 'border-emerald-300 ring-1 ring-emerald-500/20' : 'border-slate-200'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${LEVEL_ICON[n.level]}`}>
                      {n.level === 'info' ? <Bell className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${LEVEL_BADGE[n.level]}`}>
                          {LEVEL_LABEL[n.level]}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {n.entityName.includes(`(${n.shortCode})`) ? n.entityName : `${n.entityName} (${n.shortCode})`}
                        </span>
                        <span className="text-[11px] text-slate-400">• {n.category}</span>
                        {!read && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Unacknowledged" />}
                      </div>

                      <h2 className="text-sm font-bold text-slate-900 mt-1">{n.title}</h2>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.detail}</p>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col gap-2 shrink-0 self-end sm:self-start">
                    <button
                      onClick={() => inspect(n)}
                      className="px-3 py-1.5 bg-[#044332] hover:bg-[#033527] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => handleToggle(n.id)}
                      className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    >
                      {read ? 'Mark Unread' : 'Acknowledge'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
