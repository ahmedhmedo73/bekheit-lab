import React, { useEffect, useMemo, useState } from 'react';
import type { Patient } from '../../types/patient';
import { PatientService } from '../../services/patientService';
import { useToast } from '../../context/ToastContext';
import { AddAnalyticResultModal } from './AddAnalyticResultModal';
import { PatientResultsModal } from './PatientResultsModal';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Icons } from '../common/Icons';

interface AnalyticResultsPageProps {
  initialPatient?: Patient | null;
}

export const AnalyticResultsPage: React.FC<AnalyticResultsPageProps> = ({ initialPatient }) => {
  const { error: toastError } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient ?? null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(false);

  useEffect(() => {
    let active = true;
    PatientService.getAllPatients()
      .then(list => { if (active) setPatients(list.sort((a, b) => a.name.localeCompare(b.name))); })
      .catch(() => { if (active) toastError('Patients Unavailable', 'Could not load the patient list. Please refresh the page.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [toastError]);

  useEffect(() => {
    if (initialPatient) setSelectedPatient(initialPatient);
  }, [initialPatient]);

  const visiblePatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter(patient => [patient.name, patient.patientId, patient.phone].some(value => value?.toLowerCase().includes(query)));
  }, [patients, search]);

  return <div className="page-container">
    <div className="page-header">
      <div>
        <h2 className="page-title">Analytic Results</h2>
        <p className="page-subtitle">Select a patient, then record one or multiple analytic panels. Every saved panel is retained in that patient’s history.</p>
      </div>
    </div>

    <Card variant="bordered" style={{ padding: '1rem', marginBottom: '1rem' }}>
      <Input id="result-patient-search" label="Find patient" value={search} onChange={event => setSearch(event.target.value)}
        placeholder="Search by name, patient ID, or phone number" leftIcon={<Icons.Users size={17} />} />
      {loading ? <p className="text-sm text-muted" role="status">Loading patients…</p> : visiblePatients.length === 0 ? <p className="text-sm text-muted">No matching patients.</p> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
          {visiblePatients.map(patient => <button key={patient.id} type="button" className={`card card-bordered ${selectedPatient?.id === patient.id ? 'ring-2 ring-teal' : ''}`}
            style={{ padding: 12, textAlign: 'left', cursor: 'pointer' }} onClick={() => setSelectedPatient(patient)}>
            <div className="font-semibold text-main">{patient.name}</div>
            <div className="font-mono text-xs text-teal">{patient.patientId}</div>
            <div className="text-xs text-muted">{patient.age} years · {patient.phone}</div>
          </button>)}
        </div>}
    </Card>

    {selectedPatient && <Card variant="bordered" style={{ padding: '1.25rem' }}>
      <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
        <div>
          <div className="text-xs text-muted">Selected patient</div>
          <h3 className="font-bold text-lg text-main">{selectedPatient.name} <span className="font-mono text-sm text-teal">{selectedPatient.patientId}</span></h3>
          <p className="text-sm text-muted">Add as many analytic types as needed in one entry. Saving again creates another dated result set for the same patient.</p>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <Button type="button" variant="outline" onClick={() => setViewingHistory(true)} leftIcon={<Icons.ClipboardList size={16} />}>View Result History</Button>
          <Button type="button" variant="medical" onClick={() => setAdding(true)} leftIcon={<Icons.FlaskConical size={16} />}>Add Analytic Results</Button>
        </div>
      </div>
    </Card>}

    <AddAnalyticResultModal isOpen={adding} onClose={() => setAdding(false)} patient={selectedPatient} />
    <PatientResultsModal isOpen={viewingHistory} onClose={() => setViewingHistory(false)} patient={selectedPatient} />
  </div>;
};
