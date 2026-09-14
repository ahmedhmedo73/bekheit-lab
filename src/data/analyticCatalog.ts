import type { ChildAnalytic } from '../types/analyticType';

const ABIM = 'https://www.abim.org/media/e2wdwdqu/laboratory-reference-ranges.pdf';
const UREA = 'https://www.ouh.nhs.uk/biochemistry/tests/tests-catalogue/urea/';
const URINE = 'https://prod.ucsfhealth.org/care/medical-tests/urinalysis';
const INR = 'https://www.mayoclinic.org/tests-procedures/prothrombin-time/about/pac-20384661';
const VITD = 'https://www.mayocliniclabs.com/test-catalog/Overview/83670';
const TROPONIN = 'https://prd1.mayocliniclabs.com/test-catalog/overview/614422';

function child(id: string, name: string, unit: string, range: string, referenceSource = ABIM): ChildAnalytic {
  return { id, name, unit, referenceRange: `${range} [Published adult example; lab review required]`, referenceSource };
}

// Reviewed sources on 2026-09-14. Examples are not validated Bekheit Lab intervals.
// Existing panel prices are retained by the population script.
export const ANALYTIC_CATALOG = [
  { legacyName: 'Complete Blood Count (CBC)', name: 'Complete Blood Count (CBC)', children: [
    child('hemoglobin', 'Hemoglobin', 'g/dL', 'Female 12–16; male 14–18'),
    child('hematocrit', 'Hematocrit', '%', 'Female 37–47; male 42–50'),
    child('rbc', 'Red Blood Cell Count', 'million/µL', '4.2–5.9'),
    child('wbc', 'White Blood Cell Count', 'cells/µL', '4,000–11,000'),
    child('platelets', 'Platelet Count', 'cells/µL', '150,000–450,000'),
    child('mcv', 'MCV', 'fL', '80–98'),
    child('mch', 'MCH', 'pg', '28–32'),
    child('mchc', 'MCHC', 'g/dL', '33–36'),
  ] },
  { legacyName: 'Lipid Profile', name: 'Lipid Profile', children: [
    child('cholesterol', 'Total Cholesterol', 'mg/dL', 'Desirable <200'),
    child('hdl', 'HDL Cholesterol', 'mg/dL', 'Low: female <50; male <40'),
    child('ldl', 'LDL Cholesterol', 'mg/dL', 'Optimal <100; patient targets vary'),
    child('triglycerides', 'Triglycerides (Fasting)', 'mg/dL', '<150'),
  ] },
  { legacyName: 'Fasting Blood Glucose (FBG)', name: 'Fasting Blood Glucose', children: [
    child('glucose', 'Glucose, Fasting Plasma', 'mg/dL', '70–99'),
  ] },
  { legacyName: 'HbA1c', name: 'HbA1c', children: [child('hba1c', 'Hemoglobin A1c', '%', '4.0–5.6')] },
  { legacyName: 'Liver Function Tests (ALT/AST)', name: 'Liver Analytic (ALT/AST)', children: [
    child('alt', 'ALT (SGPT)', 'U/L', '10–40'), child('ast', 'AST (SGOT)', 'U/L', '10–40'),
  ] },
  { legacyName: 'Kidney Function (Creatinine/Urea)', name: 'Kidney Analytic', children: [
    child('urea', 'Urea Serum', 'mmol/L', 'Age 18+: 2.5–7.8', UREA),
    child('creatinine', 'Creatinine Serum', 'mg/dL', 'Female 0.50–1.10; male 0.70–1.30'),
  ] },
  { legacyName: 'Thyroid Profile (TSH, FT3, FT4)', name: 'Thyroid Analytic', children: [
    child('tsh', 'TSH', 'mU/L', '0.5–4.0'),
    child('ft3', 'Free T3', 'pg/mL', '2.3–4.2'),
    child('ft4', 'Free T4', 'ng/dL', '0.8–1.8'),
  ] },
  { legacyName: 'Urine Analysis', name: 'Urine Analysis', children: [
    child('ph', 'Urine pH', 'pH', '4.5–8.0'),
    child('specific-gravity', 'Specific Gravity', 'ratio', '1.002–1.030'),
    child('glucose', 'Urine Glucose', 'qualitative', 'Not detected', URINE),
    child('protein', 'Urine Protein', 'qualitative', 'Not detected', URINE),
    child('ketones', 'Urine Ketones', 'qualitative', 'Not detected', URINE),
    child('bilirubin', 'Urine Bilirubin', 'qualitative', 'Not detected', URINE),
    child('nitrites', 'Urine Nitrites', 'qualitative', 'Not detected', URINE),
    child('blood', 'Urine Hemoglobin', 'qualitative', 'Not detected', URINE),
  ] },
  { legacyName: 'ESR (Erythrocyte Sedimentation Rate)', name: 'ESR', children: [
    child('esr', 'ESR (Westergren)', 'mm/hr', 'Female 0–20; male 0–15'),
  ] },
  { legacyName: 'CRP (C-Reactive Protein)', name: 'C-Reactive Protein', children: [
    child('crp', 'C-Reactive Protein (CRP)', 'mg/dL', '≤0.8'),
  ] },
  { legacyName: 'Prothrombin Time (PT/INR)', name: 'Coagulation Analytic (PT/INR)', children: [
    child('pt', 'Prothrombin Time', 'seconds', '11–13'),
    child('inr', 'INR', 'ratio', '≤1.1 in healthy people; not an anticoagulation target', INR),
  ] },
  { legacyName: 'Serum Ferritin', name: 'Serum Ferritin', children: [
    child('ferritin', 'Ferritin Serum', 'ng/mL', 'Female 24–307; male 24–336'),
  ] },
  { legacyName: 'Vitamin D (25-OH)', name: 'Vitamin D (25-OH)', children: [
    child('vitamin-d', 'Total 25-Hydroxyvitamin D', 'ng/mL', '20–50 (optimum, healthy population)', VITD),
  ] },
  { legacyName: 'Calcium & Phosphorus', name: 'Mineral Analytic (Calcium/Phosphorus)', children: [
    child('calcium', 'Calcium Serum', 'mg/dL', '8.6–10.2'),
    child('phosphorus', 'Phosphorus Serum', 'mg/dL', '3.0–4.5'),
  ] },
  { legacyName: 'High-Sensitivity Troponin I', name: 'Cardiac Analytic (hs-Troponin I)', children: [
    child('troponin-i', 'High-Sensitivity Troponin I, Plasma', 'ng/L', 'Age 18+: female ≤15; male ≤20 (Access hsTnI assay)', TROPONIN),
  ] },
];
