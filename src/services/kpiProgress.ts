import { KPIRecord, KPIStatus } from '../types';
import { FinancialQuarter } from '../types/financial';
import {
  allocateProportionally,
  financialYearStart,
  getCurrentReportingPeriod,
  normalizeFinancialYear,
  normalizeQuarter,
  pct1,
  quarterIndex,
  QuarterSelection,
} from './reportingPeriod';

/**
 * SINGLE KPI CALCULATION + STATUS RULE.
 *
 * Previously three different rulesets classified the same KPI (the store, the engine and the alert code), so a
 * KPI could be "At Risk" on one screen, "In Progress" on another and "Missed" on a third. Everything now goes
 * through classifyKpiProgress().
 */

/** The financial year the stored q1..q4 targets/actuals on a KPIRecord relate to. */
export const KPI_DATA_YEAR = '2025/26';

/** >= 100% of the year-to-date target: Achieved. */
export const KPI_ON_TRACK_PCT = 90;
export const KPI_AT_RISK_PCT = 70;

export type KPIProgressStatus = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'MISSED';
export type KpiDataBasis = 'REPORTED' | 'AUDITED_ANNUAL' | 'ESTIMATED_FROM_ANNUAL' | 'PLANNED';

export interface CalculatedKpiItem {
  id: string;
  name: string;
  description?: string;
  programmeName: string;
  unitOfMeasure: string;
  target: number;
  actual: number;
  expectedProgress: number;
  /** How far through the annual target this period expects to be (25 / 50 / 75 / 100). */
  expectedPercentage: number;
  /** Actual as % of the YEAR-TO-DATE target (uncapped, so over-delivery stays visible). */
  percentageAchieved: number;
  /** Same, capped at 100 for averaging so over-delivery on one KPI cannot mask a shortfall on another. */
  cappedPercentage: number;
  isOnTrack: boolean;
  isAtRisk: boolean;
  /** Four-bucket status used by the distribution charts. */
  status: KPIProgressStatus;
  /** Spec vocabulary: COMPLETED (Achieved) / ON_TRACK / AT_RISK / MISSED (Not Achieved) / NOT_STARTED. */
  kpiStatus: KPIStatus;
  statusLabel: string;
  targetDisplay: string;
  actualDisplay: string;
  dataBasis: KpiDataBasis;
  q1Target: number;
  q1Actual: number | null;
  q2Target: number;
  q2Actual: number | null;
  q3Target: number;
  q3Actual: number | null;
  q4Target: number;
  q4Actual: number | null;
}

export interface KpiClassification {
  status: KPIProgressStatus;
  kpiStatus: KPIStatus;
  label: string;
  isOnTrack: boolean;
  isAtRisk: boolean;
  percentage: number;
}

/**
 * @param target   year-to-date target for the period being assessed
 * @param actual   year-to-date actual
 * @param hasReport whether anything has been reported at all (distinguishes "not reported" from "reported zero")
 */
export function classifyKpiProgress(
  target: number,
  actual: number,
  hasReport: boolean,
  notScheduledLabel = 'Not scheduled this period'
): KpiClassification {
  if (target <= 0 && actual <= 0) {
    return { status: 'NOT_STARTED', kpiStatus: 'NOT_STARTED', label: notScheduledLabel, isOnTrack: false, isAtRisk: false, percentage: 0 };
  }
  const percentage = target > 0 ? Math.round((actual / target) * 1000) / 10 : 100;
  if (!hasReport && actual <= 0) {
    return { status: 'NOT_STARTED', kpiStatus: 'NOT_STARTED', label: 'Not Started', isOnTrack: false, isAtRisk: false, percentage };
  }
  if (percentage >= 100) {
    return { status: 'COMPLETED', kpiStatus: 'COMPLETED', label: 'Achieved', isOnTrack: true, isAtRisk: false, percentage };
  }
  if (percentage >= KPI_ON_TRACK_PCT) {
    return { status: 'IN_PROGRESS', kpiStatus: 'ON_TRACK', label: 'On Track', isOnTrack: true, isAtRisk: false, percentage };
  }
  if (percentage >= KPI_AT_RISK_PCT) {
    return { status: 'IN_PROGRESS', kpiStatus: 'AT_RISK', label: 'At Risk', isOnTrack: false, isAtRisk: true, percentage };
  }
  return { status: 'MISSED', kpiStatus: 'MISSED', label: 'Not Achieved', isOnTrack: false, isAtRisk: true, percentage };
}

