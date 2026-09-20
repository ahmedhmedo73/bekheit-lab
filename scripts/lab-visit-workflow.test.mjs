import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { resultPriceCents } from '../src/services/printSelection.ts';

// Exercise the real service with an isolated transaction store; no live writes.
function setup() {
  const records = new Map([['labVisits/v', { patientId: 'p', status: 'Open', totalAmount: 10, paidAmount: 0 }]]);
  let id = 0;
  const ref = path => ({ path, id: path.split('/').at(-1) });
  const snapshot = target => ({ ref: target, exists: () => records.has(target.path), data: () => records.get(target.path) });
  const firebase = {
    collection: (_db, name) => ref(name),
    doc: (base, name, key) => key ? ref(`${name}/${key}`) : ref(`${base.path}/${++id}`),
    getDoc: async target => snapshot(target),
    where: (field, _op, value) => ({ field, value }),
    query: (base, condition) => ({ ...base, condition }),
    getDocs: async target => {
      const docs = [...records].filter(([path, data]) => path.startsWith(`${target.path}/`) && (!target.condition || data[target.condition.field] === target.condition.value)).map(([path]) => snapshot(ref(path)));
      return { empty: !docs.length, docs };
    },
    addDoc: async (base, data) => { const target = ref(`${base.path}/${++id}`); records.set(target.path, data); return target; },
    updateDoc: async (target, data) => records.set(target.path, { ...records.get(target.path), ...data }),
    runTransaction: async (_db, callback) => {
      const writes = [];
      await callback({ get: async target => snapshot(target), set: (target, data) => writes.push(() => records.set(target.path, data)), update: (target, data) => writes.push(() => records.set(target.path, { ...records.get(target.path), ...data })), delete: target => writes.push(() => records.delete(target.path)) });
      writes.forEach(write => write());
    },
  };
  const source = ts.transpileModule(fs.readFileSync(new URL('../src/services/firestoreService.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function('require', 'exports', source)(name => {
    if (name === 'firebase/firestore') return firebase;
    if (name.includes('config/firebase')) return { db: {} };
    if (name.includes('requestActivity')) return { trackServiceRequests: value => value };
    if (name.includes('migrateLabVisits')) return { migrateLabVisits: async () => {} };
    if (name.includes('printSelection')) return { resultPriceCents };
    if (name.includes('types/labVisit')) return { LAB_VISIT_STATUSES: ['New', 'In Lab', 'Completed'] };
    return {};
  }, exports);
  return { service: exports.FirestoreService, records };
}
const panel = { patientId: 'p', visitId: 'v', analyticTypeId: 'kidney', price: 0.2, result: '', children: [] };

test('result panels and visit total save together with cent precision', async () => {
  const { service, records } = setup();
  await service.createAnalyticResults([panel, { ...panel, price: 0.1 }]);
  assert.equal(records.get('labVisits/v').totalAmount, 10.3);
  assert.equal([...records.keys()].filter(key => key.startsWith('analyticResults/')).length, 2);
});
test('wrong patient, missing visit and closed visits reject without partial writes', async () => {
  for (const change of [{ patientId: 'other' }, { visitId: 'missing' }]) {
    const { service, records } = setup();
    await assert.rejects(service.createAnalyticResults([{ ...panel, ...change }]));
    assert.equal(records.size, 1);
  }
  const { service, records } = setup();
  records.get('labVisits/v').status = 'Cancelled';
  await assert.rejects(service.createAnalyticResults([panel]));
  assert.equal(records.size, 1);
});
test('deleting a result adjusts charges while preserving recorded payment', async () => {
  const { service, records } = setup();
  records.get('labVisits/v').paidAmount = 10;
  records.set('analyticResults/r', { ...panel, price: 3 });
  await service.deleteAnalyticResult('r');
  assert.equal(records.get('labVisits/v').totalAmount, 7);
  assert.equal(records.get('labVisits/v').paidAmount, 10);
  assert.equal(records.has('analyticResults/r'), false);
});
test('deleting a visit atomically removes its results and payment while preserving other visits', async () => {
  const { service, records } = setup();
  records.get('labVisits/v').updatedAt = '2026-09-19';
  records.get('labVisits/v').paidAmount = 10;
  records.set('analyticResults/r', panel);
  records.set('labVisits/other', { patientId: 'p', paidAmount: 4 });
  records.set('analyticResults/other', { ...panel, visitId: 'other' });
  assert.equal(await service.deleteLabVisit('v'), true);
  assert.equal(records.has('labVisits/v'), false);
  assert.equal(records.has('analyticResults/r'), false);
  assert.equal(records.has('labVisits/other'), true);
  assert.equal(records.has('analyticResults/other'), true);
  assert.equal(await service.deleteLabVisit('v'), false);
});
test('new visits calculate charges from chosen panels and start unpaid', async () => {
  const { service } = setup();
  const assignedAnalytics = [{ id: 'kidney', name: 'Kidney', price: 100.1 }, { id: 'cbc', name: 'CBC', price: 50.2 }];
  const visit = await service.createLabVisit({ patientId: 'p', patientName: 'Test', assignedAnalytics });
  assert.equal(visit.paidAmount, 0);
  assert.equal(visit.totalAmount, 150.3);
  assert.equal(visit.status, 'New');
  assert.deepEqual(visit.assignedAnalytics, assignedAnalytics);
  await assert.rejects(service.createLabVisit({ patientId: 'p', assignedAnalytics: [] }));
});
test('ordered panels are not charged again when saving, repeating or deleting results', async () => {
  const { service, records } = setup();
  records.get('labVisits/v').assignedAnalytics = [{ id: 'kidney', name: 'Kidney', price: 10 }];
  records.get('labVisits/v').status = 'Pending Results';
  await service.createAnalyticResults([panel]);
  await service.createAnalyticResults([panel]);
  assert.equal(records.get('labVisits/v').totalAmount, 10);
  await assert.rejects(service.createAnalyticResults([{ ...panel, analyticTypeId: 'unassigned' }]));
  const resultKey = [...records.keys()].find(key => key.startsWith('analyticResults/'));
  await service.deleteAnalyticResult(resultKey.split('/')[1]);
  assert.equal(records.get('labVisits/v').totalAmount, 10);
});
test('visit workflow accepts three statuses and rejects removed statuses', async () => {
  const { service, records } = setup();
  for (const status of ['New', 'In Lab', 'Completed']) {
    await service.updateLabVisit('v', { status });
    assert.equal(records.get('labVisits/v').status, status);
  }
  await assert.rejects(service.updateLabVisit('v', { status: 'Open' }));
  await assert.rejects(service.updateLabVisit('v', { status: 'Cancelled' }));
  await assert.rejects(service.updateLabVisit('v', { status: 'Pending Results' }));
});

test('historical pending visits appear as In Lab without changing stored records', async () => {
  const { service, records } = setup();
  records.get('labVisits/v').status = 'Pending Results';
  records.get('labVisits/v').createdAt = '2026-09-15';
  const visits = await service.getLabVisits();
  assert.equal(visits[0].status, 'In Lab');
  assert.equal(records.get('labVisits/v').status, 'Pending Results');
});

test('editing ordered analytics recalculates charges without changing payment or removing saved results', async () => {
  const { service, records } = setup();
  const kidney = { id: 'kidney', name: 'Kidney', price: 10.05 };
  const cbc = { id: 'cbc', name: 'CBC', price: 20.1 };
  records.get('labVisits/v').assignedAnalytics = [kidney];
  records.get('labVisits/v').paidAmount = 5;
  await service.updateLabVisit('v', { assignedAnalytics: [kidney, cbc], notes: 'Morning visit' });
  assert.equal(records.get('labVisits/v').totalAmount, 30.15);
  assert.equal(records.get('labVisits/v').paidAmount, 5);
  assert.equal(records.get('labVisits/v').notes, 'Morning visit');
  records.set('analyticResults/r', panel);
  await assert.rejects(service.updateLabVisit('v', { assignedAnalytics: [cbc] }));
  assert.deepEqual(records.get('labVisits/v').assignedAnalytics, [kidney, cbc]);
});
