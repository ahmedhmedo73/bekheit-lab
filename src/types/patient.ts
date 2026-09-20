export type PatientStatus = 'Active' | 'Pending Results' | 'Completed' | 'Urgent / STAT';

export interface Patient {
  id: string;
  patientId: string; // e.g. "PAT-1001"
  name: string;
  age: number;
  phone: string;
  jobTitle: string;
  subtitle?: string; // Legacy data, retained for existing Firestore records
  gender?: 'Male' | 'Female' | 'Other';
  status?: PatientStatus; // Legacy patient intake status
  registeredDate: string;
  avatarColor?: string;
  notes?: string;
  // Firestore timestamps
  createdAt?: string;
  updatedAt?: string;
}

export type PatientFormData = Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'subtitle' | 'status'>;

export interface PatientFilterOptions {
  search: string;
  status: PatientStatus | 'ALL';
  sortBy: 'name' | 'patientId' | 'age' | 'registeredDate';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
