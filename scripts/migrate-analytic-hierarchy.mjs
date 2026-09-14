import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocsFromServer, runTransaction, terminate } from 'firebase/firestore';
import { typeMigration, resultMigration } from '../src/services/analyticSchema.ts';

process.loadEnvFile('.env');
const apply = process.argv.includes('--apply');
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('VITE_FIREBASE_PROJECT_ID is required');
const app = initializeApp({ projectId, apiKey: process.env.VITE_FIREBASE_API_KEY, appId: process.env.VITE_FIREBASE_APP_ID });
const db = getFirestore(app);
try {
  console.log(`Analytic hierarchy migration: ${projectId} (${apply ? 'apply' : 'dry run'})`);
  for (const name of ['analyticTypes', 'analyticResults']) {
    const snapshot = await getDocsFromServer(collection(db, name));
    let changed = 0;
    for (const document of snapshot.docs) {
      if (document.data().schemaVersion === 2) continue;
      if (apply) await runTransaction(db, async transaction => {
        const current = await transaction.get(document.ref);
        if (!current.exists() || current.data().schemaVersion === 2) return;
        transaction.update(document.ref, name === 'analyticTypes' ? typeMigration(current.data()) : resultMigration(current.data()));
      });
      changed++;
    }
    console.log(`${name}: ${snapshot.size} documents, ${changed} ${apply ? 'migrated' : 'pending'}`);
  }
} finally {
  await terminate(db);
  await deleteApp(app);
}
