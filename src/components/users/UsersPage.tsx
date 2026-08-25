import React, { useState, useMemo, useCallback } from 'react';
import type { MedicalStaff, StaffFormData, Department, UserStatus, StaffFilterOptions } from '../../types/user';
import type { UserRole } from '../../types/auth';
import { UserService } from '../../services/userService';
import { StorageService } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Icons } from '../common/Icons';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Card } from '../common/Card';
import { RoleBadge } from '../common/Badge';
import { UserFormModal } from './UserFormModal';
import { UserDetailsModal } from './UserDetailsModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

const DEPARTMENTS_FILTER: { value: Department | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Departments (Entire Lab)' },
  { value: 'Hematology', label: 'Hematology' },
  { value: 'Clinical Biochemistry', label: 'Clinical Biochemistry' },
  { value: 'Microbiology & Parasitology', label: 'Microbiology & Parasitology' },
  { value: 'Immunology & Serology', label: 'Immunology & Serology' },
  { value: 'Histopathology & Cytology', label: 'Histopathology & Cytology' },
  { value: 'Molecular Biology & Genetics', label: 'Molecular Biology & Genetics' },
  { value: 'Quality Assurance & Safety', label: 'Quality Assurance & Safety' },
  { value: 'Administration', label: 'Administration' },
];

const ROLES_FILTER: { value: UserRole | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'ADMIN', label: 'Administrator' },
];

