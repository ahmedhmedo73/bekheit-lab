import React from 'react';
import type { AnalyticType } from '../../types/analyticType';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';

interface DeleteAnalyticTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analyticType: AnalyticType | null;
}

export const DeleteAnalyticTypeModal: React.FC<DeleteAnalyticTypeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  analyticType,
}) => {
  if (!analyticType) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2 text-danger">
          <Icons.ShieldAlert size={22} />
          <span>Confirm Deletion</span>
        </div>
      }
      subtitle="This action is irreversible."
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
            Delete Permanently
          </Button>
        </div>
      }
    >
      <div className="delete-confirm-body">
        <p className="text-sm text-muted">
          You are about to permanently delete the analytic type:
        </p>
        <div
          className="p-3 bg-teal-light rounded-md border border-teal-subtle"
          style={{ marginTop: '0.75rem' }}
        >
          <p className="font-semibold text-sm text-main">{analyticType.name}</p>
          <p className="text-xs text-teal font-mono font-bold" style={{ marginTop: '0.25rem' }}>
            Price: {analyticType.price.toFixed(2)} EGP
          </p>
        </div>
        <p className="text-xs text-muted" style={{ marginTop: '0.75rem' }}>
          Any existing patient results referencing this type will remain unchanged.
        </p>
      </div>
    </Modal>
  );
};
