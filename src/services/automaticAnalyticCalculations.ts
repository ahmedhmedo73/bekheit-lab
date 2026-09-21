import type { ChildAnalyticResult } from '../types/analyticType.ts';
import { calculateCbcIndices, isCbcCalculatedField, isCbcSourceField } from './cbcCalculations.ts';
import { calculateLipidProfile, isLipidCalculatedField, isLipidSourceField } from './lipidCalculations.ts';

export function calculateAutomaticAnalyticValues(
  children: ChildAnalyticResult[],
  clearUnavailable = false,
): ChildAnalyticResult[] {
  return calculateLipidProfile(calculateCbcIndices(children, clearUnavailable), clearUnavailable);
}

export function isAutomaticAnalyticSourceField(childId: string): boolean {
  return isCbcSourceField(childId) || isLipidSourceField(childId);
}

export function isAutomaticAnalyticCalculatedField(children: ChildAnalyticResult[], childId: string): boolean {
  return isCbcCalculatedField(children, childId) || isLipidCalculatedField(children, childId);
}
