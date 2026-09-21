import type { ChildAnalyticResult } from '../types/analyticType.ts';
import { calculateCbcIndices, isCbcCalculatedField, isCbcSourceField } from './cbcCalculations.ts';
import { calculateLipidProfile, isLipidCalculatedField, isLipidSourceField } from './lipidCalculations.ts';
import { calculateReportValues, isReportCalculatedField, isReportCalculationSourceField } from './reportCalculations.ts';

export function calculateAutomaticAnalyticValues(
  children: ChildAnalyticResult[],
  clearUnavailable = false,
): ChildAnalyticResult[] {
  return calculateReportValues(calculateLipidProfile(calculateCbcIndices(children, clearUnavailable), clearUnavailable), clearUnavailable);
}

export function isAutomaticAnalyticSourceField(childId: string): boolean {
  return isCbcSourceField(childId) || isLipidSourceField(childId) || isReportCalculationSourceField(childId);
}

export function isAutomaticAnalyticCalculatedField(children: ChildAnalyticResult[], childId: string): boolean {
  return isCbcCalculatedField(children, childId) || isLipidCalculatedField(children, childId) || isReportCalculatedField(children, childId);
}
