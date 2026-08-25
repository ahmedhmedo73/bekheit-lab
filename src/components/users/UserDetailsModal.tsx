import React from 'react';
import type { MedicalStaff } from '../../types/user';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StatusBadge, RoleBadge } from '../common/Badge';
import { Icons } from '../common/Icons';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: MedicalStaff | null;
  onEdit: (staff: MedicalStaff) => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  staff,
  onEdit,
}) => {
  if (!staff) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-3">
          <div
            className="user-details-avatar"
            style={{ backgroundColor: staff.avatarColor || '#0284c7' }}
          >
            {staff.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h3 className="modal-title">{staff.name}</h3>
            <span className="text-muted text-sm">{staff.roleTitle}</span>
          </div>
        </div>
      }
      subtitle={`LIMS Personnel Dossier • ID: ${staff.staffId}`}
      footer={
        <div className="modal-footer-actions">
          <Button type="button" variant="outline" onClick={onClose}>
            Close Dossier
          </Button>
          <Button
            type="button"
            variant="medical"
            onClick={() => {
              onClose();
              onEdit(staff);
            }}
            leftIcon={<Icons.Edit size={16} />}
          >
            Edit Record
          </Button>
        </div>
      }
    >
      <div className="staff-dossier-grid">
        {/* Status & Credential Highlights Banner */}
        <div className="dossier-top-bar">
          <div className="dossier-tag">
            <span className="tag-title">Status</span>
            <StatusBadge status={staff.status} />
          </div>
          <div className="dossier-tag">
            <span className="tag-title">Clinical Role</span>
            <RoleBadge role={staff.role} />
          </div>
          <div className="dossier-tag">
            <span className="tag-title">Syndicate License</span>
            <span className="tag-val font-mono text-teal font-bold">{staff.licenseNumber}</span>
          </div>
          <div className="dossier-tag">
            <span className="tag-title">Active Shift</span>
            <span className="tag-val">{staff.shift}</span>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="dossier-sections-grid">
          {/* Column 1: Contact & Department Assignment */}
          <div className="dossier-card">
            <h4 className="dossier-card-title">
              <Icons.Building size={16} />
              <span>Department & Contact</span>
            </h4>
            <div className="dossier-kv-list">
              <div className="kv-row">
                <span className="kv-key">Department:</span>
                <span className="kv-value font-semibold">{staff.department}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Specialization:</span>
                <span className="kv-value">{staff.specialization}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Official Email:</span>
                <a href={`mailto:${staff.email}`} className="kv-value text-teal underline">
                  {staff.email}
                </a>
              </div>
              <div className="kv-row">
                <span className="kv-key">Direct Telephone:</span>
                <span className="kv-value">{staff.phone}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Enrollment Date:</span>
                <span className="kv-value">{staff.joinDate}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Clinical Clearance & Authorized Tests */}
          <div className="dossier-card">
            <h4 className="dossier-card-title">
              <Icons.Award size={16} />
              <span>Accreditation & Authorized Testing</span>
            </h4>
            {staff.testsAuthorized && staff.testsAuthorized.length > 0 ? (
              <div className="authorized-tests-pills">
                {staff.testsAuthorized.map((t, idx) => (
                  <span key={idx} className="test-auth-pill">
                    <Icons.Check size={12} className="text-teal" />
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm italic">Standard diagnostic tests in {staff.department}.</p>
            )}

            {staff.notes && (
              <div className="dossier-notes-box">
                <span className="notes-box-header">Biosafety & Clearance Notes:</span>
                <p className="notes-box-content">{staff.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Audit Log / Activity Trail */}
        <div className="dossier-card mt-3">
          <h4 className="dossier-card-title">
            <Icons.Activity size={16} />
            <span>LIMS Audit Log & Historical Trail</span>
          </h4>
          {staff.auditLogs && staff.auditLogs.length > 0 ? (
            <div className="audit-timeline">
              {staff.auditLogs.map((log) => (
                <div key={log.id} className="audit-entry">
                  <div className="audit-dot" />
                  <div className="audit-meta">
                    <span className="audit-action">{log.action}</span>
                    <span className="audit-time">{log.timestamp}</span>
                  </div>
                  <p className="audit-details">{log.details}</p>
                  <span className="audit-author">By: {log.performedBy}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm italic py-2">No historical modification logs recorded yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
};
