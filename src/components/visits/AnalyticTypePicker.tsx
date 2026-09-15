import { useState } from 'react';
import type { AnalyticType } from '../../types/analyticType';
import { resultPriceCents } from '../../services/printSelection';
import { Input } from '../common/Input';

export function AnalyticTypePicker({ types, selectedIds, onChange, disabled }: { types: AnalyticType[]; selectedIds: string[]; onChange: (ids: string[]) => void; disabled: boolean }) {
  const [search, setSearch] = useState('');
  const total = types.filter(type => selectedIds.includes(type.id)).reduce((sum, type) => sum + resultPriceCents(type.price), 0) / 100;
  return <fieldset className="visit-analytic-picker" disabled={disabled}>
    <legend>Analytic types <span className="text-danger">*</span></legend>
    <Input id="visit-analytic-search" aria-label="Search analytic types" placeholder="Search analytic types…" value={search} onChange={event => setSearch(event.target.value)} />
    <div className="visit-analytic-options">{types.filter(type => type.name.toLowerCase().includes(search.toLowerCase())).map(type => <label key={type.id} className={`visit-analytic-option ${selectedIds.includes(type.id) ? 'selected' : ''}`}>
      <input type="checkbox" checked={selectedIds.includes(type.id)} onChange={event => onChange(event.target.checked ? [...selectedIds, type.id] : selectedIds.filter(id => id !== type.id))} />
      <span><strong>{type.name}</strong><small>{type.children?.length ?? 0} tests</small></span><b>{(resultPriceCents(type.price) / 100).toFixed(2)} EGP</b>
    </label>)}</div>
    {!types.length && <p>No analytic types available. Add them in Analytic Types first.</p>}
    <div className="visit-total"><span>{selectedIds.length} selected · Total to Pay</span><strong>{total.toFixed(2)} EGP</strong></div>
  </fieldset>;
}
