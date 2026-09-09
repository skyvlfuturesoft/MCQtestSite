import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, ShieldAlert, Search, RotateCcw } from 'lucide-react';
import '../../app.css';
import '../../proctor.css';

export default function KickLog() {
  const navigate = useNavigate();
  const [kicks, setKicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadKickHistory = async () => {
    try {
      const data = await api('/api/kick-history');
      setKicks(data.kick_logs || []);
    } catch (err) {
      setError(err.message || 'Failed to load kick history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKickHistory();
    const interval = setInterval(loadKickHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReinstate = async (attemptId) => {
    if (confirm('Are you sure you want to reinstate this student? This will clear their violations, reset attempt status to in progress, and allow them to log back in and resume the exam.')) {
      setError('');
      setLoading(true);
      try {
        await api(`/api/admin/attempts/${attemptId}/reinstate`, { method: 'POST' });
        await loadKickHistory();
      } catch (err) {
        setError(err.message || 'Failed to reinstate attempt');
        setLoading(false);
      }
    }
  };

  const handleGrantRetake = async (kick) => {
    if (confirm(`Grant retake to "${kick.student_name || 'Student'}" for exam "${kick.exam_title || 'Exam'}"?\n\nThis will clear all violations and allow them to start the exam from scratch.`)) {
      setError('');
      setLoading(true);
      try {
        await api('/api/admin/grant-retake', {
          method: 'POST',
          body: { attempt_id: kick.attempt_id }
        });
        alert(`✅ Retake granted! ${kick.student_name || 'Student'} can now start fresh from Question 1.`);
        await loadKickHistory();
      } catch (err) {
        setError(err.message || 'Failed to grant retake');
        setLoading(false);
      }
    }
  };

  const filtered = kicks.filter((k) => {
    const term = searchTerm.toLowerCase();
    return (
      (k.student_name || '').toLowerCase().includes(term) ||
      (k.email || '').toLowerCase().includes(term) ||
      (k.exam_title || '').toLowerCase().includes(term) ||
      (k.reason || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="container" style={{ paddingBottom: 48 }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/admin')}
          style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="dashboard-content">
          <div className="dashboard-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={24} style={{ color: '#C62828' }} />
                <h2>Kick Log History</h2>
              </div>
              <p>Complete history of terminated student exam sessions</p>
            </div>
            <div style={{ position: 'relative', minWidth: 250 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                className="form-input"
                placeholder="Search students, exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {filtered.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
              {kicks.length === 0 ? 'No kick records found. No students have been terminated yet.' : 'No results match your search.'}
            </p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table kick-log-table">
                <colgroup>
                  <col style={{ width: '210px' }} />
                  <col style={{ width: '110px' }} />
                  <col style={{ width: '280px' }} />
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '110px' }} />
                  <col style={{ width: '150px' }} />
                  <col style={{ width: '110px' }} />
                  <col style={{ width: '130px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Title</th>
                    <th>Reason & Violations History</th>
                    <th style={{ textAlign: 'center' }}>Strikes</th>
                    <th>Browser</th>
                    <th>Address</th>
                    <th>Date/Time</th>
                    <th style={{ textAlign: 'center' }}>Reinstate</th>
                    <th style={{ textAlign: 'center' }}>Grant Retake</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((kick) => (
                    <tr key={kick.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all' }}>
                          {kick.email || kick.student_name || 'Student'}
                        </div>
                        {kick.student_name && kick.email && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {kick.student_name}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 500 }}>{kick.exam_title || 'Untitled Exam'}</td>
                      <td className="trigger-cell">
                        <div style={{ fontWeight: 600, color: '#C62828', marginBottom: 4 }}>{kick.reason}</div>
                        {kick.violations && kick.violations.length > 0 && (
                          <div style={{ marginTop: 8, fontSize: '0.75rem', backgroundColor: 'rgba(0,0,0,0.03)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.05)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.65rem', marginBottom: 4 }}>
                              Trigger Event Logs:
                            </div>
                            <ul style={{ paddingLeft: 12, margin: 0, color: 'var(--text)' }}>
                              {kick.violations.map((v, idx) => (
                                <li key={v.id || idx} style={{ marginBottom: 2 }}>
                                  <strong>{v.violation_type.replace(/_/g, ' ').toUpperCase()}</strong>
                                  <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>({new Date(v.created_at).toLocaleTimeString()})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td className="strikes-cell">
                        <div className="strikes-content">
                          <div className="strikes-badge">
                            <span className="strikes-num">{kick.violation_count}</span>
                            <span className="strikes-text">Strikes</span>
                          </div>
                        </div>
                      </td>
                      <td>{kick.browser || 'Chrome'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        {kick.ip_address || '127.0.0.1'}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{new Date(kick.created_at).toLocaleString()}</td>
                      <td className="action-cell-td">
                        <button
                          className="btn reinstate-btn"
                          onClick={() => handleReinstate(kick.attempt_id)}
                          title="Resume current exam attempt where student left off"
                        >
                          Reinstate
                        </button>
                      </td>
                      <td className="action-cell-td">
                        <button
                          className="btn grant-retake-btn"
                          onClick={() => handleGrantRetake(kick)}
                          title="Reset exam completely so student can retake from scratch"
                        >
                          <RotateCcw size={14} />
                          <span>Grant Retake</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
