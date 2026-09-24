import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  ArrowRight, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { api } from '../lib/api';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    logout();
    setSubmitting(true);
    try {
      if (showReset) {
        if (newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters.');
        }
        await api('/api/auth/reset-password', {
          method: 'POST',
          body: { email, new_password: newPassword }
        });
        setSuccessMsg('Password reset successful! You can now sign in.');
        setShowReset(false);
      } else {
        const user = await login(email, password);
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="saec-login-page">
      <div className="saec-login-bg-img" />
      <div className="saec-bg-grid" />
      <div className="saec-bg-wave" />

      <div className="saec-login-container">
        
        {/* LEFT COLUMN — PROMOTIONAL & BRANDING */}
        <div className="saec-login-left">
          <div className="saec-brand-badge">
            S.A. ENGINEERING COLLEGE
          </div>

          <h1 className="saec-hero-heading">
            Online Examination <br />
            <span className="saec-hero-heading-highlight">Management System</span>
          </h1>

          <div className="saec-tagline-wrapper">
            <span className="saec-handwritten-tag">Learn · Practice · Grow</span>
          </div>

          <p className="saec-hero-subtext">
            Take tests, track your progress, and perform better with a simple and secure platform.
          </p>

          <div className="saec-features-list">
            <div className="saec-feature-item">
              <div className="saec-feature-icon blue">
                <FileText size={22} />
              </div>
              <div className="saec-feature-info">
                <h4>Take Tests</h4>
                <p>Anytime, Anywhere</p>
              </div>
            </div>

            <div className="saec-feature-item">
              <div className="saec-feature-icon green">
                <BarChart3 size={22} />
              </div>
              <div className="saec-feature-info">
                <h4>Track Progress</h4>
                <p>View Scores & History</p>
              </div>
            </div>

            <div className="saec-feature-item">
              <div className="saec-feature-icon purple">
                <ShieldCheck size={22} />
              </div>
              <div className="saec-feature-info">
                <h4>Secure & Reliable</h4>
                <p>Your Data is Safe</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — LOGIN CARD */}
        <div className="saec-login-right">
          <div className="saec-card">
            
            {/* College Logo & Headers */}
            <div className="saec-card-header">
              <img 
                src="/logo-removebg-preview.png" 
                alt="S.A. Engineering College Logo" 
                className="saec-logo-img"
              />
              <h2 className="saec-college-name">S.A. Engineering College</h2>
              <p className="saec-system-subtitle">Online Examination Management System</p>
              <div className="saec-divider-pill" />
            </div>

            {/* Student Login Title */}
            <div className="saec-login-header">
              <div className="saec-cap-badge">
                <GraduationCap size={24} />
              </div>
              <h3 className="saec-login-title">
                {showReset ? 'Reset Password' : 'Student Login'}
              </h3>
              <p className="saec-login-desc">
                {showReset 
                  ? 'Enter your account email and new password to reset.' 
                  : 'Access your tests, track your progress, and perform your best.'
                }
              </p>
            </div>

            {/* Error & Success Feedback Alerts */}
            {error && (
              <div className="saec-alert-error" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="saec-alert-success" role="status">
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login / Reset Form */}
            <form onSubmit={handleSubmit} noValidate>
              
              {/* Email / Register Number Field */}
              <div className="saec-form-field">
                <label htmlFor="email" className="saec-form-label">
                  Email or Register Number
                </label>
                <div className="saec-input-wrapper">
                  <Mail size={18} className="saec-input-icon-left" />
                  <input
                    id="email"
                    type="email"
                    className="saec-input"
                    placeholder="Enter your Email or Register Number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field / New Password Field */}
              {!showReset ? (
                <div className="saec-form-field">
                  <label htmlFor="password" className="saec-form-label">
                    Password
                  </label>
                  <div className="saec-input-wrapper">
                    <Lock size={18} className="saec-input-icon-left" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="saec-input saec-input-with-toggle"
                      placeholder="Enter your Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="saec-toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="saec-form-field">
                  <label htmlFor="newPassword" className="saec-form-label">
                    New Password (Min 6 chars)
                  </label>
                  <div className="saec-input-wrapper">
                    <Lock size={18} className="saec-input-icon-left" />
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="saec-input saec-input-with-toggle"
                      placeholder="Enter your New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="saec-toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot Password Toggle Link */}
              <div className="saec-form-options">
                <button
                  type="button"
                  className="saec-forgot-btn"
                  onClick={() => {
                    setShowReset(!showReset);
                    setError('');
                    setSuccessMsg('');
                  }}
                >
                  {showReset ? 'Back to Sign In' : 'Forgot Password?'}
                </button>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                className="saec-submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="saec-btn-spinner" />
                    <span>{showReset ? 'Resetting...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <>
                    <span>{showReset ? 'Reset Password' : 'Sign In'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Registration Link */}
            <div className="saec-card-footer">
              <span>Don't have an account?</span>
              <Link to="/register">Register here</Link>
            </div>

            {/* Developed Credit */}
            <div className="saec-developed-tag">
              Developed for S.A. Engineering College
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