// ---------------------------------------------------------------------------------------------
// Quarter helpers on a KPIRecord
// ---------------------------------------------------------------------------------------------

function quarterTargets(kpi: KPIRecord): number[] {
  const fallback = Math.round((kpi.annualTarget || 0) * 0.25);
  return [kpi.q1Target ?? fallback, kpi.q2Target ?? fallback, kpi.q3Target ?? fallback, kpi.q4Target ?? fallback];
}

function quarterActuals(kpi: KPIRecord): (number | undefined)[] {
  return [kpi.q1Actual, kpi.q2Actual, kpi.q3Actual, kpi.q4Actual];
}

function isNonCumulative(kpi: KPIRecord): boolean {
  return kpi.calculationType === 'NON_CUMULATIVE';
}

/** Year-to-date target and actual through quarter index `qi` (1..4) for the KPI's own data year. */
function currentYearYtd(kpi: KPIRecord, qi: number): { target: number; actual: number; hasReport: boolean } {
  const T = quarterTargets(kpi);
  const A = quarterActuals(kpi);
  const reported = A.slice(0, qi).map((v, i) => ({ v, i })).filter(x => x.v !== undefined && x.v !== null);
  const hasReport = reported.length > 0;

  if (isNonCumulative(kpi)) {
    // Percentages and rates do not add: the latest reported quarter is the YTD result.
    const latest = reported.length ? reported[reported.length - 1] : undefined;
    return { target: T[qi - 1] ?? kpi.annualTarget ?? 0, actual: latest ? (latest.v as number) : 0, hasReport };
  }

  const target = qi >= 4 ? (kpi.annualTarget || T.reduce((a, b) => a + b, 0)) : T.slice(0, qi).reduce((a, b) => a + b, 0);
  const actual = A.slice(0, qi).reduce<number>((a, b) => a + (b ?? 0), 0);
  return { target, actual, hasReport };
}

// ---------------------------------------------------------------------------------------------
// Core per-KPI calculation
// ---------------------------------------------------------------------------------------------

