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
  runTransaction,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { trackServiceRequests } from './requestActivity';
import { migrateAnalyticHierarchy } from '../scripts/migrateAnalyticHierarchy';
import { migrateLabVisits } from '../scripts/migrateLabVisits';
import { typeMigration } from './analyticSchema';
import type { Patient, PatientFormData } from '../types/patient';
import type { AnalyticType, AnalyticTypeFormData, AnalyticResult, AnalyticResultFormData } from '../types/analyticType';
import type { MedicalStaff, StaffFormData, StaffFilterOptions } from '../types/user';
import type { LabVisit, LabVisitFormData } from '../types/labVisit';
import { resultPriceCents } from './printSelection';
import { LAB_VISIT_STATUSES } from '../types/labVisit';

const PATIENTS_COLLECTION = 'patients';
const ANALYTIC_TYPES_COLLECTION = 'analyticTypes';
const ANALYTIC_RESULTS_COLLECTION = 'analyticResults';
const LAB_VISITS_COLLECTION = 'labVisits';
const STAFF_COLLECTION = 'staff';

// Helper function to convert Firestore document to Patient object
function convertDocToPatient(doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Patient | null {
  if (!doc.exists()) return null;
  const data = doc.data();
  if (!data) return null;
  return {
    id: doc.id,
    ...data,
  } as Patient;
}

// Helper function to convert Firestore document to MedicalStaff object
function convertDocToStaff(doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): MedicalStaff | null {
  if (!doc.exists()) return null;
  const data = doc.data();
  if (!data) return null;
  return {
    id: doc.id,
    ...data,
  } as MedicalStaff;
}

// Helper function to sanitize objects so Firestore never rejects undefined values
function cleanFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  }
  return clean;
}

// Helper function for pagination
function getRandomMedicalColor(): string {
  const colors = ['#0284c7', '#0d9488', '#6366f1', '#8b5cf6', '#059669', '#d97706', '#e11d48', '#3b82f6'];
  return colors[Math.floor(Math.random() * colors.length)];
}

