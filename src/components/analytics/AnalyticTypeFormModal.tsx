import React, { useState, useEffect } from 'react';
import type { AnalyticType, AnalyticTypeFormData } from '../../types/analyticType';
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
      if (names.has(child.name.trim().toLowerCase())) newErrors.children = 'Child names must be unique within this parent.';
      names.add(child.name.trim().toLowerCase());
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        <p className="text-xs text-muted">Set the lab's unit and reference range for each child. Leave unknown values blank.</p>
        {formData.children?.map((child, index) => (
          <fieldset key={child.id} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
            <legend>Child {index + 1}</legend>
            {(['name', 'unit', 'referenceRange'] as const).map(field => (
              <Input key={field} id={`child-${child.id}-${field}`} label={field === 'referenceRange' ? 'Reference Range' : field === 'unit' ? 'Unit' : 'Child Name'}
                placeholder={field === 'name' ? 'e.g. Urea Serum' : field === 'unit' ? 'Lab unit' : 'Lab reference range'}
                value={child[field]} required={field === 'name'}
                onChange={event => setFormData(prev => ({ ...prev, children: prev.children?.map(item => item.id === child.id ? { ...item, [field]: event.target.value } : item) }))} />
            ))}
            <Button type="button" variant="outline" onClick={() => setFormData(prev => ({ ...prev, children: prev.children?.filter(item => item.id !== child.id) }))}>Remove Child</Button>
          </fieldset>
        ))}
        {errors.children && <p role="alert" className="text-danger">{errors.children}</p>}
        <Button type="button" variant="outline" onClick={() => setFormData(prev => ({ ...prev, children: [...(prev.children ?? []), { id: crypto.randomUUID(), name: '', unit: '', referenceRange: '' }] }))}>Add Child Analytic</Button>
      </form>
    </Modal>
  );
};
