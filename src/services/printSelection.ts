import type { AnalyticResult } from '../types/analyticType';

export function resultPriceCents(price: unknown): number {
  const value = typeof price === 'number' || typeof price === 'string' ? Number(price) : 0;
  return Number.isFinite(value) && value >= 0 ? Math.round((value + Number.EPSILON) * 100) : 0;
}

export function selectedResultTotal(results: AnalyticResult[]): number {
  return results.reduce((sum, result) => sum + resultPriceCents(result.price), 0) / 100;
}

/** Selecting an older record replaces the current selection for that panel. */
export function togglePrintResult(results: AnalyticResult[], selectedIds: string[], result: AnalyticResult): string[] {
  if (selectedIds.includes(result.id)) return selectedIds.filter(id => id !== result.id);
  const samePanel = new Set(results.filter(item => item.analyticTypeId === result.analyticTypeId).map(item => item.id));
  return [...selectedIds.filter(id => !samePanel.has(id)), result.id];
}
