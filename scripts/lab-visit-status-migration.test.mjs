import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

test('legacy Pending Results visits migrate to In Lab without changing billing', async () => {
  const visits = [
    { id: 'old', status: 'Pending Results', totalAmount: 300, paidAmount: 80 },
    { id: 'done', status: 'Completed', totalAmount: 100, paidAmount: 100 },
  ];
  const changes = [];
  const firestore = {
    collection: (_db, name) => ({ name }),
    getDocsFromServer: async ref => ({ docs: ref.name === 'labVisits' ? visits.map(visit => ({ id: visit.id, ref: { id: visit.id }, data: () => visit })) : [] }),
    writeBatch: () => ({ update: (ref, value) => changes.push({ id: ref.id, value }), commit: async () => {} }),
  };
  const source = ts.transpileModule(fs.readFileSync(new URL('../src/scripts/migrateLabVisits.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function('require', 'exports', source)(name => name === 'firebase/firestore' ? firestore : { db: {} }, exports);
  await exports.migrateLabVisits();
  assert.equal(changes.length, 1);
  assert.equal(changes[0].id, 'old');
  assert.equal(changes[0].value.status, 'In Lab');
  assert.deepEqual(Object.keys(changes[0].value).sort(), ['status', 'updatedAt']);
});
