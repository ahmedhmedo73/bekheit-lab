import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocsFromServer, runTransaction, terminate } from 'firebase/firestore';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { ANALYTIC_CATALOG } from '../src/data/analyticCatalog.ts';

process.loadEnvFile('.env');
const apply = process.argv.includes('--apply');
const version = 'analytics-pdf-v1';
const app = initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID, apiKey: process.env.VITE_FIREBASE_API_KEY, appId: process.env.VITE_FIREBASE_APP_ID });
const db = getFirestore(app);
const read = async name => (await getDocsFromServer(collection(db, name))).docs.map(document => ({ id: document.id, data: document.data() }));
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const fingerprint = records => createHash('sha256').update(JSON.stringify(stable([...records].sort((a, b) => a.id.localeCompare(b.id))))).digest('hex');
try {
  const existing = await read('analyticTypes');
  const expectedIds = new Set(ANALYTIC_CATALOG.map(panel => panel.id));
  if (existing.length === expectedIds.size && existing.every(record => expectedIds.has(record.id) && record.data.sourceCatalogVersion === version)) {
    console.log('PDF catalog is already installed. Preserving subsequent edits.');
  } else {
    console.log(`${apply ? 'Apply' : 'Dry run'}: replace ${existing.length} analytic types with ${ANALYTIC_CATALOG.length} PDF report groups / ${ANALYTIC_CATALOG.reduce((sum, panel) => sum + panel.children.length, 0)} tests.`);
    for (const panel of ANALYTIC_CATALOG) console.log(`Page ${panel.sourcePage}: ${panel.name} (${panel.children.length} tests)`);
    if (apply) {
      const resultsBefore = await read('analyticResults');
      mkdirSync('backups', { recursive: true });
      const backupPath = `backups/analytic-types-before-pdf-${Date.now()}.json`;
      writeFileSync(backupPath, JSON.stringify({ projectId: process.env.VITE_FIREBASE_PROJECT_ID, createdAt: new Date().toISOString(), records: existing }, null, 2));
      console.log(`Catalog backup: ${backupPath}`);
      const ids = [...new Set([...existing.map(record => record.id), ...expectedIds])];
      if (ids.length > 450) throw new Error('Catalog too large for this atomic replacement; no changes applied.');
      await runTransaction(db, async transaction => {
        const current = await Promise.all(ids.map(id => transaction.get(doc(db, 'analyticTypes', id))));
        for (const snapshot of current) {
          const original = existing.find(record => record.id === snapshot.id);
          if (original ? !snapshot.exists() || !isDeepStrictEqual(original.data, snapshot.data()) : snapshot.exists()) throw new Error('Catalog changed during review; rerun dry run.');
        }
        for (const record of existing) if (!expectedIds.has(record.id)) transaction.delete(doc(db, 'analyticTypes', record.id));
        const now = new Date().toISOString();
        for (const panel of ANALYTIC_CATALOG) {
          transaction.set(doc(db, 'analyticTypes', panel.id), { ...panel, sourceCatalogVersion: version, createdAt: now, updatedAt: now });
        }
      });
      const installed = await read('analyticTypes');
      if (installed.length !== expectedIds.size || installed.some(record => !expectedIds.has(record.id))) throw new Error('Unexpected catalog contents after replacement. Inspect before rerunning.');
      const resultsAfter = await read('analyticResults');
      if (fingerprint(resultsBefore) !== fingerprint(resultsAfter)) throw new Error('Patient results changed concurrently; this script does not write them.');
      console.log(`Verified ${installed.length} report groups. All ${resultsAfter.length} patient result documents unchanged.`);
    }
  }
} finally { await terminate(db); await deleteApp(app); }
