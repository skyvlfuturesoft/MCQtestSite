import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Calendar, Clock, Award, Play, RotateCcw } from 'lucide-react';
import '../../app.css';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: examsData, isLoading: isExamsLoading, error: examsError } = useQuery({
    queryKey: ['studentExams'],
    queryFn: () => api('/api/exams'),
    staleTime: 10000,
  });

  const { data: attemptsData, isLoading: isAttemptsLoading, error: attemptsError } = useQuery({
    queryKey: ['studentAttempts'],
    queryFn: () => api('/api/my-attempts'),
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const exams = examsData?.exams || [];
  const attempts = Array.isArray(attemptsData) ? attemptsData : (attemptsData?.attempts || []);
  const loading = isExamsLoading || isAttemptsLoading;
  const error = examsError?.message || attemptsError?.message || '';

  const handleStartExam = async (examId) => {
    try {
      const data = await api(`/api/attempts/start?exam_id=${examId}`, { method: 'POST' });
      navigate(`/student/exam/${data.attempt.id}`);
    } catch (err) {
      alert(err.message || 'Could not start exam');
    }
  };

  const getAttemptStatus = (examId) => {
    const examAttempts = attempts.filter((a) => a.exam_id === examId);
    if (examAttempts.length === 0) return null;
    
    // Prioritize active in_progress or retake_granted status
    const active = examAttempts.find((a) => a.status === 'in_progress' || a.status === 'retake_granted');
    if (active) return active;

    return examAttempts[0];
  };

  return (
    <div className="app-container">
      <div className="container">
        <div className="dashboard-grid">
          <aside className="sidebar-nav">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img src="/logo.png" alt="S.A. Engineering College Logo" style={{ width: 90, height: 90, objectFit: 'contain', margin: '0 auto' }} />
            </div>
            <h3 style={{ marginBottom: 20, textAlign: 'center' }}>Student Portal</h3>
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{user.email}</div>
            </div>
            <ul className="sidebar-links">
              <li><a href="#active" className="active" onClick={(e) => { e.preventDefault(); navigate('/student'); }}>Dashboard</a></li>
              <li><a href="#history" onClick={(e) => { e.preventDefault(); navigate('/student/history'); }}>My Test History</a></li>
              <li><a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Documentation</a></li>
              <li>
                <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); navigate('/login'); }} style={{ color: '#C62828' }}>
                  Sign Out
                </a>
              </li>
            </ul>
          </aside>

          <main className="dashboard-content">
            {error && <div className="auth-error">{error}</div>}

            <div className="dashboard-header">
              <div>
                <h2>Exam Center</h2>
                <p>Select a scheduled exam or review your past attempts</p>
              </div>
            </div>

            <h3 style={{ marginBottom: 20, borderBottom: '1.5px solid var(--border-light)', paddingBottom: 10 }}>
              Available Exams
            </h3>

            <style>{`
              @keyframes skeleton-pulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
              }
              .skeleton-pulse {
                animation: skeleton-pulse 1.5s infinite ease-in-out;
              }
            `}</style>

            {loading ? (
              <div className="exam-list-grid" style={{ marginBottom: 40 }}>
                {[1, 2, 3].map((i) => (
                  <div className="exam-item-card" key={i} style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="skeleton-pulse" style={{ height: 20, width: '75%', background: 'var(--border-light)', borderRadius: 4, marginBottom: 12 }} />
                      <div className="skeleton-pulse" style={{ height: 14, width: '40%', background: 'var(--border-light)', borderRadius: 4, marginBottom: 16 }} />
                      <div className="skeleton-pulse" style={{ height: 14, width: '90%', background: 'var(--border-light)', borderRadius: 4, marginBottom: 8 }} />
                      <div className="skeleton-pulse" style={{ height: 14, width: '60%', background: 'var(--border-light)', borderRadius: 4 }} />
                    </div>
                    <div className="skeleton-pulse" style={{ height: 38, width: '100%', background: 'var(--border-light)', borderRadius: 6, marginTop: 20 }} />
                  </div>
                ))}
              </div>
            ) : exams.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No exams are currently available.</p>
            ) : (
              <div className="exam-list-grid" style={{ marginBottom: 40 }}>
                {exams.map((exam) => {
                  const attempt = getAttemptStatus(exam.id);
                  return (
                    <div className="exam-item-card" key={exam.id}>
                      <div>
                        <div className="exam-item-title">{exam.title}</div>
                        <div className="exam-item-meta">
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={14} />
                            {exam.duration} mins
                          </span>
                        </div>
                        <p className="exam-item-desc">{exam.description || 'No description provided.'}</p>
                      </div>
                      
                      {attempt && attempt.status !== 'in_progress' ? (
                        <div style={{ marginTop: 12 }}>
                          {attempt.status === 'terminated' ? (
                            <div style={{ padding: '8px 12px', background: '#ffebee', color: '#c62828', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
                              Session Terminated
                            </div>
                          ) : (
                            <button
                              className="btn btn-secondary"
                              onClick={() => navigate(`/student/result/${attempt.id}`)}
                              style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                              <Award size={16} />
                              View Score ({attempt.score}/{attempt.total_marks})
                            </button>
                          )}
                        </div>
                      ) : attempt && attempt.status === 'in_progress' ? (
                        <button
                          className="btn btn-primary"
                          onClick={() => navigate(`/student/exam/${attempt.id}`)}
                          style={{ width: '100%', marginTop: 12, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <Play size={16} />
                          Start Exam
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleStartExam(exam.id)}
                          style={{ width: '100%', marginTop: 12, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <Play size={16} />
                          Start Exam
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <h3 style={{ marginBottom: 20, borderBottom: '1.5px solid var(--border-light)', paddingBottom: 10 }}>
              Recent Attempts
            </h3>

            {loading ? (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Date</th>
                      <th>Violations</th>
                      <th>Status</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2].map((i) => (
                      <tr key={i}>
                        <td><div className="skeleton-pulse" style={{ height: 16, width: 150, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 16, width: 80, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 20, width: 60, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 20, width: 80, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 16, width: 40, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : attempts.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>You haven't attempted any exams yet.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Date</th>
                      <th>Violations</th>
                      <th>Status</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => (
                      <tr key={attempt.id} style={{ cursor: 'pointer' }} onClick={() => attempt.status !== 'in_progress' && navigate(`/student/result/${attempt.id}`)}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {attempt.exams?.title}
                        </td>
                        <td>{new Date(attempt.started_at).toLocaleDateString()}</td>
                        <td>
                          <span className={attempt.violation_count > 0 ? 'badge-red' : 'badge-green'}>
                            {attempt.violation_count}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
                            {(attempt.status || 'in_progress').replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {(attempt.status || 'in_progress') === 'in_progress' ? '—' : `${attempt.score} / ${attempt.total_marks}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
