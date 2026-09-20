import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyAnalyticResult, hasAnalyticResultValue } from '../src/services/analyticValues.ts';
import { ANALYTIC_CATALOG } from '../src/data/analyticCatalog.ts';

const cbc = ANALYTIC_CATALOG.find(panel => panel.id === 'pdf-complete-blood-picture');
test('relative and absolute counts can be entered independently', () => {
  const neutrophils = emptyAnalyticResult(cbc.children.find(child => child.id === 'neutrophils'));
  assert.equal(hasAnalyticResultValue(neutrophils), false);
  neutrophils.result = '52';
  assert.equal(hasAnalyticResultValue(neutrophils), true);
  neutrophils.result = '';
  neutrophils.absoluteResult = '0';
  assert.equal(hasAnalyticResultValue(neutrophils), true);
  const bands = emptyAnalyticResult(cbc.children.find(child => child.id === 'bands'));
  bands.result = '0';
  assert.equal(hasAnalyticResultValue(bands), true);
  assert.equal('absoluteResult' in bands, false);
});
test('qualitative, range and descriptive findings stay as entered', () => {
  for (const result of ['Nil', 'Negative', '1 - 3', 'No growth after 48 hours\nincubation', '<10,000']) {
    assert.equal(hasAnalyticResultValue({ result }), true);
  }
  assert.equal(hasAnalyticResultValue({ result: '  ' }), false);
  for (const panel of ANALYTIC_CATALOG) for (const child of panel.children) assert.equal(emptyAnalyticResult(child).result, '');
});
