import test from 'node:test';
import assert from 'node:assert/strict';
import { resultPriceCents, selectedResultTotal, togglePrintResult } from '../src/services/printSelection.ts';
import { latestPanelResults, buildAnalyticReport } from '../src/services/analyticReport.ts';

const old = { id: 'old', analyticTypeId: 'kidney', analyticTypeName: 'Kidney', price: 50, result: 'OLD VALUE', createdAt: '2026-09-01' };
const latest = { ...old, id: 'latest', price: 100, result: 'LATEST VALUE', createdAt: '2026-09-14' };
const liver = { ...old, id: 'liver', analyticTypeId: 'liver', analyticTypeName: 'Liver', price: 25.5 };
const all = [latest, old, liver];

test('default total matches printed latest records instead of all historical charges', () => {
  const selected = latestPanelResults(all);
  assert.equal(selectedResultTotal(selected), 125.5);
  const html = buildAnalyticReport({ name: 'Sample', age: 30 }, selected);
  assert.ok(html.includes('LATEST VALUE'));
  assert.equal(selected.filter(result => result.analyticTypeId === 'kidney').length, 1);
});

test('older selection replaces newer one, exclusion and deletion affect total', () => {
  let ids = ['latest', 'liver'];
  ids = togglePrintResult(all, ids, old);
  assert.deepEqual(ids, ['liver', 'old']);
  assert.equal(selectedResultTotal(all.filter(result => ids.includes(result.id))), 75.5);
  ids = togglePrintResult(all, ids, old);
  assert.deepEqual(ids, ['liver']);
  assert.equal(selectedResultTotal(all.filter(result => ids.includes(result.id))), 25.5);
  assert.equal(selectedResultTotal(all.filter(result => result.id !== 'liver' && ids.includes(result.id))), 0);
  assert.equal(selectedResultTotal([]), 0);
});

test('totals handle numeric strings, missing or malformed prices, and decimal currency', () => {
  assert.equal(selectedResultTotal([{ price: '100.50' }, { price: 0.1 }, { price: 0.2 }]), 100.8);
  for (const price of [undefined, null, 'invalid', NaN, Infinity, -1]) assert.equal(resultPriceCents(price), 0);
  assert.equal(resultPriceCents(1.005), 101);
});
