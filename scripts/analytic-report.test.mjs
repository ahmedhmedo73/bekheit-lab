import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalyticReport, latestPanelResults } from '../src/services/analyticReport.ts';

const patient = { name: '<script>patient</script>', patientId: 'PAT-1', age: 45, phone: '', registeredDate: '2026-09-14' };
const old = { id: 'old', analyticTypeId: 'kidney', analyticTypeName: 'Kidney Functions', createdAt: '2026-09-01', result: 'old value' };
const current = { ...old, id: 'new', createdAt: '2026-09-14', children: [{ id: 'urea', name: 'Urea Serum', result: '<5', unit: 'mmol/L', referenceRange: 'Published example; lab review required' }] };

test('watermark mode has a logo on every panel; white mode stays plain', () => {
  const panels = [current, { ...old, analyticTypeId: 'liver' }];
  const logoUrl = 'https://example.test/bakhet-lab/bakhet-logo.png?x=1&y=2';
  const white = buildAnalyticReport(patient, panels, { logoUrl });
  const watermarked = buildAnalyticReport(patient, panels, { logoUrl, watermark: true });
  for (const html of [white, watermarked]) assert.ok(html.includes('&lt;5'));
  assert.ok(!white.includes('class="report-logo"'));
  assert.equal(watermarked.match(/class="report-logo"/g).length, 2);
  assert.equal(watermarked.match(/BAKHET MEDICAL LABORATORY/g).length, 2);
  assert.ok(watermarked.includes('bakhet-logo.png?x=1&amp;y=2'));
  assert.ok(!white.includes('<img class="watermark"'));
  assert.equal(watermarked.match(/<img class="watermark"/g).length, 2);
  assert.match(white, /@page \{ size: A4 portrait; margin: 0; \}/);
  assert.match(white, /\.report-page \{ position: relative; isolation: isolate; min-height: 297mm; padding: 15mm 12mm;/);
});

test('print uses latest panel and shows historical data separately', () => {
  assert.deepEqual(latestPanelResults([old, current]), [current]);
  assert.deepEqual(latestPanelResults([current, old]), [current]);
  const html = buildAnalyticReport(patient, [old, current]);
  assert.ok(html.includes('old value'));
  assert.ok(html.includes('Previous Test Results'));
  assert.ok(html.includes('Reference Range'));
  assert.ok(html.includes('Published example; lab review required'));
  assert.ok(html.includes('&lt;5'));
  assert.ok(html.includes('&lt;script&gt;patient&lt;/script&gt;'));
  assert.ok(!html.includes('<script>patient'));
});

test('previous results belong to the same patient and panel, predate the selected result, and escape their content', () => {
  const p = { ...patient, id: 'p' };
  const history = [
    { ...old, patientId: 'p', children: [{ id: 'u', name: 'Urea <Serum>', result: '46.4', unit: 'mg/dL' }] },
    { ...old, id: 'other-patient', patientId: 'other', result: 'private value' },
    { ...old, id: 'other-panel', patientId: 'p', analyticTypeId: 'liver', result: 'other panel value' },
    { ...old, id: 'later', patientId: 'p', createdAt: '2026-09-20', result: 'later value' },
    { ...current, patientId: 'p' },
  ];
  const html = buildAnalyticReport(p, [{ ...current, patientId: 'p' }], { history });
  assert.ok(html.includes('Urea &lt;Serum&gt;'));
  assert.ok(html.includes('46.4 mg/dL'));
  for (const excluded of ['private value', 'other panel value', 'later value']) assert.ok(!html.includes(excluded));
  assert.equal(html.match(/Previous Test Results/g).length, 1);
  assert.ok(!buildAnalyticReport(p, [{ ...current, patientId: 'p' }], { history: [] }).includes('Previous Test Results'));
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

test('print omits blank children from current and previous results', () => {
  const withOptionalChildren = { ...current, children: [
    { id: 'filled', name: 'Measured Urea', result: '46.4', unit: 'mg/dL', referenceRange: '13 - 50' },
    { id: 'blank', name: 'Unmeasured Creatinine', result: '  ', unit: 'mg/dL', referenceRange: '0.5 - 1.1' },
    { id: 'absolute', name: 'Absolute Only', result: '', absoluteResult: '5710', absoluteEnabled: true, resultType: 'differential', unit: '%', absoluteUnit: '/cmm' },
  ] };
  const historical = { ...old, children: [
    { id: 'old-filled', name: 'Old Urea', result: '40', unit: 'mg/dL' },
    { id: 'old-blank', name: 'Old Empty Test', result: '' },
  ] };
  const html = buildAnalyticReport(patient, [withOptionalChildren], { history: [historical] });
  for (const value of ['Measured Urea', 'Absolute Only', '5710', 'Old Urea']) assert.ok(html.includes(value));
  for (const value of ['Unmeasured Creatinine', 'Old Empty Test']) assert.ok(!html.includes(value));
});

test('older duplicate results from the same visit are not printed as previous results', () => {
  const selected = { ...current, patientId: 'p', visitId: 'visit-1' };
  const duplicate = { ...old, patientId: 'p', visitId: 'visit-1', result: 'same visit duplicate' };
  const priorVisit = { ...old, id: 'prior', patientId: 'p', visitId: 'visit-0', result: 'previous visit result' };
  const html = buildAnalyticReport({ ...patient, id: 'p' }, [selected], { history: [duplicate, priorVisit, selected] });
  assert.ok(!html.includes('same visit duplicate'));
  assert.ok(html.includes('previous visit result'));
});
