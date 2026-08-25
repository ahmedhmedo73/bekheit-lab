import React from 'react';
import type { Patient } from '../../types/patient';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patient: Patient | null;
}

export const DeletePatientModal: React.FC<DeletePatientModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  patient,
}) => {
  if (!patient) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2 text-danger">
          <Icons.ShieldAlert size={22} />
          <span>Confirm Patient Removal</span>
        </div>
      }
      footer={
        <div className="modal-footer-actions">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            leftIcon={<Icons.Trash2 size={16} />}
          >
            Delete Patient Record
          </Button>
        </div>
      }
    >
      <div className="delete-confirm-body">
        <div className="delete-warning-banner">
          <Icons.AlertCircle size={24} className="text-danger flex-shrink-0" />
          <div>
            <p className="font-semibold text-danger">Patient Record Notice</p>
            <p className="text-sm text-muted">
              Are you sure you want to delete this patient record and associated specimen requisitions?
            </p>
          </div>
        </div>

        <div className="staff-to-delete-card">
          <div className="font-bold text-base">{patient.name}</div>
          <div className="text-sm text-muted">Age: {patient.age} yrs • {patient.phone}</div>
          <div className="text-xs font-mono text-teal mt-1">
            Patient ID: {patient.patientId}
          </div>
          <div className="text-xs text-muted mt-1 italic">
            "{patient.subtitle}"
          </div>
        </div>
      </div>
    </Modal>
  );
};
