import type { AnalyticType } from '../../types/analyticType';
import { AnalyticTypeService } from '../../services/analyticTypeService';
import { PatientPicker } from './PatientPicker';
import { AnalyticTypePicker } from './AnalyticTypePicker';
import './LabVisitsPage.css';
import { useEffect, useRef, useState } from 'react';
import type { Patient } from '../../types/patient';
import { LAB_VISIT_STATUSES, type LabVisit, type LabVisitStatus } from '../../types/labVisit';
import { FirestoreService } from '../../services/firestoreService';
import { LabVisitService } from '../../services/labVisitService';
import { resultPriceCents } from '../../services/printSelection';
import { useToast } from '../../context/ToastContext';
import { AddAnalyticResultModal } from '../analytics/AddAnalyticResultModal';
import { PatientResultsModal } from '../analytics/PatientResultsModal';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Icons } from '../common/Icons';
import { CollapsibleRow } from '../common/CollapsibleRow';
import { PatientDetailsModal } from '../patients/PatientDetailsModal';

const money = (amount: unknown) => `${(resultPriceCents(amount) / 100).toFixed(2)} EGP`;

export function LabVisitsPage() {
  const { success, error: toastError } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [types, setTypes] = useState<AnalyticType[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [visits, setVisits] = useState<LabVisit[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState<LabVisit | 'new' | null>(null);
  const [resultVisit, setResultVisit] = useState<LabVisit | null>(null);
  const [printVisit, setPrintVisit] = useState<LabVisit | null>(null);
  const [paymentVisit, setPaymentVisit] = useState<LabVisit | null>(null);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<LabVisit | null>(null);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError('');
    Promise.all([FirestoreService.getAllPatients(), LabVisitService.getAll(), AnalyticTypeService.getAll()])
      .then(([people, records, catalog]) => { if (active) { setPatients(people); setVisits(records); setTypes(catalog); } })
      .catch(() => { if (active) setLoadError('Could not load lab visits. Please retry.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const patientFor = (visit: LabVisit | null) => patients.find(patient => patient.id === visit?.patientId) ?? null;
  const patientName = (visit: LabVisit) => patientFor(visit)?.name || visit.patientName || 'Patient unavailable';
  const filtered = visits.filter(visit => (status === 'All' || status === visit.status) && `${patientName(visit)} ${visit.visitNumber} ${patientFor(visit)?.patientId ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const runAction = async (action: () => Promise<void>, message: string) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try { await action(); success('Lab Visit Updated', message); setRefresh(value => value + 1); }
    catch (error) { toastError('Operation Failed', error instanceof Error ? error.message : 'Please retry.'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const openForm = (visit: LabVisit | 'new') => {
    setSelectedTypeIds(visit === 'new' ? [] : visit.assignedAnalytics?.map(type => type.id) ?? []);
    setForm(visit); setPatientId(visit === 'new' ? '' : visit.patientId);
    setNotes(visit === 'new' ? '' : visit.notes ?? '');
  };
  const openPayment = (visit: LabVisit) => { setPaymentVisit(visit); setPaidAmount(String(visit.paidAmount ?? 0)); };
  const save = () => {
    if (!form) return;
    const patient = patients.find(item => item.id === patientId);
    if (form === 'new' && !patient) return toastError('Patient Required', 'Choose a registered patient.');
    if (form === 'new' && !selectedTypeIds.length) return toastError('Analytic Types Required', 'Select at least one analytic type.');
    if (form !== 'new' && form.assignedAnalytics?.length && !selectedTypeIds.length) return toastError('Analytic Types Required', 'Select at least one analytic type.');
    void runAction(async () => {
      if (form === 'new' && patient) await LabVisitService.create({ patientId: patient.id, patientName: patient.name, status: 'New', notes: notes.trim(), assignedAnalytics: types.filter(type => selectedTypeIds.includes(type.id)) });
      else if (form !== 'new') await LabVisitService.update(form.id, { notes: notes.trim(), ...(form.assignedAnalytics?.length ? { assignedAnalytics: selectedTypeIds.map(id => form.assignedAnalytics!.find(type => type.id === id) ?? types.find(type => type.id === id)!).filter(Boolean) } : {}) });
      setForm(null);
    }, form === 'new' ? 'Visit and selected analytic types saved.' : 'Visit details saved.');
  };
  const savePayment = () => {
    if (!paymentVisit) return;
    const payment = Number(paidAmount);
    if (!paidAmount.trim() || !Number.isFinite(payment) || payment < 0 || resultPriceCents(payment) / 100 !== payment) return toastError('Invalid Payment', 'Enter a paid amount of zero or greater, with at most two decimal places.');
    void runAction(async () => { await LabVisitService.update(paymentVisit.id, { paidAmount: payment }); setPaymentVisit(null); }, 'Payment saved.');
  };

  return <div className="page-container visits-page">
    <div className="page-header-row"><div><h2 className="page-title">Lab Visits</h2><p className="page-subtitle">Manage results, reports, and payments for each patient visit.</p></div>
      <Button variant="medical" disabled={loading || busy || !!loadError} onClick={() => openForm('new')} leftIcon={<Icons.Plus size={16} />}>New Lab Visit</Button></div>
    <div className="visit-summary">{LAB_VISIT_STATUSES.map(value => <div className="visit-summary-item" key={value}><span>{value}</span><strong>{visits.filter(visit => visit.status === value).length}</strong></div>)}<div className="visit-summary-item"><span>Total Paid</span><strong>{money(visits.reduce((sum, visit) => sum + resultPriceCents(visit.paidAmount), 0) / 100)}</strong></div></div>
    <Card variant="bordered" style={{ padding: 16 }}>
      <div className="visit-toolbar">
        <div style={{ flex: 1, minWidth: 220 }}><Input id="visit-search" label="Find visit" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Patient name, patient ID, or visit number" /></div>
        <div className="form-group"><label className="form-label" htmlFor="visit-status-filter">Status</label><select id="visit-status-filter" className="form-input" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>{['All', ...LAB_VISIT_STATUSES].map(value => <option key={value}>{value}</option>)}</select></div>
        <Button variant="outline" disabled={loading || busy} onClick={() => setRefresh(value => value + 1)}>Refresh</Button>
      </div>
      {loadError ? <div role="alert"><p>{loadError}</p><Button onClick={() => setRefresh(value => value + 1)}>Retry</Button></div> : <>
        <div className="table-responsive"><table className="medical-table collapsible-table"><thead><tr><th>Visit / Date</th><th>Patient</th><th>Total</th><th>Balance / Credit</th><th>Status</th><th>Results & Actions</th></tr></thead><tbody>
          {loading ? <tr><td colSpan={6} role="status">Loading lab visits…</td></tr> : !visible.length ? <tr><td colSpan={6}>No visits match your filters. Create a visit to begin.</td></tr> : visible.map(visit => {
            const balance = resultPriceCents(visit.totalAmount) - resultPriceCents(visit.paidAmount);
            const patient = patientFor(visit);
            return <CollapsibleRow key={visit.id} summary={`${visit.visitNumber} · ${patientName(visit)}`}>
              <td><div className="font-mono text-teal">{visit.visitNumber}</div><small>{new Date(visit.createdAt).toLocaleString()}</small><div className="text-xs text-muted">{visit.assignedAnalytics?.map(type => type.name).join(", ")}</div></td>
              <td data-label="Patient">{patient ? <button type="button" className="staff-name-btn" onClick={() => setDetailPatient(patient)}>{patient.name}</button> : <strong>{patientName(visit)}</strong>}</td>
              <td data-label="Total">{money(visit.totalAmount)}</td><td data-label="Balance / Credit">{money(Math.abs(balance) / 100)}<div className="text-xs text-muted">{balance < 0 ? 'Credit' : balance > 0 ? 'Due' : 'Settled'}</div></td>
              <td data-label="Status"><select className="visit-status" data-status={visit.status} aria-label={`Status for ${visit.visitNumber}`} disabled={busy || loading} value={visit.status} onChange={event => { const nextStatus = event.target.value as LabVisitStatus; void runAction(() => LabVisitService.update(visit.id, { status: nextStatus }), 'Visit status saved.'); }}>{!LAB_VISIT_STATUSES.includes(visit.status) && <option disabled>{visit.status}</option>}{LAB_VISIT_STATUSES.map(value => <option key={value}>{value}</option>)}</select></td>
              <td data-label="Actions"><div className="visit-action-icons">
                <button type="button" className="action-icon-btn text-teal" title="Add analytic results" aria-label={`Add results for ${visit.visitNumber}`} disabled={busy || loading || !patient || visit.status === 'Completed' || String(visit.status) === 'Cancelled'} onClick={() => setResultVisit(visit)}><Icons.FlaskConical size={17} /></button>
                <button type="button" className="action-icon-btn text-primary" title="Print analytic results" aria-label={`Print results for ${visit.visitNumber}`} disabled={busy || loading || !patient} onClick={() => setPrintVisit(visit)}><Icons.Printer size={17} /></button>
                <button type="button" className="action-icon-btn text-teal" title="Record payment" aria-label={`Record payment for ${visit.visitNumber}`} disabled={busy || loading} onClick={() => openPayment(visit)}><Icons.DollarSign size={17} /></button>
                <button type="button" className="action-icon-btn text-primary" title="Edit visit" aria-label={`Edit visit ${visit.visitNumber}`} disabled={busy || loading} onClick={() => openForm(visit)}><Icons.Edit size={17} /></button>
                <button type="button" className="action-icon-btn text-danger" title="Delete visit" aria-label={`Delete ${visit.visitNumber}`} disabled={busy || loading} onClick={() => setDeleting(visit)}><Icons.Trash2 size={17} /></button>
              </div></td>
            </CollapsibleRow>;
          })}
        </tbody></table></div>
        <div className="table-pagination-footer">
          <div className="pagination-info">
            Showing{' '}
            <span className="font-semibold text-teal">
              {filtered.length === 0 ? 0 : (currentPage - 1) * 10 + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-teal">
              {Math.min(currentPage * 10, filtered.length)}
            </span>{' '}
            of <span className="font-semibold text-teal">{filtered.length}</span> visits
          </div>

          <div className="pagination-controls">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              leftIcon={<Icons.ChevronLeft size={16} />}
            >
              Previous
            </Button>

            <span className="page-indicator">
              Page {currentPage} of {pages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              rightIcon={<Icons.ChevronRight size={16} />}
            >
              Next
            </Button>
          </div>
        </div>
      </>}
    </Card>
    <Modal isOpen={!!form} onClose={() => { if (!busy) setForm(null); }} title={<span>{form === 'new' ? 'New Lab Visit' : `Edit ${form?.visitNumber ?? ''}`}</span>} footer={<div className="modal-footer-actions"><Button variant="outline" disabled={busy} onClick={() => setForm(null)}>Cancel</Button><Button variant="medical" disabled={busy} isLoading={busy} onClick={save}>Save Visit</Button></div>}>
      {form === 'new' ? <>
        <PatientPicker patients={patients} value={patientId} onChange={setPatientId} disabled={busy} />
        <AnalyticTypePicker types={types} selectedIds={selectedTypeIds} onChange={setSelectedTypeIds} disabled={busy} />
      </> : form && <>
        <p className="form-label">{patientName(form)} · {form.visitNumber}</p>
        {form.assignedAnalytics?.length ? <AnalyticTypePicker types={[...form.assignedAnalytics, ...types.filter(type => !form.assignedAnalytics?.some(ordered => ordered.id === type.id))]} selectedIds={selectedTypeIds} onChange={setSelectedTypeIds} disabled={busy} /> : <p className="text-sm text-muted">Legacy visit: ordered analytics are unavailable. Existing charges are preserved; notes can still be edited.</p>}
      </>}
      <label htmlFor="visit-notes">Visit notes</label><textarea id="visit-notes" className="form-input" rows={4} disabled={busy} value={notes} onChange={event => setNotes(event.target.value)} />
    </Modal>
    <Modal isOpen={!!paymentVisit} onClose={() => { if (!busy) setPaymentVisit(null); }} title={`Payment · ${paymentVisit?.visitNumber ?? ''}`} footer={<div className="modal-footer-actions"><Button variant="outline" disabled={busy} onClick={() => setPaymentVisit(null)}>Cancel</Button><Button variant="medical" disabled={busy} isLoading={busy} onClick={savePayment}>Save Payment</Button></div>}>
      <p className="text-sm text-muted">{paymentVisit && patientName(paymentVisit)}</p>
      <div className="visit-total"><span>Visit Total</span><strong>{money(paymentVisit?.totalAmount)}</strong></div>
      <Input id="visit-payment" label="Paid to Date (EGP)" helperText="Cumulative amount received, including earlier payments." type="number" min="0" step="0.01" disabled={busy} value={paidAmount} onChange={event => setPaidAmount(event.target.value)} />
      <Input id="visit-credit" label={paymentVisit && Number(paidAmount) > paymentVisit.totalAmount ? 'Patient Credit (EGP)' : 'Credit Due (EGP)'} type="text" readOnly value={paymentVisit && Number.isFinite(Number(paidAmount)) ? money(Math.abs(resultPriceCents(paymentVisit.totalAmount) - resultPriceCents(Number(paidAmount))) / 100) : '—'} />
    </Modal>
    <PatientDetailsModal isOpen={!!detailPatient} onClose={() => setDetailPatient(null)} patient={detailPatient} />
    <Modal isOpen={!!deleting} onClose={() => { if (!busy) setDeleting(null); }} title={<span>Delete lab visit</span>} footer={<div className="modal-footer-actions"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Keep Visit</Button><Button variant="danger" disabled={busy} isLoading={busy} onClick={() => deleting && void runAction(async () => { if (!await LabVisitService.delete(deleting.id)) throw new Error('This visit no longer exists.'); setDeleting(null); }, 'Visit and its saved results deleted.')}>Delete Visit and Results</Button></div>}>
      <p>Delete {deleting?.visitNumber}? This permanently removes the visit, its saved analytic results, and its recorded payment of {money(deleting?.paidAmount)}. This cannot be undone.</p>
    </Modal>
    <AddAnalyticResultModal isOpen={!!resultVisit} onClose={() => setResultVisit(null)} onSuccess={() => setRefresh(value => value + 1)} patient={patientFor(resultVisit)} visitId={resultVisit?.id} assignedAnalytics={resultVisit?.assignedAnalytics} />
    <PatientResultsModal isOpen={!!printVisit} onClose={() => { setPrintVisit(null); setRefresh(value => value + 1); }} patient={patientFor(printVisit)} visitId={printVisit?.id} />
  </div>;
}
