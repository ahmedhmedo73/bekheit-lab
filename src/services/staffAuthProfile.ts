import type { AuthUser } from '../types/auth';
import type { MedicalStaff } from '../types/user';

export function staffAuthProfile(staff: MedicalStaff[], email: string | null): AuthUser | null {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return null;
  const match = staff.find(person => person.email.trim().toLowerCase() === normalizedEmail);
  if (!match || match.status === 'Suspended') return null;
  return {
    id: match.id,
    name: match.name,
    email: match.email,
    role: match.role,
    roleTitle: match.roleTitle,
    department: match.department,
    staffId: match.staffId,
    licenseNumber: match.licenseNumber,
    shift: match.shift,
    lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
