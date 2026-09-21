import test from 'node:test';
import assert from 'node:assert/strict';
import { ANALYTIC_CATALOG } from '../src/data/analyticCatalog.ts';
import { calculateReportValues, isReportCalculatedField } from '../src/services/reportCalculations.ts';
import { emptyAnalyticResult } from '../src/services/analyticValues.ts';

function resultsFor(panelId, values) {
  const panel = ANALYTIC_CATALOG.find(item => item.id === panelId);
  return panel.children.map(child => ({ ...emptyAnalyticResult(child), result: values[child.id] ?? '' }));
}

test('HOMA1-IR is calculated from fasting insulin and glucose', () => {
  const calculated = calculateReportValues(resultsFor('homa-ir-test', { 'fasting-insulin': '7.66', 'fasting-glucose': '98' }), true);
  assert.equal(calculated.find(child => child.id === 'homa1-ir').result, '1.85');
  assert.equal(isReportCalculatedField(calculated, 'homa1-ir'), true);
  assert.equal(isReportCalculatedField(calculated, 'homa2-ir'), false);
});

test('PSA ratio is calculated from free and total PSA', () => {
  const calculated = calculateReportValues(resultsFor('tumor-markers', { 'psa-total': '3.612', 'psa-free': '0.309' }), true);
  assert.equal(calculated.find(child => child.id === 'psa-ratio').result, '0.086');
  assert.equal(isReportCalculatedField(calculated, 'psa-ratio'), true);
});

test('derived report values clear when their denominator is missing or zero', () => {
  const calculated = calculateReportValues(resultsFor('tumor-markers', { 'psa-total': '0', 'psa-free': '0.309', 'psa-ratio': 'old' }), true);
  assert.equal(calculated.find(child => child.id === 'psa-ratio').result, '');
});
