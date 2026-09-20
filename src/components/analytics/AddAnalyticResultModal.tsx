import React, { useState, useEffect } from 'react';
import type { Patient } from '../../types/patient';
import type { AnalyticType, AnalyticResultFormData } from '../../types/analyticType';
import { AnalyticResultService } from '../../services/analyticResultService';
import { prefillAnalyticResults, type AnalyticResultEntry } from '../../services/analyticResultPrefill';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { AnalyticValueInput } from './AnalyticValueInput';
import { hasAnalyticResultValue } from '../../services/analyticValues';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';
import './AddAnalyticResultModal.css';

interface AddAnalyticResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  visitId?: string;
  assignedAnalytics?: AnalyticType[];
  onSuccess?: () => void;
}

export const AddAnalyticResultModal: React.FC<AddAnalyticResultModalProps> = ({
  isOpen,
  onClose,
  patient,
  visitId,
  assignedAnalytics,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();
  const [entries, setEntries] = useState<AnalyticResultEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isOpen || !patient) return;
    let active = true;
    const types = assignedAnalytics ?? [];
    setEntries([]);
    setLoadError('');
    setLoadingResults(false);
    if (!types.length) return;
    setLoadingResults(true);
    AnalyticResultService.getByPatientId(patient.id)
      .then(results => { if (active) setEntries(prefillAnalyticResults(types, results, visitId)); })
      .catch(() => { if (active) setLoadError('Could not load saved results. Close and reopen this dialog to retry.'); })
      .finally(() => { if (active) setLoadingResults(false); });
    return () => { active = false; };
  }, [isOpen, patient?.id, visitId, assignedAnalytics]);

  const updateEntry = (idx: number, field: 'result' | 'notes' | 'generalComment', value: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    );
  };

  const handleSubmit = async () => {
    if (saving || loadingResults || loadError) return;
    if (!patient) return;
    if (entries.length === 0) {
      toastError('No Tests Assigned', 'Assign analytic types before recording results.');
      return;
    }

    setSaving(true);
    try {
      const results = entries.map(entry => {
        const data: AnalyticResultFormData = {
          patientId: patient.id,
          visitId,
          analyticTypeId: entry.analyticTypeId,
          analyticTypeName: entry.analyticTypeName,
          price: entry.price,
          result: '',
          children: entry.children.map(child => ({ ...child, result: child.result.trim(), ...(child.absoluteResult !== undefined ? { absoluteResult: child.absoluteResult.trim() } : {}) })),
          schemaVersion: 2,
          notes: entry.notes?.trim() || '',
          generalComment: entry.generalComment.trim(),
        };
        return data;
      });
      await AnalyticResultService.createMany(results);
      success(
        'Results Saved',
        `${entries.length} analytic result(s) recorded for ${patient.name}.`
      );
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save results.';
      toastError('Save Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  if (!patient) return null;

  const totalFields = entries.reduce((count, entry) => count + entry.children.length, 0);
  const completedFields = entries.reduce((count, entry) => count + entry.children.filter(hasAnalyticResultValue).length, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!saving) onClose(); }}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2">
          <Icons.ClipboardList size={22} className="text-teal" />
          <span>Add Analytic Results</span>
        </div>
      }
      subtitle={`Recording test results for ${patient.name} (${patient.patientId})`}
      footer={
        <div className="modal-footer-actions result-modal-footer">
          <div className="result-modal-footer-summary" aria-live="polite">
            <strong>{completedFields} of {totalFields} child results entered</strong>
            <span>{entries.length} test group{entries.length === 1 ? '' : 's'}</span>
          </div>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="medical"
            onClick={handleSubmit}
            isLoading={saving}
            disabled={saving || loadingResults || !!loadError || entries.length === 0}
            leftIcon={<Icons.Check size={16} />}
          >
            Save Results ({entries.length})
          </Button>
        </div>
      }
    >
      <div className="user-form-grid result-modal-content">
        {loadingResults ? (
          <p role="status" className="text-sm text-muted">Loading saved results…</p>
        ) : loadError ? (
          <p role="alert" className="text-sm text-danger">{loadError}</p>
        ) : entries.length === 0 && (
          <div className="result-empty-state">
            <Icons.ClipboardList size={26} />
            <strong>No analytic types assigned</strong>
            <span>Assign analytic types to the visit before recording results.</span>
          </div>
        )}
        {entries.length > 0 && (
          <>
            <div className="form-section-title result-section-title">
              <Icons.TestTube size={16} />
              <span>Enter Results</span>
              <span className="result-section-count">{completedFields} of {totalFields} entered</span>
            </div>

            <div className="result-entry-list">
              {entries.map((entry, idx) => (
                <div
                  key={entry.analyticTypeId}
                  className="result-entry-card"
                >
                  <div
                    className="result-entry-header"
                  >
                    <div>
                      <span className="font-semibold text-sm text-main">{entry.analyticTypeName}</span>
                      <span className="result-entry-progress">{entry.children.filter(hasAnalyticResultValue).length} of {entry.children.length} entered</span>
                    </div>
                  </div>
                  <div className="result-entry-body">
                    <div className="result-entry-fields">
                      {entry.children.map((child, childIndex) => (
                        <div key={child.id}>
                          {child.section && (childIndex === 0 || entry.children[childIndex - 1].section !== child.section) && <h4 className="result-subsection">{child.section}</h4>}
                          <AnalyticValueInput child={child} prefix={`result-${entry.analyticTypeId}`} disabled={saving}
                            onChange={updates => setEntries(prev => prev.map((item, i) => i === idx ? { ...item, children: item.children.map(test => test.id === child.id ? { ...test, ...updates } : test) } : item))} />
                        </div>
                      ))}
                    </div>
                    <div className="result-entry-comment">
                      <label className="form-label" htmlFor={`comment-${entry.analyticTypeId}`}>General comment for this group</label>
                      <textarea className="form-input" id={`comment-${entry.analyticTypeId}`} rows={3} disabled={saving}
                        placeholder="Optional report comment" value={entry.generalComment}
                        onChange={event => updateEntry(idx, 'generalComment', event.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
