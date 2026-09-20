import test from 'node:test';
import assert from 'node:assert/strict';
import { prefillAnalyticResults } from '../src/services/analyticResultPrefill.ts';

const assigned = [
  { id: 'kidney', name: 'Kidney Functions', price: 120, generalComment: 'Catalog comment', children: [
    { id: 'urea', name: 'Urea', unit: 'mg/dL', referenceRange: '13 - 50' },
    { id: 'creatinine', name: 'Creatinine', unit: 'mg/dL', referenceRange: '0.5 - 1.1' },
  ] },
  { id: 'liver', name: 'Liver Functions', price: 90, children: [
    { id: 'alt', name: 'ALT', unit: 'U/L', referenceRange: '0 - 40' },
  ] },
];

test('reopening a visit restores its latest saved child values and comment', () => {
  const saved = [
    { id: 'other', visitId: 'visit-2', analyticTypeId: 'kidney', createdAt: '2026-09-22', children: [{ id: 'urea', name: 'Urea', result: '99' }] },
    { id: 'old', visitId: 'visit-1', analyticTypeId: 'kidney', createdAt: '2026-09-19', children: [{ id: 'urea', name: 'Urea', result: '35' }] },
    { id: 'new', visitId: 'visit-1', analyticTypeId: 'kidney', createdAt: '2026-09-20', generalComment: 'Reviewed', children: [
      { id: 'urea', name: 'Urea', result: '46.4', unit: 'old unit' },
      { id: 'creatinine', name: 'Creatinine', result: '' },
    ] },
  ];
  const entries = prefillAnalyticResults(assigned, saved, 'visit-1');
  assert.equal(entries[0].children[0].result, '46.4');
  assert.equal(entries[0].children[0].unit, 'mg/dL');
  assert.equal(entries[0].children[1].result, '');
  assert.equal(entries[0].generalComment, 'Reviewed');
  assert.equal(entries[1].children[0].result, '');
  assert.equal(entries[1].price, 90);
});

test('relative and absolute values are restored independently', () => {
  const type = { id: 'cbc', name: 'CBC', price: 0, children: [{ id: 'neut', name: 'Neutrophils', unit: '%', referenceRange: '', resultType: 'differential', absoluteEnabled: true, absoluteUnit: '/cmm' }] };
  const saved = [{ id: 'result', visitId: 'visit-1', analyticTypeId: 'cbc', createdAt: '2026-09-20', children: [{ id: 'neut', name: 'Neutrophils', result: '', absoluteResult: '5710' }] }];
  const [entry] = prefillAnalyticResults([type], saved, 'visit-1');
  assert.equal(entry.children[0].result, '');
  assert.equal(entry.children[0].absoluteResult, '5710');
});
