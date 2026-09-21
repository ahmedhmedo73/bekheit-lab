import type { ChildAnalyticResult } from '../types/analyticType.ts';

const CBC_SOURCE_IDS = new Set(['rbcs', 'hemoglobin', 'hematocrit']);
const CBC_CALCULATED_IDS = new Set(['mcv', 'mch', 'mchc']);

function parsePositiveNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatIndex(value: number): string {
  return value.toFixed(1);
}

function hasCbcIndexFields(children: ChildAnalyticResult[]): boolean {
  const ids = new Set(children.map(child => child.id.toLowerCase()));
  return [...CBC_SOURCE_IDS, ...CBC_CALCULATED_IDS].every(id => ids.has(id));
}

export function isCbcSourceField(childId: string): boolean {
  return CBC_SOURCE_IDS.has(childId.toLowerCase());
}

export function isCbcCalculatedField(children: ChildAnalyticResult[], childId: string): boolean {
  return hasCbcIndexFields(children) && CBC_CALCULATED_IDS.has(childId.toLowerCase());
}

export function calculateCbcIndices(
  children: ChildAnalyticResult[],
  clearUnavailable = false,
): ChildAnalyticResult[] {
  if (!hasCbcIndexFields(children)) return children;

  const resultById = new Map(children.map(child => [child.id.toLowerCase(), child.result]));
  const rbcs = parsePositiveNumber(resultById.get('rbcs'));
  const hemoglobin = parsePositiveNumber(resultById.get('hemoglobin'));
  const hematocrit = parsePositiveNumber(resultById.get('hematocrit'));
  const calculated = new Map<string, string | null>([
    ['mcv', rbcs !== null && hematocrit !== null ? formatIndex((hematocrit / rbcs) * 10) : null],
    ['mch', rbcs !== null && hemoglobin !== null ? formatIndex((hemoglobin / rbcs) * 10) : null],
    ['mchc', hematocrit !== null && hemoglobin !== null ? formatIndex((hemoglobin / hematocrit) * 100) : null],
  ]);

  return children.map(child => {
    const value = calculated.get(child.id.toLowerCase());
    if (value === undefined || (value === null && !clearUnavailable)) return child;
    return { ...child, result: value ?? '' };
  });
}
