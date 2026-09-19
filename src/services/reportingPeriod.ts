import type { FinancialQuarter } from '../types/financial';

/**
 * SINGLE SOURCE OF TRUTH FOR FINANCIAL-YEAR / QUARTER HANDLING
 *
 * South African national government financial years run 1 April – 31 March and are written "2025/26".
 * Every screen and service must go through this module: it replaces the five ad-hoc year normalisers
 * that previously disagreed with each other (e.g. "2025/2026" resolved to 2026/27 in one place and
 * 2025/26 in another) and the hard-coded 'Q3' / '2025/26' that made screens open on different periods.
 */

export const QUARTER_ORDER: FinancialQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

export type QuarterSelection = FinancialQuarter | 'FULL_YEAR';

export interface ReportingPeriod {
  financialYear: string; // canonical "2025/26"
  quarter: FinancialQuarter;
}

/**
 * The reporting period the platform is currently "as at".
 *
 * The demonstration dataset is frozen at the Q3 2025/26 statutory cycle (cut-off 31 Jan 2026). To run the
 * platform against the real clock once live data is loaded, either set VITE_REPORTING_PERIOD (for example
 * "2026/27:Q1") or switch DEFAULT_REPORTING_PERIOD to derivePeriodFromDate(new Date()). This is the ONLY
 * place that decision is made.
 */
export const DEFAULT_REPORTING_PERIOD: ReportingPeriod = { financialYear: '2025/26', quarter: 'Q3' };

let activePeriod: ReportingPeriod | null = null;

function readEnvOverride(): ReportingPeriod | null {
  try {
    const raw = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_REPORTING_PERIOD;
    if (!raw) return null;
    const [fy, q] = raw.split(':');
    const quarter = q?.toUpperCase() as FinancialQuarter;
    if (!fy || !QUARTER_ORDER.includes(quarter)) return null;
    return { financialYear: normalizeFinancialYear(fy, DEFAULT_REPORTING_PERIOD.financialYear), quarter };
  } catch {
    return null;
  }
}

export function getCurrentReportingPeriod(): ReportingPeriod {
  if (!activePeriod) activePeriod = readEnvOverride() || { ...DEFAULT_REPORTING_PERIOD };
  return activePeriod;
}

/** Test / demo helper. Pass null to restore the default. */
export function setCurrentReportingPeriod(period: ReportingPeriod | null): void {
  activePeriod = period ? { financialYear: normalizeFinancialYear(period.financialYear), quarter: period.quarter } : null;
}

/**
 * Canonicalises any financial-year label ("2025/26", "2025/2026", "FY 2025/26", "2025/26 Financial Year",
 * "2025/2026 (Current)") to "2025/26". Anything without a recognisable year resolves to the fallback
 * (default: the current reporting year), so labels such as "This Financial Year" work.
 */
export function normalizeFinancialYear(input?: string | null, fallback?: string): string {
  const match = String(input ?? '').match(/(20\d{2})/);
  if (!match) return fallback ?? getCurrentReportingPeriod().financialYear;
  const start = parseInt(match[1], 10);
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
}

/** "2025/26" -> "2025/2026" (the long form used by report records). */
export function toLongFinancialYear(fy: string): string {
  const start = financialYearStart(fy);
  return `${start}/${start + 1}`;
}

export function financialYearStart(fy: string): number {
  return parseInt(normalizeFinancialYear(fy).slice(0, 4), 10);
}

export function sameFinancialYear(a?: string | null, b?: string | null): boolean {
  return normalizeFinancialYear(a) === normalizeFinancialYear(b);
}

export function normalizeQuarter(quarter?: string | null): QuarterSelection {
  if (!quarter) return 'FULL_YEAR';
  const q = quarter.trim().toUpperCase();
  if (q.includes('Q1') || q === '1') return 'Q1';
  if (q.includes('Q2') || q === '2') return 'Q2';
  if (q.includes('Q3') || q === '3') return 'Q3';
  if (q.includes('Q4') || q === '4') return 'Q4';
  return 'FULL_YEAR';
}

