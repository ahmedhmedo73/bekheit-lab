import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import type { NavView } from './components/layout/Sidebar';
import { PatientsPage } from './components/patients/PatientsPage';
import './scripts/migrateToFirestore';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeView, setActiveView] = useState<NavView>('patients');

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="flex items-center gap-3 text-white">
          <div className="btn-spinner" style={{ width: 28, height: 28 }} />
          <span className="text-sm font-semibold">Initializing Bekheit LIMS Core...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout activeView={activeView} onSelectView={setActiveView}>
      <PatientsPage />
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
}
