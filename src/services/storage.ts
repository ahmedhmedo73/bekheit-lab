import type { MedicalStaff } from "../types/user";
import type { AuthUser } from "../types/auth";
import type { Patient } from "../types/patient";

const STORAGE_KEYS = {
  STAFF_DATA: "bekheit_lab_staff_data_v1",
  PATIENT_DATA: "bekheit_lab_patient_data_v1",
  AUTH_SESSION: "bekheit_lab_auth_session_v1",
  ACTIVITY_LOGS: "bekheit_lab_activity_logs_v1",
};

export const INITIAL_STAFF_DATA: MedicalStaff[] = [
  {
    id: "staff-01",
    staffId: "BKL-1001",
    name: "Prof. Dr. Mohamed Bekheit",
    email: "mohamed.bekheit@bekheitlab.com",
    phone: "+20 100 245 8891",
    role: "ADMIN",
    roleTitle: "Consultant Pathologist & Lab Administrator",
    department: "Histopathology & Cytology",
    specialization: "Surgical Pathology & Flow Cytometry",
    licenseNumber: "EMS-74192-PATH",
    nationalId: "27608150102914",
    status: "Active",
    shift: "Morning (07:00 - 15:30)",
    joinDate: "2015-03-15",
    avatarColor: "#0284c7",
    notes:
      "Founding Laboratory Director. Lead signatory for high-complexity oncological pathology reports.",
    testsAuthorized: [
      "Histopathology Biopsies",
      "Bone Marrow Aspirates",
      "Immunohistochemistry",
      "Flow Cytometry Panels",
    ],
    auditLogs: [
      {
        id: "log-01",
        action: "Profile Updated",
        performedBy: "System Administrator",
        timestamp: "2026-08-20 09:15",
        details: "Renewed CAP accreditation supervisor status.",
      },
    ],
  },
];

export const INITIAL_PATIENT_DATA: Patient[] = [
  {
    id: "pat-01",
    patientId: "PAT-1001",
    name: "Youssef Ibrahim",
    age: 34,
    phone: "+201004819920",
    jobTitle: "Software Engineer",
    subtitle: "Routine Complete Blood Count & Lipid Panel",
    gender: "Male",
    status: "Active",
    registeredDate: "2026-08-24",
    avatarColor: "#0284c7",
    notes:
      "Fasting 12 hours prior to biochemistry draw. Sample barcode #BC-9901.",
  },
  {
    id: "pat-02",
    patientId: "PAT-1002",
    name: "Nourhan Adel",
    age: 28,
    phone: "+20 111 829 3301",
    jobTitle: "Pharmacist",
    subtitle: "Thyroid Profile (TSH, Free T3/T4) & Serum Ferritin",
    gender: "Female",
    status: "Pending Results",
    registeredDate: "2026-08-24",
    avatarColor: "#0d9488",
    notes:
      "Referred by Dr. Hazem (Endocrinology). Serum aliquots sent to Chemiluminescence bench.",
  },
  {
    id: "pat-03",
    patientId: "PAT-1003",
    name: "Mahmoud El-Shamy",
    age: 56,
    phone: "+20 122 710 4482",
    jobTitle: "Retired Teacher",
    subtitle: "Fasting Blood Glucose & HbA1c Monitoring",
    gender: "Male",
    status: "Active",
    registeredDate: "2026-08-23",
    avatarColor: "#6366f1",
    notes: "Monthly diabetic follow-up check.",
  },
  {
    id: "pat-04",
    patientId: "PAT-1004",
    name: "Farida Mostafa",
    age: 42,
    phone: "+20 109 334 1189",
    jobTitle: "Accountant",
    subtitle: "STAT Cardiac Biomarkers (High-Sensitivity Troponin I & CK-MB)",
    gender: "Female",
    status: "Urgent / STAT",
    registeredDate: "2026-08-24",
    avatarColor: "#ef4444",
    notes:
      "Emergency department priority sample #STAT-4412. Immediate phone notification required.",
  },
  {
    id: "pat-05",
    patientId: "PAT-1005",
    name: "Hassan Mansour",
    age: 61,
    phone: "+20 114 902 5567",
    jobTitle: "Civil Engineer",
    subtitle: "Renal Function (Creatinine / Urea) & Liver Enzymes (ALT / AST)",
    gender: "Male",
    status: "Completed",
    registeredDate: "2026-08-22",
    avatarColor: "#10b981",
    notes: "All test results authorized by Consultant Pathologist.",
  },
  {
    id: "pat-06",
    patientId: "PAT-1006",
    name: "Mariam El-Gohary",
    age: 19,
    phone: "+20 102 673 8810",
    jobTitle: "University Student",
    subtitle: "Pre-Operative Coagulation Screen (PT, PTT & INR)",
    gender: "Female",
    status: "Active",
    registeredDate: "2026-08-24",
    avatarColor: "#8b5cf6",
    notes:
      "Sodium citrate blue tube spun at 3000 RPM. Ready for analyzer reading.",
  },
];

export const StorageService = {
  getStaffData(): MedicalStaff[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF_DATA);
      if (!data) {
        this.saveStaffData(INITIAL_STAFF_DATA);
        return INITIAL_STAFF_DATA;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading staff data from storage", e);
      return INITIAL_STAFF_DATA;
    }
  },

  saveStaffData(staff: MedicalStaff[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF_DATA, JSON.stringify(staff));
    } catch (e) {
      console.error("Error saving staff data to storage", e);
    }
  },

  getPatientData(): Patient[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PATIENT_DATA);
      if (!data) {
        this.savePatientData(INITIAL_PATIENT_DATA);
        return INITIAL_PATIENT_DATA;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading patient data from storage", e);
      return INITIAL_PATIENT_DATA;
    }
  },

  savePatientData(patients: Patient[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENT_DATA, JSON.stringify(patients));
    } catch (e) {
      console.error("Error saving patient data to storage", e);
    }
  },

  getAuthSession(): AuthUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Error reading auth session", e);
      return null;
    }
  },

  saveAuthSession(user: AuthUser | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      }
    } catch (e) {
      console.error("Error saving auth session", e);
    }
  },

  resetToDefault(): void {
    this.saveStaffData(INITIAL_STAFF_DATA);
    this.savePatientData(INITIAL_PATIENT_DATA);
  },
};
