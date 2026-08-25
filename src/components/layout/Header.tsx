import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Icons } from '../common/Icons';
import { RoleBadge } from '../common/Badge';

interface HeaderProps {
  onToggleSidebar?: () => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, activeView }) => {
  const { user, logout } = useAuth();
  const { info, success } = useToast();
  const [time, setTime] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    success('Session Terminated', 'You have been securely signed out of the laboratory portal.');
  };

  const getBreadcrumbTitle = () => {
    switch (activeView) {
      case 'patients':
        return 'Patient Records & Diagnostic Intake';
      default:
        return 'Patient Records';
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Icons.Menu size={20} />
        </button>

        <div className="header-breadcrumb">
          <div className="lab-system-badge">
            <span className="live-indicator-dot" />
            <span>LIMS Core Active</span>
          </div>
          <span className="breadcrumb-separator">/</span>
          <h2 className="breadcrumb-current">{getBreadcrumbTitle()}</h2>
        </div>
      </div>

      <div className="header-right">
        {/* Live Lab Clock */}
        <div className="live-clock-badge" title="Laboratory Standard Real-Time Clock">
          <Icons.Clock size={15} />
          <span className="clock-time">{time}</span>
          <span className="clock-zone">EGY (UTC+3)</span>
        </div>

        {/* Notifications Dropdown */}
        <div className={`dropdown-wrapper ${showNotifications ? 'show-dropdown' : ''}`} ref={notifRef}>
          <button
            type="button"
            className="icon-action-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="System alerts and quality notifications"
          >
            <Icons.Bell size={18} />
            <span className="notification-badge">3</span>
          </button>

          {showNotifications && (
            <div className="dropdown-panel notifications-panel">
              <div className="dropdown-panel-header">
                <h3>Laboratory Alerts</h3>
                <span className="badge badge-teal badge-sm">3 New</span>
              </div>
              <div className="notifications-list">
                <div className="notif-item unread">
                  <div className="notif-icon text-warning">
                    <Icons.ShieldAlert size={16} />
                  </div>
                  <div className="notif-content">
                    <p className="notif-title">Roche Cobas c501 QC Pass</p>
                    <span className="notif-desc">Biochemistry multi-level controls within 2SD limits.</span>
                    <span className="notif-time">12 mins ago</span>
                  </div>
                </div>

                <div className="notif-item unread">
                  <div className="notif-icon text-teal">
                    <Icons.TestTube size={16} />
                  </div>
                  <div className="notif-content">
                    <p className="notif-title">Stat Troponin I Critical Alert</p>
                    <span className="notif-desc">Emergency room sample #BKL-9921 flagged for priority review.</span>
                    <span className="notif-time">28 mins ago</span>
                  </div>
                </div>

                <div className="notif-item">
                  <div className="notif-icon text-purple">
                    <Icons.UserCheck size={16} />
                  </div>
                  <div className="notif-content">
                    <p className="notif-title">Shift Handover Completed</p>
                    <span className="notif-desc">Morning to Evening shift handover verified by Senior Pathologist.</span>
                    <span className="notif-time">1 hr ago</span>
                  </div>
                </div>
              </div>
              <div className="dropdown-panel-footer">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    info('Alerts cleared', 'All laboratory notifications marked as reviewed.');
                    setShowNotifications(false);
                  }}
                >
                  Mark all as acknowledged
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Session Dropdown */}
        {user && (
          <div className={`dropdown-wrapper ${showUserMenu ? 'show-dropdown' : ''}`} ref={userMenuRef}>
            <button
              type="button"
              className="user-profile-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User profile and session menu"
            >
              <div className="user-avatar-badge" style={{ backgroundColor: '#0284c7' }}>
                {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="user-profile-meta">
                <span className="user-name">{user.name}</span>
                <span className="user-dept">{user.roleTitle || user.department}</span>
              </div>
              <Icons.ChevronDown size={14} className="text-muted" />
            </button>

            {showUserMenu && (
              <div className="dropdown-panel user-menu-panel">
                <div className="user-menu-header">
                  <div className="user-menu-avatar">
                    {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="user-menu-info">
                    <p className="user-menu-name">{user.name}</p>
                    <p className="user-menu-email">{user.email}</p>
                    <div className="mt-1">
                      <RoleBadge role={user.role} />
                    </div>
                  </div>
                </div>

                <div className="user-menu-details">
                  <div className="user-detail-row">
                    <span className="detail-label">Staff ID:</span>
                    <span className="detail-val font-mono">{user.staffId || 'BKL-1001'}</span>
                  </div>
                  {user.licenseNumber && (
                    <div className="user-detail-row">
                      <span className="detail-label">Syndicate License:</span>
                      <span className="detail-val font-mono">{user.licenseNumber}</span>
                    </div>
                  )}
                  <div className="user-detail-row">
                    <span className="detail-label">Department:</span>
                    <span className="detail-val">{user.department}</span>
                  </div>
                </div>

                <div className="user-menu-actions">
                  <button
                    type="button"
                    className="menu-action-item text-danger"
                    onClick={handleLogout}
                  >
                    <Icons.LogOut size={16} />
                    <span>Sign Out of LIMS</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
