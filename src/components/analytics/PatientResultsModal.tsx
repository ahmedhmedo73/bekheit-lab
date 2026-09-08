import React, { useState, useEffect } from 'react';
import type { Patient } from '../../types/patient';
import type { AnalyticResult } from '../../types/analyticType';
import { AnalyticResultService } from '../../services/analyticResultService';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';

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

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lab Report — ${patient.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a2e;
      padding: 20px 40px;
      background: #fff;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0d9488;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 22px;
      color: #0d9488;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .header p {
      font-size: 11px;
      color: #666;
      margin-top: 4px;
    }
    .patient-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 32px;
      margin-bottom: 24px;
      padding: 12px 16px;
      background: #f8fffe;
      border: 1px solid #e0f2f1;
      border-radius: 6px;
    }
    .patient-info .row {
      display: flex;
      gap: 8px;
      font-size: 13px;
    }
    .patient-info .label {
      font-weight: 600;
      color: #444;
      min-width: 100px;
    }
    .patient-info .value { color: #1a1a2e; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #0d9488;
      color: #fff;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      text-align: left;
    }
    td {
      padding: 10px 12px;
      font-size: 13px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) td { background: #fafafa; }
    .total-row {
      display: flex;
      justify-content: flex-end;
      padding: 12px 0;
      border-top: 2px solid #0d9488;
      margin-top: -1px;
    }
    .total-row span {
      font-size: 15px;
      font-weight: 700;
      color: #0d9488;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #999;
      border-top: 1px solid #eee;
      padding-top: 12px;
    }
    .signature-area {
      margin-top: 48px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-box .line {
      border-top: 1px solid #333;
      margin-bottom: 6px;
    }
    .signature-box p {
      font-size: 11px;
      color: #555;
    }
    @media print {
      body { padding: 10px 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>BEKHEIT LAB</h1>
    <p>Clinical Pathology — Laboratory Results Report</p>
  </div>

  <div class="patient-info">
    <div class="row"><span class="label">Patient Name:</span><span class="value">${patient.name}</span></div>
    <div class="row"><span class="label">Patient ID:</span><span class="value">${patient.patientId}</span></div>
    <div class="row"><span class="label">Age:</span><span class="value">${patient.age} years</span></div>
    <div class="row"><span class="label">Gender:</span><span class="value">${patient.gender || 'N/A'}</span></div>
    <div class="row"><span class="label">Phone:</span><span class="value">${patient.phone}</span></div>
    <div class="row"><span class="label">Report Date:</span><span class="value">${new Date().toLocaleDateString()}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px">#</th>
        <th>Test Name</th>
        <th>Result</th>
        <th>Notes / Reference</th>
      </tr>
    </thead>
    <tbody>
      ${results
        .map(
          (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${r.analyticTypeName}</td>
          <td><strong>${r.result}</strong></td>
          <td>${r.notes || '—'}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="signature-area">
    <div class="signature-box">
      <div class="line"></div>
      <p>Lab Technician</p>
    </div>
    <div class="signature-box">
      <div class="line"></div>
      <p>Consultant Pathologist</p>
    </div>
  </div>

  <div class="footer">
    <p>Bekheit Lab Clinical Pathology • Printed on ${new Date().toLocaleString()} • This is a computer-generated report</p>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 150);
    });
  </script>
</body>
</html>`;

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
            disabled={results.length === 0}
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
                    <span className="font-bold text-sm text-teal">{r.result}</span>
                  </td>
                  <td>
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
