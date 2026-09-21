import type { AnalyticResult, AnalyticResultFormData } from '../types/analyticType';
import { FirestoreService } from './firestoreService';

export const AnalyticResultService = {
  async createMany(data: AnalyticResultFormData[]): Promise<void> {
    return FirestoreService.createAnalyticResults(data);
  },
  async saveMany(data: AnalyticResultFormData[]): Promise<void> {
    return FirestoreService.saveAnalyticResults(data);
  },
  async getByPatientId(patientId: string): Promise<AnalyticResult[]> {
    return await FirestoreService.getResultsByPatientId(patientId);
  },

  async create(data: AnalyticResultFormData): Promise<AnalyticResult> {
    return await FirestoreService.createAnalyticResult(data);
  },

  async delete(id: string): Promise<boolean> {
    return await FirestoreService.deleteAnalyticResult(id);
  },
};
