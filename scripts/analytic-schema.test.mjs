import test from 'node:test';
import assert from 'node:assert/strict';
import { typeMigration, resultMigration } from '../src/services/analyticSchema.ts';
import { ANALYTIC_CATALOG } from '../src/data/analyticCatalog.ts';

test('legacy catalog retains identity and billing without inventing clinical metadata', () => {
  const original = { id: 'kidney', name: 'Kidney Function', price: 140, createdAt: '2025-01-01' };
  const migrated = { ...original, ...typeMigration(original) };
  assert.equal(migrated.id, original.id);
  assert.equal(migrated.price, 140);
  assert.equal(migrated.createdAt, original.createdAt);
  assert.deepEqual(migrated.children, [{ id: 'legacy', name: 'Kidney Function', unit: '', referenceRange: '' }]);
  assert.deepEqual({ ...migrated, ...typeMigration(migrated) }, migrated);
});

test('legacy results preserve exact original text without interpreting or splitting it', () => {
  const original = { analyticTypeName: 'Kidney', result: 'Urea: 20; creatinine: 1', price: 140 };
  const migrated = { ...original, ...resultMigration(original) };
  assert.equal(migrated.children[0].result, original.result);
  assert.equal(migrated.result, original.result);
  assert.deepEqual({ ...migrated, ...resultMigration(migrated) }, migrated);
});

test('existing child definitions and result snapshots remain untouched', () => {
  const children = [{ id: 'urea', name: 'Urea Serum', unit: 'lab-unit', referenceRange: 'lab-range', result: '20' }];
  assert.deepEqual(typeMigration({ name: 'Kidney', children }).children, children);
  assert.deepEqual(resultMigration({ analyticTypeName: 'Kidney', children }).children, children);
});

test('report catalog covers supplied panels and has unique child IDs without patient results', () => {
  assert.equal(ANALYTIC_CATALOG.length, 24);
  assert.equal(ANALYTIC_CATALOG.reduce((sum, panel) => sum + panel.children.length, 0), 152);
  assert.deepEqual(ANALYTIC_CATALOG.map(panel => panel.sourcePage), Array.from({ length: 24 }, (_, index) => index + 1));
  assert.equal(new Set(ANALYTIC_CATALOG.map(panel => panel.id)).size, ANALYTIC_CATALOG.length);
  for (const panel of ANALYTIC_CATALOG) {
    assert.equal(new Set(panel.children.map(child => child.id)).size, panel.children.length);
    for (const child of panel.children) {
      assert.ok(child.name && child.section && child.resultType);
      assert.equal(typeof child.unit, 'string');
      assert.equal(typeof child.referenceRange, 'string');
      assert.ok(child.referenceSource);
      assert.equal('result' in child, false);
    }
    assert.equal(panel.generalComment, '');
    assert.equal(panel.price, 0);
  }
});
