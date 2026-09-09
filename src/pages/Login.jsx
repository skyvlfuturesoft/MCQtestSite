import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';
import { api } from '../lib/api';
import '../app.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
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
    <div className="app-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img src="/logo-removebg-preview.png" alt="S.A. Engineering College Logo" width={110} height={110} loading="lazy" style={{ width: 110, height: 110, objectFit: 'contain', margin: '0 auto', display: 'block' }} />
            </div>
            <h2>S.A. Engineering College</h2>
            <p>Secure Online Examination Management System</p>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {successMsg && (
            <div style={{
              color: '#065F46',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: 12,
              borderRadius: 6,
              marginBottom: 16,
              fontSize: '0.88rem',
              fontWeight: 500,
              textAlign: 'center'
            }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!showReset ? (
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="newPassword">New Password (Min 6 chars)</label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary auth-button"
              disabled={submitting}
            >
              {submitting ? (showReset ? 'Resetting...' : 'Signing in...') : (showReset ? 'Reset Password' : 'Sign In')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setShowReset(!showReset);
                setError('');
                setSuccessMsg('');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
            >
              {showReset ? 'Back to Sign In' : 'Forgot Password?'}
            </button>
          </div>


          <div className="auth-footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 24, textAlign: 'center', fontWeight: 500 }}>
            Developed by Skyvlfuturesoft
          </div>
        </div>
      </div>
    </div>
  );
}