/** 1..4 for a quarter; 4 for FULL_YEAR. */
export function quarterIndex(q: QuarterSelection): number {
  return q === 'FULL_YEAR' ? 4 : QUARTER_ORDER.indexOf(q) + 1;
}

/** Quarters covered by a selection: Q2 -> [Q1, Q2]; FULL_YEAR -> all four. */
export function quartersThrough(q: QuarterSelection): FinancialQuarter[] {
  return QUARTER_ORDER.slice(0, quarterIndex(q));
}

/**
 * Is a quarter's return due (its reporting window has opened) as at the current reporting period?
 * Earlier financial years are wholly due; later years are not due at all.
 */
export function isQuarterDue(
  financialYear: string,
  quarter: FinancialQuarter,
  period: ReportingPeriod = getCurrentReportingPeriod()
): boolean {
  const fy = financialYearStart(financialYear);
  const cur = financialYearStart(period.financialYear);
  if (fy < cur) return true;
  if (fy > cur) return false;
  return quarterIndex(quarter) <= quarterIndex(period.quarter);
}

/** Has the financial year fully closed as at the current reporting period? */
export function isFinancialYearClosed(financialYear: string, period: ReportingPeriod = getCurrentReportingPeriod()): boolean {
  return financialYearStart(financialYear) < financialYearStart(period.financialYear);
}

/** Statutory due date: quarter end + one month (31 Jul, 31 Oct, 31 Jan, 30 Apr). */
export function quarterDueDate(financialYear: string, quarter: FinancialQuarter): string {
  const start = financialYearStart(financialYear);
  switch (quarter) {
    case 'Q1': return `${start}-07-31T23:59:59.000Z`;
    case 'Q2': return `${start}-10-31T23:59:59.000Z`;
    case 'Q3': return `${start + 1}-01-31T23:59:59.000Z`;
    default: return `${start + 1}-04-30T23:59:59.000Z`;
  }
}

/** The most recently ended quarter as at a calendar date (the quarter whose return is being collected). */
export function derivePeriodFromDate(date: Date): ReportingPeriod {
  const month = date.getUTCMonth(); // 0 = Jan
  const year = date.getUTCFullYear();
  const fyStart = month >= 3 ? year : year - 1;
  // Months since 1 April of the FY start, then the number of whole quarters completed (min 1).
  const monthsIn = (year - fyStart) * 12 + month - 3;
  const completed = Math.min(4, Math.floor(monthsIn / 3));
  if (completed === 0) {
    // First quarter of a new year has not ended yet: the quarter being reported is Q4 of the year that just closed.
    return { financialYear: `${fyStart - 1}/${String(fyStart % 100).padStart(2, '0')}`, quarter: 'Q4' };
  }
  return {
    financialYear: `${fyStart}/${String((fyStart + 1) % 100).padStart(2, '0')}`,
    quarter: QUARTER_ORDER[completed - 1],
  };
}

/** Percentage to one decimal place, safe for a zero denominator. */
export function pct1(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

/**
 * Splits `total` (whole rand) across `weights` so the parts are integers that sum EXACTLY to `total`
 * (largest-remainder method). Prevents the R1-R7 rounding drift that stopped budget lines footing to the header.
 */
export function allocateProportionally(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const safeTotal = Math.max(0, Math.round(total));
  const sum = weights.reduce((a, b) => a + Math.max(0, b), 0);
  const w = sum > 0 ? weights.map(x => Math.max(0, x) / sum) : weights.map(() => 1 / n);
  const raw = w.map(x => x * safeTotal);
  const floors = raw.map(Math.floor);
  let remainder = safeTotal - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; remainder > 0; k = (k + 1) % n, remainder--) floors[order[k].i] += 1;
  return floors;
}