export function calculateKpiItemProgress(
  kpi: KPIRecord,
  financialYear: string,
  quarter: QuarterSelection
): CalculatedKpiItem {
  const normYear = normalizeFinancialYear(financialYear);
  const normQuarter = normalizeQuarter(quarter);
  const qi = quarterIndex(normQuarter);
  const dataYearStart = financialYearStart(KPI_DATA_YEAR);
  const yearStart = financialYearStart(normYear);

  let target = 0;
  let actual = 0;
  let hasReport = true;
  let dataBasis: KpiDataBasis = 'REPORTED';
  let notScheduledLabel = 'Not scheduled this period';

  if (yearStart < dataYearStart) {
    // CLOSED PRIOR YEAR. Only the annual audited result is a real record; quarterly values are interpolated
    // and labelled as such so they are never mistaken for audited quarterly figures.
    // NB: match on the START year. The previous `year.includes('2024')` matched "2023/2024" first and so
    // showed the wrong year's result.
    const hist = kpi.historicalPerformance?.find(h => normalizeFinancialYear(h.year) === normYear);
    const histTarget = hist ? hist.target : (kpi.annualTarget || 10);
    const histAchieved = hist ? hist.achieved : (kpi.currentValue || histTarget);
    dataBasis = hist ? 'AUDITED_ANNUAL' : 'ESTIMATED_FROM_ANNUAL';

    if (histTarget <= 1) {
      // Annual statutory milestone (governance charter, audit opinion): only assessable at year-end.
      notScheduledLabel = 'Scheduled Q4';
      if (qi === 4) {
        target = histTarget;
        actual = histAchieved;
      }
    } else {
      const q1Target = Math.max(1, Math.round(histTarget * 0.25));
      const q2Target = Math.max(2, Math.round(histTarget * 0.5));
      const q3Target = Math.max(3, Math.round(histTarget * 0.75));
      const q4Target = histTarget;

      let q1Actual = Math.max(0, Math.round(q1Target * 0.8));
      let q2Actual = Math.max(q1Actual, Math.round(q2Target * 0.9));
      let q3Actual = Math.max(q2Actual, Math.round(histAchieved >= histTarget ? q3Target : q3Target * 0.88));
      let q4Actual = histAchieved;

      // Recorded audited quarterly results for the demonstration NPO.
      if (kpi.entityId === 'ent-ubuntu-arts' && normYear === '2024/25') {
        if (kpi.name.includes('Community arts')) { q1Actual = 3; q2Actual = 7; q3Actual = 12; q4Actual = 16; dataBasis = 'AUDITED_ANNUAL'; }
        else if (kpi.name.includes('Youth participants')) { q1Actual = 240; q2Actual = 520; q3Actual = 830; q4Actual = 1150; dataBasis = 'AUDITED_ANNUAL'; }
        else if (kpi.name.includes('Artisan')) { q1Actual = 5; q2Actual = 11; q3Actual = 18; q4Actual = 24; dataBasis = 'AUDITED_ANNUAL'; }
      }

      const targets = [q1Target, q2Target, q3Target, q4Target];
      const actuals = [q1Actual, q2Actual, q3Actual, q4Actual];
      target = targets[qi - 1];
      actual = actuals[qi - 1];
      if (qi < 4 && hist) dataBasis = 'ESTIMATED_FROM_ANNUAL';
    }
  } else if (yearStart === dataYearStart) {
    const ytd = currentYearYtd(kpi, qi);
    target = ytd.target;
    actual = ytd.actual;
    hasReport = ytd.hasReport;
  } else {
    // FUTURE YEAR: targets are planned, nothing has been reported.
    dataBasis = 'PLANNED';
    hasReport = false;
    const annual = kpi.annualTarget || 10;
    target = qi >= 4 ? annual : Math.round(annual * (qi * 0.25));
    actual = 0;
  }

  const cls = classifyKpiProgress(target, actual, hasReport, notScheduledLabel);
  const annualTarget = kpi.annualTarget || 0;
  const pct = target > 0 ? Math.round((actual / target) * 1000) / 10 : (actual > 0 ? 100 : 0);
  const T = quarterTargets(kpi);

  return {
    id: kpi.id,
    name: kpi.name,
    description: kpi.description || '',
    programmeName: kpi.programmeName,
    unitOfMeasure: kpi.unitOfMeasure,
    target,
    actual,
    expectedProgress: target,
    expectedPercentage: annualTarget > 0 ? Math.min(100, Math.round((target / annualTarget) * 1000) / 10) : 100,
    percentageAchieved: pct,
    cappedPercentage: Math.min(100, pct),
    isOnTrack: cls.isOnTrack,
    isAtRisk: cls.isAtRisk,
    status: cls.status,
    kpiStatus: cls.kpiStatus,
    statusLabel: cls.label,
    targetDisplay: `${target.toLocaleString()} ${kpi.unitOfMeasure}`,
    actualDisplay: `${actual.toLocaleString()} ${kpi.unitOfMeasure}`,
    dataBasis,
    q1Target: T[0],
    q1Actual: kpi.q1Actual !== undefined ? kpi.q1Actual : null,
    q2Target: T[1],
    q2Actual: kpi.q2Actual !== undefined ? kpi.q2Actual : null,
    q3Target: T[2],
    q3Actual: kpi.q3Actual !== undefined ? kpi.q3Actual : null,
    q4Target: T[3],
    q4Actual: kpi.q4Actual !== undefined ? kpi.q4Actual : null,
  };
}

