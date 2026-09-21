import type { ChildAnalyticResult } from '../types/analyticType.ts';

const LIPID_SOURCE_IDS = new Set(['total-cholesterol', 'triglycerides', 'hdl-cholesterol']);
const LIPID_CALCULATED_IDS = new Set(['ldl-cholesterol', 'vldl-cholesterol', 'non-hdl', 'risk-ratio-i', 'risk-ratio-ii']);

function parseNonNegativeNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatValue(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

function hasLipidProfileFields(children: ChildAnalyticResult[]): boolean {
  const ids = new Set(children.map(child => child.id.toLowerCase()));
  return [...LIPID_SOURCE_IDS, ...LIPID_CALCULATED_IDS].every(id => ids.has(id));
}

export function isLipidSourceField(childId: string): boolean {
  return LIPID_SOURCE_IDS.has(childId.toLowerCase());
}

export function isLipidCalculatedField(children: ChildAnalyticResult[], childId: string): boolean {
  return hasLipidProfileFields(children) && LIPID_CALCULATED_IDS.has(childId.toLowerCase());
}

export function calculateLipidProfile(
  children: ChildAnalyticResult[],
  clearUnavailable = false,
): ChildAnalyticResult[] {
  if (!hasLipidProfileFields(children)) return children;

  const resultById = new Map(children.map(child => [child.id.toLowerCase(), child.result]));
  const cholesterol = parseNonNegativeNumber(resultById.get('total-cholesterol'));
  const triglycerides = parseNonNegativeNumber(resultById.get('triglycerides'));
  const hdl = parseNonNegativeNumber(resultById.get('hdl-cholesterol'));
  const validHdl = hdl !== null && hdl > 0 ? hdl : null;
  const vldl = triglycerides !== null ? triglycerides / 5 : null;
  const ldl = cholesterol !== null && vldl !== null && hdl !== null ? cholesterol - vldl - hdl : null;

  const calculated = new Map<string, string | null>([
    ['ldl-cholesterol', ldl !== null ? formatValue(ldl) : null],
    ['vldl-cholesterol', vldl !== null ? formatValue(vldl) : null],
    ['non-hdl', cholesterol !== null && hdl !== null ? formatValue(cholesterol - hdl) : null],
    ['risk-ratio-i', cholesterol !== null && validHdl !== null ? formatValue(cholesterol / validHdl) : null],
    ['risk-ratio-ii', ldl !== null && validHdl !== null ? formatValue(ldl / validHdl) : null],
  ]);

  return children.map(child => {
    const value = calculated.get(child.id.toLowerCase());
    if (value === undefined || (value === null && !clearUnavailable)) return child;
    return { ...child, result: value ?? '' };
  });
}
