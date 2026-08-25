import type { Patient, PatientFormData, PatientFilterOptions } from '../types/patient';
import { FirestoreService } from './firestoreService';
import { StorageService } from './storage';

// Flag to switch between localStorage and Firestore
// Set to true to use Firestore, false to use localStorage
const USE_FIRESTORE = true;

export const PatientService = {
  async getAllPatients(): Promise<Patient[]> {
    if (USE_FIRESTORE) {
      try {
        return await FirestoreService.getAllPatients();
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
        return StorageService.getPatientData();
      }
    }
    return StorageService.getPatientData();
  },

  async getPatientById(id: string): Promise<Patient | undefined> {
    if (USE_FIRESTORE) {
      try {
        return await FirestoreService.getPatientById(id);
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
        const patients = StorageService.getPatientData();
        return patients.find((p) => p.id === id);
      }
    }
    const patients = StorageService.getPatientData();
    return patients.find((p) => p.id === id);
  },

  async createPatient(formData: PatientFormData): Promise<Patient> {
    if (USE_FIRESTORE) {
      try {
        return await FirestoreService.createPatient(formData);
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }
    
    const patients = StorageService.getPatientData();
    const newId = `pat-${Date.now()}`;
    const nextNum = patients.length + 1;
    const patientId = formData.patientId || `PAT-${1000 + nextNum}`;

    const newPatient: Patient = {
      ...formData,
      id: newId,
      patientId,
      registeredDate: formData.registeredDate || new Date().toISOString().split('T')[0],
      avatarColor: formData.avatarColor || getRandomMedicalColor(),
    };

    patients.unshift(newPatient);
    StorageService.savePatientData(patients);
    return newPatient;
  },

  async updatePatient(id: string, updates: Partial<PatientFormData>): Promise<Patient> {
    if (USE_FIRESTORE) {
      try {
        return await FirestoreService.updatePatient(id, updates);
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }
    
    const patients = StorageService.getPatientData();
    const index = patients.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Patient with id "${id}" was not found.`);
    }

    const updatedPatient: Patient = {
      ...patients[index],
      ...updates,
    };

    patients[index] = updatedPatient;
    StorageService.savePatientData(patients);
    return updatedPatient;
  },

  async deletePatient(id: string): Promise<boolean> {
    if (USE_FIRESTORE) {
      try {
        return await FirestoreService.deletePatient(id);
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }
    
    const patients = StorageService.getPatientData();
    const filtered = patients.filter((p) => p.id !== id);
    if (filtered.length === patients.length) return false;
    StorageService.savePatientData(filtered);
    return true;
  },

  async filterPatients(options: PatientFilterOptions): Promise<{ data: Patient[]; total: number; totalPages: number }> {
    if (USE_FIRESTORE) {
      try {
        return await FirestoreService.filterPatients(options);
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }
    
    let list = StorageService.getPatientData();

    // 1. Search Query (name, patientId, phone, subtitle)
    if (options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.patientId.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          p.jobTitle.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (options.status !== 'ALL') {
      list = list.filter((p) => p.status === options.status);
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (options.sortBy === 'age') {
        return options.sortOrder === 'asc' ? a.age - b.age : b.age - a.age;
      }
      const valA: string = (a[options.sortBy] || '').toString();
      const valB: string = (b[options.sortBy] || '').toString();
      const comp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      return options.sortOrder === 'asc' ? comp : -comp;
    });

    const total = list.length;
    const totalPages = Math.ceil(total / options.pageSize) || 1;
    const startIndex = (options.page - 1) * options.pageSize;
    const paginated = list.slice(startIndex, startIndex + options.pageSize);

    return {
      data: paginated,
      total,
      totalPages,
    };
  },

  async getStats() {
    if (USE_FIRESTORE) {
      try {
        return await FirestoreService.getStats();
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }
    
    const list = StorageService.getPatientData();
    return {
      total: list.length,
      active: list.filter((p) => p.status === 'Active').length,
      pending: list.filter((p) => p.status === 'Pending Results').length,
      stat: list.filter((p) => p.status === 'Urgent / STAT').length,
      completed: list.filter((p) => p.status === 'Completed').length,
    };
  },
};

function getRandomMedicalColor(): string {
  const colors = ['#0284c7', '#0d9488', '#6366f1', '#8b5cf6', '#059669', '#d97706', '#e11d48', '#3b82f6'];
  return colors[Math.floor(Math.random() * colors.length)];
}
