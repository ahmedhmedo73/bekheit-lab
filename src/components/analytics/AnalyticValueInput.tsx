import type { ChildAnalyticResult } from '../../types/analyticType';
import { Input } from '../common/Input';
import { hasAnalyticResultValue } from '../../services/analyticValues';

export function AnalyticValueInput({ child, prefix, disabled, autoCalculated = false, onChange }: {
  child: ChildAnalyticResult;
  prefix: string;
  disabled: boolean;
  autoCalculated?: boolean;
  onChange: (updates: Partial<ChildAnalyticResult>) => void;
}) {
  const id = `${prefix}-${child.id}`;
  return <div className={`result-value-row ${hasAnalyticResultValue(child) ? 'is-complete' : ''} ${autoCalculated ? 'is-auto-calculated' : ''}`}>
    {child.resultType === 'text' ? <>
      <label htmlFor={id}>{child.name}</label>
      <textarea className="form-input" id={id} rows={2} value={child.result} disabled={disabled} style={{ width: '100%' }} onChange={event => onChange({ result: event.target.value })} />
    </> : <Input id={id} label={`${child.name}${child.resultType === 'differential' ? ' — Relative Count' : ''}`} value={child.result} disabled={disabled} readOnly={autoCalculated}
      helperText={autoCalculated ? 'Calculated automatically from the entered source values.' : undefined}
      inputMode={child.resultType === 'numeric' || child.resultType === 'differential' ? 'decimal' : 'text'}
      placeholder={child.resultType === 'range' ? 'e.g. 1 - 3, Nil' : child.resultType === 'qualitative' ? 'Select or enter a finding' : 'Enter result'}
      list={child.resultType === 'qualitative' ? `${id}-choices` : undefined}
      onChange={event => onChange({ result: event.target.value })} />}
    {child.resultType === 'qualitative' && <datalist id={`${id}-choices`}>{child.options?.filter(Boolean).map(option => <option key={option} value={option} />)}</datalist>}
    <p className="result-value-reference"><span>Unit: {child.unit || '—'}</span><span>Reference: {child.referenceRange || '—'}</span></p>
    {child.resultType === 'differential' && child.absoluteEnabled && <>
      <Input id={`${id}-absolute`} label={`${child.name} — Absolute Count`} value={child.absoluteResult ?? ''} inputMode="decimal" disabled={disabled} onChange={event => onChange({ absoluteResult: event.target.value })} />
      <p className="result-value-reference"><span>Unit: {child.absoluteUnit || '—'}</span><span>Reference: {child.absoluteReferenceRange || '—'}</span></p>
    </>}
  </div>;
}
