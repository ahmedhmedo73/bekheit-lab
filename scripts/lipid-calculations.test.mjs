import test from 'node:test';
import assert from 'node:assert/strict';
import { ANALYTIC_CATALOG } from '../src/data/analyticCatalog.ts';
import { calculateLipidProfile, isLipidCalculatedField } from '../src/services/lipidCalculations.ts';
import { emptyAnalyticResult } from '../src/services/analyticValues.ts';

const lipids = ANALYTIC_CATALOG.find(panel => panel.id === 'lipids-profile');

function lipidResults(values = {}) {
  return lipids.children.map(child => ({
    ...emptyAnalyticResult(child),
    result: values[child.id] ?? '',
  }));
}

test('lipid values reproduce the supplied report calculations', () => {
  const calculated = calculateLipidProfile(lipidResults({
    'total-cholesterol': '172',
    triglycerides: '84',
    'hdl-cholesterol': '38',
  }), true);
  const value = id => calculated.find(child => child.id === id).result;

  assert.equal(value('ldl-cholesterol'), '117.2');
  assert.equal(value('vldl-cholesterol'), '16.8');
  assert.equal(value('non-hdl'), '134');
  assert.equal(value('risk-ratio-i'), '4.5');
  assert.equal(value('risk-ratio-ii'), '3.1');
});

test('lipid calculated values clear when required inputs are unavailable', () => {
  const calculated = calculateLipidProfile(lipidResults({
    'total-cholesterol': '172',
    triglycerides: '84',
    'hdl-cholesterol': '0',
    'risk-ratio-i': 'old',
    'risk-ratio-ii': 'old',
  }), true);
  const value = id => calculated.find(child => child.id === id).result;

  assert.equal(value('vldl-cholesterol'), '16.8');
  assert.equal(value('non-hdl'), '172');
  assert.equal(value('risk-ratio-i'), '');
  assert.equal(value('risk-ratio-ii'), '');
});

test('only the five derived lipid fields are read-only', () => {
  const children = lipidResults();
  assert.equal(isLipidCalculatedField(children, 'ldl-cholesterol'), true);
  assert.equal(isLipidCalculatedField(children, 'vldl-cholesterol'), true);
  assert.equal(isLipidCalculatedField(children, 'non-hdl'), true);
  assert.equal(isLipidCalculatedField(children, 'risk-ratio-i'), true);
  assert.equal(isLipidCalculatedField(children, 'risk-ratio-ii'), true);
  assert.equal(isLipidCalculatedField(children, 'hdl-cholesterol'), false);
});
