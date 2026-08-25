import React, { useState, useEffect } from 'react';
import type { MedicalStaff, StaffFormData, Department, UserStatus, ShiftType } from '../../types/user';
import type { UserRole } from '../../types/auth';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StaffFormData) => void;
  editingStaff?: MedicalStaff | null;
}

const DEPARTMENTS: Department[] = [
  'Hematology',
  'Clinical Biochemistry',
  'Microbiology & Parasitology',
  'Immunology & Serology',
  'Histopathology & Cytology',
  'Molecular Biology & Genetics',
  'Quality Assurance & Safety',
  'Administration',
];

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrator' },
];

const SHIFTS: ShiftType[] = [
  'Morning (07:00 - 15:30)',
  'Evening (15:00 - 23:30)',
  'Night (23:00 - 07:30)',
  'Rotating',
];

const STATUSES: UserStatus[] = ['Active', 'On Leave', 'In Training', 'Suspended'];

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingStaff,
}) => {
  const [formData, setFormData] = useState<StaffFormData>({
    staffId: '',
    name: '',
    email: '',
    phone: '',
    role: 'ADMIN',
    roleTitle: 'Laboratory Administrator',
    department: 'Clinical Biochemistry',
    specialization: '',
    licenseNumber: '',
    status: 'Active',
    shift: 'Morning (07:00 - 15:30)',
    joinDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingStaff) {
      setFormData({
        staffId: editingStaff.staffId,
        name: editingStaff.name,
        email: editingStaff.email,
        phone: editingStaff.phone,
        role: editingStaff.role,
        roleTitle: editingStaff.roleTitle,
        department: editingStaff.department,
        specialization: editingStaff.specialization,
        licenseNumber: editingStaff.licenseNumber,
        nationalId: editingStaff.nationalId || '',
        status: editingStaff.status,
        shift: editingStaff.shift,
        joinDate: editingStaff.joinDate,
        notes: editingStaff.notes || '',
      });
    } else {
      setFormData({
        staffId: '',
        name: '',
        email: '',
        phone: '',
        role: 'ADMIN',
        roleTitle: 'Laboratory Administrator',
        department: 'Clinical Biochemistry',
        specialization: 'Automated Assays & Chemistry',
        licenseNumber: '',
        status: 'Active',
        shift: 'Morning (07:00 - 15:30)',
        joinDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setErrors({});
  }, [editingStaff, isOpen]);

  const handleChange = (field: keyof StaffFormData, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-populate role title if changed
      if (field === 'role') {
        const found = ROLES.find((r) => r.value === value);
        if (found) next.roleTitle = found.label;
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Full staff member name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Staff email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid laboratory email address.';
    }

    if (!formData.phone.trim()) newErrors.phone = 'Contact phone number is required.';
    if (!formData.roleTitle.trim()) newErrors.roleTitle = 'Professional title is required.';
    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'Syndicate or Board License # is required.';
    if (!formData.specialization.trim()) newErrors.specialization = 'Clinical bench or specialization is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <Icons.UserPlus size={22} className="text-teal" />
          <span>{editingStaff ? 'Edit Staff Profile' : 'Enroll New Laboratory Staff'}</span>
        </div>
      }
      subtitle={
        editingStaff
          ? `Modifying credential record for ${editingStaff.name} (${editingStaff.staffId})`
          : 'Register clinical personnel into the Bekheit LIMS directory.'
      }
      footer={
        <div className="modal-footer-actions">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="medical"
            onClick={handleSubmit}
            leftIcon={<Icons.Check size={16} />}
          >
            {editingStaff ? 'Save Changes' : 'Register Staff Member'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="user-form-grid" noValidate>
        {/* Basic Information */}
        <div className="form-section-title">
          <Icons.User size={16} />
          <span>1. Clinical Identity & Contact Information</span>
        </div>

        <div className="form-row-2">
          <Input
            label="Full Name & Clinical Credentials"
            placeholder="e.g. Dr. Ahmed Bekheit, MD"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            leftIcon={<Icons.User size={16} />}
          />
          <Input
            label="Staff ID (LIMS Badge)"
            placeholder="e.g. BKL-1025 (auto-generated if empty)"
            value={formData.staffId}
            onChange={(e) => handleChange('staffId', e.target.value)}
            helperText="Leave empty to auto-assign next sequential ID"
            leftIcon={<Icons.Award size={16} />}
          />
        </div>

        <div className="form-row-2">
          <Input
            label="Medical Staff Email"
            type="email"
            placeholder="ahmed.bekheit@bekheitlab.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            required
            leftIcon={<Icons.Mail size={18} />}
          />
          <Input
            label="Direct Contact / Mobile #"
            placeholder="+20 100 123 4567"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={errors.phone}
            required
            leftIcon={<Icons.Phone size={16} />}
          />
        </div>

        {/* Clinical Qualifications & Syndicate License */}
        <div className="form-section-title mt-4">
          <Icons.Award size={16} />
          <span>2. Professional Credentials & Department Placement</span>
        </div>

        <div className="form-row-2">
          <Select
            label="Laboratory Role"
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value as UserRole)}
            options={ROLES}
            required
          />
          <Input
            label="Designated Role / Job Title"
            placeholder="e.g. Senior Hematologist Consultant"
            value={formData.roleTitle}
            onChange={(e) => handleChange('roleTitle', e.target.value)}
            error={errors.roleTitle}
            required
          />
        </div>

        <div className="form-row-2">
          <Select
            label="Laboratory Department / Section"
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value as Department)}
            options={DEPARTMENTS}
            required
          />
          <Input
            label="Specialization / Diagnostic Bench"
            placeholder="e.g. Coagulation & Smears, Flow Cytometry"
            value={formData.specialization}
            onChange={(e) => handleChange('specialization', e.target.value)}
            error={errors.specialization}
            required
          />
        </div>

        <div className="form-row-2">
          <Input
            label="Medical Syndicate License / Board Reg #"
            placeholder="e.g. EMS-99120-MLS"
            value={formData.licenseNumber}
            onChange={(e) => handleChange('licenseNumber', e.target.value)}
            error={errors.licenseNumber}
            required
            leftIcon={<Icons.ShieldCheck size={16} />}
          />
          <Select
            label="Working Duty Shift"
            value={formData.shift}
            onChange={(e) => handleChange('shift', e.target.value as ShiftType)}
            options={SHIFTS}
            required
          />
        </div>

        <div className="form-row-2">
          <Select
            label="Employment Status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as UserStatus)}
            options={STATUSES}
            required
          />
          <Input
            label="Enrollment / Start Date"
            type="date"
            value={formData.joinDate}
            onChange={(e) => handleChange('joinDate', e.target.value)}
            required
            leftIcon={<Icons.Calendar size={16} />}
          />
        </div>

        <div className="form-group mt-2">
          <label className="form-label" htmlFor="staff-notes">Clinical Qualifications / Biosafety Clearance Notes</label>
          <textarea
            id="staff-notes"
            className="form-textarea"
            rows={3}
            placeholder="Add relevant equipment certifications (e.g. Sysmex XN-1000 certified, PCR Biosafety Level 2 cleared, etc.)"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
