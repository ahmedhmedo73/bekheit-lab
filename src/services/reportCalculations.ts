import type { ChildAnalyticResult } from '../types/analyticType.ts';

const SOURCE_IDS = new Set(['fasting-insulin', 'fasting-glucose', 'psa-total', 'psa-free']);
const CALCULATED_IDS = new Set(['homa1-ir', 'psa-ratio']);

function parseNonNegative(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function format(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

function hasIds(children: ChildAnalyticResult[], ids: string[]): boolean {
  const childIds = new Set(children.map(child => child.id.toLowerCase()));
  return ids.every(id => childIds.has(id));
}

export function isReportCalculationSourceField(childId: string): boolean {
  return SOURCE_IDS.has(childId.toLowerCase());
}

export function isReportCalculatedField(children: ChildAnalyticResult[], childId: string): boolean {
  const id = childId.toLowerCase();
  if (!CALCULATED_IDS.has(id)) return false;
  if (id === 'homa1-ir') return hasIds(children, ['fasting-insulin', 'fasting-glucose', 'homa1-ir']);
  return hasIds(children, ['psa-total', 'psa-free', 'psa-ratio']);
}

export function calculateReportValues(
  children: ChildAnalyticResult[],
  clearUnavailable = false,
): ChildAnalyticResult[] {
  const resultById = new Map(children.map(child => [child.id.toLowerCase(), child.result]));
  const calculations = new Map<string, string | null>();

  if (hasIds(children, ['fasting-insulin', 'fasting-glucose', 'homa1-ir'])) {
    const insulin = parseNonNegative(resultById.get('fasting-insulin'));
    const glucose = parseNonNegative(resultById.get('fasting-glucose'));
    calculations.set('homa1-ir', insulin !== null && glucose !== null ? format((insulin * glucose) / 405, 2) : null);
  }

  if (hasIds(children, ['psa-total', 'psa-free', 'psa-ratio'])) {
    const total = parseNonNegative(resultById.get('psa-total'));
    const free = parseNonNegative(resultById.get('psa-free'));
    calculations.set('psa-ratio', total !== null && total > 0 && free !== null ? format(free / total, 3) : null);
  }

  if (!calculations.size) return children;
  return children.map(child => {
    const value = calculations.get(child.id.toLowerCase());
    if (value === undefined || (value === null && !clearUnavailable)) return child;
    return { ...child, result: value ?? '' };
  });
}
