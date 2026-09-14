import type { ChildAnalytic, ChildAnalyticResult } from '../types/analyticType';

export function emptyAnalyticResult(child: ChildAnalytic): ChildAnalyticResult {
  return { ...child, result: '', ...(child.resultType === 'differential' && child.absoluteEnabled ? { absoluteResult: '' } : {}) };
}

export function isAnalyticResultComplete(child: ChildAnalyticResult): boolean {
  return Boolean(child.result.trim()) && !(child.resultType === 'differential' && child.absoluteEnabled && !child.absoluteResult?.trim());
}