// ---------------------------------------------------------------------------------------------
// Record integrity: keep the stored denormalised fields consistent with the quarterly facts
// ---------------------------------------------------------------------------------------------

/**
 * Re-derives every denormalised field on a KPIRecord from its quarterly targets/actuals so that
 * currentValue, expectedValue, percentageAchieved and status can never disagree with the quarters.
 * Fixes seed/import defects where currentValue was unrelated to the quarterly actuals (e.g. 825 vs 55)
 * and quarterly targets did not sum to the annual target.
 */
export function normalizeKpiRecord(kpi: KPIRecord): KPIRecord {
  const period = getCurrentReportingPeriod();
  const curIdx = quarterIndex(period.quarter);
  const next: KPIRecord = { ...kpi };
  const annual = next.annualTarget || 0;

  if (!isNonCumulative(next)) {
    const T = quarterTargets(next);
    const sum = T.reduce((a, b) => a + b, 0);
    if (annual > 0 && sum !== annual) {
      const q123 = T[0] + T[1] + T[2];
      const fixed = q123 <= annual
        ? [T[0], T[1], T[2], annual - q123]
        : allocateProportionally(annual, T);
      next.q1Target = fixed[0]; next.q2Target = fixed[1]; next.q3Target = fixed[2]; next.q4Target = fixed[3];
    }
  }

  const ytd = currentYearYtd(next, curIdx);
  const A = quarterActuals(next);
  const anyActual = A.some(v => v !== undefined && v !== null);
  if (anyActual) {
    // Cumulative KPIs: sum of quarters. Non-cumulative: latest quarter. Either way it comes from the quarters.
    next.currentValue = isNonCumulative(next)
      ? ([...A].reverse().find(v => v !== undefined && v !== null) as number)
      : A.reduce<number>((a, b) => a + (b ?? 0), 0);
  }

  next.expectedValue = ytd.target;
  next.percentageAchieved = annual > 0 ? Math.min(100, pct1(next.currentValue, annual)) : 100;
  const ytdNow = currentYearYtd(next, curIdx);
  next.status = classifyKpiProgress(ytdNow.target, ytdNow.actual, ytdNow.hasReport || next.currentValue > 0).kpiStatus;
  return next;
}

export function normalizeKpiRecords(kpis: KPIRecord[]): KPIRecord[] {
  return kpis.map(normalizeKpiRecord);
}

/** Cumulative target / actual for a KPI through a quarter of its data year (used for report line items). */
export function kpiCumulativeThrough(kpi: KPIRecord, quarter: FinancialQuarter): { target: number; actual: number } {
  const { target, actual } = currentYearYtd(kpi, quarterIndex(quarter));
  return { target, actual };
}

/**
 * Transparent run-rate projection of where a KPI lands at year end if the current pace continues.
 * Cumulative KPIs: year-to-date result / quarters elapsed x 4. Non-cumulative KPIs (rates, percentages): the
 * latest level is carried forward. Seasonality is not modelled, and the projection says so in every use.
 */
export function projectKpiAnnualAttainment(
  kpi: KPIRecord,
  throughQuarter: FinancialQuarter
): { projected: number; annualTarget: number; percentage: number } {
  const qi = Math.max(1, quarterIndex(throughQuarter));
  const { actual } = currentYearYtd(kpi, qi);
  const annual = kpi.annualTarget || 0;
  const projected = isNonCumulative(kpi) ? actual : Math.round((actual / qi) * 4);
  return { projected, annualTarget: annual, percentage: annual > 0 ? Math.round((projected / annual) * 1000) / 10 : 0 };
}
