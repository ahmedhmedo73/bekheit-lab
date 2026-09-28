export interface ChildAnalytic {
  id: string;
  name: string;
  unit: string;
  referenceRange: string;
  referenceSource?: string;
  section?: string;
  resultType?: 'numeric' | 'text' | 'qualitative' | 'range' | 'differential';
  options?: string[];
  absoluteEnabled?: boolean;
  absoluteUnit?: string;
  absoluteReferenceRange?: string;
}

export interface ChildAnalyticResult extends ChildAnalytic {
  result: string;
  absoluteResult?: string;
}

export interface AnalyticType {
  id: string;
  name: string;
  price: number;
  children?: ChildAnalytic[];
  schemaVersion?: number;
  generalComment?: string;
  sourcePage?: number;
  chartEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnalyticResultChart {
  url: string;
  storagePath: string;
  fileName: string;
}

export type AnalyticTypeFormData = Omit<AnalyticType, 'id' | 'createdAt' | 'updatedAt'>;

export interface AnalyticResult {
  id: string;
  patientId: string;
  visitId?: string;
  analyticTypeId: string;
  analyticTypeName: string;
  price: number;
  result: string;
  children?: ChildAnalyticResult[];
  schemaVersion?: number;
  notes?: string;
  generalComment?: string;
  chartImage?: AnalyticResultChart | null;
  createdAt?: string;
}

export type AnalyticResultFormData = Omit<AnalyticResult, 'id' | 'createdAt'>;