const STATUS_FILTER: { value: UserStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'On Leave', label: 'On Leave' },
  { value: 'In Training', label: 'In Training' },
  { value: 'Suspended', label: 'Suspended' },
];

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [filterOptions, setFilterOptions] = useState<StaffFilterOptions>({
    search: '',
    department: 'ALL',
    role: 'ALL',
    status: 'ALL',
    sortBy: 'staffId',
    sortOrder: 'asc',
    page: 1,
    pageSize: 8,
  });

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedStaffForDetails, setSelectedStaffForDetails] = useState<MedicalStaff | null>(null);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<MedicalStaff | null>(null);
  const [selectedStaffForDelete, setSelectedStaffForDelete] = useState<MedicalStaff | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);

  const refreshList = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Filter & Stats calculation
  const { data: staffList, total, totalPages } = useMemo(() => {
    void refreshKey;
    return UserService.filterUsers(filterOptions);
  }, [filterOptions, refreshKey]);

  const stats = useMemo(() => {
    void refreshKey;
    return UserService.getStats();
  }, [refreshKey]);

  // Handle Form Submission (Create or Edit)
  const handleFormSubmit = (formData: StaffFormData) => {
    try {
      const creatorName = currentUser?.name || 'Authorized Staff';
      if (selectedStaffForEdit) {
        UserService.updateUser(selectedStaffForEdit.id, formData, creatorName);
        success('Staff Record Updated', `Successfully updated profile for ${formData.name}.`);
      } else {
        const created = UserService.createUser(formData, creatorName);
        success('Staff Member Enrolled', `${created.name} registered with ID ${created.staffId}.`);
      }
      setIsFormModalOpen(false);
      setSelectedStaffForEdit(null);
      refreshList();
    } catch (err: any) {
      toastError('Operation Failed', err.message || 'Could not save staff data.');
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    if (!selectedStaffForDelete) return;
    try {
      const name = selectedStaffForDelete.name;
      UserService.deleteUser(selectedStaffForDelete.id);
      success('Staff Member Removed', `${name} has been de-registered from the LIMS.`);
      setSelectedStaffForDelete(null);
      refreshList();
    } catch (err: any) {
      toastError('Deletion Failed', err.message || 'Could not delete staff member.');
    }
  };

  // Handle Status Toggle
  const handleToggleStatus = (staff: MedicalStaff) => {
    try {
      const updated = UserService.toggleUserStatus(staff.id, currentUser?.name || 'Admin');
      info(
        'Status Toggled',
        `${updated.name} status is now marked as ${updated.status}.`
      );
      refreshList();
    } catch (err: any) {
      toastError('Toggle Failed', err.message);
    }
  };

  // Export Staff Data to CSV
  const handleExportCSV = () => {
    const all = UserService.getAllUsers();
    const headers = ['Staff ID', 'Name', 'Email', 'Phone', 'Role', 'Department', 'Specialization', 'License #', 'Shift', 'Status', 'Join Date'];
    const rows = all.map((s) => [
      s.staffId,
      `"${s.name}"`,
      s.email,
      s.phone,
      s.roleTitle,
      `"${s.department}"`,
      `"${s.specialization}"`,
      s.licenseNumber,
      `"${s.shift}"`,
      s.status,
      s.joinDate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bekheit_Lab_Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Export Generated', 'Staff personnel directory downloaded successfully.');
  };

  // Reset to seed data
  const handleResetDefaults = () => {
    if (window.confirm('Reset staff directory to factory default records?')) {
      StorageService.resetToDefault();
      refreshList();
      success('System Reset', 'Restored default clinical laboratory staff members.');
    }
  };

  return (
    <div className="users-page">
      {/* Header Banner */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Medical Staff & Personnel</h1>
          <p className="page-subtitle">
            Manage clinical pathologists, laboratory technologists, biosafety officers, and credentials.
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
            Export Directory (CSV)
          </Button>

          <Button
            type="button"
            variant="medical"
            size="md"
            onClick={() => {
              setSelectedStaffForEdit(null);
              setIsFormModalOpen(true);
            }}
            leftIcon={<Icons.UserPlus size={18} />}
          >
            Enroll New Staff
          </Button>
        </div>
      </div>

      {/* KPI Stats Widgets */}
      <div className="stats-grid">
        <Card variant="glass" className="stat-card">
          <div className="stat-icon-wrapper text-teal" style={{ backgroundColor: '#0d948815' }}>
            <Icons.Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Personnel</span>
            <span className="stat-value">{stats.totalStaff}</span>
            <span className="stat-badge text-teal font-medium">8 Departments Active</span>
          </div>
        </Card>

        <Card variant="glass" className="stat-card">
          <div className="stat-icon-wrapper text-success" style={{ backgroundColor: '#10b98115' }}>
            <Icons.UserCheck size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Active On-Duty</span>
            <span className="stat-value">{stats.activeStaff}</span>
            <span className="stat-badge text-success font-medium">
              {Math.round((stats.activeStaff / (stats.totalStaff || 1)) * 100)}% Laboratory Capacity
            </span>
          </div>
        </Card>

        <Card variant="glass" className="stat-card">
          <div className="stat-icon-wrapper text-purple" style={{ backgroundColor: '#8b5cf615' }}>
            <Icons.ShieldCheck size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">System Administrators</span>
            <span className="stat-value">{stats.admins}</span>
            <span className="stat-badge text-purple font-medium">Full System Authority</span>
          </div>
        </Card>

        <Card variant="glass" className="stat-card">
          <div className="stat-icon-wrapper text-primary" style={{ backgroundColor: '#0284c715' }}>
            <Icons.Award size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Onboarding & Training</span>
            <span className="stat-value">{stats.inTraining}</span>
            <span className="stat-badge text-primary font-medium">Clearance In Review</span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Toolbar */}
      <Card variant="default" className="table-toolbar-card">
        <div className="toolbar-grid">
          {/* Search Box */}
          <div className="search-field-wrap">
            <Input
              placeholder="Search by staff name, ID, license, bench, email..."
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

          {/* Department Filter */}
          <div className="filter-select-wrap">
            <Select
              value={filterOptions.department}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  department: e.target.value as Department | 'ALL',
                  page: 1,
                }))
              }
              options={DEPARTMENTS_FILTER}
              leftIcon={<Icons.Building size={16} />}
            />
          </div>

          {/* Role Filter */}
          <div className="filter-select-wrap">
            <Select
              value={filterOptions.role}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  role: e.target.value as UserRole | 'ALL',
                  page: 1,
                }))
              }
              options={ROLES_FILTER}
              leftIcon={<Icons.Award size={16} />}
            />
          </div>

          {/* Status Filter */}
          <div className="filter-select-wrap">
            <Select
              value={filterOptions.status}
              onChange={(e) =>
                setFilterOptions((prev) => ({
                  ...prev,
                  status: e.target.value as UserStatus | 'ALL',
                  page: 1,
                }))
              }
              options={STATUS_FILTER}
              leftIcon={<Icons.ShieldCheck size={16} />}
            />
          </div>
        </div>

        {/* Active Filters Summary & Reset */}
        {(filterOptions.search ||
          filterOptions.department !== 'ALL' ||
          filterOptions.role !== 'ALL' ||
          filterOptions.status !== 'ALL') && (
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
            {filterOptions.department !== 'ALL' && (
              <span className="filter-pill">
                Dept: {filterOptions.department}
                <button
                  type="button"
                  onClick={() => setFilterOptions((prev) => ({ ...prev, department: 'ALL', page: 1 }))}
                >
                  <Icons.X size={12} />
                </button>
              </span>
            )}
            {filterOptions.role !== 'ALL' && (
              <span className="filter-pill">
                Role: {filterOptions.role}
                <button
                  type="button"
                  onClick={() => setFilterOptions((prev) => ({ ...prev, role: 'ALL', page: 1 }))}
                >
                  <Icons.X size={12} />
                </button>
              </span>
            )}
            {filterOptions.status !== 'ALL' && (
              <span className="filter-pill">
                Status: {filterOptions.status}
                <button
                  type="button"
                  onClick={() => setFilterOptions((prev) => ({ ...prev, status: 'ALL', page: 1 }))}
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
                  department: 'ALL',
                  role: 'ALL',
                  status: 'ALL',
                  sortBy: 'staffId',
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

      {/* Main Staff Data Table */}
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
                    <span>Medical Staff</span>
                    <Icons.ArrowUpDown size={14} className="th-sort-icon" />
                  </div>
                </th>
                <th
                  onClick={() =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      sortBy: 'staffId',
                      sortOrder: prev.sortBy === 'staffId' && prev.sortOrder === 'asc' ? 'desc' : 'asc',
                    }))
                  }
                  className="sortable-th"
                >
                  <div className="th-flex">
                    <span>Staff ID & License</span>
                    <Icons.ArrowUpDown size={14} className="th-sort-icon" />
                  </div>
                </th>
                <th
                  onClick={() =>
                    setFilterOptions((prev) => ({
                      ...prev,
                      sortBy: 'department',
                      sortOrder: prev.sortBy === 'department' && prev.sortOrder === 'asc' ? 'desc' : 'asc',
                    }))
                  }
                  className="sortable-th"
                >
                  <div className="th-flex">
                    <span>Department & Bench</span>
                    <Icons.ArrowUpDown size={14} className="th-sort-icon" />
                  </div>
                </th>
                <th>Role Designation</th>
                <th>Shift Schedule</th>
                <th>Status Toggle</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty-cell">
                    <div className="empty-state-box">
                      <div className="empty-icon-wrap">
                        <Icons.Microscope size={36} className="text-muted" />
                      </div>
                      <h4 className="empty-title">No Medical Staff Found</h4>
                      <p className="empty-desc">
                        No laboratory personnel match your current search or filter criteria.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFilterOptions({
                            search: '',
                            department: 'ALL',
                            role: 'ALL',
                            status: 'ALL',
                            sortBy: 'staffId',
                            sortOrder: 'asc',
                            page: 1,
                            pageSize: 8,
                          })
                        }
                      >
                        Clear Search Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="table-row-hover">
                    {/* Medical Staff Profile */}
                    <td>
                      <div className="staff-cell-flex">
                        <div
                          className="table-avatar"
                          style={{ backgroundColor: staff.avatarColor || '#0284c7' }}
                        >
                          {staff.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="staff-meta-cell">
                          <button
                            type="button"
                            className="staff-name-btn"
                            onClick={() => setSelectedStaffForDetails(staff)}
                          >
                            {staff.name}
                          </button>
                          <span className="staff-email-cell">{staff.email}</span>
                          <span className="staff-phone-cell">{staff.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Staff ID & License */}
                    <td>
                      <div className="id-license-stack">
                        <span className="font-mono font-bold text-teal">{staff.staffId}</span>
                        <span className="font-mono text-xs text-muted">{staff.licenseNumber}</span>
                      </div>
                    </td>

                    {/* Department & Bench */}
                    <td>
                      <div className="dept-bench-cell">
                        <span className="dept-name">{staff.department}</span>
                        <span className="bench-name">{staff.specialization}</span>
                      </div>
                    </td>

                    {/* Role Designation */}
                    <td>
                      <RoleBadge role={staff.role} />
                    </td>

                    {/* Shift */}
                    <td>
                      <div className="shift-cell">
                        <Icons.Clock size={13} className="text-muted" />
                        <span>{staff.shift.split(' ')[0]}</span>
                      </div>
                    </td>

                    {/* Status & Quick Toggle */}
                    <td>
                      <div className="status-toggle-cell">
                        <button
                          type="button"
                          className={`status-toggle-pill ${staff.status.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => handleToggleStatus(staff)}
                          title={`Click to toggle ${staff.name}'s status`}
                        >
                          <span className="status-toggle-dot" />
                          <span>{staff.status}</span>
                        </button>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="text-right">
                      <div className="actions-cell-group">
                        <button
                          type="button"
                          className="action-icon-btn text-teal"
                          onClick={() => setSelectedStaffForDetails(staff)}
                          title="View Full Staff Record"
                          aria-label={`View details for ${staff.name}`}
                        >
                          <Icons.Eye size={17} />
                        </button>

                        <button
                          type="button"
                          className="action-icon-btn text-primary"
                          onClick={() => {
                            setSelectedStaffForEdit(staff);
                            setIsFormModalOpen(true);
                          }}
                          title="Edit Staff Information"
                          aria-label={`Edit ${staff.name}`}
                        >
                          <Icons.Edit size={17} />
                        </button>

                        <button
                          type="button"
                          className="action-icon-btn text-danger"
                          onClick={() => setSelectedStaffForDelete(staff)}
                          title="De-register Personnel"
                          aria-label={`Delete ${staff.name}`}
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

        {/* Table Footer & Pagination */}
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
            of <span className="font-semibold text-teal">{total}</span> laboratory staff members
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

      {/* Bottom Emergency Reset Action */}
      <div className="system-reset-row">
        <button
          type="button"
          className="reset-defaults-link"
          onClick={handleResetDefaults}
        >
          <Icons.RefreshCw size={13} />
          <span>Reset Staff Directory to Lab Defaults</span>
        </button>
      </div>

      {/* Form Modal (Create / Edit) */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedStaffForEdit(null);
        }}
        onSubmit={handleFormSubmit}
        editingStaff={selectedStaffForEdit}
      />

      {/* Details Inspector Modal */}
      <UserDetailsModal
        isOpen={!!selectedStaffForDetails}
        onClose={() => setSelectedStaffForDetails(null)}
        staff={selectedStaffForDetails}
        onEdit={(staff) => {
          setSelectedStaffForDetails(null);
          setSelectedStaffForEdit(staff);
          setIsFormModalOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!selectedStaffForDelete}
        onClose={() => setSelectedStaffForDelete(null)}
        onConfirm={handleDeleteConfirm}
        staff={selectedStaffForDelete}
      />
    </div>
  );
};
