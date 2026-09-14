import type { AnalyticType, AnalyticResult, ChildAnalytic } from '../types/analyticType';

// Never infer clinical ranges or split a historical free-text result.
export function analyticChildren(type: Pick<AnalyticType, 'name' | 'children'>): ChildAnalytic[] {
  return type.children ?? [{ id: 'legacy', name: type.name, unit: '', referenceRange: '' }];
}

export function typeMigration(data: AnalyticType) {
  return { children: analyticChildren(data), schemaVersion: 2 };
}

export function resultMigration(data: AnalyticResult) {
  return {
    children: data.children ?? [{ id: 'legacy', name: data.analyticTypeName, unit: '', referenceRange: '', result: data.result ?? '' }],
    schemaVersion: 2,
  };
}
