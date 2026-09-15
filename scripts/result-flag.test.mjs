import test from 'node:test';
import assert from 'node:assert/strict';
import { resultFlag } from '../src/services/resultFlag.ts';
import { buildAnalyticReport } from '../src/services/analyticReport.ts';

test('numeric ranges, exact boundaries, negatives and thousands', () => {
  for (const [value, range, expected] of [['51', '13 - 50', '↑'], ['12', '13–50', '↓'], ['13', '13 - 50', ''], ['50', '13 - 50', ''], ['-3', '-2 - 2', '↓'], ['7,001', '2,000 - 7,000', '↑'], ['1.1', '0.5 - 1.1', '']]) assert.equal(resultFlag(value, range), expected);
});
test('one-sided ranges respect inclusive and exclusive limits', () => {
  for (const [value, range, expected] of [['10000', '<10,000', '↑'], ['5', '≤5', ''], ['5', '>5', '↓'], ['5', '>=5', ''], ['6', 'Less than 5.7', '↑']]) assert.equal(resultFlag(value, range), expected);
});
test('ambiguous and nonnumeric findings are not flagged', () => {
  for (const [value, range] of [['', '0 - 5'], ['Nil', '0 - 5'], ['1 - 3', '0 - 5'], ['<5', '10 - 20'], ['10', 'Non Diabetic: Less than 5.7\nPrediabetic: 5.7 - 6.4'], ['10', '20 - 5'], ['5', 'Negative']]) assert.equal(resultFlag(value, range), '');
  assert.equal(resultFlag('13', 'Female 12–16; male 14–18 [Published adult example; lab review required]', 'Male'), '↓');
  assert.equal(resultFlag('13', 'Female 12–16; male 14–18', 'Female'), '');
  assert.equal(resultFlag('13', 'Female 12–16; male 14–18'), '');
});
test('printed relative and absolute values compare independently', () => {
  const html = buildAnalyticReport({ name: 'Test', patientId: 'TEST', age: 30 }, [{ id: 'r', analyticTypeId: 'cbc', analyticTypeName: 'CBC', children: [{ id: 'n', name: 'Neutrophils', resultType: 'differential', result: '81', unit: '%', referenceRange: '40 - 80', absoluteEnabled: true, absoluteResult: '1900', absoluteReferenceRange: '2000 - 7000' }] }]);
  assert.ok(html.includes('81 ↑'));
  assert.ok(html.includes('1900 ↓'));
});
