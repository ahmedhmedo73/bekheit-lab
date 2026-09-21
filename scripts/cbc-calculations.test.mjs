import test from 'node:test';
import assert from 'node:assert/strict';
import { ANALYTIC_CATALOG } from '../src/data/analyticCatalog.ts';
import { calculateCbcIndices, isCbcCalculatedField } from '../src/services/cbcCalculations.ts';
import { emptyAnalyticResult } from '../src/services/analyticValues.ts';

const cbc = ANALYTIC_CATALOG.find(panel => panel.id === 'pdf-complete-blood-picture');

function cbcResults(values = {}) {
  return cbc.children.map(child => ({
    ...emptyAnalyticResult(child),
    result: values[child.id] ?? '',
  }));
}

test('CBC indices are calculated from RBCs, hemoglobin and hematocrit', () => {
  const calculated = calculateCbcIndices(cbcResults({ rbcs: '4.5', hemoglobin: '13.5', hematocrit: '40.5' }), true);
  const value = id => calculated.find(child => child.id === id).result;

  assert.equal(value('mcv'), '90.0');
  assert.equal(value('mch'), '30.0');
  assert.equal(value('mchc'), '33.3');
});

test('CBC calculations clear unavailable values and reject zero denominators', () => {
  const calculated = calculateCbcIndices(cbcResults({ rbcs: '0', hemoglobin: '13.5', hematocrit: '40.5', mcv: 'old', mch: 'old', mchc: 'old' }), true);
  const value = id => calculated.find(child => child.id === id).result;

  assert.equal(value('mcv'), '');
  assert.equal(value('mch'), '');
  assert.equal(value('mchc'), '33.3');
});

test('only complete CBC layouts expose calculated fields', () => {
  const children = cbcResults();
  const partialChildren = children.slice(0, 3);
  assert.equal(isCbcCalculatedField(children, 'mcv'), true);
  assert.equal(isCbcCalculatedField(children, 'rbcs'), false);
  assert.equal(isCbcCalculatedField(partialChildren, 'mcv'), false);
  assert.equal(calculateCbcIndices(partialChildren), partialChildren);
});
