/**
 * Reconciliation and control tests.
 *
 * These encode the accounting invariants the dashboards must satisfy and the control failures found in review.
 * Run with `npm test`. They drive the same store methods the UI buttons call.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { store } from '../store';
import { DEMO_PASSWORD, DEMO_DSAC_ADMIN_EMAIL } from '../../config/demoMode';
import { sha256Hex, hashPassword, verifyPassword } from '../passwordHash';
import {
  allocateProportionally,
  derivePeriodFromDate,
  getCurrentReportingPeriod,
  isQuarterDue,
  normalizeFinancialYear,
  quarterDueDate,
} from '../reportingPeriod';
import { calculateEntityFinancialSummary } from '../financialService';
import { classifyKpiProgress } from '../kpiProgress';
import { getEvidenceSummary } from '../evidenceStatus';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const FY = getCurrentReportingPeriod().financialYear;

function signIn(email: string) {
  const result = store.login(email, DEMO_PASSWORD);
  assert.equal(result.success, true, `could not sign in as ${email}`);
}
const asDsac = () => signIn(DEMO_DSAC_ADMIN_EMAIL);
const asNac = () => signIn('p.dlamini@nac.org.za');
const asSahra = () => signIn('kmokoena@sahra.org.za');
const asNfvf = () => signIn('b.sithole@nfvf.co.za');

const cat = () => store.getExpenseCategories()[0];
const line = (amount: number) => [{ categoryId: cat().id, categoryName: cat().name, actualAmount: amount, plannedAmount: 0 }];
const ret = (entityId: string, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', amount: number, affirmed = true) => ({
  entityId, entityName: entityId, financialYear: FY, quarter, totalQuarterlyActual: amount, lines: line(amount), accountingOfficerAffirmation: affirmed,
});
const entity = (id: string) => store.entities.find(e => e.id === id)!;
const pulse = () => store.getPerformancePulse();

beforeEach(() => {
  asDsac();
  store.reseedOfficialBaseline();
});

// ---------------------------------------------------------------------------------------------
describe('reporting period', () => {
  it('normalises every financial-year spelling to one canonical form', () => {
    for (const input of ['2025/26', '2025/2026', 'FY 2025/26', '2025/26 Financial Year', '2025/2026 (Current)']) {
      assert.equal(normalizeFinancialYear(input), '2025/26', input);
    }
    assert.equal(normalizeFinancialYear('2023/24 Financial Year'), '2023/24');
    assert.equal(normalizeFinancialYear('2026/27'), '2026/27');
    assert.equal(normalizeFinancialYear('This Financial Year'), FY);
  });

  it('derives the reporting quarter from a date', () => {
    assert.deepEqual(derivePeriodFromDate(new Date('2026-01-15T00:00:00Z')), { financialYear: '2025/26', quarter: 'Q3' });
    assert.deepEqual(derivePeriodFromDate(new Date('2026-09-18T00:00:00Z')), { financialYear: '2026/27', quarter: 'Q1' });
    assert.deepEqual(derivePeriodFromDate(new Date('2026-04-05T00:00:00Z')), { financialYear: '2025/26', quarter: 'Q4' });
  });

  it('knows which returns are due and when', () => {
    assert.equal(isQuarterDue('2025/26', 'Q3', { financialYear: '2025/26', quarter: 'Q3' }), true);
    assert.equal(isQuarterDue('2025/26', 'Q4', { financialYear: '2025/26', quarter: 'Q3' }), false);
    assert.equal(isQuarterDue('2024/25', 'Q4', { financialYear: '2025/26', quarter: 'Q1' }), true);
    assert.equal(isQuarterDue('2026/27', 'Q1', { financialYear: '2025/26', quarter: 'Q3' }), false);
    assert.ok(quarterDueDate('2025/26', 'Q3').startsWith('2026-01-31'));
  });

  it('allocates a total across weights without losing a cent', () => {
    for (const total of [0, 1, 7, 100, 10_000_000, 118_450_000, 15_000_001]) {
      for (const weights of [[1, 1, 1], [5, 3, 2], [32, 14, 12, 10, 5, 3, 4, 8, 6, 4, 2], [0, 0, 0], [1]]) {
        const parts = allocateProportionally(total, weights);
        assert.equal(sum(parts), total, `total ${total} weights ${weights}`);
        assert.ok(parts.every(p => Number.isInteger(p) && p >= 0));
      }
    }
  });
});

// ---------------------------------------------------------------------------------------------
describe('passwords and sessions', () => {
  it('computes correct SHA-256 digests', () => {
    assert.equal(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('hashes with a per-password salt and verifies correctly', () => {
    const a = hashPassword('Sup3rSecret');
    const b = hashPassword('Sup3rSecret');
    assert.notEqual(a, b);
    assert.equal(verifyPassword('Sup3rSecret', a), true);
    assert.equal(verifyPassword('sup3rsecret', a), false);
    assert.equal(verifyPassword('anything', undefined), false);
  });

  it('never stores plain-text passwords', () => {
    assert.ok(store.registeredUsers.length > 0);
    for (const u of store.registeredUsers) {
      assert.equal(u.password, undefined);
      assert.match(u.passwordHash || '', /^[0-9a-f]+\$[0-9a-f]{64}$/);
    }
  });

  it('rejects a missing or wrong password and does not reveal the expected one', () => {
    store.logout();
    const missing = store.login(DEMO_DSAC_ADMIN_EMAIL);
    assert.equal(missing.success, false);
    assert.equal(store.currentUser, null);
    const wrong = store.login(DEMO_DSAC_ADMIN_EMAIL, 'not-the-password');
    assert.equal(wrong.success, false);
    assert.equal(wrong.message, 'Invalid email or password.');
    assert.ok(!(wrong.message || '').includes(DEMO_PASSWORD));
    assert.equal(store.login('nobody@example.org', 'x').message, 'Invalid email or password.');
  });

  it('locks an account after repeated failures', () => {
    const email = 'lockout.test@example.org';
    for (let i = 0; i < 5; i++) store.login(email, 'wrong');
    assert.match(store.login(email, 'wrong').message || '', /Too many failed attempts/);
  });

  it('refuses weak passwords at registration', () => {
    const r = store.signUp({ name: 'X', email: 'weak@example.org', role: 'ENTITY_OFFICER', designation: 'Officer', password: 'short' });
    assert.equal(r.success, false);
  });
});

// ---------------------------------------------------------------------------------------------
describe('portfolio reconciliation (one source of truth)', () => {
  it('has the 26 public entities and 6 NPOs the brief specifies', () => {
    const p = pulse();
    assert.equal(p.totalEntities, 32);
    assert.equal(p.publicEntitiesCount, 26);
    assert.equal(p.nposCount, 6);
  });

  it('gives the same headline figures from the pulse, the engine and the sum of entities, for every period', () => {
    for (const fy of ['2023/24', '2024/25', '2025/26', '2026/27']) {
      for (const q of ['Q1', 'Q2', 'Q3', 'Q4', 'FULL_YEAR'] as const) {
        const agg = store.getDepartmentFinancialAggregation(fy, q);
        const kpi = store.getDepartmentFinancialKPIs(fy, q);
        const sums = store.entities.map(e => store.getEntityFinancialSummary(e.id, fy, q));
        const label = `${fy} ${q}`;
        assert.equal(agg.totalApprovedBudget, sum(sums.map(s => s.approvedAmount)), `approved ${label}`);
        assert.equal(agg.totalReportedExpenditure, sum(sums.map(s => s.ytdActual)), `reported ${label}`);
        assert.equal(agg.totalTransferredToDate, sum(sums.map(s => s.disbursedToDate)), `disbursed ${label}`);
        assert.equal(kpi.totalApproved, agg.totalApprovedBudget, `KPI approved ${label}`);
        assert.equal(kpi.totalActualYTD, agg.totalReportedExpenditure, `KPI reported ${label}`);
      }
    }
    const p = pulse();
    const agg = store.getDepartmentFinancialAggregation();
    assert.equal(p.totalAllocation, agg.totalApprovedBudget);
    assert.equal(p.totalExpended, agg.totalReportedExpenditure);
    assert.equal(p.totalTransferred, agg.totalTransferredToDate);
  });

  it('keeps the per-entity read cache identical to the engine', () => {
    const p = pulse();
    assert.equal(sum(store.entities.map(e => e.budgetAllocationZAR)), p.totalAllocation);
    assert.equal(sum(store.entities.map(e => e.transferredAmountZAR)), p.totalTransferred);
    assert.equal(sum(store.entities.map(e => e.reportedExpenditureZAR)), p.totalExpended);
  });

  it('foots every budget profile and every quarterly return', () => {
    for (const b of store.budgetProfiles) {
      if (b.approvedAmount > 0) assert.equal(sum(b.lines.map(l => l.annualBudget)), b.approvedAmount, `${b.entityId} ${b.financialYear} approved lines`);
      assert.equal(sum(b.lines.map(l => l.requestedAmount)), b.requestedAmount, `${b.entityId} ${b.financialYear} requested lines`);
    }
    for (const s of store.quarterlyFinancialSubmissions) {
      assert.equal(sum(s.lines.map(l => l.actualAmount)), s.totalQuarterlyActual, `${s.entityId} ${s.financialYear} ${s.quarter}`);
    }
  });

  it('shows expense lines that add up to the header for every entity (the Finance tab foots)', () => {
    for (const e of store.entities) {
      const s = store.getEntityFinancialSummary(e.id);
      assert.ok(s.categories.length > 0, `${e.id} has no expense lines`);
      assert.equal(s.lineBudgetVariance, 0, `${e.id} line budgets do not equal approved`);
      assert.equal(sum(s.categories.map(c => c.ytdActual)), s.ytdActual, `${e.id} line spend does not equal YTD`);
      assert.equal(s.linesReconcile, true, e.id);
    }
  });

  it('never disburses more than approved or fabricates disbursement', () => {
    for (const e of store.entities) {
      const s = store.getEntityFinancialSummary(e.id, FY, 'FULL_YEAR');
      assert.ok(s.disbursedToDate <= s.approvedAmount, e.id);
    }
    const byQuarter = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => store.getDepartmentFinancialAggregation(FY, q as 'Q1').totalTransferredToDate);
    for (let i = 1; i < byQuarter.length; i++) assert.ok(byQuarter[i] >= byQuarter[i - 1]);
    assert.ok(byQuarter[0] < byQuarter[2], 'disbursed must grow by quarter');
  });

  it('defines "remaining to disburse" as approved minus disbursed, distinct from "left to spend"', () => {
    const p = pulse();
    assert.equal(p.remainingDisbursement, p.totalAllocation - p.totalTransferred);
    assert.equal(p.remainingBudget, p.totalAllocation - p.totalExpended);
    assert.notEqual(p.remainingDisbursement, p.remainingBudget);
  });

  it('reports the two utilisation measures separately and consistently', () => {
    const p = pulse();
    assert.equal(p.burnRate, Math.round((p.totalExpended / p.totalAllocation) * 1000) / 10);
    assert.equal(p.expenditureRate, Math.round((p.totalExpended / p.totalTransferred) * 1000) / 10);
  });

  it('does not show prior-year data under the wrong year', () => {
    // Entities with no 2026/27 budget must show nothing for 2026/27, not their 2025/26 figures relabelled.
    const without = store.entities.filter(e => !store.getBudgetProfileForEntity(e.id, '2026/27'));
    assert.ok(without.length > 0);
    for (const e of without) {
      const s = store.getEntityFinancialSummary(e.id, '2026/27', 'Q3');
      assert.equal(s.ytdActual, 0, e.id);
      assert.equal(s.approvedAmount, 0, e.id);
    }
  });

  it('resolves "2025/2026" to the same numbers as "2025/26"', () => {
    const a = calculateEntityFinancialSummary('ent-ubuntu-arts', '2025/26', 'Q3', store.budgetProfiles, store.quarterlyFinancialSubmissions, store.expenseCategories, entity('ent-ubuntu-arts'), store.kpis, store.disbursements);
    const b = calculateEntityFinancialSummary('ent-ubuntu-arts', '2025/2026', 'Q3', store.budgetProfiles, store.quarterlyFinancialSubmissions, store.expenseCategories, entity('ent-ubuntu-arts'), store.kpis, store.disbursements);
    assert.equal(a.approvedAmount, b.approvedAmount);
    assert.equal(a.ytdActual, b.ytdActual);
  });

  it('shows the demonstration NPO consistently at header and line level', () => {
    const s = store.getEntityFinancialSummary('ent-ubuntu-arts');
    assert.equal(s.approvedAmount, 15_000_000);
    assert.equal(s.lineBudgetTotal, 15_000_000);
    assert.ok(s.categories.every(c => !c.isOverspent), 'no line should be overspent while the header is under budget');
  });
});

// ---------------------------------------------------------------------------------------------
describe('expenditure workflow', () => {
  it('counts a lodged return exactly once, and a resubmission replaces rather than adds', () => {
    const base = pulse().totalExpended;
    const nacBase = store.getEntityFinancialSummary('ent-nac');
    assert.equal(nacBase.q3Submitted, false, 'NAC has not lodged Q3');

    asNac();
    store.submitQuarterlyFinancialReturn(ret('ent-nac', 'Q3', 5_000_000));
    assert.equal(pulse().totalExpended - base, 5_000_000);

    store.submitQuarterlyFinancialReturn(ret('ent-nac', 'Q3', 7_000_000));
    assert.equal(pulse().totalExpended - base, 7_000_000, 'resubmission must replace, not add');
    const nac = store.getEntityFinancialSummary('ent-nac');
    assert.equal(nac.ytdActual, nacBase.ytdActual + 7_000_000);
    assert.equal(pulse().totalExpended, store.getDepartmentFinancialAggregation().totalReportedExpenditure);
  });

  it('keeps reported and verified amounts apart until DSAC accepts', () => {
    asNac();
    store.submitQuarterlyFinancialReturn(ret('ent-nac', 'Q3', 4_000_000));
    const submitted = store.getEntityFinancialSummary('ent-nac');
    assert.equal(submitted.unverifiedYtdActual, 4_000_000);

    asDsac();
    const sub = store.quarterlyFinancialSubmissions.find(s => s.entityId === 'ent-nac' && s.quarter === 'Q3')!;
    assert.equal(sub.status, 'SUBMITTED', 'a new return awaits DSAC review');
    store.reviewQuarterlyFinancialReturn(sub.id, 'APPROVE', 'ok');
    const accepted = store.getEntityFinancialSummary('ent-nac');
    assert.equal(accepted.unverifiedYtdActual, 0);
    assert.equal(accepted.verifiedYtdActual, accepted.ytdActual);
  });

  it('excludes a return that is uncertified (draft) or sent back for correction', () => {
    const base = pulse().totalExpended;
    asNac();
    store.submitQuarterlyFinancialReturn(ret('ent-nac', 'Q3', 3_000_000, false));
    assert.equal(pulse().totalExpended, base, 'a draft must not count');

    store.submitQuarterlyFinancialReturn(ret('ent-nac', 'Q3', 3_000_000, true));
    assert.equal(pulse().totalExpended - base, 3_000_000);
    asDsac();
    const sub = store.quarterlyFinancialSubmissions.find(s => s.entityId === 'ent-nac' && s.quarter === 'Q3')!;
    store.reviewQuarterlyFinancialReturn(sub.id, 'REQUEST_CORRECTION', 'vouchers missing');
    assert.equal(pulse().totalExpended, base, 'a returned return must not count');
    assert.deepEqual(store.getEntityFinancialSummary('ent-nac').returnedQuarters, ['Q3']);
  });

  it('locks an accepted return and blocks cross-entity or invalid submissions', () => {
    asSahra();
    assert.throws(() => store.submitQuarterlyFinancialReturn(ret('ent-sahra', 'Q3', 1_000)), /locked/);
    assert.throws(() => store.submitQuarterlyFinancialReturn(ret('ent-nac', 'Q3', 1_000)), /not authorised/);
    assert.throws(() => store.submitQuarterlyFinancialReturn({ ...ret('ent-sahra', 'Q4', 1), lines: line(-5) }), /non-negative/);
  });

  it('never lets a performance report change money, however often it is resubmitted', () => {
    const before = pulse();
    asNac();
    const report = store.reports.find(r => r.entityId === 'ent-nac' && r.quarter === 'Q3')!;
    store.submitReport(report.id, report.items, 999_000_000);
    store.submitReport(report.id, report.items, 999_000_000);
    const after = pulse();
    assert.equal(after.totalExpended, before.totalExpended);
    assert.equal(sum(store.entities.map(e => e.reportedExpenditureZAR)), before.totalExpended);
  });

  it('mirrors the finance return onto the performance report rather than trusting a typed claim', () => {
    asNac();
    store.submitQuarterlyFinancialReturn(ret('ent-nac', 'Q3', 6_000_000));
    const report = store.reports.find(r => r.entityId === 'ent-nac' && r.quarter === 'Q3')!;
    store.submitReport(report.id, report.items, 1);
    assert.equal(report.fundsSpentThisQuarterZAR, 6_000_000);
  });
});

// ---------------------------------------------------------------------------------------------
describe('funding controls', () => {
  it('does not release a withheld tranche when an unrelated (already approved) report is "approved"', () => {
    const nac = entity('ent-nac');
    assert.equal(nac.trancheStatus, 'WITHHELD');
    const q1 = store.reports.find(r => r.entityId === 'ent-nac' && r.quarter === 'Q1')!;
    store.reviewReport(q1.id, 'APPROVE', 'routine');
    assert.equal(entity('ent-nac').trancheStatus, 'WITHHELD');
    assert.equal(store.reports.find(r => r.entityId === 'ent-nac' && r.quarter === 'Q3')!.submissionStatus, 'OVERDUE');
  });

  it('releases the hold only once the overdue return is lodged AND accepted', () => {
    asNac();
    const q3 = store.reports.find(r => r.entityId === 'ent-nac' && r.quarter === 'Q3')!;
    store.submitReport(q3.id, q3.items, 0);
    assert.equal(entity('ent-nac').trancheStatus, 'WITHHELD', 'lodging alone is not enough');
    asDsac();
    store.reviewReport(q3.id, 'APPROVE', 'accepted');
    assert.equal(entity('ent-nac').overdueReportsCount, 0);
    assert.equal(entity('ent-nac').trancheStatus, 'RELEASED');
    assert.equal(store.getNextTranche('ent-nac')?.status, 'SCHEDULED');
  });

  it('never auto-lifts a stage 3+ statutory default', () => {
    store.issueStatutoryNotice('ent-nac', 3, 'board censure');
    asNac();
    const q3 = store.reports.find(r => r.entityId === 'ent-nac' && r.quarter === 'Q3')!;
    store.submitReport(q3.id, q3.items, 0);
    asDsac();
    store.reviewReport(q3.id, 'APPROVE', 'accepted');
    assert.equal(entity('ent-nac').trancheStatus, 'WITHHELD');
  });

  it('changes disbursed only through the ledger, in order, and never above the approved budget', () => {
    const before = pulse().totalTransferred;
    const blocked = store.releaseTranche('ent-nac', FY, 'Q4');
    assert.equal(blocked.success, false, 'withheld tranche cannot be released');
    assert.equal(pulse().totalTransferred, before);

    store.liftTrancheWithholding('ent-nac', 'cleared');
    const next = store.getNextTranche('ent-nac')!;
    const ok = store.releaseTranche('ent-nac', FY, next.tranche);
    assert.equal(ok.success, true, ok.message);
    assert.equal(pulse().totalTransferred - before, next.amountZAR);
    assert.ok(store.getEntityFinancialSummary('ent-nac', FY, 'FULL_YEAR').disbursedToDate <= entity('ent-nac').budgetAllocationZAR);
    assert.equal(store.releaseTranche('ent-nac', FY, next.tranche).success, false, 'cannot release twice');
  });

  it('blocks entity officers from DSAC-only actions', () => {
    asNac();
    const before = pulse().totalTransferred;
    assert.equal(store.releaseTranche('ent-nac', FY, 'Q4').success, false);
    store.liftTrancheWithholding('ent-nac', 'self-clearance');
    assert.equal(entity('ent-nac').trancheStatus, 'WITHHELD');
    store.enforceTrancheWithholding('ent-nfvf', 'sabotage');
    assert.equal(entity('ent-nfvf').trancheStatus, 'RELEASED');
    const report = store.reports.find(r => r.entityId === 'ent-sahra' && r.submissionStatus === 'CORRECTION_REQUIRED');
    if (report) {
      store.reviewReport(report.id, 'APPROVE', 'self-approval');
      assert.notEqual(report.submissionStatus, 'APPROVED');
    }
    assert.equal(pulse().totalTransferred, before);
    assert.equal(store.reviewBudgetRequest('bp-anything', 1, 'APPROVED').success, false);
  });
});

// ---------------------------------------------------------------------------------------------
describe('budget workflow', () => {
  const fullLines = (total: number) => [
    { categoryId: cat().id, categoryName: cat().name, requestedAmount: total },
  ];

  it('requires expense lines to add up to the request', () => {
    asNfvf();
    assert.throws(
      () => store.submitBudgetRequest({ entityId: 'ent-nfvf', entityName: 'NFVF', financialYear: '2027/28', requestedAmount: 100_000_000, justification: 'x', lines: fullLines(90_000_000) }),
      /must add up/
    );
  });

  it('stores a partial approval and allocates it exactly across the lines', () => {
    asNfvf();
    const p = store.submitBudgetRequest({
      entityId: 'ent-nfvf', entityName: 'NFVF', financialYear: '2027/28', requestedAmount: 100_000_001, justification: 'x',
      lines: [
        { categoryId: store.getExpenseCategories()[0].id, categoryName: 'A', requestedAmount: 33_333_334 },
        { categoryId: store.getExpenseCategories()[1].id, categoryName: 'B', requestedAmount: 33_333_333 },
        { categoryId: store.getExpenseCategories()[2].id, categoryName: 'C', requestedAmount: 33_333_334 },
      ],
    });
    asDsac();
    assert.equal(store.reviewBudgetRequest(p.id, 200_000_000, 'APPROVED').success, false, 'cannot approve more than requested');
    const r = store.reviewBudgetRequest(p.id, 60_000_007, 'PARTIALLY_APPROVED', 'partial');
    assert.equal(r.success, true, r.message);
    const stored = store.budgetProfiles.find(b => b.id === p.id)!;
    assert.equal(stored.approvedAmount, 60_000_007);
    assert.equal(stored.status, 'PARTIALLY_APPROVED');
    assert.equal(sum(stored.lines.map(l => l.annualBudget)), 60_000_007, 'lines must foot exactly');
  });

  it('does not let approving next year change this year', () => {
    const before = entity('ent-basa').budgetAllocationZAR;
    const profile = store.budgetProfiles.find(b => b.entityId === 'ent-basa' && b.financialYear === '2026/27')!;
    const r = store.reviewBudgetRequest(profile.id, profile.requestedAmount, 'APPROVED');
    assert.equal(r.success, true, r.message);
    assert.equal(entity('ent-basa').budgetAllocationZAR, before);
    assert.equal(store.getEntityFinancialSummary('ent-basa', FY, 'Q3').approvedAmount, before);
  });

  it('keeps an existing approval when the entity lodges a revision, and when DSAC declines it', () => {
    const existing = store.budgetProfiles.find(b => b.entityId === 'ent-sahra' && b.financialYear === '2026/27' && b.status === 'APPROVED')!;
    const approved = existing.approvedAmount;
    const lineBudgets = existing.lines.map(l => l.annualBudget);
    asSahra();
    store.submitBudgetRequest({ entityId: 'ent-sahra', entityName: 'SAHRA', financialYear: '2026/27', requestedAmount: approved * 2, justification: 'revision', lines: fullLines(approved * 2) });
    const revised = store.budgetProfiles.find(b => b.id === existing.id)!;
    assert.equal(revised.approvedAmount, approved, 'approval must stand while a revision is pending');
    assert.equal(revised.status, 'SUBMITTED');
    assert.deepEqual(revised.lines.filter(l => l.annualBudget > 0).map(l => l.annualBudget).sort(), lineBudgets.filter(v => v > 0).sort());
    asDsac();
    store.reviewBudgetRequest(existing.id, 0, 'REJECTED', 'no');
    const after = store.budgetProfiles.find(b => b.id === existing.id)!;
    assert.equal(after.approvedAmount, approved);
    assert.equal(after.status, 'APPROVED');
  });

  it('imports Treasury allocations for one year only, once per entity, and foots the lines', () => {
    const before = entity('ent-nfvf').budgetAllocationZAR;
    const r = store.uploadTreasuryAllocations(
      [{ shortCode: 'NFVF', amount: 100 }, { shortCode: 'NFVF', amount: 200_000_001 }, { shortCode: 'ZZZ', amount: 5 }, { shortCode: 'BSA', amount: -1 }],
      '2027/28', 'test.csv'
    );
    assert.equal(r.updatedCount, 1);
    assert.equal(r.totalZAR, 200_000_001, 'the duplicate row must not be counted twice');
    assert.equal(r.skipped.length, 2);
    const p = store.budgetProfiles.find(b => b.entityId === 'ent-nfvf' && b.financialYear === '2027/28')!;
    assert.equal(sum(p.lines.map(l => l.annualBudget)), 200_000_001);
    assert.equal(entity('ent-nfvf').budgetAllocationZAR, before, 'a 2027/28 import must not change the current year');
  });
});

// ---------------------------------------------------------------------------------------------
describe('registration', () => {
  it('does not add invented money, or unapproved budget, to the portfolio', () => {
    const before = pulse();
    const result = store.registerEntityAndUser({
      entityName: 'Test Arts NPO', entityType: 'NPO', cluster: 'Subsidized Cultural NPOs', cipcNumber: '2020/000001/08',
      accountingOfficer: 'A Tester', email: 'tester@example.org', password: 'Str0ngPass1', allocatedBudgetZAR: 500_000_000,
    });
    assert.equal(result.success, true, result.message);
    const after = pulse();
    assert.equal(after.totalAllocation, before.totalAllocation);
    assert.equal(after.totalTransferred, before.totalTransferred);
    assert.equal(after.totalExpended, before.totalExpended);
    assert.equal(after.totalEntities, before.totalEntities);
    assert.equal(after.pendingRegistrationsCount, before.pendingRegistrationsCount + 1);
    const e = store.entities.find(x => x.name === 'Test Arts NPO')!;
    assert.equal(e.registrationStatus, 'PENDING_VERIFICATION');
    assert.equal(e.auditOutcome, 'NOT_YET_AUDITED');
    assert.equal(e.budgetAllocationZAR, 0);
    assert.equal(e.declaredBudgetZAR, 500_000_000);
    const request = store.budgetProfiles.find(b => b.entityId === e.id)!;
    assert.equal(request.status, 'SUBMITTED');
    assert.equal(request.approvedAmount, 0);
  });

  it('will not attach a new user to an existing organisation', () => {
    const r = store.registerEntityAndUser({
      entityName: 'Boxing South Africa (BSA)', entityType: 'PUBLIC_ENTITY', cluster: 'Sport & Recreation', cipcNumber: 'x',
      accountingOfficer: 'Intruder', email: 'intruder@example.org', password: 'Str0ngPass1',
    });
    assert.equal(r.success, false);
    assert.match(r.message || '', /already registered/);
  });
});

// ---------------------------------------------------------------------------------------------
describe('performance indicators', () => {
  it('keeps every stored KPI value consistent with its quarterly facts', () => {
    for (const k of store.kpis) {
      assert.equal(k.q1Target + k.q2Target + k.q3Target + k.q4Target, k.annualTarget, `${k.id} quarterly targets`);
      const actual = (k.q1Actual || 0) + (k.q2Actual || 0) + (k.q3Actual || 0) + (k.q4Actual || 0);
      assert.equal(actual, k.currentValue, `${k.id} currentValue`);
    }
  });

  it('classifies with one rule set everywhere', () => {
    assert.equal(classifyKpiProgress(100, 100, true).kpiStatus, 'COMPLETED');
    assert.equal(classifyKpiProgress(100, 95, true).kpiStatus, 'ON_TRACK');
    assert.equal(classifyKpiProgress(100, 75, true).kpiStatus, 'AT_RISK');
    assert.equal(classifyKpiProgress(100, 40, true).kpiStatus, 'MISSED');
    assert.equal(classifyKpiProgress(100, 0, false).kpiStatus, 'NOT_STARTED');
    assert.equal(classifyKpiProgress(100, 0, true).kpiStatus, 'MISSED', 'reported zero is a miss, not "not started"');
    const p = pulse();
    assert.equal(p.kpisOnTrack + p.kpisAtRisk + p.kpisMissed + p.kpisNotStarted, p.totalKpis);
  });

  it('updates the cumulative value and the report line item on the same basis', () => {
    asSahra();
    const kpi = store.kpis.find(k => k.id === 'kpi-sahra-1')!;
    store.updateKPIValue(kpi.id, 20, 'catch-up', 'Q3', 'plan');
    assert.equal(kpi.currentValue, (kpi.q1Actual || 0) + (kpi.q2Actual || 0) + 20);
    const item = store.reports.find(r => r.entityId === 'ent-sahra' && r.quarter === 'Q3')!.items.find(i => i.kpiId === kpi.id)!;
    assert.equal(item.actualAchieved, kpi.currentValue);
    assert.equal(item.targetToDate, kpi.q1Target + kpi.q2Target + kpi.q3Target);
  });

  it('rejects invalid values and updates for another organisation', () => {
    asSahra();
    const own = store.kpis.find(k => k.id === 'kpi-sahra-1')!;
    const ownBefore = own.currentValue;
    store.updateKPIValue(own.id, -5, undefined, 'Q3');
    assert.equal(own.currentValue, ownBefore);
    const other = store.kpis.find(k => k.entityId === 'ent-nac')!;
    const otherBefore = other.currentValue;
    store.updateKPIValue(other.id, 9999, undefined, 'Q3');
    assert.equal(other.currentValue, otherBefore);
  });
});

// ---------------------------------------------------------------------------------------------
describe('document review and evidence', () => {
  const pendingDocument = () => {
    const doc = store.documents[0];
    doc.approvalStatus = 'PENDING_REVIEW';
    return doc;
  };

  it('lets only DSAC officials verify a document', () => {
    const doc = pendingDocument();
    asNac();
    store.verifyDocument(doc.id, 'APPROVED', 'self-approval attempt');
    assert.equal(store.documents.find(d => d.id === doc.id)!.approvalStatus, 'PENDING_REVIEW');
    asDsac();
    store.verifyDocument(doc.id, 'APPROVED', 'checked against the bank statement');
    const after = store.documents.find(d => d.id === doc.id)!;
    assert.equal(after.approvalStatus, 'APPROVED');
    assert.ok(after.approvedBy && after.approvedAt, 'the approver and time are recorded');
  });

  it('does not approve the entity\'s reports as a side effect of verifying a document', () => {
    const doc = pendingDocument();
    const before = store.reports.filter(r => r.entityId === doc.entityId).map(r => [r.id, r.submissionStatus]);
    const q3 = store.reports.find(r => r.entityId === doc.entityId && r.quarter === 'Q3');
    if (q3) q3.submissionStatus = 'SUBMITTED';
    const snapshot = store.reports.filter(r => r.entityId === doc.entityId).map(r => [r.id, r.submissionStatus]);
    asDsac();
    store.verifyDocument(doc.id, 'APPROVED');
    const after = store.reports.filter(r => r.entityId === doc.entityId).map(r => [r.id, r.submissionStatus]);
    assert.deepEqual(after, snapshot, 'report statuses are decided by report review only');
    assert.equal(before.length, after.length);
  });

  it('lets an entity officer archive only their own documents', () => {
    const template = store.documents.find(d => d.entityId !== 'ent-nac')!;
    const foreign = template.id;
    const own = { ...template, id: 'doc-test-own', entityId: 'ent-nac', entityName: 'National Arts Council' };
    store.documents.push(own);
    asNac();
    store.deleteEntityDocument(foreign);
    assert.ok(store.documents.some(d => d.id === foreign), 'another organisation\'s document is protected');
    store.deleteEntityDocument(own.id);
    assert.ok(!store.documents.some(d => d.id === own.id), 'own document can be archived');
  });

  it('reflects the structured returns in the evidence status, and never invents one', () => {
    const performance = store.documentRequirements.find(r => r.requiredDocumentType === 'PERFORMANCE_REPORT')!;
    const withDocs = new Set(store.documents.map(d => d.entityId));
    const q3 = (status: string) =>
      store.reports.find(r => r.quarter === 'Q3' && r.submissionStatus === status && !withDocs.has(r.entityId));

    const approved = q3('APPROVED')!;
    const slotFor = (entityId: string) =>
      getEvidenceSummary(entityId, 'Q3', FY).slots.find(s => s.id === performance.id)!;
    assert.equal(slotFor(approved.entityId).status, 'VERIFIED');
    assert.equal(slotFor(approved.entityId).source, 'RETURN');

    const returned = store.reports.find(r => r.quarter === 'Q3' && r.submissionStatus === 'CORRECTION_REQUIRED' && !withDocs.has(r.entityId))!;
    assert.equal(slotFor(returned.entityId).status, 'REJECTED');

    const overdue = store.reports.find(r => r.quarter === 'Q3' && r.submissionStatus === 'OVERDUE' && !withDocs.has(r.entityId))!;
    assert.equal(slotFor(overdue.entityId).status, 'MISSING');
    assert.equal(slotFor(overdue.entityId).source, 'NONE');
  });

  it('keeps the evidence counts consistent', () => {
    for (const e of store.entities.filter(x => x.type === 'PUBLIC_ENTITY')) {
      const s = getEvidenceSummary(e.id, 'Q3', FY);
      assert.ok(s.verifiedMandatory <= s.totalMandatory, e.name);
      assert.equal(s.slots.filter(x => x.mandatory).length, s.totalMandatory, e.name);
      assert.equal(s.completionPercent, s.totalMandatory ? Math.round((s.verifiedMandatory / s.totalMandatory) * 100) : 100, e.name);
    }
  });
});

// ---------------------------------------------------------------------------------------------
describe('tasks and comments', () => {
  const draft = (entityId: string, direction: 'DSAC_TO_ENTITY' | 'ENTITY_INTERNAL' | 'ENTITY_TO_DSAC') => ({
    entityId, entityName: entity(entityId).name, title: `test ${direction}`, description: 'd', assignedToName: 'someone',
    priority: 'HIGH' as const, status: 'OPEN' as const, dueDate: new Date(Date.now() + 86_400_000).toISOString(), direction,
  });
  const has = (title: string) => store.tasks.some(t => t.title === title);

  it('lets only DSAC issue a directive, and entity officers raise tasks for their own organisation only', () => {
    asNac();
    store.createTask(draft('ent-nac', 'DSAC_TO_ENTITY'));
    assert.ok(!has('test DSAC_TO_ENTITY'), 'an entity cannot issue itself a DSAC directive');
    store.createTask(draft('ent-sahra', 'ENTITY_INTERNAL'));
    assert.ok(!has('test ENTITY_INTERNAL'), 'nor raise a task for another organisation');
    store.createTask(draft('ent-nac', 'ENTITY_INTERNAL'));
    assert.ok(has('test ENTITY_INTERNAL'), 'its own internal task is fine');
    asDsac();
    store.createTask(draft('ent-sahra', 'DSAC_TO_ENTITY'));
    assert.ok(has('test DSAC_TO_ENTITY'), 'DSAC can direct any organisation');
  });

  it('lets only the owner or DSAC resolve a task, once, with a note', () => {
    asDsac();
    store.createTask(draft('ent-sahra', 'DSAC_TO_ENTITY'));
    const task = store.tasks.find(t => t.title === 'test DSAC_TO_ENTITY')!;
    asNac();
    store.resolveTask(task.id, 'closed by someone else');
    assert.equal(task.status, 'OPEN', 'another organisation cannot close it');
    asSahra();
    store.resolveTask(task.id, '   ');
    assert.equal(task.status, 'OPEN', 'a note is required');
    store.resolveTask(task.id, 'Evidence lodged on the portal.');
    assert.equal(task.status, 'COMPLETED');
    store.resolveTask(task.id, 'overwritten');
    assert.equal(task.resolutionNotes, 'Evidence lodged on the portal.', 'a closed task keeps its original resolution');
  });

  it('lets an organisation edit only its own profile fields, never its risk, funding status or money', () => {
    asNac();
    const nac = entity('ent-nac');
    const before = { risk: nac.riskLevel, tranche: nac.trancheStatus, reg: nac.registrationStatus, budget: nac.budgetAllocationZAR, score: nac.riskScore };
    store.updateEntity({ ...nac, contactEmail: 'new.contact@nac.org.za', riskLevel: 'LOW', riskScore: 1, trancheStatus: 'RELEASED', statutoryDefaultStage: 0, budgetAllocationZAR: 999_999_999, registrationStatus: 'ACTIVE' });
    const after = entity('ent-nac');
    assert.equal(after.contactEmail, 'new.contact@nac.org.za', 'a profile field is editable');
    assert.equal(after.riskLevel, before.risk);
    assert.equal(after.riskScore, before.score);
    assert.equal(after.trancheStatus, before.tranche, 'cannot lift its own funding hold');
    assert.equal(after.budgetAllocationZAR, before.budget);
    assert.equal(after.registrationStatus, before.reg);

    const sahra = entity('ent-sahra');
    store.updateEntity({ ...sahra, contactEmail: 'attacker@example.org' });
    assert.notEqual(entity('ent-sahra').contactEmail, 'attacker@example.org', "cannot edit another organisation's profile");
  });

  it('keeps document comments to the owning organisation and DSAC', () => {
    const doc = store.documents.find(d => d.entityId !== 'ent-nac')!;
    const before = doc.comments.length;
    asNac();
    store.addDocumentComment(doc.id, 'not my document');
    assert.equal(doc.comments.length, before);
    asDsac();
    store.addDocumentComment(doc.id, 'reviewer comment');
    assert.equal(doc.comments.length, before + 1);
  });

  it('still raises the system tasks a workflow creates, whoever triggers it', () => {
    asNac();
    const before = store.tasks.filter(t => t.entityId === 'ent-nac' && t.direction === 'ENTITY_TO_DSAC').length;
    store.submitQuarterlyReport({ entityId: 'ent-nac', quarter: 'Q3', financialYear: FY, expenditureClaimedZAR: 0, declarationNotes: 'certified' });
    assert.ok(
      store.tasks.filter(t => t.entityId === 'ent-nac' && t.direction === 'ENTITY_TO_DSAC').length > before,
      'lodging a return raises its review task for DSAC, even though the officer could not create that task by hand'
    );
  });
});

// ---------------------------------------------------------------------------------------------
describe('source guards', () => {
  const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const files: string[] = [];
  (function walk(dir: string) {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) { if (name !== '__tests__') walk(full); }
      else if (/\.(ts|tsx)$/.test(name)) files.push(full);
    }
  })(srcRoot);
  const rel = (f: string) => path.relative(srcRoot, f).replace(/\\/g, '/');

  it('contains no hard-coded credentials or personal e-mail accounts', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const text = readFileSync(f, 'utf8');
      if (/\bpassword\s*[:=]\s*['"][^'"]{4,}['"]/i.test(text)) offenders.push(`${rel(f)}: literal password`);
      if (/useState\(\s*['"][^'"]*[Pp]ass(word)?[^'"]*['"]\s*\)/.test(text) && /password/i.test(text) && /Password\d|@\d{3}/.test(text)) offenders.push(`${rel(f)}: prefilled password`);
      if (/[a-z0-9._-]+@gmail\.com/i.test(text)) offenders.push(`${rel(f)}: personal e-mail`);
    }
    assert.deepEqual(offenders, []);
  });

  it('types no monetary totals into screens (they must come from the engines)', () => {
    const allowedDivisors = new Set(['1_000_000', '1_000_000_000']);
    const offenders: string[] = [];
    for (const f of files.filter(x => rel(x).startsWith('components/'))) {
      const lines = readFileSync(f, 'utf8').split('\n');
      lines.forEach((text, i) => {
        for (const m of text.matchAll(/\b\d{1,3}(?:_\d{3}){2,}\b/g)) if (!allowedDivisors.has(m[0])) offenders.push(`${rel(f)}:${i + 1} ${m[0]}`);
        // Skip imports, asset names, time constants, and registration identifiers (not monetary amounts).
        if (/^\s*import\s|\.jpg|\.png|Date\.now|86400000|60000\b|pboNumber|npoNumber|cipcReg/.test(text)) return;
        for (const m of text.matchAll(/(?<![\w.])[1-9]\d{6,}(?![\w.])/g)) offenders.push(`${rel(f)}:${i + 1} ${m[0]}`);
      });
    }
    assert.deepEqual(offenders, []);
  });

  it('shows no typed compliance verdicts, no claims of dispatch, and no invented score changes', () => {
    // The old compliance screen showed every entity the same green checklist ("7 of 8 Validated", "B-BBEE Level 1
    // Verified"), claimed a demand letter had been "dispatched" when nothing was sent, and added +4 to a derived score.
    const banned: Array<[RegExp, string]> = [
      [/\b\d+ of \d+ Validated\b/, 'typed validation count'],
      [/Level 1 Verified|Valid (&amp;|&) Good Standing|Tabled (&amp;|&) Approved/, 'typed verdict'],
      [/(Transferred|Tranches Received) \(\d+%\)/, 'typed percentage in a money label'],
      [/Letter of Demand dispatched/i, 'claim that a letter was sent'],
      [/overallComplianceScore\s*[:=]\s*[^,;\n]*\+\s*\d/, 'invented score bump'],
    ];
    const offenders: string[] = [];
    for (const f of files.filter(x => rel(x).startsWith('components/'))) {
      const text = readFileSync(f, 'utf8');
      for (const [re, why] of banned) if (re.test(text)) offenders.push(`${rel(f)}: ${why}`);
    }
    assert.deepEqual(offenders, []);
  });

  it('has no generator of synthetic per-entity content', () => {
    // The old dossier generator invented KPIs, Q3 actuals, variance explanations and reviewer names.
    assert.ok(!files.some(f => /entityFeatureGenerator/.test(f)), 'the generator file must not exist');
    const offenders = files.filter(f => /generateEntityFeatureDossier|entityFeatureGenerator/.test(readFileSync(f, 'utf8'))).map(rel);
    assert.deepEqual(offenders, []);
  });

  it('shows a newly registered organisation with no KPIs rather than invented ones', () => {
    const id = 'ent-test-newly-registered';
    store.entities.push({ ...store.entities[0], id, name: 'Newly Registered NPO', shortCode: 'NEWNPO', type: 'NPO' } as typeof store.entities[number]);
    assert.equal(store.kpis.filter(k => k.entityId === id).length, 0);
    assert.equal(store.getPerformancePulse().totalKpis, store.kpis.length, 'no invented KPIs enter the totals');
  });

  it('uses one vote name and no inconsistent "Vote 40" text', () => {
    const offenders = files.filter(f => /Vote 40/.test(readFileSync(f, 'utf8'))).map(rel);
    assert.deepEqual(offenders, []);
  });
});
