import type { AnalyticResult, AnalyticType, ChildAnalyticResult } from '../types/analyticType';
import { analyticChildren, resultMigration } from './analyticSchema.ts';
import { emptyAnalyticResult } from './analyticValues.ts';

export interface AnalyticResultEntry {
  analyticTypeId: string;
  analyticTypeName: string;
  price: number;
  result: string;
  children: ChildAnalyticResult[];
  notes: string;
  generalComment: string;
}

export function prefillAnalyticResults(
  assignedAnalytics: AnalyticType[],
  savedResults: AnalyticResult[],
  visitId?: string,
): AnalyticResultEntry[] {
  const latestByType = new Map<string, AnalyticResult>();
  for (const result of savedResults) {
    if (visitId && result.visitId !== visitId) continue;
    const previous = latestByType.get(result.analyticTypeId);
    if (!previous || (result.createdAt ?? '') > (previous.createdAt ?? '')) {
      latestByType.set(result.analyticTypeId, result);
    }
  }

  return assignedAnalytics.map(type => {
    const saved = latestByType.get(type.id);
    const savedChildren = saved ? resultMigration(saved).children : [];
    return {
      analyticTypeId: type.id,
      analyticTypeName: type.name,
      price: type.price,
      result: saved?.result ?? '',
      children: analyticChildren(type).map(child => {
        const previous = savedChildren.find(item => item.id === child.id)
          ?? savedChildren.find(item => item.name === child.name && item.section === child.section);
        return {
          ...emptyAnalyticResult(child),
          result: previous?.result ?? '',
          ...(child.absoluteEnabled ? { absoluteResult: previous?.absoluteResult ?? '' } : {}),
        };
      }),
      notes: saved?.notes ?? '',
      generalComment: saved?.generalComment ?? type.generalComment ?? '',
    };
  });
}
