import React from 'react';
import { KPIStatus } from '../../types';

type Tone = 'default' | 'good' | 'warn' | 'bad';

const TONE: Record<Tone, string> = {
  default: 'bg-slate-50 border-slate-200 text-slate-900',
  good: 'bg-emerald-50/70 border-emerald-200 text-emerald-800',
  warn: 'bg-amber-50/70 border-amber-200 text-amber-800',
  bad: 'bg-rose-50/70 border-rose-200 text-rose-800',
};

/** A single headline figure. */
export const Stat: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: Tone }> = ({ label, value, sub, tone = 'default' }) => (
  <div className={`p-3 rounded-xl border ${TONE[tone]}`}>
    <div className="text-[11px] font-semibold text-slate-500">{label}</div>
    <div className="text-lg font-black mt-0.5 leading-tight">{value}</div>
    {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
  </div>
);

/** A titled card. */
export const Panel: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, right, children }) => (
  <section className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs">
    <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
      <div>
        <h2 className="text-sm sm:text-base font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

export const KPI_STYLE: Record<KPIStatus, { label: string; pill: string; bar: string }> = {
  COMPLETED: { label: 'Achieved', pill: 'bg-emerald-100 text-emerald-800 border-emerald-300', bar: 'bg-emerald-600' },
  ON_TRACK: { label: 'On track', pill: 'bg-emerald-100 text-emerald-800 border-emerald-300', bar: 'bg-emerald-600' },
  AT_RISK: { label: 'At risk', pill: 'bg-amber-100 text-amber-800 border-amber-300', bar: 'bg-amber-500' },
  MISSED: { label: 'Not achieved', pill: 'bg-rose-100 text-rose-800 border-rose-300', bar: 'bg-rose-600' },
  NOT_STARTED: { label: 'Not started', pill: 'bg-slate-100 text-slate-700 border-slate-300', bar: 'bg-slate-400' },
};

export const LEVEL_STYLE = {
  critical: { dot: 'bg-rose-500', box: 'bg-rose-50/70 border-rose-200', text: 'text-rose-900', label: 'Critical' },
  warning: { dot: 'bg-amber-500', box: 'bg-amber-50/70 border-amber-200', text: 'text-amber-900', label: 'Warning' },
  info: { dot: 'bg-sky-500', box: 'bg-sky-50/60 border-sky-200', text: 'text-sky-900', label: 'Note' },
} as const;

export const RISK_TONE: Record<string, Tone> = { LOW: 'good', MEDIUM: 'warn', HIGH: 'bad', CRITICAL: 'bad' };

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
