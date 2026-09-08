import type { AnalyticType, AnalyticTypeFormData } from '../types/analyticType';
import { FirestoreService } from './firestoreService';

export const AnalyticTypeService = {
  async getAll(): Promise<AnalyticType[]> {
    try {
      return await FirestoreService.getAllAnalyticTypes();
    } catch (error) {
      console.warn('Firestore error fetching analytic types:', error);
      return [];
    }
  },

  async create(data: AnalyticTypeFormData): Promise<AnalyticType> {
    return await FirestoreService.createAnalyticType(data);
  },

  async update(id: string, data: Partial<AnalyticTypeFormData>): Promise<AnalyticType> {
    return await FirestoreService.updateAnalyticType(id, data);
  },

  async delete(id: string): Promise<boolean> {
    return await FirestoreService.deleteAnalyticType(id);
  },
};
