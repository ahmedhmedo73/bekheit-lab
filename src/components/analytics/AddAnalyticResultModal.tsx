import React, { useState, useEffect } from 'react';
import type { Patient } from '../../types/patient';
import type { AnalyticType, AnalyticResultFormData, ChildAnalyticResult } from '../../types/analyticType';
import { analyticChildren } from '../../services/analyticSchema';
import { AnalyticTypeService } from '../../services/analyticTypeService';
import { AnalyticResultService } from '../../services/analyticResultService';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { AnalyticValueInput } from './AnalyticValueInput';
import { emptyAnalyticResult, isAnalyticResultComplete } from '../../services/analyticValues';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';

interface AddAnalyticResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  visitId?: string;
  assignedAnalytics?: AnalyticType[];
  onSuccess?: () => void;
}

interface ResultEntry {
  analyticTypeId: string;
  analyticTypeName: string;
  price: number;
  result: string;
  children: ChildAnalyticResult[];
  notes: string;
  generalComment: string;
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
  const [analyticTypes, setAnalyticTypes] = useState<AnalyticType[]>([]);
  const [entries, setEntries] = useState<ResultEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);

  useEffect(() => {
    let active = true;
    if (isOpen) {
      if (assignedAnalytics?.length) {
        setAnalyticTypes(assignedAnalytics);
        setEntries(assignedAnalytics.map(type => ({ analyticTypeId: type.id, analyticTypeName: type.name, price: type.price, result: '', children: analyticChildren(type).map(emptyAnalyticResult), notes: '', generalComment: type.generalComment ?? '' })));
        setLoadingTypes(false);
        return () => { active = false; };
      }
      setLoadingTypes(true);
      setAnalyticTypes([]);
      AnalyticTypeService.getAll().then(types => { if (active) setAnalyticTypes(types); })
        .catch(() => { if (active) toastError('Catalog Failed', 'Could not load or migrate analytic types. Reopen this dialog to retry.'); })
        .finally(() => { if (active) setLoadingTypes(false); });
      setEntries([]);
    }
    return () => { active = false; };
  }, [isOpen, toastError, assignedAnalytics]);

  const addEntry = (type: AnalyticType) => {
    // Prevent duplicates
    if (entries.find((e) => e.analyticTypeId === type.id)) return;
    setEntries((prev) => [
      ...prev,
      {
        analyticTypeId: type.id,
        analyticTypeName: type.name,
        price: type.price,
        result: '',
        children: analyticChildren(type).map(emptyAnalyticResult),
        notes: '',
        generalComment: type.generalComment ?? '',
      },
    ]);
  };

  const removeEntry = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx: number, field: 'result' | 'notes' | 'generalComment', value: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    );
  };

  const totalPrice = entries.reduce((sum, e) => sum + e.price, 0);

  const handleSubmit = async () => {
    if (saving) return;
    if (!patient) return;
    if (entries.length === 0) {
      toastError('No Tests Selected', 'Please add at least one analytic test.');
      return;
    }

    const emptyResults = entries.filter((e) => !e.children.length || e.children.some(child => !isAnalyticResultComplete(child)));
    if (emptyResults.length > 0) {
      toastError(
        'Missing Results',
        `Please enter a result value for: ${emptyResults.map((e) => e.analyticTypeName).join(', ')}`
      );
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
          children: entry.children.map(child => ({ ...child, result: child.result.trim() })),
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

  const availableTypes = analyticTypes.filter(
    (t) => !entries.find((e) => e.analyticTypeId === t.id)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!saving) onClose(); }}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <Icons.ClipboardList size={22} className="text-teal" />
          <span>Add Analytic Results</span>
        </div>
      }
      subtitle={`Recording test results for ${patient.name} (${patient.patientId})`}
      footer={
        <div className="modal-footer-actions">
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.DollarSign size={16} className="text-teal" />
            <span className="font-bold text-sm text-teal">
              Total: {totalPrice.toFixed(2)} EGP
            </span>
          </div>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="medical"
            onClick={handleSubmit}
            isLoading={saving}
            disabled={saving || loadingTypes}
            leftIcon={<Icons.Check size={16} />}
          >
            Save Results ({entries.length})
          </Button>
        </div>
      }
    >
      <div className="user-form-grid">
        {/* Available Types Selector */}
        <div className="form-section-title">
          <Icons.FlaskConical size={16} />
          <span>1. Select Analytic Tests</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          {loadingTypes && <p className="text-xs text-muted" role="status">Loading analytic groups...</p>}
          {!loadingTypes && availableTypes.length === 0 && entries.length === 0 && (
            <p className="text-xs text-muted">
              No analytic types available. Please add types in the Analytic Types catalog first.
            </p>
          )}
          {availableTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => addEntry(type)}
              disabled={saving || analyticChildren(type).length === 0}
              style={{ fontSize: '0.8rem' }}
            >
              <Icons.Plus size={14} />
              <span className="btn-label">
                {type.name} — {type.price} EGP
              </span>
            </button>
          ))}
          {availableTypes.length === 0 && entries.length > 0 && (
            <p className="text-xs text-muted">All available types have been selected.</p>
          )}
        </div>

        {/* Selected Entries */}
        {entries.length > 0 && (
          <>
            <div className="form-section-title" style={{ marginTop: '0.5rem' }}>
              <Icons.TestTube size={16} />
              <span>2. Enter Results</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {entries.map((entry, idx) => (
                <div
                  key={entry.analyticTypeId}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color, #1e293b)',
                    backgroundColor: 'var(--card-bg, rgba(15,23,42,0.5))',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div>
                      <span className="font-semibold text-sm text-main">{entry.analyticTypeName}</span>
                      <span
                        className="font-mono text-xs text-teal font-bold"
                        style={{ marginLeft: '0.5rem' }}
                      >
                        {entry.price.toFixed(2)} EGP
                      </span>
                    </div>
                    <button
                      type="button"
                      className="action-icon-btn text-danger"
                      onClick={() => removeEntry(idx)}
                      disabled={saving}
                      title="Remove this test"
                    >
                      <Icons.X size={16} />
                    </button>
                  </div>
                  <div className="form-row-2">
                    <div>
                      {entry.children.map((child, childIndex) => (
                        <div key={child.id} style={{ marginBottom: 12 }}>
                          {child.section && (childIndex === 0 || entry.children[childIndex - 1].section !== child.section) && <h4 className="form-section-title">{child.section}</h4>}
                          <AnalyticValueInput child={child} prefix={`result-${entry.analyticTypeId}`} disabled={saving}
                            onChange={updates => setEntries(prev => prev.map((item, i) => i === idx ? { ...item, children: item.children.map(test => test.id === child.id ? { ...test, ...updates } : test) } : item))} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label htmlFor={`comment-${entry.analyticTypeId}`}>General Comment for This Page / Group</label>
                      <textarea className="form-input" id={`comment-${entry.analyticTypeId}`} rows={5} style={{ width: '100%' }} disabled={saving}
                        placeholder="Enter a comment for this patient's report group" value={entry.generalComment}
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
