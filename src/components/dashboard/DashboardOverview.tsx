import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserService } from '../../services/userService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge, RoleBadge } from '../common/Badge';
import { Icons } from '../common/Icons';
import type { NavView } from '../layout/Sidebar';

interface DashboardOverviewProps {
  onNavigate: (view: NavView) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const users = UserService.getAllUsers();
  const activeStaff = users.filter((u) => u.status === 'Active');

  return (
    <div className="dashboard-overview">
      {/* Welcome Banner */}
      <div className="overview-welcome-banner">
        <div className="welcome-meta">
          <div className="welcome-badge">
            <Icons.ShieldCheck size={14} className="text-teal" />
            <span>Bekheit Clinical Laboratories • Central Branch LIMS</span>
          </div>
          <h1 className="welcome-title">
            Welcome back, {user?.name || 'Doctor'}
          </h1>
          <p className="welcome-desc">
            Diagnostic analyzers are calibrated and synchronized. All sections are operating under ISO 15189 standard operating procedures.
          </p>
        </div>

        <div className="welcome-actions">
          <Button
            type="button"
            variant="medical"
            size="md"
            onClick={() => onNavigate('users')}
            leftIcon={<Icons.Users size={18} />}
          >
            Manage Laboratory Personnel ({users.length})
          </Button>
        </div>
      </div>

      {/* Lab Throughput & Staffing Grid */}
      <div className="overview-stats-grid">
        <Card variant="glass" className="stat-widget">
          <div className="stat-widget-head">
            <span className="stat-widget-title">Active Shift Personnel</span>
            <div className="stat-widget-icon text-teal">
              <Icons.Users size={20} />
            </div>
          </div>
          <div className="stat-widget-value">{activeStaff.length} <span className="text-sm font-normal text-muted">/ {users.length} Total</span></div>
          <div className="stat-widget-trend text-success">
            <Icons.Check size={14} />
            <span>Full coverage across all 8 diagnostic sections</span>
          </div>
        </Card>

        <Card variant="glass" className="stat-widget">
          <div className="stat-widget-head">
            <span className="stat-widget-title">Today's Specimen Intake</span>
            <div className="stat-widget-icon text-primary">
              <Icons.TestTube size={20} />
            </div>
          </div>
          <div className="stat-widget-value">482 <span className="text-sm font-normal text-muted">Samples</span></div>
          <div className="stat-widget-trend text-teal">
            <Icons.Activity size={14} />
            <span>98.4% On-time Turnaround Time (TAT)</span>
          </div>
        </Card>

        <Card variant="glass" className="stat-widget">
          <div className="stat-widget-head">
            <span className="stat-widget-title">Critical & STAT Alerts</span>
            <div className="stat-widget-icon text-warning">
              <Icons.ShieldAlert size={20} />
            </div>
          </div>
          <div className="stat-widget-value">3 <span className="text-sm font-normal text-muted">Actionable</span></div>
          <div className="stat-widget-trend text-warning">
            <Icons.AlertCircle size={14} />
            <span>Pathology phone sign-off in progress</span>
          </div>
        </Card>

        <Card variant="glass" className="stat-widget">
          <div className="stat-widget-head">
            <span className="stat-widget-title">Internal QC Compliance</span>
            <div className="stat-widget-icon text-purple">
              <Icons.Award size={20} />
            </div>
          </div>
          <div className="stat-widget-value">99.8%</div>
          <div className="stat-widget-trend text-purple">
            <Icons.Check size={14} />
            <span>Westgard Multi-rules Validated</span>
          </div>
        </Card>
      </div>

      {/* 2-Column Operational Grid */}
      <div className="overview-two-col">
        {/* Left Column: On-Duty Medical Staff Roster */}
        <Card variant="default" className="overview-panel">
          <div className="panel-header">
            <div className="panel-header-title">
              <Icons.Users size={18} className="text-teal" />
              <h3>On-Duty Medical Personnel</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onNavigate('users')}
              rightIcon={<Icons.ChevronRight size={14} />}
            >
              View Full Staff List
            </Button>
          </div>

          <div className="on-duty-list">
            {activeStaff.slice(0, 5).map((staff) => (
              <div key={staff.id} className="on-duty-item">
                <div
                  className="table-avatar"
                  style={{ backgroundColor: staff.avatarColor || '#0284c7' }}
                >
                  {staff.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="on-duty-meta">
                  <span className="on-duty-name">{staff.name}</span>
                  <span className="on-duty-dept">{staff.department} • {staff.specialization}</span>
                </div>
                <div className="on-duty-badges">
                  <RoleBadge role={staff.role} />
                  <StatusBadge status={staff.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Column: Active Laboratory Sections & Analyzer Status */}
        <Card variant="default" className="overview-panel">
          <div className="panel-header">
            <div className="panel-header-title">
              <Icons.Microscope size={18} className="text-teal" />
              <h3>Laboratory Section Diagnostic Benches</h3>
            </div>
          </div>

          <div className="bench-list">
            <div className="bench-item">
              <div className="bench-info">
                <span className="bench-name">Clinical Biochemistry Bench</span>
                <span className="bench-equipment">Roche Cobas 6000 & Abbott Architect c8000</span>
              </div>
              <span className="badge badge-success badge-sm">Online • 186/hr</span>
            </div>

            <div className="bench-item">
              <div className="bench-info">
                <span className="bench-name">Hematology & Coagulation Bench</span>
                <span className="bench-equipment">Sysmex XN-1000 & Stago Compact Max</span>
              </div>
              <span className="badge badge-success badge-sm">Online • 94/hr</span>
            </div>

            <div className="bench-item">
              <div className="bench-info">
                <span className="bench-name">Histopathology & Cytology Bench</span>
                <span className="bench-equipment">Leica Autostainer XL & Cryostat CM1950</span>
              </div>
              <span className="badge badge-purple badge-sm">Slide Review Active</span>
            </div>

            <div className="bench-item">
              <div className="bench-info">
                <span className="bench-name">Molecular Diagnostics & PCR Bench</span>
                <span className="bench-equipment">Bio-Rad CFX96 & Illumina NextSeq 550</span>
              </div>
              <span className="badge badge-teal badge-sm">Amplification in Run</span>
            </div>

            <div className="bench-item">
              <div className="bench-info">
                <span className="bench-name">Microbiology & Bacterial Culture Bench</span>
                <span className="bench-equipment">BD BACTEC FX & bioMérieux VITEK 2</span>
              </div>
              <span className="badge badge-warning badge-sm">Incubation Cycle 48h</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
