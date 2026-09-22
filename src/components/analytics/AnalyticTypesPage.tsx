import React, { useState, useEffect, useCallback } from 'react';
import type { AnalyticType, AnalyticTypeFormData } from '../../types/analyticType';
import { AnalyticTypeService } from '../../services/analyticTypeService';
import { useToast } from '../../context/ToastContext';
import { Icons } from '../common/Icons';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { CollapsibleRow } from '../common/CollapsibleRow';
import { AnalyticTypeFormModal } from './AnalyticTypeFormModal';
import { DeleteAnalyticTypeModal } from './DeleteAnalyticTypeModal';
import { analyticChildren } from '../../services/analyticSchema';

export const AnalyticTypesPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [types, setTypes] = useState<AnalyticType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<AnalyticType[]>([]);
  const [search, setSearch] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<AnalyticType | null>(null);
  const [deletingType, setDeletingType] = useState<AnalyticType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Load all analytic types
  useEffect(() => {
    const load = async () => {
      try {
        const data = await AnalyticTypeService.getAll();
        setTypes(data);
      } catch (err) {
        console.error('Error loading analytic types:', err);
        toastError('Catalog Failed', 'Could not load or migrate analytic types. Reload to retry.');
        setTypes([]);
      }
    };
    load();
  }, [refreshKey, toastError]);

  // Filter & search
  useEffect(() => {
    let list = [...types];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((t) => t.name.toLowerCase().includes(q) || analyticChildren(t).some(child => child.name.toLowerCase().includes(q)));
    }
    setFilteredTypes(list);
  }, [types, search]);

  const stats = {
    total: types.length,
    avgPrice: types.length > 0 ? types.reduce((sum, t) => sum + t.price, 0) / types.length : 0,
    maxPrice: types.length > 0 ? Math.max(...types.map((t) => t.price)) : 0,
    minPrice: types.length > 0 ? Math.min(...types.map((t) => t.price)) : 0,
  };

  const handleFormSubmit = async (formData: AnalyticTypeFormData) => {
    try {
      if (editingType) {
        await AnalyticTypeService.update(editingType.id, formData);
        success('Type Updated', `"${formData.name}" has been updated successfully.`);
      } else {
        await AnalyticTypeService.create(formData);
        success('Type Created', `"${formData.name}" has been added to the catalog.`);
      }
      setIsFormOpen(false);
      setEditingType(null);
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save analytic type.';
      toastError('Operation Failed', msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingType) return;
    try {
      const name = deletingType.name;
      await AnalyticTypeService.delete(deletingType.id);
      success('Type Deleted', `"${name}" has been removed from the catalog.`);
      setDeletingType(null);
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete analytic type.';
      toastError('Deletion Failed', msg);
    }
  };

  return (
    <div className="users-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Analytic Types Catalog</h1>
          <p className="page-subtitle">
            Manage parent analytic panels, child tests, units, reference ranges and panel pricing.
          </p>
        </div>

        <div className="page-actions-group">
          <Button
            type="button"
            variant="medical"
            size="md"
            onClick={() => {
              setEditingType(null);
              setIsFormOpen(true);
            }}
            leftIcon={<Icons.Plus size={18} />}
          >
            Add Analytic Type
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <Card variant="glass" className="stat-card">
          <div className="stat-icon-wrapper text-teal" style={{ backgroundColor: 'var(--brand-secondary-light)' }}>
            <Icons.FlaskConical size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Types</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </Card>

        <Card variant="glass" className="stat-card">
          <div className="stat-icon-wrapper text-success" style={{ backgroundColor: '#10b98115' }}>
            <Icons.DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Average Price</span>
            <span className="stat-value">{stats.avgPrice.toFixed(0)} EGP</span>
          </div>
        </Card>

        <Card variant="glass" className="stat-card">
          <div className="stat-icon-wrapper text-warning" style={{ backgroundColor: '#f59e0b15' }}>
            <Icons.Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Highest Price</span>
            <span className="stat-value">{stats.maxPrice.toFixed(0)} EGP</span>
          </div>
        </Card>

        <Card variant="glass" className="stat-card">
          <div className="stat-icon-wrapper text-primary" style={{ backgroundColor: '#3b82f615' }}>
            <Icons.Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Lowest Price</span>
            <span className="stat-value">{stats.minPrice.toFixed(0)} EGP</span>
          </div>
        </Card>
      </div>

      {/* Search Toolbar */}
      <Card variant="default" className="table-toolbar-card">
        <div className="toolbar-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="search-field-wrap">
            <Input
              placeholder="Search by analytic type name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Icons.Search size={16} />}
              rightIcon={
                search ? (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearch('')}
                  >
                    <Icons.X size={14} />
                  </button>
                ) : undefined
              }
            />
          </div>
        </div>

        {search && (
          <div className="active-filters-row">
            <span className="text-xs text-muted font-medium">
              Filtered Results ({filteredTypes.length} found):
            </span>
            <span className="filter-pill">
              Keyword: "{search}"
              <button type="button" onClick={() => setSearch('')}>
                <Icons.X size={12} />
              </button>
            </span>
          </div>
        )}
      </Card>

      {/* Main Data Table */}
      <Card variant="default" className="table-wrapper-card">
        <div className="table-responsive">
          <table className="medical-table collapsible-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Test Name</th>
                <th>Price (EGP)</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty-cell">
                    <div className="empty-state-box">
                      <div className="empty-icon-wrap">
                        <Icons.FlaskConical size={36} className="text-muted" />
                      </div>
                      <h4 className="empty-title">No Analytic Types Found</h4>
                      <p className="empty-desc">
                        {search
                          ? 'No types match your search criteria.'
                          : 'Start by adding your first analytic test type.'}
                      </p>
                      {search ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSearch('')}
                        >
                          Clear Search
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="medical"
                          size="sm"
                          onClick={() => {
                            setEditingType(null);
                            setIsFormOpen(true);
                          }}
                          leftIcon={<Icons.Plus size={16} />}
                        >
                          Add First Type
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTypes.map((type, idx) => (
                  <CollapsibleRow key={type.id} className="table-row-hover" summary={type.name}>
                    <td>
                      <span className="font-mono text-xs text-muted">
                        {idx + 1}
                      </span>
                    </td>
                    <td data-label="Test Name">
                      <div className="staff-cell-flex">
                        <div
                          className="table-avatar"
                          style={{ backgroundColor: 'var(--brand-secondary)' }}
                        >
                          {type.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="staff-meta-cell">
                          <span className="font-semibold text-sm text-main">{type.name}</span>
                          <table className="medical-table" style={{ marginTop: 8 }}>
                            <thead><tr><th>Child Analytic</th><th>Unit</th><th>Reference Range</th></tr></thead>
                            <tbody>{analyticChildren(type).map(child => (
                              <tr key={child.id}><td data-label="Child Analytic"><small>{child.section}</small><div>{child.name}</div><small>{child.resultType || 'text'}</small></td><td data-label="Unit">{child.unit || 'Not specified'}{child.resultType === 'differential' && child.absoluteEnabled && <div>Absolute: {child.absoluteUnit || 'Not specified'}</div>}</td><td data-label="Reference Range" style={{ whiteSpace: 'pre-wrap', minWidth: 200, maxWidth: 360 }}>{child.resultType === 'differential' ? 'Relative: ' : ''}{child.referenceRange || 'Not specified'}
                                {child.resultType === 'differential' && child.absoluteEnabled && <div>Absolute: {child.absoluteReferenceRange || 'Not specified'}</div>}
                                {child.referenceSource && !child.referenceSource.startsWith('https://') && <div className="text-xs text-muted">{child.referenceSource}</div>}
                                {child.referenceSource?.startsWith('https://') && <div><a href={child.referenceSource} target="_blank" rel="noreferrer">Published source</a></div>}
                              </td></tr>
                            ))}</tbody>
                          </table>
                          {type.generalComment && <p style={{ whiteSpace: 'pre-wrap' }}>General Comment: {type.generalComment}</p>}
                        </div>
                      </div>
                    </td>
                    <td data-label="Price">
                      <span className="font-bold text-sm text-teal font-mono">
                        {type.price.toFixed(2)} EGP
                      </span>
                    </td>
                    <td data-label="Created">
                      <span className="text-xs text-muted">
                        {type.createdAt
                          ? new Date(type.createdAt).toLocaleDateString()
                          : '—'}
                      </span>
                    </td>
                    <td data-label="Actions" className="text-right">
                      <div className="actions-cell-group">
                        <button
                          type="button"
                          className="action-icon-btn text-primary"
                          onClick={() => {
                            setEditingType(type);
                            setIsFormOpen(true);
                          }}
                          title="Edit Analytic Type"
                          aria-label={`Edit ${type.name}`}
                        >
                          <Icons.Edit size={17} />
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn text-danger"
                          onClick={() => setDeletingType(type)}
                          title="Delete Analytic Type"
                          aria-label={`Delete ${type.name}`}
                        >
                          <Icons.Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </CollapsibleRow>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="table-pagination-footer">
          <div className="pagination-info">
            Showing <span className="font-semibold text-teal">{filteredTypes.length}</span> analytic {filteredTypes.length === 1 ? 'type' : 'types'}
          </div>
        </div>
      </Card>

      {/* Form Modal */}
      <AnalyticTypeFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingType(null);
        }}
        onSubmit={handleFormSubmit}
        editingType={editingType}
      />

      {/* Delete Confirmation Modal */}
      <DeleteAnalyticTypeModal
        isOpen={!!deletingType}
        onClose={() => setDeletingType(null)}
        onConfirm={handleDeleteConfirm}
        analyticType={deletingType}
      />
    </div>
  );
};
