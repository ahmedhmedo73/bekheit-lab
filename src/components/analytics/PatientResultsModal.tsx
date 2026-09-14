import React, { useState, useEffect } from 'react';
import type { Patient } from '../../types/patient';
import type { AnalyticResult } from '../../types/analyticType';
import { AnalyticResultService } from '../../services/analyticResultService';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';
import { buildAnalyticReport } from '../../services/analyticReport';
import { resultMigration } from '../../services/analyticSchema';


interface PatientResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export const PatientResultsModal: React.FC<PatientResultsModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const [results, setResults] = useState<AnalyticResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && patient) {
      setLoading(true);
      AnalyticResultService.getByPatientId(patient.id)
        .then(setResults)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, patient]);

  if (!patient) return null;

  const totalPrice = results.reduce((sum, r) => sum + r.price, 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = buildAnalyticReport(patient, results);

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // Handled by inline script
      }
    }, 300);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <Icons.ClipboardList size={22} className="text-teal" />
          <span>Analytic Results</span>
        </div>
      }
      subtitle={`Viewing test results for ${patient.name} (${patient.patientId})`}
      footer={
        <div className="modal-footer-actions">
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.DollarSign size={16} className="text-teal" />
            <span className="font-bold text-sm text-teal">
              Total: {totalPrice.toFixed(2)} EGP
            </span>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="medical"
            onClick={handlePrint}
            disabled={loading || results.length === 0}
            leftIcon={<Icons.Printer size={16} />}
          >
            Print Report
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center gap-3" style={{ padding: '2rem', justifyContent: 'center' }}>
          <div className="btn-spinner" style={{ width: 24, height: 24 }} />
          <span className="text-sm text-muted">Loading results…</span>
        </div>
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
        <div className="table-responsive">
          <table className="medical-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Test Name</th>
                <th>Result</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Price (EGP)</th>
                <th style={{ width: '80px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.id} className="table-row-hover">
                  <td>
                    <span className="font-mono text-xs text-muted">{i + 1}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-sm text-main">{r.analyticTypeName}</span>
                  </td>
                  <td>
                    <table className="medical-table">
                      <thead><tr><th>Child Analytic</th><th>Value</th><th>Unit</th><th>Reference Range</th></tr></thead>
                      <tbody>{resultMigration(r).children.map(child => (
                        <tr key={child.id}><td><small>{child.section}</small><div>{child.name}</div></td><td style={{ whiteSpace: 'pre-wrap' }}>{child.resultType === 'differential' ? 'Relative: ' : ''}{child.result}{child.resultType === 'differential' && child.absoluteEnabled && <div>Absolute: {child.absoluteResult}</div>}</td><td>{child.unit || 'Not specified'}{child.resultType === 'differential' && child.absoluteEnabled && <div>Absolute: {child.absoluteUnit || 'Not specified'}</div>}</td><td style={{ whiteSpace: 'pre-wrap' }}>{child.referenceRange || 'Not specified'}{child.resultType === 'differential' && child.absoluteEnabled && <div>Absolute: {child.absoluteReferenceRange || 'Not specified'}</div>}</td></tr>
                      ))}</tbody>
                    </table>
                  </td>
                  <td>
                    {r.generalComment && <p style={{ whiteSpace: 'pre-wrap' }}><strong>General Comment:</strong> {r.generalComment}</p>}
                    <span className="text-xs text-muted">{r.notes || '—'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="font-mono font-bold text-sm">{r.price.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className="text-xs text-muted">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};
