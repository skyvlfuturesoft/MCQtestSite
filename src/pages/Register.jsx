import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';
import '../app.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await register(name, email, password, role);
      // If session token exists (email confirmation disabled) → auto login & redirect
      if (data.session?.access_token) {
        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      } else {
        // Email confirmation is enabled — redirect to login with a success notice
        navigate('/login', {
          state: { message: 'Registration successful! Please check your email to confirm your account, then log in.' }
        });
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
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
              <img src="/logo-removebg-preview.png" alt="S.A. Engineering College Logo" style={{ width: 110, height: 110, objectFit: 'contain', margin: '0 auto', display: 'block' }} />
            </div>
            <h2>S.A. Engineering College</h2>
            <p>Secure Online Examination Management System</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            <div className="form-group">
              <label htmlFor="role">I am a</label>
              <select
                id="role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-button"
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
