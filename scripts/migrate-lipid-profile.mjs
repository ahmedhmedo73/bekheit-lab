import { initializeApp, deleteApp } from 'firebase/app';
import { doc, getDocFromServer, getFirestore, runTransaction, terminate } from 'firebase/firestore';
import { ANALYTIC_CATALOG } from '../src/data/analyticCatalog.ts';

process.loadEnvFile('.env');

const apply = process.argv.includes('--apply');
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('VITE_FIREBASE_PROJECT_ID is required');

const profile = ANALYTIC_CATALOG.find(panel => panel.id === 'lipids-profile');
if (!profile) throw new Error('Lipids Profile is missing from the analytic catalog');

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

try {
  const ref = doc(db, 'analyticTypes', profile.id);
  const snapshot = await getDocFromServer(ref);
  console.log(`Lipids Profile migration: ${projectId} (${apply ? 'apply' : 'dry run'})`);
  if (snapshot.exists()) {
    console.log('analyticTypes/lipids-profile already exists; no changes needed.');
  } else if (!apply) {
    console.log('analyticTypes/lipids-profile will be created.');
  } else {
    await runTransaction(db, async transaction => {
      const current = await transaction.get(ref);
      if (current.exists()) return;
      const timestamp = new Date().toISOString();
      transaction.set(ref, { ...profile, createdAt: timestamp, updatedAt: timestamp });
    });
    console.log('analyticTypes/lipids-profile created.');
  }
} finally {
  await terminate(db);
  await deleteApp(app);
}
