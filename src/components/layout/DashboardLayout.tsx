import React, { type ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar, type NavView } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  activeView: NavView;
  onSelectView: (view: NavView) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeView,
  onSelectView,
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="dashboard-container">
      <Sidebar
        activeView={activeView}
        onSelectView={onSelectView}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="dashboard-main">
        <Header
          activeView={activeView}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="dashboard-content">
          <div className="content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
};
