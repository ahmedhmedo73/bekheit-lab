import React from 'react';
import type { MedicalStaff } from '../../types/user';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  staff: MedicalStaff | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  staff,
}) => {
  if (!staff) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2 text-danger">
          <Icons.ShieldAlert size={22} />
          <span>Confirm Personnel De-Registration</span>
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
            Permanently Remove Staff
          </Button>
        </div>
      }
    >
      <div className="delete-confirm-body">
        <div className="delete-warning-banner">
          <Icons.AlertCircle size={24} className="text-danger flex-shrink-0" />
          <div>
            <p className="font-semibold text-danger">Laboratory Regulatory Notice</p>
            <p className="text-sm text-muted">
              Removing this account will revoke laboratory system access and release all assigned test sign-off authorizations.
            </p>
          </div>
        </div>

        <div className="staff-to-delete-card">
          <div className="font-bold text-base">{staff.name}</div>
          <div className="text-sm text-muted">{staff.roleTitle}</div>
          <div className="text-xs font-mono text-teal mt-1">
            Staff ID: {staff.staffId} • {staff.department}
          </div>
        </div>

        <p className="text-sm text-muted mt-3">
          Are you sure you want to proceed? Historical audit logs with this staff ID will be archived for ISO 15189 compliance.
        </p>
      </div>
    </Modal>
  );
};
