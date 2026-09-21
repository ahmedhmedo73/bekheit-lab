import { initializeApp, deleteApp } from 'firebase/app';
import { collection, doc, getDocsFromServer, getFirestore, terminate, writeBatch } from 'firebase/firestore';
import { ANALYTIC_CATALOG } from '../src/data/analyticCatalog.ts';

process.loadEnvFile('.env');

const apply = process.argv.includes('--apply');
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('VITE_FIREBASE_PROJECT_ID is required');

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

const normalize = value => String(value ?? '').toLowerCase().replace(/&/g, 'and').replace(/\breport\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const aliases = new Map([
  ['elisa-asma', ['elisa', 'elissa', 'asma']],
  ['ana-by-if', ['ana by if', 'anti nuclear ab ana by if']],
  ['hematology-esr', ['hematology', 'esr', 'erythrocyte sedimentation rate']],
  ['estimated-gfr', ['estimated glomerular filtration rate', 'egfr']],
  ['homa-ir-test', ['homa ir test', 'homa ir']],
]);

function matchesPanel(panel, existing) {
  const existingName = normalize(existing.data.name);
  return normalize(panel.name) === existingName || (aliases.get(panel.id) ?? []).some(alias => normalize(alias) === existingName);
}

function mergeChildren(catalogChildren, existingChildren = []) {
  const used = new Set();
  const merged = catalogChildren.map(child => {
    const index = existingChildren.findIndex((current, currentIndex) => !used.has(currentIndex)
      && (current.id === child.id || (normalize(current.name) === normalize(child.name) && normalize(current.section) === normalize(child.section))));
    if (index >= 0) used.add(index);
    return child;
  });
  existingChildren.forEach((child, index) => { if (!used.has(index)) merged.push(child); });
  return merged;
}

async function commitWrites(writes) {
  for (let start = 0; start < writes.length; start += 450) {
    const batch = writeBatch(db);
    for (const write of writes.slice(start, start + 450)) batch.set(write.ref, write.data, { merge: true });
    await batch.commit();
  }
}

try {
  const [typeSnapshot, visitSnapshot] = await Promise.all([
    getDocsFromServer(collection(db, 'analyticTypes')),
    getDocsFromServer(collection(db, 'labVisits')),
  ]);
  const existingTypes = typeSnapshot.docs.map(item => ({ ref: item.ref, id: item.id, data: item.data() }));
  const claimedTypeIds = new Set();
  const timestamp = new Date().toISOString();
  const typeWrites = [];
  const resolvedByCatalogId = new Map();
  const resolvedByStoredId = new Map();

  for (const panel of ANALYTIC_CATALOG) {
    const existing = existingTypes.find(item => item.id === panel.id)
      ?? existingTypes.find(item => !claimedTypeIds.has(item.id) && matchesPanel(panel, item));
    const storedId = existing?.id ?? panel.id;
    if (existing) claimedTypeIds.add(existing.id);
    const resolved = {
      ...panel,
      id: storedId,
      price: Number.isFinite(existing?.data.price) ? existing.data.price : panel.price,
      children: mergeChildren(panel.children, existing?.data.children),
      generalComment: existing?.data.generalComment ?? panel.generalComment,
      createdAt: existing?.data.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    resolvedByCatalogId.set(panel.id, resolved);
    resolvedByStoredId.set(storedId, resolved);
    typeWrites.push({ ref: doc(db, 'analyticTypes', storedId), data: resolved });
  }

  const visitWrites = [];
  for (const visit of visitSnapshot.docs) {
    const assigned = visit.data().assignedAnalytics;
    if (!Array.isArray(assigned) || !assigned.length) continue;
    let changed = false;
    const updatedAssigned = assigned.map(item => {
      const resolved = resolvedByStoredId.get(item.id)
        ?? resolvedByCatalogId.get(item.id)
        ?? [...resolvedByCatalogId.values()].find(panel => normalize(panel.name) === normalize(item.name));
      if (!resolved) return item;
      changed = true;
      return {
        ...resolved,
        id: item.id || resolved.id,
        price: Number.isFinite(item.price) ? item.price : resolved.price,
        generalComment: item.generalComment ?? resolved.generalComment,
      };
    });
    if (changed) visitWrites.push({ ref: visit.ref, data: { assignedAnalytics: updatedAssigned, updatedAt: timestamp } });
  }

  const created = ANALYTIC_CATALOG.filter(panel => !existingTypes.some(item => item.id === panel.id || matchesPanel(panel, item))).length;
  console.log(`Supplied report catalog migration: ${projectId} (${apply ? 'apply' : 'dry run'})`);
  console.log(`Analytic types: ${ANALYTIC_CATALOG.length} upserts (${created} new, ${ANALYTIC_CATALOG.length - created} existing).`);
  console.log(`Lab visits: ${visitWrites.length} assigned-analytic snapshots to refresh.`);
  if (apply) {
    await commitWrites(typeWrites);
    await commitWrites(visitWrites);
    console.log('Firestore analytic catalog migration completed. Existing results and prices were preserved.');
  }
} finally {
  await terminate(db);
  await deleteApp(app);
}
