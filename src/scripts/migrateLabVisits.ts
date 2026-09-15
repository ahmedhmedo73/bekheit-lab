import { collection, doc, getDocsFromServer, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

let migration: Promise<void> | undefined;

/** Creates a preserved legacy visit for result documents that predate visits. */
export function migrateLabVisits(): Promise<void> {
  if (!migration) migration = migrate().catch(error => { migration = undefined; throw error; });
  return migration;
}

async function migrate() {
  if (!db) throw new Error('Firestore is not initialized');
  const [patients, results] = await Promise.all([
    getDocsFromServer(collection(db, 'patients')),
    getDocsFromServer(collection(db, 'analyticResults')),
  ]);
  const names = new Map(patients.docs.map(patient => [patient.id, String(patient.data().name ?? 'Unknown patient')]));
  const legacy = results.docs.filter(result => !result.data().visitId);
  for (let offset = 0; offset < legacy.length; offset += 250) {
    const batch = writeBatch(db);
    for (const result of legacy.slice(offset, offset + 250)) {
      const data = result.data();
      const visit = doc(collection(db, 'labVisits'));
      const timestamp = String(data.createdAt ?? new Date().toISOString());
      batch.set(visit, {
        patientId: data.patientId,
        patientName: names.get(data.patientId) ?? 'Unknown patient',
        visitNumber: `LEGACY-${result.id.slice(0, 8).toUpperCase()}`,
        status: 'Completed', totalAmount: Number(data.price ?? 0), paidAmount: 0,
        notes: 'Migrated legacy analytic result. Payment was not recorded in the previous system.', createdAt: timestamp, updatedAt: timestamp,
      });
      batch.update(result.ref, { visitId: visit.id });
    }
    await batch.commit();
  }
}
