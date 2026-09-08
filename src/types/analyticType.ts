export interface AnalyticType {
  id: string;
  name: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AnalyticTypeFormData = Omit<AnalyticType, 'id' | 'createdAt' | 'updatedAt'>;

export interface AnalyticResult {
  id: string;
  patientId: string;
  analyticTypeId: string;
  analyticTypeName: string;
  price: number;
  result: string;
  notes?: string;
  createdAt?: string;
}

export type AnalyticResultFormData = Omit<AnalyticResult, 'id' | 'createdAt'>;
