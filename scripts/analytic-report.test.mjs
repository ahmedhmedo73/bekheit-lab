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

test('report renders sections, paired differential columns, and escaped group comments', () => {
  const html = buildAnalyticReport(patient, [{ ...current, generalComment: 'Review <finding>\nSecond line', children: [
    { id: 'wbc', name: 'WBC', section: 'CBC', result: '9.21', unit: '10^3/cmm', referenceRange: '4 - 11', resultType: 'numeric' },
    { id: 'neutrophils', name: 'Neutrophils', section: 'Differential White Cell Count', result: '52', unit: '%', referenceRange: '40 - 80', resultType: 'differential', absoluteEnabled: true, absoluteResult: '5710', absoluteReferenceRange: '2000 - 7000' },
    { id: 'bands', name: 'Bands', section: 'Differential White Cell Count', result: '2', unit: '%', referenceRange: '0 - 6', resultType: 'differential', absoluteEnabled: false },
  ] }]);
  for (const text of ['CBC', 'Relative Count', 'Absolute Count', '5710', '2000 - 7000', 'General Comment:', 'Review &lt;finding&gt;\nSecond line']) assert.ok(html.includes(text));
});
