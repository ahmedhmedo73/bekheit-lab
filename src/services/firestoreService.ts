import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Patient, PatientFormData } from '../types/patient';

const PATIENTS_COLLECTION = 'patients';

// Helper function to convert Firestore document to Patient object
function convertDocToPatient(doc: QueryDocumentSnapshot<DocumentData>): Patient {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
  } as Patient;
}

// Helper function for pagination
function getRandomMedicalColor(): string {
  const colors = ['#0284c7', '#0d9488', '#6366f1', '#8b5cf6', '#059669', '#d97706', '#e11d48', '#3b82f6'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export const FirestoreService = {
  // Get all patients
  async getAllPatients(): Promise<Patient[]> {
    try {
      const patientsRef = collection(db, PATIENTS_COLLECTION);
      const snapshot = await getDocs(patientsRef);
      return snapshot.docs.map(convertDocToPatient);
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw new Error('Failed to fetch patients from Firestore', { cause: error });
    }
  },

  // Get patient by ID
  async getPatientById(id: string): Promise<Patient | undefined> {
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        return undefined;
      }
      return convertDocToPatient(snapshot);
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw new Error('Failed to fetch patient from Firestore', { cause: error });
    }
  },

  // Create new patient
  async createPatient(patientData: PatientFormData): Promise<Patient> {
    try {
      const patientsRef = collection(db, PATIENTS_COLLECTION);
      
      // Generate patient ID if not provided
      const patientId = patientData.patientId || `PAT-${Date.now()}`;
      
      const newPatientData = {
        ...patientData,
        patientId,
        registeredDate: patientData.registeredDate || new Date().toISOString().split('T')[0],
        avatarColor: patientData.avatarColor || getRandomMedicalColor(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(patientsRef, newPatientData);
      return {
        id: docRef.id,
        ...newPatientData,
      } as Patient;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw new Error('Failed to create patient in Firestore', { cause: error });
    }
  },

  // Update patient
  async updatePatient(id: string, updates: Partial<PatientFormData>): Promise<Patient> {
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, id);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(docRef, updateData);
      
      // Return updated patient
      const updatedSnapshot = await getDoc(docRef);
      return convertDocToPatient(updatedSnapshot);
    } catch (error) {
      console.error('Error updating patient:', error);
      throw new Error('Failed to update patient in Firestore', { cause: error });
    }
  },

  // Delete patient
  async deletePatient(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw new Error('Failed to delete patient from Firestore', { cause: error });
    }
  },

  // Filter patients with pagination
  async filterPatients(options: {
    search: string;
    status: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    page: number;
    pageSize: number;
  }) {
    try {
      let q = collection(db, PATIENTS_COLLECTION);
      
      // Build query
      const constraints = [];
      
      // Status filter
      if (options.status !== 'ALL') {
        constraints.push(where('status', '==', options.status));
      }
      
      // Sorting
      const sortDirection = options.sortOrder === 'asc' ? 'asc' : 'desc';
      constraints.push(orderBy(options.sortBy, sortDirection));
      
      // Apply constraints
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }
      
      const snapshot = await getDocs(q);
      let patients = snapshot.docs.map(convertDocToPatient);
      
      // Search filter (client-side for complex search)
      if (options.search.trim()) {
        const searchLower = options.search.toLowerCase().trim();
        patients = patients.filter(
          (p: Patient) =>
            p.name?.toLowerCase().includes(searchLower) ||
            p.patientId?.toLowerCase().includes(searchLower) ||
            p.phone?.toLowerCase().includes(searchLower) ||
            p.jobTitle?.toLowerCase().includes(searchLower) ||
            p.subtitle?.toLowerCase().includes(searchLower)
        );
      }
      
      // Pagination (client-side after filtering)
      const total = patients.length;
      const totalPages = Math.ceil(total / options.pageSize) || 1;
      const startIndex = (options.page - 1) * options.pageSize;
      const paginated = patients.slice(startIndex, startIndex + options.pageSize);
      
      return {
        data: paginated,
        total,
        totalPages,
      };
    } catch (error) {
      console.error('Error filtering patients:', error);
      throw new Error('Failed to filter patients in Firestore', { cause: error });
    }
  },

  // Get patient statistics
  async getStats() {
    try {
      const patients = await this.getAllPatients();
      return {
        total: patients.length,
        active: patients.filter((p: Patient) => p.status === 'Active').length,
        pending: patients.filter((p: Patient) => p.status === 'Pending Results').length,
        stat: patients.filter((p: Patient) => p.status === 'Urgent / STAT').length,
        completed: patients.filter((p: Patient) => p.status === 'Completed').length,
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error('Failed to fetch patient statistics from Firestore', { cause: error });
    }
  },

  // Batch migration: migrate existing patients to Firestore
  async migratePatients(patients: Patient[]) {
    try {
      const patientsRef = collection(db, PATIENTS_COLLECTION);
      const batch = patients.map(async (patient) => {
        const patientData = {
          ...patient,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        // Use addDoc to let Firestore generate ID, or use doc with specific ID
        return addDoc(patientsRef, patientData);
      });
      
      await Promise.all(batch);
      return { success: true, count: patients.length };
    } catch (error) {
      console.error('Error migrating patients:', error);
      throw new Error('Failed to migrate patients to Firestore', { cause: error });
    }
  },
};
