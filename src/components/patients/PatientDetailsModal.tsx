import React from 'react';
import type { Patient } from '../../types/patient';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onEdit?: (patient: Patient) => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  isOpen,
  onClose,
  patient,
  onEdit,
}) => {
  if (!patient) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-3">
          <div
            className="user-details-avatar"
            style={{ backgroundColor: patient.avatarColor || 'var(--brand-primary)' }}
          >
            {patient.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h3 className="modal-title">{patient.name}</h3>
          </div>
        </div>
      }
      subtitle={`Patient Intake Dossier • ID: ${patient.patientId}`}
      footer={
        <div className="modal-footer-actions">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && <Button
            type="button"
            variant="medical"
            onClick={() => {
              onClose();
              onEdit(patient);
            }}
            leftIcon={<Icons.Edit size={16} />}
          >
            Edit Record
          </Button>}
        </div>
      }
    >
      <div className="staff-dossier-grid">
        <div className="dossier-top-bar patient-dossier-top-bar">
          <div className="dossier-tag">
            <span className="tag-title">Age</span>
            <span className="tag-val font-bold">{patient.age} Years Old</span>
          </div>
          <div className="dossier-tag">
            <span className="tag-title">Phone Number</span>
            <span className="tag-val font-mono text-teal font-bold">{patient.phone}</span>
          </div>
          <div className="dossier-tag">
            <span className="tag-title">Patient ID</span>
            <span className="tag-val font-mono">{patient.patientId}</span>
          </div>
        </div>

        <div className="dossier-sections-grid">
          <div className="dossier-card">
            <h4 className="dossier-card-title">
              <Icons.User size={16} />
              <span>Demographics & Contact</span>
            </h4>
            <div className="dossier-kv-list">
              <div className="kv-row">
                <span className="kv-key">Full Name:</span>
                <span className="kv-value font-semibold">{patient.name}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Age:</span>
                <span className="kv-value">{patient.age} yrs</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Gender:</span>
                <span className="kv-value">{patient.gender || 'Unspecified'}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Phone:</span>
                <span className="kv-value">{patient.phone}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Registered:</span>
                <span className="kv-value">{patient.registeredDate}</span>
              </div>
            </div>
          </div>

          <div className="dossier-card">
            <h4 className="dossier-card-title">
              <Icons.Info size={16} />
              <span>Laboratory Notes</span>
            </h4>
            <p className="text-sm text-muted">
              {patient.notes || 'No special clinical notes recorded for this patient intake.'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
