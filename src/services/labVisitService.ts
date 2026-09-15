import type { LabVisit, LabVisitFormData } from '../types/labVisit';
import { FirestoreService } from './firestoreService';

export const LabVisitService = {
  getAll: (): Promise<LabVisit[]> => FirestoreService.getLabVisits(),
  getByPatient: (patientId: string): Promise<LabVisit[]> => FirestoreService.getLabVisits(patientId),
  getCounts: (patientIds: string[]): Promise<Record<string, number>> => FirestoreService.getLabVisitCounts(patientIds),
  create: (data: LabVisitFormData): Promise<LabVisit> => FirestoreService.createLabVisit(data),
  update: (id: string, updates: Parameters<typeof FirestoreService.updateLabVisit>[1]) => FirestoreService.updateLabVisit(id, updates),
  delete: (id: string): Promise<boolean> => FirestoreService.deleteLabVisit(id),
};
