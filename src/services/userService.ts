import type { MedicalStaff, StaffFormData, StaffFilterOptions, UserStatus } from '../types/user';
import { StorageService } from './storage';

export const UserService = {
  getAllUsers(): MedicalStaff[] {
    return StorageService.getStaffData();
  },

  getUserById(id: string): MedicalStaff | undefined {
    const users = this.getAllUsers();
    return users.find((u) => u.id === id);
  },

  createUser(formData: StaffFormData, creatorName: string = 'Admin'): MedicalStaff {
    const users = this.getAllUsers();

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

  updateUser(id: string, updates: Partial<StaffFormData>, modifierName: string = 'Admin'): MedicalStaff {
    const users = this.getAllUsers();
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

  deleteUser(id: string): boolean {
    const users = this.getAllUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) return false;
    StorageService.saveStaffData(filtered);
    return true;
  },

  toggleUserStatus(id: string, modifierName: string = 'Admin'): MedicalStaff {
    const user = this.getUserById(id);
    if (!user) throw new Error('User not found');

    const nextStatus: UserStatus = user.status === 'Active' ? 'On Leave' : 'Active';
    return this.updateUser(
      id,
      { status: nextStatus },
      modifierName
    );
  },

  filterUsers(options: StaffFilterOptions): { data: MedicalStaff[]; total: number; totalPages: number } {
    let list = this.getAllUsers();

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

  getStats() {
    const users = this.getAllUsers();
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
