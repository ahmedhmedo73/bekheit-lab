import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import type { NavView } from './components/layout/Sidebar';
import { PatientsPage } from './components/patients/PatientsPage';
import { LabVisitsPage } from './components/visits/LabVisitsPage';
import { AnalyticTypesPage } from './components/analytics/AnalyticTypesPage';
import { UsersPage } from './components/users/UsersPage';
import './scripts/migrateToFirestore';
import { GlobalRequestLoader } from './components/common/GlobalRequestLoader';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeView, setActiveView] = useState<NavView>('patients');

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="flex items-center gap-3 text-white">
          <div className="btn-spinner" style={{ width: 28, height: 28 }} />
          <span className="text-sm font-semibold">Initializing Bakhet LIMS Core...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'analytics':
        return <AnalyticTypesPage />;
      case 'results':
        return <LabVisitsPage />;
      case 'users':
        return <UsersPage />;
      case 'patients':
      default:
        return <PatientsPage />;
    }
  };

  return (
    <DashboardLayout activeView={activeView} onSelectView={setActiveView}>
      {renderActiveView()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
        <GlobalRequestLoader />
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
}
