import React from 'react';
import { useToast } from '../../context/ToastContext';
import { Icons } from './Icons';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <aside className="toast-container" aria-label="Notifications" role="region">
      {toasts.map((toast) => {
        let Icon = Icons.Info;
        if (toast.type === 'success') Icon = Icons.Check;
        if (toast.type === 'error') Icon = Icons.AlertCircle;
        if (toast.type === 'warning') Icon = Icons.ShieldAlert;

        return (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
            <div className="toast-icon">
              <Icon size={18} />
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <Icons.X size={14} />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
