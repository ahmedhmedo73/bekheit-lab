import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Icons } from '../common/Icons';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error: authError } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = 'Staff Medical Email or ID is required.';
    } else if (!email.includes('@') && !email.startsWith('BKL-')) {
      errs.email = 'Please provide a valid staff email or BKL ID.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 4) {
      errs.password = 'Password must be at least 4 characters.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const ok = await login({ email, password, rememberMe });
    if (ok) {
      success('Authentication Successful', 'Welcome to Bekheit Medical Laboratories LIMS portal.');
    } else {
      toastError('Login Failed', 'Please verify your credentials or contact IT administration.');
    }
  };

  return (
    <div className="login-page">
      {/* Visual Ambient Glows */}
      <div className="login-ambient-blob blob-1" />
      <div className="login-ambient-blob blob-2" />

      <div className="login-wrapper">
        {/* Left Side: Clinical Lab Brand Banner */}
        <div className="login-banner">
          <div className="login-brand-header">
            <div className="brand-icon-box">
              <Icons.Microscope size={28} className="text-white" />
            </div>
            <div>
              <h1 className="brand-title">BEKHEIT</h1>
              <span className="brand-subtitle">MEDICAL LABORATORIES</span>
            </div>
          </div>

          <div className="login-banner-content">
            <div className="lab-chip">
              <Icons.Activity size={14} className="animate-pulse" />
              <span>LIMS Enterprise v4.2 • Core Lab Active</span>
            </div>

            <h2 className="banner-headline">
              Precision Diagnostics & Clinical Intelligence
            </h2>
            <p className="banner-description">
              Secure Laboratory Information Management System (LIMS) designed for high-throughput clinical biochemistry, hematology, histopathology, molecular testing, and quality assurance.
            </p>

          </div>

          <div className="login-banner-footer">
            <span>© 2026 Bekheit Medical Laboratories. All rights reserved.</span>
            <span>HIPAA & GDPR Compliant</span>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="login-form-pane">
          <div className="login-form-header">
            <div className="mobile-brand-tag">
              <Icons.Microscope size={20} />
              <span>BEKHEIT MEDICAL LAB</span>
            </div>
            <h2 className="login-title">Staff Portal Sign In</h2>
            <p className="login-desc">Enter your laboratory credentials to access your diagnostic workbench.</p>
          </div>

          {authError && (
            <div className="login-error-alert" role="alert">
              <Icons.AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="login-form" noValidate>
            <Input
              label="Staff Medical Email / ID"
              id="staff-email"
              type="email"
              placeholder="e.g. mohamed.bekheit@bekheitlab.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={formErrors.email}
              leftIcon={<Icons.Mail size={18} />}
              required
            />

            <div className="form-group">
              <Input
                label="Security Password"
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your clinical portal password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={formErrors.password}
                leftIcon={<Icons.Lock size={18} />}
                rightIcon={
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                  </button>
                }
                required
              />
            </div>

            <div className="login-form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember this terminal session</span>
              </label>

              <a
                href="#forgot"
                className="forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('For password resets, contact the Lab Operations Administrator (Ext. 104) or IT Security.');
                }}
              >
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              variant="medical"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<Icons.ChevronRight size={18} />}
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
