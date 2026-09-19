import { flaggedResult } from '../../services/resultFlag';
import React, { useState, useEffect } from 'react';
import type { Patient } from '../../types/patient';
import type { AnalyticResult } from '../../types/analyticType';
import { AnalyticResultService } from '../../services/analyticResultService';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';
import { CollapsibleRow } from '../common/CollapsibleRow';
import { buildAnalyticReport, latestPanelResults } from '../../services/analyticReport';
import { resultMigration } from '../../services/analyticSchema';
import { selectedResultTotal, resultPriceCents, togglePrintResult } from '../../services/printSelection';
import { useToast } from '../../context/ToastContext';


interface PatientResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  visitId?: string;
}

export const PatientResultsModal: React.FC<PatientResultsModalProps> = ({
  isOpen,
  onClose,
  patient,
  visitId,
}) => {
  const [results, setResults] = useState<AnalyticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingResult, setDeletingResult] = useState<AnalyticResult | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    let active = true;
    if (isOpen && patient) {
      setLoading(true);
      setResults([]);
      setSelectedIds([]);
      setLoadError('');
      setDeletingResult(null);
      AnalyticResultService.getByPatientId(patient.id)
        .then(data => {
          if (!active) return;
          if (visitId) data = data.filter(result => result.visitId === visitId);
          setResults(data);
          setSelectedIds(latestPanelResults(data).map(result => result.id));
        })
        .catch(() => { if (active) setLoadError('Could not load results. Please retry.'); })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [isOpen, patient, visitId, refreshKey]);

  if (!patient) return null;

  const selectedResults = results.filter(result => selectedIds.includes(result.id));
  const totalPrice = selectedResultTotal(selectedResults);
  const latestIds = new Set(latestPanelResults(results).map(result => result.id));

  const handleDelete = async () => {
    if (!deletingResult || deleting) return;
    setDeleting(true);
    try {
      const removed = await AnalyticResultService.delete(deletingResult.id);
      if (!removed) throw new Error('The result was not deleted.');
      setResults(previous => previous.filter(result => result.id !== deletingResult.id));
      setSelectedIds(previous => previous.filter(id => id !== deletingResult.id));
      setDeletingResult(null);
      success('Result Deleted', 'The saved analytic result has been removed.');
    } catch (error) {
      toastError('Delete Failed', error instanceof Error ? error.message : 'Could not delete the result.');
    } finally { setDeleting(false); }
  };

  const handlePrint = async (watermark: boolean) => {
    if (loading || deleting || printing || selectedResults.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toastError('Popup Blocked', 'Allow popups for this website to print the report.');
      return;
    }
    setPrinting(true);
    try {
      const logoUrl = new URL(`${import.meta.env.BASE_URL}bakhet-logo.png`, window.location.origin).href;
      printWindow.document.write(buildAnalyticReport(patient, selectedResults, { logoUrl, watermark }));
      printWindow.document.close();
      await Promise.all(Array.from(printWindow.document.images, image => image.decode()));
      await printWindow.document.fonts.ready;
      if (!printWindow.closed) {
        printWindow.focus();
        printWindow.print();
      }
    } catch {
      toastError('Print Failed', 'Could not prepare the report logo. Please retry printing.');
    } finally { setPrinting(false); }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!deleting) onClose(); }}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2">
          <Icons.ClipboardList size={22} className="text-teal" />
          <span>Analytic Results</span>
        </div>
      }
      subtitle={`Viewing test results for ${patient.name} (${patient.patientId})`}
      footer={
        <div className="modal-footer-actions" style={{ flexWrap: 'wrap' }}>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.DollarSign size={16} className="text-teal" />
            <span className="font-bold text-sm text-teal">
              Selected Total: {totalPrice.toFixed(2)} EGP
            </span>
          </div>
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handlePrint(false)}
            disabled={loading || deleting || printing || selectedResults.length === 0}
            leftIcon={<Icons.Printer size={16} />}
          >
            Print White ({selectedResults.length})
          </Button>
          <Button
            type="button"
            variant="medical"
            onClick={() => handlePrint(true)}
            disabled={loading || deleting || printing || selectedResults.length === 0}
            leftIcon={<Icons.Printer size={16} />}
          >
            Print with Watermark ({selectedResults.length})
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center gap-3" style={{ padding: '2rem', justifyContent: 'center' }}>
          <div className="btn-spinner" style={{ width: 24, height: 24 }} />
          <span className="text-sm text-muted">Loading results…</span>
        </div>
      ) : loadError ? (
        <div role="alert"><p>{loadError}</p><Button type="button" onClick={() => setRefreshKey(key => key + 1)}>Retry</Button></div>
      ) : results.length === 0 ? (
        <div className="empty-state-box" style={{ padding: '2rem' }}>
          <div className="empty-icon-wrap">
            <Icons.ClipboardList size={36} className="text-muted" />
          </div>
          <h4 className="empty-title">No Results Recorded</h4>
          <p className="empty-desc">
            No analytic results have been recorded for this patient yet.
          </p>
        </div>
      ) : (
        <>
        <p className="text-sm text-muted">Select the analytics to print. One result per analytic can be selected; the latest is selected by default. Uncheck a result to remove it from this printout.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Button type="button" variant="outline" size="sm" disabled={deleting} onClick={() => setSelectedIds(latestPanelResults(results).map(result => result.id))}>Select Latest</Button>
          <Button type="button" variant="outline" size="sm" disabled={deleting} onClick={() => setSelectedIds([])}>Clear Selection</Button>
        </div>
        {deletingResult && <div role="alert" style={{ padding: 16, marginBottom: 16, border: '1px solid #dc2626', borderRadius: 8 }}>
          <p>Delete the saved result for <strong>{deletingResult.analyticTypeName}</strong>{deletingResult.createdAt ? ` (${new Date(deletingResult.createdAt).toLocaleString()})` : ''}? This permanently deletes this result from the patient's history. To omit it only from printing, cancel and uncheck it.</p>
          <div style={{ display: 'flex', gap: 8 }}><Button type="button" variant="outline" disabled={deleting} onClick={() => setDeletingResult(null)}>Cancel Delete</Button>
            <Button type="button" variant="danger" isLoading={deleting} disabled={deleting} onClick={handleDelete}>Delete Saved Result</Button></div>
        </div>}
        <div className="table-responsive">
          <table className="medical-table collapsible-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Print</th>
                <th>Test Name</th>
                <th>Result</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Price (EGP)</th>
                <th style={{ width: '80px' }}>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <CollapsibleRow key={r.id} className="table-row-hover" summary={r.analyticTypeName} primaryCell={1}>
                  <td>
                    <input type="checkbox" aria-label={`Print ${r.analyticTypeName} ${r.createdAt || r.id}`} checked={selectedIds.includes(r.id)} disabled={deleting}
                      onChange={() => setSelectedIds(previous => togglePrintResult(results, previous, r))} />
                  </td>
                  <td>
                    <span className="font-semibold text-sm text-main">{r.analyticTypeName}</span>
                    <div className="text-xs text-muted">{latestIds.has(r.id) ? 'Latest result' : 'Older result'}</div>
                  </td>
                  <td data-label="Result">
                    <table className="medical-table">
                      <thead><tr><th>Child Analytic</th><th>Value</th><th>Unit</th><th>Reference Range</th></tr></thead>
                      <tbody>{resultMigration(r).children.map(child => (
                        <tr key={child.id}><td data-label="Child Analytic"><small>{child.section}</small><div>{child.name}</div></td><td data-label="Value" style={{ whiteSpace: 'pre-wrap' }}>{child.resultType === 'differential' ? 'Relative: ' : ''}{flaggedResult(child.result, child.referenceRange, patient.gender)}{child.resultType === 'differential' && child.absoluteEnabled && <div>Absolute: {flaggedResult(child.absoluteResult, child.absoluteReferenceRange, patient.gender)}</div>}</td><td data-label="Unit">{child.unit || 'Not specified'}{child.resultType === 'differential' && child.absoluteEnabled && <div>Absolute: {child.absoluteUnit || 'Not specified'}</div>}</td><td data-label="Reference Range" style={{ whiteSpace: 'pre-wrap' }}>{child.referenceRange || 'Not specified'}{child.resultType === 'differential' && child.absoluteEnabled && <div>Absolute: {child.absoluteReferenceRange || 'Not specified'}</div>}</td></tr>
                      ))}</tbody>
                    </table>
                  </td>
                  <td data-label="Notes">
                    {r.generalComment && <p style={{ whiteSpace: 'pre-wrap' }}><strong>General Comment:</strong> {r.generalComment}</p>}
                    <span className="text-xs text-muted">{r.notes || '—'}</span>
                  </td>
                  <td data-label="Price" style={{ textAlign: 'right' }}>
                    <span className="font-mono font-bold text-sm">{(resultPriceCents(r.price) / 100).toFixed(2)}</span>
                  </td>
                  <td data-label="Date">
                    <span className="text-xs text-muted">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td data-label="Actions"><button type="button" className="action-icon-btn text-danger" disabled={deleting}
                    aria-label={`Delete saved result ${r.analyticTypeName} ${r.createdAt || r.id}`} title="Delete saved result" onClick={() => setDeletingResult(r)}><Icons.Trash2 size={17} /></button></td>
                </CollapsibleRow>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </Modal>
  );
};
