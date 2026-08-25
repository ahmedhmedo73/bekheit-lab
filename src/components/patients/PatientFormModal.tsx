import React, { useState, useEffect } from 'react';
import type { Patient, PatientFormData, PatientStatus } from '../../types/patient';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PatientFormData) => void;
  editingPatient?: Patient | null;
}

const STATUSES: { value: PatientStatus; label: string }[] = [
  { value: 'Active', label: 'Active - In Processing' },
  { value: 'Pending Results', label: 'Pending Analyzer Results' },
  { value: 'Urgent / STAT', label: 'Urgent / STAT Priority' },
  { value: 'Completed', label: 'Completed & Released' },
];

const GENDERS = ['Male', 'Female', 'Other'];

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingPatient,
}) => {
  const [formData, setFormData] = useState<PatientFormData>({
    patientId: '',
    name: '',
    age: 30,
    phone: '',
    jobTitle: '',
    subtitle: '',
    gender: 'Male',
    status: 'Active',
    registeredDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingPatient) {
      setFormData({
        patientId: editingPatient.patientId,
        name: editingPatient.name,
        age: editingPatient.age,
        phone: editingPatient.phone,
        jobTitle: editingPatient.jobTitle || '',
        subtitle: editingPatient.subtitle,
        gender: editingPatient.gender || 'Male',
        status: editingPatient.status,
        registeredDate: editingPatient.registeredDate,
        notes: editingPatient.notes || '',
      });
    } else {
      setFormData({
        patientId: '',
        name: '',
        age: 30,
        phone: '',
        jobTitle: '',
        subtitle: '',
        gender: 'Male',
        status: 'Active',
        registeredDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setErrors({});
  }, [editingPatient, isOpen]);

  const handleChange = (field: keyof PatientFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (!formData.name.trim()) newErrors.name = 'Patient full name is required.';
    if (!formData.age || formData.age < 0 || formData.age > 130) {
      newErrors.age = 'Please enter a valid age (0-130).';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required.';
    if (!formData.subtitle.trim()) {
      newErrors.subtitle = 'Subtitle (diagnosis, tests, or clinical reason) is required.';
    }

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
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <Icons.UserPlus size={22} className="text-teal" />
          <span>{editingPatient ? 'Edit Patient Record' : 'Register New Patient'}</span>
        </div>
      }
      subtitle={
        editingPatient
          ? `Modifying patient intake details for ${editingPatient.name} (${editingPatient.patientId})`
          : 'Enter patient information and clinical subtitle for lab intake.'
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
            {editingPatient ? 'Save Changes' : 'Register Patient'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="user-form-grid" noValidate>
        <div className="form-section-title">
          <Icons.User size={16} />
          <span>1. Patient Primary Information</span>
        </div>

        <div className="form-row-2">
          <Input
            label="Patient Full Name"
            placeholder="e.g. Ahmed Hassan"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            leftIcon={<Icons.User size={16} />}
          />
          <Input
            label="Patient Age (Years)"
            type="number"
            placeholder="e.g. 42"
            value={formData.age}
            onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
            error={errors.age}
            required
            leftIcon={<Icons.Clock size={16} />}
          />
        </div>

        <div className="form-row-2">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. +20 100 123 4567"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            error={errors.phone}
            required
            leftIcon={<Icons.Phone size={16} />}
          />
          <Input
            label="Patient ID / MRN"
            placeholder="e.g. PAT-1025 (auto-generated if empty)"
            value={formData.patientId}
            onChange={(e) => handleChange('patientId', e.target.value)}
            helperText="Leave empty to auto-assign sequential ID"
            leftIcon={<Icons.Award size={16} />}
          />
        </div>

        <div className="form-group">
          <Input
            label="Job Title / Occupation"
            placeholder="e.g. Software Engineer, Teacher, Accountant"
            value={formData.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            leftIcon={<Icons.Award size={16} />}
          />
        </div>

        <div className="form-section-title mt-4">
          <Icons.FileText size={16} />
          <span>2. Clinical Subtitle & Test Requisition</span>
        </div>

        <div className="form-group">
          <Input
            label="Subtitle (Clinical Reason / Test Package / Diagnosis)"
            placeholder="e.g. Routine CBC & Lipid Profile / Referred by Dr. Sameh"
            value={formData.subtitle}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            error={errors.subtitle}
            required
            leftIcon={<Icons.TestTube size={16} />}
          />
        </div>

        <div className="form-row-2">
          <Select
            label="Specimen Intake Status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as PatientStatus)}
            options={STATUSES}
            required
          />
          <Select
            label="Gender"
            value={formData.gender || 'Male'}
            onChange={(e) => handleChange('gender', e.target.value)}
            options={GENDERS}
          />
        </div>

        <div className="form-group mt-2">
          <label className="form-label" htmlFor="patient-notes">Clinical Observations / Fasting Notes</label>
          <textarea
            id="patient-notes"
            className="form-textarea"
            rows={3}
            placeholder="Add any fasting status, medication notes, or priority handling flags..."
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
