import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalyticReport, latestPanelResults } from '../src/services/analyticReport.ts';

const patient = { name: '<script>patient</script>', patientId: 'PAT-1', age: 45, phone: '', registeredDate: '2026-09-14' };
const old = { id: 'old', analyticTypeId: 'kidney', analyticTypeName: 'Kidney Functions', createdAt: '2026-09-01', result: 'old value' };
const current = { ...old, id: 'new', createdAt: '2026-09-14', children: [{ id: 'urea', name: 'Urea Serum', result: '<5', unit: 'mmol/L', referenceRange: 'Published example; lab review required' }] };

test('print uses latest panel without changing historical data', () => {
  assert.deepEqual(latestPanelResults([old, current]), [current]);
  assert.deepEqual(latestPanelResults([current, old]), [current]);
  const html = buildAnalyticReport(patient, [old, current]);
  assert.ok(!html.includes('old value'));
  assert.ok(!html.includes('Previous Test Results'));
  assert.ok(html.includes('Reference Range'));
  assert.ok(html.includes('Published example; lab review required'));
  assert.ok(html.includes('&lt;5'));
  assert.ok(html.includes('&lt;script&gt;patient&lt;/script&gt;'));
  assert.ok(!html.includes('<script>patient'));
});

test('legacy results still print and separate panels get separate pages', () => {
  const html = buildAnalyticReport(patient, [old, { ...old, id: 'liver', analyticTypeId: 'liver', analyticTypeName: 'Liver' }]);
  assert.equal(html.match(/<section class="report-page">/g).length, 2);
  assert.ok(html.includes('old value'));
});
