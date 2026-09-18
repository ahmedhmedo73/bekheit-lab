import React, { useState, useEffect, useCallback } from 'react';
import type { Patient, PatientFormData, PatientStatus, PatientFilterOptions } from '../../types/patient';
import { PatientService } from '../../services/patientService';
import { useToast } from '../../context/ToastContext';
import { Icons } from '../common/Icons';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { PatientFormModal } from './PatientFormModal';
import { PatientDetailsModal } from './PatientDetailsModal';
import { DeletePatientModal } from './DeletePatientModal';
import { LabVisitService } from '../../services/labVisitService';

export const PatientsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [filterOptions, setFilterOptions] = useState<PatientFilterOptions>({
    search: '',
    status: 'ALL',
    sortBy: 'patientId',
    sortOrder: 'asc',
    page: 1,
    pageSize: 8,
  });

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<Patient | null>(null);
  const [selectedPatientForEdit, setSelectedPatientForEdit] = useState<Patient | null>(null);
  const [selectedPatientForDelete, setSelectedPatientForDelete] = useState<Patient | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, stat: 0, completed: 0 });
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});

  const refreshList = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const result = await PatientService.filterPatients(filterOptions);
        setPatientList(result.data);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        const counts = await LabVisitService.getCounts(result.data.map(patient => patient.id));
        setVisitCounts(counts);
      } catch (error) {
        console.error('Error loading patients:', error);
        setPatientList([]);
        setTotal(0);
        setTotalPages(1);
      }
    };

    loadPatients();
  }, [filterOptions, refreshKey]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await PatientService.getStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, [refreshKey]);

  const handleFormSubmit = async (formData: PatientFormData) => {
    try {
      if (selectedPatientForEdit) {
        await PatientService.updatePatient(selectedPatientForEdit.id, formData);
        success('Patient Updated', `Record for ${formData.name} updated successfully.`);
      } else {
        const created = await PatientService.createPatient(formData);
        success('Patient Enrolled', `${created.name} registered with ID ${created.patientId}.`);
      }
      setIsFormModalOpen(false);
      setSelectedPatientForEdit(null);
      refreshList();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save patient data.';
      toastError('Operation Failed', message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPatientForDelete) return;
    try {
      const name = selectedPatientForDelete.name;
      await PatientService.deletePatient(selectedPatientForDelete.id);
      success('Patient Removed', `${name}'s record has been removed.`);
      setSelectedPatientForDelete(null);
      refreshList();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not delete patient.';
      toastError('Deletion Failed', message);
    }
  };

  const handleExportCSV = async () => {
    const all = await PatientService.getAllPatients();
    const headers = ['Patient ID', 'Name', 'Age', 'Phone', 'Subtitle', 'Gender', 'Status', 'Registered Date'];
    const rows = all.map((p) => [
      p.patientId,
      `"${p.name}"`,
      p.age,
      p.phone,
      `"${p.subtitle}"`,
      p.gender || '',
      p.status,
      p.registeredDate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bakhet_Lab_Patients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Export Generated', 'Patient directory downloaded successfully.');
  };

  const handleStatusChange = async (patient: Patient, newStatus: PatientStatus) => {
    if (patient.status === newStatus) return;
    try {
      await PatientService.updatePatientStatus(patient.id, newStatus);
      success('Status Updated', `${patient.name}'s status changed to "${newStatus}".`);
      refreshList();
      if (selectedPatientForDetails && selectedPatientForDetails.id === patient.id) {
        setSelectedPatientForDetails({ ...selectedPatientForDetails, status: newStatus });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not update status.';
      toastError('Update Failed', message);
    }
  };

  return (
    <div className="users-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Patient Records & Diagnostic Intake</h1>
          <p className="page-subtitle">
            Manage patient demographics, age, contact numbers, and clinical test subtitles.
          </p>
        </div>

        <div className="page-actions-group">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleExportCSV}
            leftIcon={<Icons.FileText size={16} />}
          >
            Export CSV
          </Button>

          <Button
            type="button"
            variant="medical"
            size="md"
            onClick={() => {
              setSelectedPatientForEdit(null);
              setIsFormModalOpen(true);
            }}
            leftIcon={<Icons.UserPlus size={18} />}
          >
            Add New Patient
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid">
        <Card variant="glass" className="stat-card">
          <div className="stat-icon-wrapper text-teal" style={{ backgroundColor: 'var(--brand-secondary-light)' }}>
            <Icons.Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Patients</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card variant="default" className="table-toolbar-card">
        <div className="toolbar-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="search-field-wrap">
            <Input
              placeholder="Search by patient ID, patient name, phone, job title or subtitle..."
              value={filterOptions.search}
              onChange={(e) =>
                setFilterOptions((prev) => ({ ...prev, search: e.target.value, page: 1 }))
              }
              leftIcon={<Icons.Search size={16} />}
              rightIcon={
                filterOptions.search ? (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setFilterOptions((prev) => ({ ...prev, search: '', page: 1 }))}
                  >
                    <Icons.X size={14} />
                  </button>
                ) : undefined
              }
            />
          </div>
        </div>

        {filterOptions.search && (
          <div className="active-filters-row">
            <span className="text-xs text-muted font-medium">Filtered Results ({total} found):</span>
            {filterOptions.search && (
              <span className="filter-pill">
                Keyword: "{filterOptions.search}"
                <button
                  type="button"
                  onClick={() => setFilterOptions((prev) => ({ ...prev, search: '', page: 1 }))}
                >
                  <Icons.X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              className="clear-all-filters-btn"
              onClick={() =>
                setFilterOptions({
                  search: '',
                  status: 'ALL',
                  sortBy: 'patientId',
                  sortOrder: 'asc',
                  page: 1,
                  pageSize: 8,
                })
              }
            >
              Reset Filters
            </button>
          </div>
        )}
      </Card>

      {/* Main Patient Data Table */}
      <Card variant="default" className="table-wrapper-card">
        <div className="table-responsive">
          <table className="medical-table">
            <thead>
              <tr>
                <th
                  onClick={() =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      sortBy: 'name',
                      sortOrder: prev.sortBy === 'name' && prev.sortOrder === 'asc' ? 'desc' : 'asc',
                    }))
                  }
                  className="sortable-th"
                >
                  <div className="th-flex">
                    <span>Patient Name</span>
                    <Icons.ArrowUpDown size={14} className="th-sort-icon" />
                  </div>
                </th>
                <th
                  onClick={() =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      sortBy: 'age',
                      sortOrder: prev.sortBy === 'age' && prev.sortOrder === 'asc' ? 'desc' : 'asc',
                    }))
                  }
                  className="sortable-th"
                >
                  <div className="th-flex">
                    <span>Age</span>
                    <Icons.ArrowUpDown size={14} className="th-sort-icon" />
                  </div>
                </th>
                <th>Phone Number</th>
                <th>Job Title</th>
                <th>Clinical Subtitle</th>
                <th>Lab Visits</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patientList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty-cell">
                    <div className="empty-state-box">
                      <div className="empty-icon-wrap">
                        <Icons.Users size={36} className="text-muted" />
                      </div>
                      <h4 className="empty-title">No Patients Found</h4>
                      <p className="empty-desc">
                        No patient intake records match your search criteria.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFilterOptions({
                            search: '',
                            status: 'ALL',
                            sortBy: 'patientId',
                            sortOrder: 'asc',
                            page: 1,
                            pageSize: 8,
                          })
                        }
                      >
                        Clear Search
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                patientList.map((patient) => (
                  <tr key={patient.id} className="table-row-hover">
                    {/* Patient Name + ID */}
                    <td>
                      <div className="staff-cell-flex">
                        <div
                          className="table-avatar"
                          style={{ backgroundColor: patient.avatarColor || 'var(--brand-primary)' }}
                        >
                          {patient.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="staff-meta-cell">
                          <button
                            type="button"
                            className="staff-name-btn"
                            onClick={() => setSelectedPatientForDetails(patient)}
                          >
                            {patient.name}
                          </button>
                          <span className="font-mono text-xs text-teal font-bold">{patient.patientId}</span>
                        </div>
                      </div>
                    </td>

                    {/* Age */}
                    <td>
                      <span className="font-bold text-sm">{patient.age}</span>
                    </td>

                    {/* Phone Number */}
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-sm">{patient.phone}</span>
                      </div>
                    </td>

                    {/* Job Title */}
                    <td>
                      <span className="font-medium text-sm">{patient.jobTitle || '—'}</span>
                    </td>

                    {/* Subtitle */}
                    <td>
                      <div className="dept-bench-cell">
                        <span className="font-semibold text-sm text-main">{patient.subtitle}</span>
                        <span className="text-xs text-muted">Registered: {patient.registeredDate}</span>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td><span className="font-mono font-bold text-teal">{visitCounts[patient.id] ?? 0}</span></td>
                    <td className="text-right">
                      <div className="actions-cell-group">
                        <button
                          type="button"
                          className="action-icon-btn text-teal"
                          onClick={() => setSelectedPatientForDetails(patient)}
                          title="View Patient Record"
                          aria-label={`View details for ${patient.name}`}
                        >
                          <Icons.Eye size={17} />
                        </button>

                        <button
                          type="button"
                          className="action-icon-btn text-primary"
                          onClick={() => {
                            setSelectedPatientForEdit(patient);
                            setIsFormModalOpen(true);
                          }}
                          title="Edit Patient Information"
                          aria-label={`Edit ${patient.name}`}
                        >
                          <Icons.Edit size={17} />
                        </button>

                        <button
                          type="button"
                          className="action-icon-btn text-danger"
                          onClick={() => setSelectedPatientForDelete(patient)}
                          title="Delete Patient Record"
                          aria-label={`Delete ${patient.name}`}
                        >
                          <Icons.Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="table-pagination-footer">
          <div className="pagination-info">
            Showing{' '}
            <span className="font-semibold text-teal">
              {total === 0 ? 0 : (filterOptions.page - 1) * filterOptions.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-teal">
              {Math.min(filterOptions.page * filterOptions.pageSize, total)}
            </span>{' '}
            of <span className="font-semibold text-teal">{total}</span> registered patients
          </div>

          <div className="pagination-controls">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filterOptions.page <= 1}
              onClick={() => setFilterOptions((prev) => ({ ...prev, page: prev.page - 1 }))}
              leftIcon={<Icons.ChevronLeft size={16} />}
            >
              Previous
            </Button>

            <span className="page-indicator">
              Page {filterOptions.page} of {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filterOptions.page >= totalPages}
              onClick={() => setFilterOptions((prev) => ({ ...prev, page: prev.page + 1 }))}
              rightIcon={<Icons.ChevronRight size={16} />}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Form Modal */}
      <PatientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedPatientForEdit(null);
        }}
        onSubmit={handleFormSubmit}
        editingPatient={selectedPatientForEdit}
      />

      {/* Details Modal */}
      <PatientDetailsModal
        isOpen={!!selectedPatientForDetails}
        onClose={() => setSelectedPatientForDetails(null)}
        patient={selectedPatientForDetails}
        onEdit={(patient) => {
          setSelectedPatientForDetails(null);
          setSelectedPatientForEdit(patient);
          setIsFormModalOpen(true);
        }}
        onStatusChange={handleStatusChange}
      />

      {/* Delete Confirmation Modal */}
      <DeletePatientModal
        isOpen={!!selectedPatientForDelete}
        onClose={() => setSelectedPatientForDelete(null)}
        onConfirm={handleDeleteConfirm}
        patient={selectedPatientForDelete}
      />
    </div>
  );
};
