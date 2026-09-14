import type { AnalyticResult, AnalyticResultFormData } from '../types/analyticType';
import { FirestoreService } from './firestoreService';

export const AnalyticResultService = {
  async createMany(data: AnalyticResultFormData[]): Promise<void> {
    return FirestoreService.createAnalyticResults(data);
  },
  async getByPatientId(patientId: string): Promise<AnalyticResult[]> {
    try {
      return await FirestoreService.getResultsByPatientId(patientId);
    } catch (error) {
      console.warn('Firestore error fetching analytic results:', error);
      return [];
    }
  },

  async create(data: AnalyticResultFormData): Promise<AnalyticResult> {
    return await FirestoreService.createAnalyticResult(data);
  },

  async delete(id: string): Promise<boolean> {
    return await FirestoreService.deleteAnalyticResult(id);
  },
};
