import type { AnalyticType } from './analyticType';

export const LAB_VISIT_STATUSES = ['New', 'In Lab', 'Pending Results', 'Completed'] as const;
export type LabVisitStatus = typeof LAB_VISIT_STATUSES[number];

export interface LabVisit {
  id: string;
  patientId: string;
  patientName: string;
  visitNumber: string;
  status: LabVisitStatus;
  totalAmount: number;
  paidAmount: number;
  assignedAnalytics?: AnalyticType[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LabVisitFormData = Pick<LabVisit, 'patientId' | 'patientName' | 'status' | 'notes'> & { assignedAnalytics?: AnalyticType[]; paidAmount?: number };
