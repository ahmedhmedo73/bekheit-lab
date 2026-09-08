import type { MedicalStaff, StaffFormData, StaffFilterOptions, UserStatus } from '../types/user';
import { FirestoreService } from './firestoreService';
import { StorageService } from './storage';

// Flag to switch between localStorage and Firestore
// Set to true to use Firestore, false to use localStorage
const USE_FIRESTORE = true;

export const UserService = {
  async getAllUsers(): Promise<MedicalStaff[]> {
    if (USE_FIRESTORE) {
      try {
        const staff = await FirestoreService.getAllStaff();
        if (staff.length > 0) {
          StorageService.saveStaffData(staff);
          return staff;
        }
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }
    return StorageService.getStaffData();
  },

  async getUserById(id: string): Promise<MedicalStaff | undefined> {
    if (USE_FIRESTORE) {
      try {
        const staff = await FirestoreService.getStaffById(id);
        if (staff) return staff;
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }
    const users = StorageService.getStaffData();
    return users.find((u) => u.id === id);
  },

  async createUser(formData: StaffFormData, creatorName: string = 'Admin'): Promise<MedicalStaff> {
    if (USE_FIRESTORE) {
      try {
        const created = await FirestoreService.createStaff(formData, creatorName);
        const users = StorageService.getStaffData();
        users.unshift(created);
        StorageService.saveStaffData(users);
        return created;
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }

    const users = StorageService.getStaffData();
    const newId = `staff-${Date.now()}`;
    const nextNum = users.length + 1;
    const staffId = formData.staffId || `BKL-${1000 + nextNum}`;

    const newUser: MedicalStaff = {
      ...formData,
      id: newId,
      staffId,
      joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
      avatarColor: formData.avatarColor || getRandomMedicalColor(),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          action: 'Staff Account Created',
          performedBy: creatorName,
          timestamp: formatTimestamp(new Date()),
          details: `Account enrolled in ${formData.department} as ${formData.roleTitle}.`,
        },
      ],
    };

    users.unshift(newUser);
    StorageService.saveStaffData(users);
    return newUser;
  },

  async updateUser(id: string, updates: Partial<StaffFormData>, modifierName: string = 'Admin'): Promise<MedicalStaff> {
    if (USE_FIRESTORE) {
      try {
        const updated = await FirestoreService.updateStaff(id, updates, modifierName);
        const users = StorageService.getStaffData();
        const index = users.findIndex((u) => u.id === id);
        if (index !== -1) {
          users[index] = updated;
          StorageService.saveStaffData(users);
        }
        return updated;
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }

    const users = StorageService.getStaffData();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`Staff with id "${id}" was not found.`);
    }

    const current = users[index];
    const logDetails = generateChangeSummary(current, updates);

    const updatedUser: MedicalStaff = {
      ...current,
      ...updates,
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          action: 'Staff Record Modified',
          performedBy: modifierName,
          timestamp: formatTimestamp(new Date()),
          details: logDetails || 'Staff information details updated.',
        },
        ...(current.auditLogs || []),
      ],
    };

    users[index] = updatedUser;
    StorageService.saveStaffData(users);
    return updatedUser;
  },

  async deleteUser(id: string): Promise<boolean> {
    if (USE_FIRESTORE) {
      try {
        const success = await FirestoreService.deleteStaff(id);
        const users = StorageService.getStaffData();
        const filtered = users.filter((u) => u.id !== id);
        StorageService.saveStaffData(filtered);
        return success;
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }

    const users = StorageService.getStaffData();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) return false;
    StorageService.saveStaffData(filtered);
    return true;
  },

  async toggleUserStatus(id: string, modifierName: string = 'Admin'): Promise<MedicalStaff> {
    const user = await this.getUserById(id);
    if (!user) throw new Error('User not found');

    const nextStatus: UserStatus = user.status === 'Active' ? 'On Leave' : 'Active';
    return this.updateUser(
      id,
      { status: nextStatus },
      modifierName
    );
  },

  async filterUsers(options: StaffFilterOptions): Promise<{ data: MedicalStaff[]; total: number; totalPages: number }> {
    if (USE_FIRESTORE) {
      try {
        return await FirestoreService.filterStaff(options);
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }

    let list = StorageService.getStaffData();

    // 1. Search Query
    if (options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.staffId.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.specialization.toLowerCase().includes(q) ||
          u.licenseNumber.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
      );
    }

    // 2. Department Filter
    if (options.department !== 'ALL') {
      list = list.filter((u) => u.department === options.department);
    }

    // 3. Role Filter
    if (options.role !== 'ALL') {
      list = list.filter((u) => u.role === options.role);
    }

    // 4. Status Filter
    if (options.status !== 'ALL') {
      list = list.filter((u) => u.status === options.status);
    }

    // 5. Sorting
    list.sort((a, b) => {
      let valA: string = a[options.sortBy] || '';
      let valB: string = b[options.sortBy] || '';
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
        return await FirestoreService.getStaffStats();
      } catch (error) {
        console.warn('Firestore error, falling back to localStorage:', error);
      }
    }

    const users = StorageService.getStaffData();
    return {
      totalStaff: users.length,
      activeStaff: users.filter((u) => u.status === 'Active').length,
      onLeave: users.filter((u) => u.status === 'On Leave').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      inTraining: users.filter((u) => u.status === 'In Training').length,
    };
  },
};

function getRandomMedicalColor(): string {
  const colors = ['#0284c7', '#0d9488', '#6366f1', '#8b5cf6', '#059669', '#d97706', '#e11d48', '#3b82f6'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function formatTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

function generateChangeSummary(oldObj: MedicalStaff, newObj: Partial<StaffFormData>): string {
  const changes: string[] = [];
  if (newObj.roleTitle && newObj.roleTitle !== oldObj.roleTitle) changes.push(`Title changed to "${newObj.roleTitle}"`);
  if (newObj.department && newObj.department !== oldObj.department) changes.push(`Transferred to ${newObj.department}`);
  if (newObj.status && newObj.status !== oldObj.status) changes.push(`Status changed to ${newObj.status}`);
  if (newObj.shift && newObj.shift !== oldObj.shift) changes.push(`Shift updated to ${newObj.shift}`);
  if (newObj.phone && newObj.phone !== oldObj.phone) changes.push(`Phone updated`);
  if (newObj.licenseNumber && newObj.licenseNumber !== oldObj.licenseNumber) changes.push(`License # updated`);
  return changes.length > 0 ? changes.join(', ') : 'Updated profile properties.';
}
