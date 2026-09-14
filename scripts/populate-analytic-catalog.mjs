import { initializeApp, deleteApp } from 'firebase/app';
import { isDeepStrictEqual } from 'node:util';
import { getFirestore, collection, getDocsFromServer, runTransaction, terminate } from 'firebase/firestore';
import { ANALYTIC_CATALOG } from '../src/data/analyticCatalog.ts';

process.loadEnvFile('.env');
const apply = process.argv.includes('--apply');
const app = initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID, apiKey: process.env.VITE_FIREBASE_API_KEY, appId: process.env.VITE_FIREBASE_APP_ID });
const db = getFirestore(app);
try {
  console.log(`Populate catalog (${apply ? 'apply' : 'dry run'}): ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  const snapshot = await getDocsFromServer(collection(db, 'analyticTypes'));
  let count = 0;
  for (const document of snapshot.docs) {
    const data = document.data();
    const template = ANALYTIC_CATALOG.find(item => item.legacyName === data.name || item.name === data.name || (data.name === 'urine' && item.legacyName === 'Urine Analysis'));
    if (!template) { console.log(`Unmatched panel: ${data.name}`); continue; }
    if (data.catalogExampleVersion === 1) continue;
    // Do not overwrite child definitions that the user has already customized.
    if (data.children?.length !== 1 || data.children[0].id !== 'legacy') continue;
    console.log(`${data.name} -> ${template.name}: ${template.children.length} children`);
    if (apply) await runTransaction(db, async transaction => {
      const current = await transaction.get(document.ref);
      if (!current.exists()) throw new Error('Catalog changed; rerun dry run.');
      const latest = current.data();
      if (latest.catalogExampleVersion === 1) return;
      if (latest.name !== data.name || !isDeepStrictEqual(latest.children, data.children)) throw new Error('Catalog edited concurrently; rerun dry run.');
      transaction.update(document.ref, { name: template.name, children: template.children, schemaVersion: 2, catalogExampleVersion: 1, updatedAt: new Date().toISOString() });
    });
    count++;
  }
  console.log(`${count} panels ${apply ? 'updated' : 'pending'}; prices and patient results unchanged.`);
} finally {
  await terminate(db);
  await deleteApp(app);
}
