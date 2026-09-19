/**
 * Navigation and attention tests.
 *
 * The specification asks for six primary DSAC items. These tests keep that true, keep every older section id
 * working, and check that the alerts DSAC sees come from the data rather than typed text.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { store } from '../store';
import { DEMO_PASSWORD, DEMO_DSAC_ADMIN_EMAIL } from '../../config/demoMode';
import { DSAC_SECTIONS, LEGACY_SECTION_IDS, resolveDsacRoute, getSection } from '../../config/dsacNavigation';
import { getEntityAttention, getPortfolioAlerts, EntityTab } from '../attention';
import { isPortfolioMember } from '../financialService';

const TABS: EntityTab[] = ['overview', 'performance', 'finance', 'compliance', 'reports', 'profile'];

beforeEach(() => {
  assert.equal(store.login(DEMO_DSAC_ADMIN_EMAIL, DEMO_PASSWORD).success, true);
  store.reseedOfficialBaseline();
});

describe('DSAC navigation', () => {
  it('has the six primary items the specification asks for', () => {
    assert.deepEqual(DSAC_SECTIONS.map(s => s.id), ['dashboard', 'entities', 'reports', 'requests', 'alerts', 'admin']);
  });

  it('gives every section unique tab ids, and none to the entity list', () => {
    for (const s of DSAC_SECTIONS) {
      const ids = s.tabs.map(t => t.id);
      assert.equal(new Set(ids).size, ids.length, `${s.id} has duplicate tabs`);
    }
    assert.equal(getSection('entities').tabs.length, 0);
  });

  it('sends every legacy section id to a real section and tab', () => {
    for (const id of LEGACY_SECTION_IDS) {
      const route = resolveDsacRoute(id);
      const section = getSection(route.section);
      assert.ok(section, `${id}: unknown section`);
      if (route.tab) assert.ok(section.tabs.some(t => t.id === route.tab), `${id} -> ${route.section}/${route.tab} is not a tab`);
    }
  });

  it('keeps the ids other screens navigate with working', () => {
    assert.deepEqual(resolveDsacRoute('overview'), { section: 'dashboard', tab: 'overview' });
    assert.equal(resolveDsacRoute('financials').tab, 'finance');
    assert.equal(resolveDsacRoute('transfers').financeView, 'approvals');
    assert.equal(resolveDsacRoute('review').reportsView, 'review');
    assert.equal(resolveDsacRoute('risks').section, 'alerts');
    assert.equal(resolveDsacRoute('queries').tab, 'parliament');
    assert.equal(resolveDsacRoute('audit_logs').tab, 'audit');
    assert.equal(resolveDsacRoute('a-section-that-does-not-exist').section, 'dashboard');
  });

  it('lands on the first tab when a section is named without one', () => {
    assert.equal(resolveDsacRoute('alerts').tab, 'risks');
    assert.equal(resolveDsacRoute('admin').tab, 'audit');
  });
});

describe('what needs attention', () => {
  it('flags an overdue return and a withheld tranche as critical, with a place to fix each', () => {
    const items = getEntityAttention('ent-nac');
    const critical = items.filter(i => i.level === 'critical');
    assert.ok(critical.some(i => /overdue/i.test(i.title)), 'overdue return');
    assert.ok(critical.some(i => /withheld/i.test(i.title)), 'withheld tranche');
    for (const i of items) assert.ok(TABS.includes(i.tab), `${i.id} points at ${i.tab}`);
  });

  it('is sorted most serious first', () => {
    const rank = { critical: 0, warning: 1, info: 2 } as const;
    const items = getEntityAttention('ent-nac');
    assert.deepEqual(items.map(i => rank[i.level]), items.map(i => rank[i.level]).sort((a, b) => a - b));
    const portfolio = getPortfolioAlerts().map(i => rank[i.level]);
    assert.deepEqual(portfolio, [...portfolio].sort((a, b) => a - b));
  });

  it('agrees with the headline overdue count', () => {
    const pulse = store.getPerformancePulse();
    const overdueAlerts = getPortfolioAlerts().filter(a => a.id.endsWith(':report-overdue'));
    assert.equal(overdueAlerts.length, pulse.currentQuarterOverdueCount);
  });

  it('lists only real portfolio organisations, and never information-level items', () => {
    const members = new Set(store.entities.filter(isPortfolioMember).map(e => e.id));
    for (const a of getPortfolioAlerts()) {
      assert.ok(members.has(a.entityId), a.id);
      assert.notEqual(a.level, 'info');
    }
  });

  it('says nothing about an organisation that does not exist', () => {
    assert.deepEqual(getEntityAttention('ent-does-not-exist'), []);
  });

  it('follows the data: lodging the overdue return clears the alert', () => {
    assert.ok(getEntityAttention('ent-nac').some(i => i.id.endsWith(':report-overdue')));
    const q3 = store.reports.find(r => r.entityId === 'ent-nac' && r.quarter === 'Q3')!;
    assert.equal(store.login('p.dlamini@nac.org.za', DEMO_PASSWORD).success, true);
    store.submitReport(q3.id, q3.items, 0);
    assert.ok(!getEntityAttention('ent-nac').some(i => i.id.endsWith(':report-overdue')));
    assert.ok(getEntityAttention('ent-nac').some(i => i.id.endsWith(':report-review')), 'now awaiting review');
  });
});

describe('the shell', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8');

  it('no longer carries the side view or the inspection drawer', () => {
    const shell = read('components/DsacRepoDashboard.tsx');
    assert.ok(!/DsacFeatureSideView|EntityInspectionDrawer/.test(shell));
    const files: string[] = [];
    (function walk(d: string) {
      for (const n of readdirSync(d)) {
        const f = path.join(d, n);
        if (statSync(f).isDirectory()) { if (n !== '__tests__') walk(f); } else files.push(f);
      }
    })(root);
    assert.ok(!files.some(f => /DsacFeatureSideView|EntityInspectionDrawer/.test(f)));
  });

  it('draws the sidebar from the navigation definition, not a typed list', () => {
    const shell = read('components/DsacRepoDashboard.tsx');
    assert.ok(/DSAC_SECTIONS/.test(shell));
    assert.ok(!/Statutory Early Alerts[\s\S]{0,400}Boxing SA/.test(shell), 'no typed alert about a named organisation');
    assert.ok(!/DSAC-PQ-2026\/048/.test(shell), 'no typed parliamentary question reference');
  });
});
