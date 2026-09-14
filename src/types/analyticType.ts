export interface ChildAnalytic {
  id: string;
  name: string;
  unit: string;
  referenceRange: string;
  referenceSource?: string;
}

export interface ChildAnalyticResult extends ChildAnalytic {
  result: string;
}

export interface AnalyticType {
  id: string;
  name: string;
  price: number;
  children?: ChildAnalytic[];
  schemaVersion?: number;
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
  children?: ChildAnalyticResult[];
  schemaVersion?: number;
  notes?: string;
  createdAt?: string;
}

export type AnalyticResultFormData = Omit<AnalyticResult, 'id' | 'createdAt'>;
