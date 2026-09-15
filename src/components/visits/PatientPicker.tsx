import { useEffect, useRef, useState } from 'react';
import type { Patient } from '../../types/patient';
import { Icons } from '../common/Icons';

export function PatientPicker({ patients, value, onChange, disabled }: { patients: Patient[]; value: string; onChange: (id: string) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const selected = patients.find(patient => patient.id === value);
  const matches = patients.filter(patient => `${patient.name} ${patient.patientId} ${patient.phone}`.toLowerCase().includes(query.toLowerCase())).slice(0, 50);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const choose = (patient: Patient) => { onChange(patient.id); setOpen(false); setQuery(''); };
  return <div className="visit-patient-picker" ref={root}>
    <label className="form-label" htmlFor="visit-patient">Patient <span className="text-danger">*</span></label>
    <div className="visit-picker-input"><Icons.Users size={18} /><input id="visit-patient" role="combobox" aria-expanded={open} aria-autocomplete="list" aria-controls="visit-patient-options" aria-activedescendant={open && matches[active] ? `patient-option-${active}` : undefined}
      disabled={disabled} autoComplete="off" placeholder="Search patient name, ID, or phone…" value={open ? query : selected ? `${selected.name} · ${selected.patientId}` : ''}
      onFocus={() => { setOpen(true); setQuery(''); setActive(0); }} onClick={() => { if (!open) { setOpen(true); setQuery(''); setActive(0); } }} onChange={event => { setQuery(event.target.value); setOpen(true); setActive(0); }}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive(index => Math.max(0, Math.min(matches.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))); }
        if (event.key === 'Enter' && open) { event.preventDefault(); if (matches[active]) choose(matches[active]); }
        if (event.key === 'Escape' || event.key === 'Tab') setOpen(false);
      }} /><Icons.ChevronDown size={16} /></div>
    {selected && <p className="form-helper">{selected.phone} · {selected.age} years</p>}
    {open && <div id="visit-patient-options" className="visit-picker-menu" role="listbox">
      {!matches.length && <p className="visit-picker-empty">No matching patients.</p>}
      {matches.map((patient, index) => <div id={`patient-option-${index}`} key={patient.id} role="option" aria-selected={patient.id === value} className={`visit-picker-option ${index === active ? 'highlighted' : ''}`} onMouseDown={event => event.preventDefault()} onClick={() => choose(patient)}>
        <span className="visit-avatar">{patient.name.slice(0, 1)}</span><span><strong>{patient.name}</strong><small>{patient.patientId} · {patient.phone}</small></span>{patient.id === value && <Icons.Check size={16} />}
      </div>)}
    </div>}
  </div>;
}
