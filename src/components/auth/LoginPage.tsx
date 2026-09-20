import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/ToastContext';
import { Icons } from '../common/Icons';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export const LoginPage: React.FC = () => {
  const { login, resetPassword, isLoading, error: authError } = useAuth();
  const { success } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [resettingPassword, setResettingPassword] = useState(false);

  const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!validEmail(email)) {
      errs.email = 'Enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const ok = await login({ email, password, rememberMe });
    if (ok) success('Authentication Successful', 'Welcome to Bakhet Medical Laboratories LIMS portal.');
  };

  const handlePasswordReset = async () => {
    if (!validEmail(email)) {
      setFormErrors(previous => ({ ...previous, email: 'Enter your email address to reset your password.' }));
      return;
    }
    setFormErrors(previous => ({ ...previous, email: undefined }));
    setResettingPassword(true);
    try {
      if (await resetPassword(email)) {
        success('Reset Requested', 'If this email has an account, a password reset link has been sent.');
      }
    } finally {
      setResettingPassword(false);
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
              <img src={`${import.meta.env.BASE_URL}bakhet-logo.png`} alt="Bakhet Medical Laboratory logo" />
            </div>
            <div>
              <h1 className="brand-title">Bakhet</h1>
              <span className="brand-subtitle">MEDICAL LABORATORIES</span>
            </div>
          </div>

          <div className="login-banner-content">
            <h2 className="banner-headline">
              Precision Diagnostics & Clinical Intelligence
            </h2>
            <p className="banner-description">
              Secure Laboratory Information Management System (LIMS) designed for high-throughput clinical biochemistry, hematology, histopathology, molecular testing, and quality assurance.
            </p>

          </div>

          <div className="login-banner-footer">
            <span>© 2026 Bakhet Medical Laboratories. All rights reserved.</span>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="login-form-pane">
          <div className="login-form-header">
            <div className="mobile-brand-tag">
              <img src={`${import.meta.env.BASE_URL}bakhet-logo.png`} alt="" />
              <span>Bakhet MEDICAL LAB</span>
            </div>
            <h2 className="login-title">Staff Portal Sign In</h2>
            <p className="login-desc">Sign in with your registered staff email and Firebase password.</p>
          </div>

          {authError && (
            <div className="login-error-alert" role="alert">
              <Icons.AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="login-form" noValidate>
            <Input
              label="Email address"
              id="staff-username"
              type="email"
              autoComplete="username"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFormErrors(previous => ({ ...previous, email: undefined })); }}
              error={formErrors.email}
              leftIcon={<Icons.User size={18} />}
              required
            />

            <div className="form-group">
              <Input
                label="Password"
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFormErrors(previous => ({ ...previous, password: undefined })); }}
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
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                className="forgot-link"
                onClick={() => void handlePasswordReset()}
                disabled={isLoading || resettingPassword}
              >
                {resettingPassword ? 'Sending reset link…' : 'Forgot Password?'}
              </button>
            </div>

            <Button
              type="submit"
              variant="medical"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading || resettingPassword}
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
