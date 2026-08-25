export type PatientStatus = 'Active' | 'Pending Results' | 'Completed' | 'Urgent / STAT';

export interface Patient {
  id: string;
  patientId: string; // e.g. "PAT-1001"
  name: string;
  age: number;
  phone: string;
  jobTitle: string;
  subtitle: string; // Clinical subtitle / diagnosis / referral note
  gender?: 'Male' | 'Female' | 'Other';
  status: PatientStatus;
  registeredDate: string;
  avatarColor?: string;
  notes?: string;
  // Firestore timestamps
  createdAt?: string;
  updatedAt?: string;
}

export type PatientFormData = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;

export interface PatientFilterOptions {
  search: string;
  status: PatientStatus | 'ALL';
  sortBy: 'name' | 'patientId' | 'age' | 'registeredDate';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
