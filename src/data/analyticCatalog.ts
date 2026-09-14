import type { AnalyticType, ChildAnalytic } from '../types/analyticType';

// Visually transcribed from analytics.pdf (pages 1-8). No patient data or results.
const t = (id: string, name: string, section: string, unit = '', referenceRange = '', resultType: ChildAnalytic['resultType'] = 'numeric', options: string[] = []): ChildAnalytic => ({ id, name, section, unit, referenceRange, resultType, options });
const q = (id: string, name: string, section: string, range = 'Nil') => t(id, name, section, '', range, 'qualitative', ['Nil', 'Negative', 'Positive', 'Trace', '+', '++', '+++']);
const d = (id: string, name: string, referenceRange: string, absoluteReferenceRange?: string): ChildAnalytic => ({ ...t(id, name, 'Differential White Cell Count', '%', referenceRange, 'differential'), absoluteEnabled: absoluteReferenceRange !== undefined, absoluteReferenceRange: absoluteReferenceRange ?? '', absoluteUnit: '' });
const p = (id: string, name: string, sourcePage: number, children: ChildAnalytic[]): AnalyticType => ({ id, name, price: 0, sourcePage, children: children.map(child => ({ ...child, referenceSource: `analytics.pdf, page ${sourcePage}` })), generalComment: '', schemaVersion: 2 });

