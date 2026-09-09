import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Users, BookOpen, AlertTriangle, Play, Award, ClipboardList, PlusCircle, Radio } from 'lucide-react';
import AdminNotifications from '../../components/admin/AdminNotifications';
import '../../app.css';
import '../../proctor.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const { data: statsData, isLoading: isStatsLoading, error: statsError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api('/api/monitor/stats'),
    refetchInterval: 10000,
  });

  const { data: examsData, isLoading: isExamsLoading, error: examsError, refetch: refetchExams } = useQuery({
    queryKey: ['adminExams'],
    queryFn: () => api('/api/exams'),
    staleTime: 10000,
  });

  const stats = statsData || {
    total_students: 0,
    total_exams: 0,
    active_attempts: 0,
    completed_attempts: 0,
    total_violations: 0,
  };
  const exams = examsData?.exams || [];
  const error = examsError?.message || statsError?.message || '';


  const handlePublishToggle = async (examId, currentStatus) => {
    try {
      await api(`/api/exams/${examId}`, {
        method: 'PUT',
        body: { is_published: !currentStatus }
      });
      refetchExams();
    } catch (err) {
      alert(err.message || 'Failed to update exam status');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (confirm('Are you sure you want to delete this draft exam? This action is permanent and cannot be undone.')) {
      try {
        await api(`/api/exams/${examId}`, { method: 'DELETE' });
        refetchExams();
        alert('Draft exam deleted successfully!');
      } catch (err) {
        alert(err.message || 'Failed to delete exam');
      }
    }
  };

  const handleDuplicateExam = async (exam) => {
    if (confirm(`Duplicate the exam "${exam.title}"? This will copy all its details and questions.`)) {
      try {
        setIsDuplicating(true);
        const questionsRes = await api(`/api/exams/${exam.id}/questions`);
        const targetQuestions = questionsRes.questions || [];

        const duplicatedExam = await api('/api/exams', {
          method: 'POST',
          body: {
            title: `${exam.title} (Copy)`,
            description: exam.description,
            duration: exam.duration,
            start_time: exam.start_time,
            end_time: exam.end_time,
            negative_marking: exam.negative_marking,
            pass_threshold: exam.pass_threshold,
            max_violations: exam.max_violations,
            allowed_violations: exam.allowed_violations
          }
        });
        const newExamId = duplicatedExam.exam.id;

        for (const q of targetQuestions) {
          await api('/api/questions', {
            method: 'POST',
            body: {
              exam_id: newExamId,
              question_text: q.question_text,
              question_type: q.question_type || 'mcq',
              image_url: q.image_url || '',
              options: q.options || [],
              correct_answer: q.correct_answer !== undefined ? q.correct_answer : 0,
              accepted_answers: q.accepted_answers || [],
              marks: q.marks
            }
          });
        }

        await refetchExams();
        alert('Exam duplicated successfully!');
      } catch (err) {
        alert(err.message || 'Failed to duplicate exam');
      } finally {
        setIsDuplicating(false);
      }
    }
  };

  return (
    <div className="app-container">
      <div className="container">
        <div className="dashboard-grid">
          <aside className="sidebar-nav">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <img src="/logo-removebg-preview.png" alt="S.A. Engineering College Logo" width={90} height={90} loading="lazy" style={{ width: 90, height: 90, objectFit: 'contain', margin: '0 auto', display: 'block' }} />
            </div>
            <h3 style={{ marginBottom: 20, textAlign: 'center' }}>Admin Portal</h3>
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{user.email}</div>
            </div>
            <ul className="sidebar-links">
              <li><a href="#dashboard" className="active">Dashboard</a></li>
              <li><a href="#create" onClick={(e) => { e.preventDefault(); navigate('/admin/create-exam'); }}>Create Exam</a></li>
              <li><a href="#monitor" onClick={(e) => { e.preventDefault(); navigate('/admin/monitor'); }}>Live Monitor</a></li>
              <li><a href="#results" onClick={(e) => { e.preventDefault(); navigate('/admin/results'); }}>View Results</a></li>
              <li><a href="#kick-log" onClick={(e) => { e.preventDefault(); navigate('/admin/kick-log'); }}>Kick Log</a></li>
              <li><a href="#analytics" onClick={(e) => { e.preventDefault(); navigate('/admin/analytics'); }}>Analytics</a></li>
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
                <h2>Overview Dashboard</h2>
                <p>Monitor platform statistics, manage schedules, and track activity</p>
              </div>
            </div>

            <style>{`
              @keyframes skeleton-pulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
              }
              .skeleton-pulse {
                animation: skeleton-pulse 1.5s infinite ease-in-out;
              }
            `}</style>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 24,
              marginBottom: 40
            }}>
              {isStatsLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <div className="stat-card" key={i}>
                    <div className="skeleton-pulse" style={{ width: 40, height: 40, background: 'var(--border-light)', borderRadius: '50%', marginBottom: 12 }} />
                    <div className="skeleton-pulse" style={{ height: 28, width: 60, background: 'var(--border-light)', borderRadius: 4, marginBottom: 8 }} />
                    <div className="skeleton-pulse" style={{ height: 16, width: 120, background: 'var(--border-light)', borderRadius: 4 }} />
                  </div>
                ))
              ) : (
                <>
                  <div className="stat-card">
                    <div className="stat-icon"><Users size={24} /></div>
                    <div className="stat-number">{stats.total_students}</div>
                    <div className="stat-label">Registered Students</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><BookOpen size={24} /></div>
                    <div className="stat-number">{stats.total_exams}</div>
                    <div className="stat-label">Total Exams</div>
                  </div>
                  <div className="stat-card" style={{ borderColor: stats.active_attempts > 0 ? 'var(--primary)' : '' }}>
                    <div className="stat-icon" style={{ color: stats.active_attempts > 0 ? 'var(--primary)' : '' }}><Radio size={24} /></div>
                    <div className="stat-number" style={{ color: stats.active_attempts > 0 ? 'var(--primary)' : '' }}>{stats.active_attempts}</div>
                    <div className="stat-label">Live Active Attempts</div>
                  </div>
                  <div className="stat-card" style={{ borderColor: stats.total_violations > 0 ? '#FFCDD2' : '' }}>
                    <div className="stat-icon" style={{ color: stats.total_violations > 0 ? '#C62828' : '' }}><AlertTriangle size={24} /></div>
                    <div className="stat-number" style={{ color: stats.total_violations > 0 ? '#C62828' : '' }}>{stats.total_violations}</div>
                    <div className="stat-label">Logged Violations</div>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1.5px solid var(--border-light)', paddingBottom: 10 }}>
              <h3 style={{ margin: 0 }}>Examinations</h3>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/admin/create-exam')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <PlusCircle size={16} />
                Create Exam
              </button>
            </div>



            {isExamsLoading ? (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th>Duration</th>
                      <th>Created By</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td><div className="skeleton-pulse" style={{ height: 16, width: 200, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 16, width: 80, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 16, width: 120, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 20, width: 60, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 24, width: 150, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : exams.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>No examinations found in this section.</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th>Duration</th>
                      <th>Created By</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams
                      .map((exam) => (
                        <tr key={exam.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text)' }}>{exam.title}</td>
                          <td>{exam.duration} minutes</td>
                          <td>{exam.profiles?.name || 'Administrator'}</td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: 12,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                background: exam.is_published ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.10)',
                                color: exam.is_published ? '#16A34A' : '#DC2626',
                                border: `1px solid ${exam.is_published ? 'rgba(34,197,94,0.3)' : 'rgba(220,38,38,0.2)'}`
                              }}
                            >
                              {exam.is_published ? '✔ Published' : '✖ Hidden'}
                            </span>
                          </td>
                          <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handlePublishToggle(exam.id, exam.is_published)}
                              style={{
                                padding: '6px 12px', fontSize: '0.8rem',
                                backgroundColor: exam.is_published ? 'rgba(220,38,38,0.08)' : 'rgba(34,197,94,0.10)',
                                color: exam.is_published ? '#DC2626' : '#16A34A',
                                border: `1px solid ${exam.is_published ? 'rgba(220,38,38,0.25)' : 'rgba(34,197,94,0.3)'}`,
                                fontWeight: 600
                              }}
                            >
                              {exam.is_published ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => navigate(`/admin/edit-exam/${exam.id}`)}
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleDeleteExam(exam.id)}
                              style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.2)' }}
                            >
                              Delete
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleDuplicateExam(exam)}
                              style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'var(--lighter-blue)', color: 'var(--primary)' }}
                            >
                              Duplicate
                            </button>
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
      <AdminNotifications />
    </div>
  );
}
