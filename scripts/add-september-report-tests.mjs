import { initializeApp, deleteApp } from 'firebase/app';
import { collection, doc, getDocsFromServer, getFirestore, runTransaction, terminate } from 'firebase/firestore';
import { ANALYTIC_CATALOG } from '../src/data/analyticCatalog.ts';

process.loadEnvFile('.env');
const apply = process.argv.includes('--apply');
const app = initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID, apiKey: process.env.VITE_FIREBASE_API_KEY });
const db = getFirestore(app);
const normalize = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const additions = new Map([
  ['pdf-clinical-chemistry', ['amyloid-a']],
  ['pdf-hormones', ['anti-tg', 'anti-tpo']],
  ['ttg-iga', ['anti-ttg-iga']],
  ['microalbuminuria', ['urine-creatinine', 'urine-albumin', 'albumin-creatinine-ratio']],
  ['pdf-kidney-functions', ['bun', 'phosphorus', 'sodium', 'potassium']],
  ['liver-functions', ['total-bilirubin', 'direct-bilirubin', 'indirect-bilirubin', 'total-protein', 'albumin', 'globulin']],
  ['quantitative-b-hcg', ['bhcg-quantitative']],
  ['hemoglobin-electrophoresis', ['hemoglobin-a1', 'hemoglobin-a2']],
]);
const aliases = {
  'amyloid-a': ['Serum Amyloid A', 'Amyloid A Protein'],
  'anti-tg': ['Anti-TG', 'Anti Thyroglobulin Ab'],
  'anti-tpo': ['Anti-TPO', 'Thyroid Peroxidase Antibodies'],
  'anti-ttg-iga': ['tTG IgA', 'Anti Tissue Transglutaminase IgA'],
  'bun': ['Blood Urea Nitrogen'],
  'phosphorus': ['Phosphorus', 'Serum Phosphorus'],
  'sodium': ['Sodium', 'Sodium (Na) Serum'],
  'potassium': ['Potassium', 'Potassium (K) (Serum)'],
  'total-bilirubin': ['Bilirubin Total'],
  'direct-bilirubin': ['Bilirubin Direct'],
  'indirect-bilirubin': ['Bilirubin Indirect'],
  'total-protein': ['Total Protein', 'Serum Total Protein'],
  'albumin': ['Albumin', 'Serum Albumin'],
  'globulin': ['Globulin', 'Globulin (Serum)'],
  'bhcg-quantitative': ['Beta HCG (Quantitative)', 'Quantitative B-HCG'],
  'hemoglobin-a1': ['Hb A1', 'HbA1'],
  'hemoglobin-a2': ['Hb A2', 'HbA2'],
};
function merge(existing, incoming) {
  const children = [...(existing ?? [])];
  for (const child of incoming) {
    const names = [child.name, ...(aliases[child.id] ?? [])].map(normalize);
    if (!children.some(item => item.id === child.id || names.includes(normalize(item.name)))) children.push(child);
  }
  return children;
}
try {
  const snapshot = await getDocsFromServer(collection(db, 'analyticTypes'));
  const targets = [];
  for (const [id, childIds] of additions) {
    const panel = ANALYTIC_CATALOG.find(item => item.id === id);
    const existing = snapshot.docs.find(item => item.id === id || normalize(item.data().name) === normalize(panel.name));
    const ref = existing?.ref ?? doc(db, 'analyticTypes', id);
    const incoming = panel.children.filter(child => childIds.includes(child.id));
    targets.push({ id: ref.id, panel, incoming });
    if (apply) await runTransaction(db, async transaction => {
      const current = await transaction.get(ref);
      const now = new Date().toISOString();
      if (!current.exists()) transaction.set(ref, { ...panel, id: ref.id, createdAt: now, updatedAt: now });
      else {
        const children = merge(current.data().children, incoming);
        if (children.length !== (current.data().children ?? []).length) transaction.update(ref, { children, updatedAt: now });
      }
    });
    console.log(`${panel.name}: ${existing ? 'add missing children' : 'create panel'}${apply ? ' completed' : ' (dry run)'}`);
  }
  // Existing visits retain their own prices, comments and child definitions.
  const visits = await getDocsFromServer(collection(db, 'labVisits'));
  for (const visit of visits.docs) {
    if (!apply) continue;
    await runTransaction(db, async transaction => {
      const current = await transaction.get(visit.ref);
      if (!current.exists()) return;
      let changed = false;
      const assignedAnalytics = (current.data().assignedAnalytics ?? []).map(item => {
        const target = targets.find(target => item.id === target.id || normalize(item.name) === normalize(target.panel.name));
        if (!target) return item;
        const children = merge(item.children, target.incoming);
        if (children.length === (item.children ?? []).length) return item;
        changed = true;
        return { ...item, children };
      });
      if (changed) transaction.update(visit.ref, { assignedAnalytics, updatedAt: new Date().toISOString() });
    });
  }
  if (apply) {
    const verified = await getDocsFromServer(collection(db, 'analyticTypes'));
    for (const target of targets) {
      const stored = verified.docs.find(item => item.id === target.id)?.data();
      if (!stored || merge(stored.children, target.incoming).length !== stored.children.length) throw new Error(`Verification failed: ${target.panel.name}`);
    }
    console.log('Verified all additions in Firestore.');
  }
} finally {
  await terminate(db);
  await deleteApp(app);
}
