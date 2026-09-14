import type { ChildAnalyticResult } from '../../types/analyticType';
import { Input } from '../common/Input';

export function AnalyticValueInput({ child, prefix, disabled, onChange }: {
  child: ChildAnalyticResult;
  prefix: string;
  disabled: boolean;
  onChange: (updates: Partial<ChildAnalyticResult>) => void;
}) {
  const id = `${prefix}-${child.id}`;
  return <div style={{ marginBottom: 16 }}>
    {child.resultType === 'text' ? <>
      <label htmlFor={id}>{child.name} *</label>
      <textarea className="form-input" id={id} rows={2} value={child.result} disabled={disabled} required style={{ width: '100%' }} onChange={event => onChange({ result: event.target.value })} />
    </> : <Input id={id} label={`${child.name}${child.resultType === 'differential' ? ' — Relative Count' : ''}`} value={child.result} disabled={disabled} required
      inputMode={child.resultType === 'numeric' || child.resultType === 'differential' ? 'decimal' : 'text'}
      placeholder={child.resultType === 'range' ? 'e.g. 1 - 3, Nil' : child.resultType === 'qualitative' ? 'Select or enter a finding' : 'Enter result'}
      list={child.resultType === 'qualitative' ? `${id}-choices` : undefined}
      onChange={event => onChange({ result: event.target.value })} />}
    {child.resultType === 'qualitative' && <datalist id={`${id}-choices`}>{child.options?.filter(Boolean).map(option => <option key={option} value={option} />)}</datalist>}
    <p className="text-xs text-muted" style={{ whiteSpace: 'pre-wrap' }}>Unit: {child.unit || 'Not specified'} | Reference range: {child.referenceRange || 'Not specified'}</p>
    {child.resultType === 'differential' && child.absoluteEnabled && <>
      <Input id={`${id}-absolute`} label={`${child.name} — Absolute Count`} value={child.absoluteResult ?? ''} inputMode="decimal" required disabled={disabled} onChange={event => onChange({ absoluteResult: event.target.value })} />
      <p className="text-xs text-muted">Unit: {child.absoluteUnit || 'Not specified'} | Reference range: {child.absoluteReferenceRange || 'Not specified'}</p>
    </>}
  </div>;
}
