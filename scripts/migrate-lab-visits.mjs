import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocsFromServer, writeBatch, terminate } from 'firebase/firestore';

process.loadEnvFile('.env');
if (!process.argv.includes('--apply')) throw new Error('Use --apply to migrate legacy result records into lab visits.');
const app = initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID, apiKey: process.env.VITE_FIREBASE_API_KEY, appId: process.env.VITE_FIREBASE_APP_ID });
const database = getFirestore(app);
try {
  const [patients, results] = await Promise.all([getDocsFromServer(collection(database, 'patients')), getDocsFromServer(collection(database, 'analyticResults'))]);
  const names = new Map(patients.docs.map(item => [item.id, String(item.data().name ?? 'Unknown patient')]));
  const legacy = results.docs.filter(item => !item.data().visitId);
  for (const result of legacy) {
    const data = result.data(), visit = doc(collection(database, 'labVisits')), timestamp = String(data.createdAt ?? new Date().toISOString());
    const batch = writeBatch(database);
    batch.set(visit, { patientId: data.patientId, patientName: names.get(data.patientId) ?? 'Unknown patient', visitNumber: `LEGACY-${result.id.slice(0, 8).toUpperCase()}`, status: 'Completed', totalAmount: Number(data.price ?? 0), paidAmount: 0, notes: 'Migrated legacy analytic result. Payment was not recorded in the previous system.', createdAt: timestamp, updatedAt: timestamp });
    batch.update(result.ref, { visitId: visit.id });
    await batch.commit();
  }
  console.log(`Lab visits migration: ${legacy.length} legacy result records migrated.`);
} finally { await terminate(database); await deleteApp(app); }
