import React, { useState, useEffect } from 'react';
import type { AnalyticType, AnalyticTypeFormData } from '../../types/analyticType';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Icons } from '../common/Icons';

interface AnalyticTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AnalyticTypeFormData) => void;
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingType) {
      setFormData({
        name: editingType.name,
        price: editingType.price,
      });
    } else {
      setFormData({ name: '', price: 0 });
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
    if (formData.price < 0) newErrors.price = 'Price must be zero or greater.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2">
          <Icons.FlaskConical size={22} className="text-teal" />
          <span>{editingType ? 'Edit Analytic Type' : 'Add Analytic Type'}</span>
        </div>
      }
      subtitle={
        editingType
          ? `Modifying "${editingType.name}" — update name or price.`
          : 'Define a new analytic test type with a name and price.'
      }
      footer={
        <div className="modal-footer-actions">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="medical"
            onClick={handleSubmit}
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
            label="Test Name"
            placeholder="e.g. Complete Blood Count (CBC)"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            leftIcon={<Icons.FileText size={16} />}
          />
        </div>

        <div className="form-group">
          <Input
            label="Price (EGP)"
            type="number"
            placeholder="e.g. 150"
            value={formData.price}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
            error={errors.price}
            required
            leftIcon={<Icons.DollarSign size={16} />}
          />
        </div>
      </form>
    </Modal>
  );
};
