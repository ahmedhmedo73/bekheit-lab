import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../common/Icons';

export type NavView = 'patients' | 'results' | 'analytics' | 'samples' | 'tests' | 'qc' | 'settings' | 'users';

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
  {
    id: 'results',
    label: 'Lab Visits',
    icon: <Icons.ClipboardList size={19} />,
  },
  {
    id: 'analytics',
    label: 'Analytic Types',
    icon: <Icons.FlaskConical size={19} />,
  },
  {
    id: 'users',
    label: 'Medical Staff',
    icon: <Icons.ShieldCheck size={19} />,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isOpen,
  onCloseMobile,
}) => {
  const { logout } = useAuth();

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
            <img src={`${import.meta.env.BASE_URL}bakhet-logo.png`} alt="Bakhet Medical Laboratory logo" />
          </div>
          <div className="sidebar-brand-text">
            <h1 className="sidebar-brand-name">BAKHET LAB</h1>
            <span className="sidebar-brand-tag">CLINICAL PATHOLOGY</span>
          </div>
        </div>

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
                </button>
              );
            })}
          </nav>
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
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