export const ANALYTIC_CATALOG = [
  p('pdf-clinical-chemistry', 'Clinical Chemistry Report', 1, [
    t('hba1c', 'Hb A1-C', 'Diabetes Profiles', '%', 'Non Diabetic: Less than 5.7\nPrediabetic: 5.7 - 6.4\nGood Control: 6.5 - 7\nFair Control: 7 - 7.5\nUncontrolled: > 7.5'),
    t('glucose-random', 'Glucose Random', 'Diabetes Profiles', 'mg/dL', '60 - 160'),
  ]),
  p('pdf-hormones', 'Hormones Report', 2, [
    t('tsh', 'TSH', 'Thyroid Profile', 'uIU/mL', '0.35 - 5.1'),
    t('ferritin', 'Ferritin', 'Hormones Assay', 'ng/ml', '10 - 291'),
  ]),
  p('pdf-urine-analysis', 'Urine Analysis Report', 3, [
    t('sample', 'Sample', 'Physical Examination', '', '', 'text'),
    t('specific-gravity', 'Specific Gravity', 'Physical Examination', 'fl', '1.015 - 1.025'),
    t('colour', 'Colour', 'Physical Examination', '', 'Yellow', 'text'),
    t('reaction', 'Reaction (pH)', 'Physical Examination', '', '', 'text'),
    t('aspect', 'Aspect', 'Physical Examination', '', 'Clear', 'text'),
    q('glucose', 'Glucose', 'Chemical Examination'), q('bilirubin', 'Bilirubin', 'Chemical Examination'), q('ketones', 'Ketones', 'Chemical Examination'),
    q('urobilinogen', 'Urobilinogen', 'Chemical Examination', 'Normal Trace'), q('protein', 'Protein', 'Chemical Examination'), q('nitrite', 'Nitrite', 'Chemical Examination'),
    t('pus-cells', 'Pus Cells', 'Microscopic Examination', '/HPF', '0 - 5', 'range'),
    t('red-cells', 'Red Cells', 'Microscopic Examination', '/HPF', '0 - 3', 'range'),
    t('casts', 'Casts', 'Microscopic Examination', '/LPF', 'Nil', 'text'),
    t('crystals', 'Crystals', 'Microscopic Examination', '', 'Nil', 'text'),
    t('epithelial-cells', 'Epithelial Cells', 'Microscopic Examination', '', 'Rare', 'text'),
    t('amorphous', 'Amorphous', 'Microscopic Examination', '', 'Nil', 'text'),
  ]),
  p('pdf-stool-analysis', 'Stool Analysis Report', 4, [
    t('consistency', 'Consistency', 'Macroscopic Examination', '', 'Soft formed', 'text'),
    t('colour', 'Colour', 'Macroscopic Examination', '', 'Brown', 'text'), q('mucus', 'Mucus', 'Macroscopic Examination'),
    t('odour', 'Odour', 'Macroscopic Examination', '', '', 'text'), q('blood', 'Blood', 'Macroscopic Examination'),
    t('reaction', 'Reaction (pH)', 'Macroscopic Examination', '', '', 'text'),
    t('pus-cells', 'Pus Cells', 'Microscopic Examination', '/HPF', 'Nil', 'range'),
    t('rbcs', 'RBCs', 'Microscopic Examination', '/HPF', 'Nil', 'range'), q('starch', 'Starch', 'Microscopic Examination'),
    q('fat-globules', 'Fat Globules', 'Microscopic Examination', ''),
    t('protozoa-cysts', 'Protozoa (Cysts)', 'Microscopic Examination', '', '', 'text'),
    t('protozoa-vegetative', 'Protozoa (Vegetative)', 'Microscopic Examination', '', '', 'text'),
    q('vegetable-cells', 'Vegetable Cells', 'Microscopic Examination'), q('muscle-fibres', 'Muscle Fibres', 'Microscopic Examination'),
    t('ova', 'Ova', 'Microscopic Examination', '', 'Nil', 'text'), t('yeast', 'Yeast', 'Microscopic Examination', '', '', 'text'),
  ]),
  p('pdf-urine-culture', 'Urine Culture & Sensitivity', 5, [
    t('pus-cells', 'Pus Cells', 'Microscopic Examination', '/HPF', '', 'range'), t('rbcs', 'RBCs', 'Microscopic Examination', '/HPF', '', 'range'),
    t('epithelial-cells', 'Epithelial Cells', 'Microscopic Examination', '', '', 'text'),
    t('culture-condition', 'Culture Condition', 'Culture', '', '', 'text'),
    t('colony-count', 'Colony Count', 'Culture', 'CFU/ml', '<10,000'), t('microbial-growth', 'Microbial Growth', 'Culture', '', '', 'text'),
  ]),
  p('pdf-complete-blood-picture', 'Complete Blood Picture', 6, [
    t('rbcs', 'RBCs', 'CBC', '10^6/cmm', '3.8 - 4.8'), t('hemoglobin', 'Hemoglobin (HB)', 'CBC', 'g/dL', '12 - 15'),
    t('hematocrit', 'Haematocrit (HCT)', 'CBC', '%', '36 - 45'), t('mcv', 'MCV', 'CBC', 'fl', '84 - 101'),
    t('mch', 'MCH', 'CBC', 'pg', '27 - 32'), t('mchc', 'MCHC', 'CBC', 'g/dL', '31.5 - 34.5'),
    t('rdw', 'RDW', 'CBC', '%', '11.5 - 15'), t('platelets', 'Platelet Count', 'CBC', '10^3/cmm', '150 - 450'),
    t('wbc', 'White Cell Count', 'CBC', '10^3/cmm', '4 - 11'),
    d('segmented', 'Segmented', ''), d('bands', 'Bands', '0 - 6'), d('neutrophils', 'Neutrophils', '40 - 80', '2000 - 7000'),
    d('lymphocytes', 'Lymphocytes', '20 - 45', '1000 - 4000'), d('monocytes', 'Monocytes', '1 - 10', '200 - 1000'),
    d('eosinophils', 'Eosinophils', '1 - 6', '20 - 500'), d('basophils', 'Basophils', '0 - 1', '0 - 2'),
  ]),
  p('pdf-h-pylori-stool', 'H. Pylori Ag in Stool (Qualitative)', 7, [
    t('h-pylori', 'H. pylori Ag in Stool (Qualitative)', 'Category', '', 'Negative', 'qualitative', ['Negative', 'Positive', 'Equivocal']),
  ]),
  p('pdf-kidney-functions', 'Kidney Functions', 8, [
    t('urea', 'Blood Urea (Serum)', 'Kidney Functions', 'mg/dL', '13 - 50'),
    t('creatinine', 'Creatinine (Serum)', 'Kidney Functions', 'mg/dL', '0.5 - 1.1'),
    t('uric-acid', 'Uric Acid (Serum)', 'Kidney Functions', 'mg/dL', '2.4 - 5.7'),
  ]),
];
