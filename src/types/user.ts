import type { UserRole } from './auth';

export type Department =
  | 'Hematology'
  | 'Clinical Biochemistry'
  | 'Microbiology & Parasitology'
  | 'Immunology & Serology'
  | 'Histopathology & Cytology'
  | 'Molecular Biology & Genetics'
  | 'Quality Assurance & Safety'
  | 'Administration';

export type UserStatus = 'Active' | 'On Leave' | 'Suspended' | 'In Training';

export type ShiftType = 'Morning (07:00 - 15:30)' | 'Evening (15:00 - 23:30)' | 'Night (23:00 - 07:30)' | 'Rotating';

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
}

export interface MedicalStaff {
  id: string;
  staffId: string; // e.g., "BKL-2041"
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  roleTitle: string;
  department: Department;
  specialization: string;
  licenseNumber: string; // Egyptian Medical Syndicate or Lab Board License
  nationalId?: string;
  status: UserStatus;
  shift: ShiftType;
  joinDate: string;
  avatarColor?: string;
  notes?: string;
  testsAuthorized?: string[];
  auditLogs?: AuditLogEntry[];
}

export type StaffFormData = Omit<MedicalStaff, 'id' | 'auditLogs'>;

export interface StaffFilterOptions {
  search: string;
  department: Department | 'ALL';
  role: UserRole | 'ALL';
  status: UserStatus | 'ALL';
  sortBy: 'name' | 'staffId' | 'department' | 'joinDate' | 'status';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
