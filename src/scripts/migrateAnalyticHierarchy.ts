import { collection, getDocsFromServer, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import { resultMigration, typeMigration } from '../services/analyticSchema';
import type { AnalyticResult, AnalyticType } from '../types/analyticType';

let migration: Promise<void> | undefined;

/** In-place, resumable migration. Transactions protect concurrent catalog edits.
 * Keeps document IDs, prices, timestamps and original result text unchanged.
 * Runs before catalog/result reads using the app's Firestore access.
 */
export function migrateAnalyticHierarchy(): Promise<void> {
  if (!migration) migration = migrate().catch(error => {
    migration = undefined;
    throw error;
  });
  return migration;
}

async function migrate() {
  const database = db;
  if (!database) throw new Error('Firestore is not initialized');
  for (const name of ['analyticTypes', 'analyticResults']) {
    const snapshot = await getDocsFromServer(collection(database, name));
    for (const document of snapshot.docs) {
      if (document.data().schemaVersion === 2) continue;
      await runTransaction(database, async transaction => {
        const current = await transaction.get(document.ref);
        if (!current.exists() || current.data().schemaVersion === 2) return;
        const data = current.data();
        transaction.update(document.ref, name === 'analyticTypes'
          ? typeMigration(data as AnalyticType)
          : resultMigration(data as AnalyticResult));
      });
    }
  }
}