const firestoreService = {
  async getLabVisits(patientId?: string): Promise<LabVisit[]> {
    if (!db) throw new Error('Firestore is not initialized');
    await migrateLabVisits();
    const ref = collection(db, LAB_VISITS_COLLECTION);
    const snapshot = await getDocs(patientId ? query(ref, where('patientId', '==', patientId)) : ref);
    return snapshot.docs.map(item => ({ ...item.data(), id: item.id, status: item.data().status === 'Open' ? 'New' : item.data().status } as LabVisit)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getLabVisitCounts(patientIds: string[]): Promise<Record<string, number>> {
    const visits = await this.getLabVisits();
    const allowed = new Set(patientIds);
    return visits.reduce<Record<string, number>>((counts, visit) => {
      if (allowed.has(visit.patientId)) counts[visit.patientId] = (counts[visit.patientId] ?? 0) + 1;
      return counts;
    }, {});
  },

  async createLabVisit(data: LabVisitFormData): Promise<LabVisit> {
    if (!db) throw new Error('Firestore is not initialized');
    const assignedAnalytics = data.assignedAnalytics ?? [];
    if (!assignedAnalytics.length) throw new Error('Select at least one analytic type.');
    if (new Set(assignedAnalytics.map(type => type.id)).size !== assignedAnalytics.length) throw new Error('Select each analytic type only once.');
    const totalAmount = assignedAnalytics.reduce((sum, type) => sum + resultPriceCents(type.price), 0) / 100;
    const timestamp = new Date().toISOString();
    const ref = await addDoc(collection(db, LAB_VISITS_COLLECTION), cleanFirestoreData({
      ...data, assignedAnalytics, status: 'New', visitNumber: `VIS-${Date.now()}`, totalAmount, paidAmount: 0,
      createdAt: timestamp, updatedAt: timestamp,
    }));
    const snapshot = await getDoc(ref);
    return { id: ref.id, ...snapshot.data() } as LabVisit;
  },

  async updateLabVisit(id: string, updates: Partial<Pick<LabVisit, 'status' | 'notes' | 'paidAmount' | 'totalAmount'>>): Promise<void> {
    if (!db) throw new Error('Firestore is not initialized');
    if (updates.paidAmount !== undefined && (!Number.isFinite(updates.paidAmount) || updates.paidAmount < 0)) throw new Error('Paid amount must be zero or greater.');
    if (updates.status !== undefined && !LAB_VISIT_STATUSES.includes(updates.status)) throw new Error('Choose a valid visit status.');
    await updateDoc(doc(db, LAB_VISITS_COLLECTION, id), cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() }));
  },

  async deleteLabVisit(id: string): Promise<boolean> {
    if (!db) throw new Error('Firestore is not initialized');
    const attached = await getDocs(query(collection(db, ANALYTIC_RESULTS_COLLECTION), where('visitId', '==', id)));
    if (!attached.empty) throw new Error('This visit has saved results and cannot be deleted.');
    const ref = doc(db, LAB_VISITS_COLLECTION, id);
    await runTransaction(db, async transaction => {
      const current = await transaction.get(ref);
      if (!current.exists()) return;
      if (Number(current.data().paidAmount) > 0) throw new Error('This visit has recorded payments and cannot be deleted.');
      transaction.delete(ref);
    });
    return true;
  },
  // Get all patients
  async getAllPatients(): Promise<Patient[]> {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    try {
      const patientsRef = collection(db, PATIENTS_COLLECTION);
      const snapshot = await getDocs(patientsRef);
      return snapshot.docs.map(convertDocToPatient).filter((p): p is Patient => p !== null);
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw new Error('Failed to fetch patients from Firestore', { cause: error });
    }
  },

  // Get patient by ID
  async getPatientById(id: string): Promise<Patient | undefined> {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        return undefined;
      }
      const patient = convertDocToPatient(snapshot);
      return patient || undefined;
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw new Error('Failed to fetch patient from Firestore', { cause: error });
    }
  },

  // Create new patient
  async createPatient(patientData: PatientFormData): Promise<Patient> {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    try {
      const patientsRef = collection(db, PATIENTS_COLLECTION);
      
      // Generate patient ID if not provided
      const patientId = patientData.patientId || `PAT-${Date.now()}`;
      
      const newPatientData = cleanFirestoreData({
        ...patientData,
        patientId,
        registeredDate: patientData.registeredDate || new Date().toISOString().split('T')[0],
        avatarColor: patientData.avatarColor || getRandomMedicalColor(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

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
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, id);
      const updateData = cleanFirestoreData({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(docRef, updateData);
      
      // Return updated patient
      const updatedSnapshot = await getDoc(docRef);
      const patient = convertDocToPatient(updatedSnapshot);
      if (!patient) {
        throw new Error('Failed to retrieve updated patient');
      }
      return patient;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw new Error('Failed to update patient in Firestore', { cause: error });
    }
  },

  // Delete patient
  async deletePatient(id: string): Promise<boolean> {
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
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
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    try {
      const patientsRef = collection(db, PATIENTS_COLLECTION);
      
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
      const q = constraints.length > 0 ? query(patientsRef, ...constraints) : patientsRef;
      
      const snapshot = await getDocs(q);
      let patients = snapshot.docs.map(convertDocToPatient).filter((p): p is Patient => p !== null);
      
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
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
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

  // ───────────────────────────────────────────────────
  // ANALYTIC TYPES CRUD
  // ───────────────────────────────────────────────────

  async getAllAnalyticTypes(): Promise<AnalyticType[]> {
    if (!db) throw new Error('Firestore is not initialized');
    await migrateAnalyticHierarchy();
    try {
      const ref = collection(db, ANALYTIC_TYPES_COLLECTION);
      const q = query(ref, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => {
        const data = d.data();
        return { id: d.id, ...data } as AnalyticType;
      });
    } catch (error) {
      console.error('Error fetching analytic types:', error);
      throw new Error('Failed to fetch analytic types from Firestore', { cause: error });
    }
  },

  async createAnalyticType(data: AnalyticTypeFormData): Promise<AnalyticType> {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const ref = collection(db, ANALYTIC_TYPES_COLLECTION);
      const newData = cleanFirestoreData({
        ...data,
        ...typeMigration(data as AnalyticType),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const docRef = await addDoc(ref, newData);
      return { id: docRef.id, ...newData } as AnalyticType;
    } catch (error) {
      console.error('Error creating analytic type:', error);
      throw new Error('Failed to create analytic type in Firestore', { cause: error });
    }
  },

  async updateAnalyticType(id: string, updates: Partial<AnalyticTypeFormData>): Promise<AnalyticType> {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const docRef = doc(db, ANALYTIC_TYPES_COLLECTION, id);
      const updateData = cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() });
      await updateDoc(docRef, updateData);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) throw new Error('Analytic type not found after update');
      return { id: snapshot.id, ...snapshot.data() } as AnalyticType;
    } catch (error) {
      console.error('Error updating analytic type:', error);
      throw new Error('Failed to update analytic type in Firestore', { cause: error });
    }
  },

  async deleteAnalyticType(id: string): Promise<boolean> {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const docRef = doc(db, ANALYTIC_TYPES_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting analytic type:', error);
      throw new Error('Failed to delete analytic type from Firestore', { cause: error });
    }
  },

  // ───────────────────────────────────────────────────
  // ANALYTIC RESULTS CRUD
  // ───────────────────────────────────────────────────

  async getResultsByPatientId(patientId: string): Promise<AnalyticResult[]> {
    if (!db) throw new Error('Firestore is not initialized');
    await migrateAnalyticHierarchy();
    try {
      const ref = collection(db, ANALYTIC_RESULTS_COLLECTION);
      const q = query(ref, where('patientId', '==', patientId));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AnalyticResult));
      return list.sort((a, b) => {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateB.localeCompare(dateA);
      });
    } catch (error) {
      console.error('Error fetching analytic results:', error);
      throw new Error('Failed to fetch analytic results from Firestore', { cause: error });
    }
  },

  async createAnalyticResults(entries: AnalyticResultFormData[]): Promise<void> {
    if (!db) throw new Error('Firestore is not initialized');
    if (!entries.length) return;
    if (entries.length > 499) throw new Error('Save at most 499 panels at a time.');
    const visitId = entries[0]?.visitId;
    if (!visitId || entries.some(entry => entry.visitId !== visitId || entry.patientId !== entries[0].patientId)) throw new Error('Choose one lab visit for these results.');
    const visitRef = doc(db, LAB_VISITS_COLLECTION, visitId);
    const refs = entries.map(() => doc(collection(db!, ANALYTIC_RESULTS_COLLECTION)));
    await runTransaction(db, async transaction => {
      const visit = await transaction.get(visitRef);
      if (!visit.exists() || visit.data().patientId !== entries[0].patientId) throw new Error('The selected visit does not belong to this patient.');
      if (!['Open', 'New', 'In Lab', 'Pending Results'].includes(visit.data().status)) throw new Error('Change the visit to In Lab or Pending Results before adding results.');
      const assigned = visit.data().assignedAnalytics as AnalyticType[] | undefined;
      if (assigned?.length && entries.some(entry => !assigned.some(type => type.id === entry.analyticTypeId))) throw new Error('Results must belong to the analytic types assigned to this visit.');
      const timestamp = new Date().toISOString();
      entries.forEach((data, index) => transaction.set(refs[index], cleanFirestoreData({ ...data, schemaVersion: 2, createdAt: timestamp })));
      // Ordered panels were charged when the visit was created. Recording or
      // repeating their results must not charge the patient a second time.
      const cents = assigned?.length ? resultPriceCents(visit.data().totalAmount) : entries.reduce((sum, entry) => sum + resultPriceCents(entry.price), resultPriceCents(visit.data().totalAmount));
      transaction.update(visitRef, { totalAmount: cents / 100, updatedAt: timestamp });
    });
  },

  async createAnalyticResult(data: AnalyticResultFormData): Promise<AnalyticResult> {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const ref = collection(db, ANALYTIC_RESULTS_COLLECTION);
      const cleaned = cleanFirestoreData({
        ...data,
        notes: data.notes ?? '',
        createdAt: new Date().toISOString(),
      });
      const docRef = await addDoc(ref, cleaned);
      return { id: docRef.id, ...cleaned } as AnalyticResult;
    } catch (error) {
      console.error('Error creating analytic result:', error);
      throw new Error('Failed to create analytic result in Firestore', { cause: error });
    }
  },

  async deleteAnalyticResult(id: string): Promise<boolean> {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const docRef = doc(db, ANALYTIC_RESULTS_COLLECTION, id);
      await runTransaction(db, async transaction => {
        const result = await transaction.get(docRef);
        if (!result.exists()) return;
        const visitId = result.data().visitId;
        const visitRef = visitId ? doc(db!, LAB_VISITS_COLLECTION, visitId) : null;
        const visit = visitRef ? await transaction.get(visitRef) : null;
        transaction.delete(docRef);
        if (visit?.exists() && visitRef) transaction.update(visitRef, {
          totalAmount: visit.data().assignedAnalytics?.length ? resultPriceCents(visit.data().totalAmount) / 100 : Math.max(0, resultPriceCents(visit.data().totalAmount) - resultPriceCents(result.data().price)) / 100,
          updatedAt: new Date().toISOString(),
        });
      });
      return true;
    } catch (error) {
      console.error('Error deleting analytic result:', error);
      throw new Error('Failed to delete analytic result from Firestore', { cause: error });
    }
  },

  async migrateAnalyticTypes(types: AnalyticType[]) {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const database = db;
      await runTransaction(database, async transaction => {
        const refs = types.map(type => doc(database, ANALYTIC_TYPES_COLLECTION, type.id));
        const snapshots = await Promise.all(refs.map(ref => transaction.get(ref)));
        for (let index = 0; index < types.length; index++) {
          if (snapshots[index].exists()) continue;
          const type = types[index];
          transaction.set(refs[index], { ...type, ...typeMigration(type), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
      });
      return { success: true, count: types.length };
    } catch (error) {
      console.error('Error migrating analytic types:', error);
      throw new Error('Failed to migrate analytic types to Firestore', { cause: error });
    }
  },

  // ───────────────────────────────────────────────────
  // STAFF / USERS CRUD
  // ───────────────────────────────────────────────────

  async getAllStaff(): Promise<MedicalStaff[]> {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const staffRef = collection(db, STAFF_COLLECTION);
      const snapshot = await getDocs(staffRef);
      return snapshot.docs.map(convertDocToStaff).filter((s): s is MedicalStaff => s !== null);
    } catch (error) {
      console.error('Error fetching staff from Firestore:', error);
      throw new Error('Failed to fetch staff from Firestore', { cause: error });
    }
  },

  async getStaffById(id: string): Promise<MedicalStaff | undefined> {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const docRef = doc(db, STAFF_COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return undefined;
      const staff = convertDocToStaff(snapshot);
      return staff || undefined;
    } catch (error) {
      console.error('Error fetching staff by id:', error);
      throw new Error('Failed to fetch staff from Firestore', { cause: error });
    }
  },

  async createStaff(formData: StaffFormData, creatorName: string = 'Admin'): Promise<MedicalStaff> {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const staffRef = collection(db, STAFF_COLLECTION);
      const now = new Date();
      const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const newStaffData = cleanFirestoreData({
        ...formData,
        staffId: formData.staffId || `BKL-${1000 + Math.floor(Math.random() * 9000)}`,
        joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
        avatarColor: formData.avatarColor || getRandomMedicalColor(),
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            action: 'Staff Account Created',
            performedBy: creatorName,
            timestamp: timestampStr,
            details: `Account enrolled in ${formData.department} as ${formData.roleTitle}.`,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const docRef = await addDoc(staffRef, newStaffData);
      return {
        id: docRef.id,
        ...newStaffData,
      } as MedicalStaff;
    } catch (error) {
      console.error('Error creating staff in Firestore:', error);
      throw new Error('Failed to create staff in Firestore', { cause: error });
    }
  },

  async updateStaff(id: string, updates: Partial<StaffFormData>, modifierName: string = 'Admin'): Promise<MedicalStaff> {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const docRef = doc(db, STAFF_COLLECTION, id);
      const existingSnap = await getDoc(docRef);
      if (!existingSnap.exists()) {
        throw new Error(`Staff with id "${id}" not found.`);
      }
      const current = existingSnap.data() as MedicalStaff;

      const now = new Date();
      const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const newAuditLog = {
        id: `log-${Date.now()}`,
        action: 'Staff Record Modified',
        performedBy: modifierName,
        timestamp: timestampStr,
        details: 'Staff record updated.',
      };

      const updateData = cleanFirestoreData({
        ...updates,
        auditLogs: [newAuditLog, ...(current.auditLogs || [])],
        updatedAt: new Date().toISOString(),
      });

      await updateDoc(docRef, updateData);
      const updatedSnap = await getDoc(docRef);
      const updatedStaff = convertDocToStaff(updatedSnap);
      if (!updatedStaff) throw new Error('Failed to retrieve updated staff');
      return updatedStaff;
    } catch (error) {
      console.error('Error updating staff in Firestore:', error);
      throw new Error('Failed to update staff in Firestore', { cause: error });
    }
  },

  async deleteStaff(id: string): Promise<boolean> {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const docRef = doc(db, STAFF_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting staff from Firestore:', error);
      throw new Error('Failed to delete staff from Firestore', { cause: error });
    }
  },

  async filterStaff(options: StaffFilterOptions): Promise<{ data: MedicalStaff[]; total: number; totalPages: number }> {
    try {
      let list = await this.getAllStaff();

      if (options.search.trim()) {
        const q = options.search.toLowerCase().trim();
        list = list.filter(
          (u) =>
            u.name?.toLowerCase().includes(q) ||
            u.staffId?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.specialization?.toLowerCase().includes(q) ||
            u.licenseNumber?.toLowerCase().includes(q) ||
            u.department?.toLowerCase().includes(q)
        );
      }

      if (options.department !== 'ALL') {
        list = list.filter((u) => u.department === options.department);
      }

      if (options.role !== 'ALL') {
        list = list.filter((u) => u.role === options.role);
      }

      if (options.status !== 'ALL') {
        list = list.filter((u) => u.status === options.status);
      }

      list.sort((a, b) => {
        const valA = (a[options.sortBy] || '').toString();
        const valB = (b[options.sortBy] || '').toString();
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
    } catch (error) {
      console.error('Error filtering staff in Firestore:', error);
      throw new Error('Failed to filter staff in Firestore', { cause: error });
    }
  },

  async getStaffStats() {
    try {
      const staff = await this.getAllStaff();
      return {
        totalStaff: staff.length,
        activeStaff: staff.filter((u) => u.status === 'Active').length,
        onLeave: staff.filter((u) => u.status === 'On Leave').length,
        admins: staff.filter((u) => u.role === 'ADMIN').length,
        inTraining: staff.filter((u) => u.status === 'In Training').length,
      };
    } catch (error) {
      console.error('Error getting staff stats:', error);
      throw new Error('Failed to get staff stats from Firestore', { cause: error });
    }
  },

  async migrateStaff(staffList: MedicalStaff[]) {
    if (!db) throw new Error('Firestore is not initialized');
    try {
      const ref = collection(db, STAFF_COLLECTION);
      const batch = staffList.map(async (s) => {
        const data = { ...s, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        return addDoc(ref, data);
      });
      await Promise.all(batch);
      return { success: true, count: staffList.length };
    } catch (error) {
      console.error('Error migrating staff to Firestore:', error);
      throw new Error('Failed to migrate staff to Firestore', { cause: error });
    }
  },
};

export const FirestoreService = trackServiceRequests(firestoreService);
