import type { MedicalStaff, StaffFormData, StaffFilterOptions, UserStatus } from '../types/user';
import { FirestoreService } from './firestoreService';

// Staff records control access to the application, so Firestore failures must
// never be hidden by a browser-local copy of a profile or status change.
export const UserService = {
  getAllUsers(): Promise<MedicalStaff[]> {
    return FirestoreService.getAllStaff();
  },

  getUserById(id: string): Promise<MedicalStaff | undefined> {
    return FirestoreService.getStaffById(id);
  },

  createUser(formData: StaffFormData, creatorName = 'Admin'): Promise<MedicalStaff> {
    return FirestoreService.createStaff(formData, creatorName);
  },

  updateUser(id: string, updates: Partial<StaffFormData>, modifierName = 'Admin'): Promise<MedicalStaff> {
    return FirestoreService.updateStaff(id, updates, modifierName);
  },

  deleteUser(id: string): Promise<boolean> {
    return FirestoreService.deleteStaff(id);
  },

  async toggleUserStatus(id: string, modifierName = 'Admin'): Promise<MedicalStaff> {
    const user = await this.getUserById(id);
    if (!user) throw new Error('User not found');
    const nextStatus: UserStatus = user.status === 'Active' ? 'On Leave' : 'Active';
    return this.updateUser(id, { status: nextStatus }, modifierName);
  },

  filterUsers(options: StaffFilterOptions): Promise<{ data: MedicalStaff[]; total: number; totalPages: number }> {
    return FirestoreService.filterStaff(options);
  },

  getStats() {
    return FirestoreService.getStaffStats();
  },
};
