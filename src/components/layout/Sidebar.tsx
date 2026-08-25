import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../common/Icons';
import { RoleBadge } from '../common/Badge';

export type NavView = 'patients';

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: NavView;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'patients',
    label: 'Patients',
    icon: <Icons.Users size={19} />,
    badge: 'Live',
    badgeVariant: 'badge-teal',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  const handleNavClick = (view: NavView) => {
    onSelectView(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`dashboard-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Brand Banner */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Icons.Microscope size={22} className="text-white" />
          </div>
          <div className="sidebar-brand-text">
            <h1 className="sidebar-brand-name">BEKHEIT LAB</h1>
            <span className="sidebar-brand-tag">CLINICAL PATHOLOGY</span>
          </div>
        </div>

        {/* Current Active User Snapshot */}
        {user && (
          <div className="sidebar-user-card">
            <div
              className="user-avatar-sm"
              style={{ backgroundColor: '#0284c7' }}
            >
              {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="user-info-sm">
              <span className="user-name-sm">{user.name}</span>
              <div className="user-role-wrap">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="sidebar-nav-section">
          <span className="sidebar-nav-title">CORE MODULES</span>
          <nav className="sidebar-nav-menu">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-label">{item.label}</span>
                  {item.badge && (
                    <span className={`nav-item-badge ${item.badgeVariant || 'badge-neutral'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Laboratory Status & Accreditations Box */}
        <div className="sidebar-lab-info">
          <div className="lab-info-header">
            <Icons.Award size={16} className="text-teal" />
            <span>Accredited Facility</span>
          </div>
          <p className="lab-info-text">
            Compliant with ISO 15189:2022 & College of American Pathologists standards.
          </p>
          <div className="lab-system-indicator">
            <span className="live-dot" />
            <span>LIS Online: Analyzers Syncing</span>
          </div>
        </div>

        {/* Footer Quick Logout */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={logout}
            title="Sign out of LIMS console"
          >
            <Icons.LogOut size={18} />
            <span>Sign Out Terminal</span>
          </button>
        </div>
      </aside>
    </>
  );
};
