import React, { useState, useEffect } from 'react';
import type { AnalyticType, AnalyticTypeFormData, ChildAnalytic } from '../../types/analyticType';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';
import { analyticChildren } from '../../services/analyticSchema';

interface AnalyticTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AnalyticTypeFormData) => Promise<void>;
  editingType?: AnalyticType | null;
}

export const AnalyticTypeFormModal: React.FC<AnalyticTypeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingType,
}) => {
  const [formData, setFormData] = useState<AnalyticTypeFormData>({
    name: '',
    price: 0,
    children: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingType) {
      setFormData({
        name: editingType.name,
        price: editingType.price,
        children: analyticChildren(editingType),
        generalComment: editingType.generalComment ?? '',
      });
    } else {
      setFormData({ name: '', price: 0, children: [] });
    }
    setErrors({});
  }, [editingType, isOpen]);

  const handleChange = (field: keyof AnalyticTypeFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Analytic type name is required.';
    if (!Number.isFinite(formData.price) || formData.price < 0) newErrors.price = 'Price must be zero or greater.';
    if (!formData.children?.length) newErrors.children = 'Add at least one child analytic.';
    const names = new Set<string>();
    formData.children?.forEach((child) => {
      if (!child.name.trim()) newErrors.children = 'Every child needs a name.';
      const key = `${child.section?.trim().toLowerCase() ?? ''}:${child.name.trim().toLowerCase()}`;
      if (names.has(key)) newErrors.children = 'Child names must be unique within each section.';
      names.add(key);
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateChild = (id: string, updates: Partial<ChildAnalytic>) => {
    setFormData(prev => ({ ...prev, children: prev.children?.map(child => child.id === id ? { ...child, ...updates } : child) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    try {
    await onSubmit({ ...formData, name: formData.name.trim(), schemaVersion: 2,
      children: formData.children?.map(child => ({ ...child, name: child.name.trim(), unit: child.unit.trim(), referenceRange: child.referenceRange.trim() })) });
    } finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!saving) onClose(); }}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <Icons.FlaskConical size={22} className="text-teal" />
          <span>{editingType ? 'Edit Analytic Type' : 'Add Analytic Type'}</span>
        </div>
      }
      subtitle={
        editingType
          ? `Modifying "${editingType.name}" — update name or price.`
          : 'Create a parent panel, such as Kidney Analytic, and add its child tests.'
      }
      footer={
        <div className="modal-footer-actions">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="medical"
            onClick={handleSubmit}
            isLoading={saving}
            disabled={saving}
            leftIcon={<Icons.Check size={16} />}
          >
            {editingType ? 'Save Changes' : 'Create Type'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="user-form-grid" noValidate>
        <div className="form-section-title">
          <Icons.TestTube size={16} />
          <span>Analytic Test Details</span>
        </div>

        <div className="form-group">
          <Input
            label="Parent Analytic Name"
            placeholder="e.g. Kidney Analytic"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            leftIcon={<Icons.FileText size={16} />}
          />
        </div>

        <div className="form-group">
          <Input
            label="Parent Panel Price (EGP)"
            type="number"
            placeholder="e.g. 150"
            value={formData.price}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
            error={errors.price}
            required
            leftIcon={<Icons.DollarSign size={16} />}
          />
        </div>
        <div className="form-section-title">Child Analytics</div>
        <label htmlFor="panel-general-comment">General Comment / Page Comment Template</label>
        <textarea className="form-input" id="panel-general-comment" rows={3} value={formData.generalComment ?? ''}
          placeholder="Optional editable comment for this report group. Leave patient-specific findings blank."
          onChange={event => handleChange('generalComment', event.target.value)} />
        <p className="text-xs text-muted">Set the lab's unit and reference range for each child. Leave unknown values blank.</p>
        {formData.children?.map((child, index) => (
          <fieldset key={child.id} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
            <legend>Child {index + 1}</legend>
            <Input id={`section-${child.id}`} label="Section / Subgroup" value={child.section ?? ''} onChange={event => updateChild(child.id, { section: event.target.value })} />
            <label htmlFor={`format-${child.id}`}>Result Format</label>
            <select className="form-input" id={`format-${child.id}`} value={child.resultType ?? 'text'} onChange={event => updateChild(child.id, { resultType: event.target.value as ChildAnalytic['resultType'] })}>
              <option value="numeric">Numeric measurement</option><option value="text">Descriptive / multiline text</option>
              <option value="qualitative">Qualitative / suggested choices</option><option value="range">Microscopy range (e.g. 1 - 3)</option>
              <option value="differential">Relative / absolute differential count</option>
            </select>
            {(['name', 'unit'] as const).map(field => (
              <Input key={field} id={`child-${child.id}-${field}`} label={field === 'unit' ? 'Unit' : 'Child Name'}
                placeholder={field === 'name' ? 'e.g. Urea Serum' : field === 'unit' ? 'Lab unit' : 'Lab reference range'}
                value={child[field]} required={field === 'name'}
                onChange={event => setFormData(prev => ({ ...prev, children: prev.children?.map(item => item.id === child.id ? { ...item, [field]: event.target.value } : item) }))} />
            ))}
            <label htmlFor={`reference-${child.id}`}>{child.resultType === 'differential' ? 'Relative Reference Range' : 'Reference Range / Interpretation'}</label>
            <textarea className="form-input" id={`reference-${child.id}`} rows={3} style={{ width: '100%' }} value={child.referenceRange} onChange={event => updateChild(child.id, { referenceRange: event.target.value })} />
            {child.resultType === 'qualitative' && <Input id={`options-${child.id}`} label="Suggested Choices (comma separated)" value={child.options?.join(', ') ?? ''}
              onChange={event => updateChild(child.id, { options: event.target.value.split(',').map(value => value.trim()) })} />}
            {child.resultType === 'differential' && <>
              <p className="text-xs text-muted">The unit and reference range above apply to the relative count.</p>
              <label><input type="checkbox" checked={child.absoluteEnabled ?? false} onChange={event => updateChild(child.id, { absoluteEnabled: event.target.checked })} /> Include absolute count</label>
              {child.absoluteEnabled && <>
                <Input id={`absolute-unit-${child.id}`} label="Absolute Count Unit" value={child.absoluteUnit ?? ''} onChange={event => updateChild(child.id, { absoluteUnit: event.target.value })} />
                <Input id={`absolute-reference-${child.id}`} label="Absolute Reference Range" value={child.absoluteReferenceRange ?? ''} onChange={event => updateChild(child.id, { absoluteReferenceRange: event.target.value })} />
              </>}
            </>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="button" variant="outline" disabled={index === 0} onClick={() => setFormData(prev => { const children = [...(prev.children ?? [])]; [children[index - 1], children[index]] = [children[index], children[index - 1]]; return { ...prev, children }; })}>Move Up</Button>
              <Button type="button" variant="outline" disabled={index === (formData.children?.length ?? 0) - 1} onClick={() => setFormData(prev => { const children = [...(prev.children ?? [])]; [children[index], children[index + 1]] = [children[index + 1], children[index]]; return { ...prev, children }; })}>Move Down</Button>
            </div>
            <Button type="button" variant="outline" onClick={() => setFormData(prev => ({ ...prev, children: prev.children?.filter(item => item.id !== child.id) }))}>Remove Child</Button>
          </fieldset>
        ))}
        {errors.children && <p role="alert" className="text-danger">{errors.children}</p>}
        <Button type="button" variant="outline" onClick={() => setFormData(prev => ({ ...prev, children: [...(prev.children ?? []), { id: crypto.randomUUID(), name: '', unit: '', referenceRange: '' }] }))}>Add Child Analytic</Button>
      </form>
    </Modal>
  );
};
