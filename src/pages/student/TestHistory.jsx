import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ArrowLeft, Search, Clock, Award, AlertTriangle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import '../../app.css';

export default function TestHistory() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highest_score, highest_percentage
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { data: attemptsData, isLoading, error } = useQuery({
    queryKey: ['studentAttemptsHistory'],
    queryFn: () => api('/api/my-attempts'),
    staleTime: 5000,
  });

  const attempts = attemptsData?.attempts || [];

  // Filter and search
  const filteredAttempts = attempts.filter((att) => {
    const title = att.exams?.title || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sorting
  const sortedAttempts = [...filteredAttempts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at);
    }
    if (sortBy === 'highest_score') {
      return b.score - a.score;
    }
    if (sortBy === 'highest_percentage') {
      const aPct = a.percentage || 0;
      const bPct = b.percentage || 0;
      return bPct - aPct;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedAttempts.length / itemsPerPage) || 1;
  const paginatedAttempts = sortedAttempts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              <li><a href="#active" onClick={(e) => { e.preventDefault(); navigate('/student'); }}>Dashboard</a></li>
              <li><a href="#history" className="active" onClick={(e) => { e.preventDefault(); navigate('/student/history'); }}>My Test History</a></li>
              <li><a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Documentation</a></li>
              <li>
                <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); navigate('/login'); }} style={{ color: '#C62828' }}>
                  Sign Out
                </a>
              </li>
            </ul>
          </aside>

          <main className="dashboard-content">
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/student')}
              style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>

            <div className="dashboard-header" style={{ marginBottom: 32 }}>
              <div>
                <h2>My Test History</h2>
                <p>Browse, search, and review your previous exam attempts</p>
              </div>
            </div>

            {error && <div className="auth-error">{error.message || 'Failed to fetch history'}</div>}

            {/* Filters Row */}
            <div style={{
              display: 'flex',
              gap: 16,
              marginBottom: 24,
              alignItems: 'center',
              flexWrap: 'wrap',
              background: 'var(--lighter-blue)',
              padding: 16,
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-light)'
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search by exam title..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="form-input"
                  style={{ paddingLeft: 36, marginBottom: 0 }}
                />
              </div>

              {/* Sort Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Sort By:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-select"
                  style={{ minWidth: 160, marginBottom: 0 }}
                >
                  <option value="newest">Newest Date</option>
                  <option value="oldest">Oldest Date</option>
                  <option value="highest_score">Highest Marks</option>
                  <option value="highest_percentage">Highest Percentage</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th>Attempt Date</th>
                      <th>Marks</th>
                      <th>Percentage</th>
                      <th>Violations</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i}>
                        <td><div className="skeleton-pulse" style={{ height: 16, width: 160, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 16, width: 120, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 16, width: 60, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 16, width: 60, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 16, width: 40, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 20, width: 70, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                        <td><div className="skeleton-pulse" style={{ height: 24, width: 100, background: 'var(--border-light)', borderRadius: 4 }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filteredAttempts.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>No exam attempts found matching your query.</p>
            ) : (
              <>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Exam Title</th>
                        <th>Attempt Date</th>
                        <th>Marks</th>
                        <th>Percentage</th>
                        <th>Violations</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAttempts.map((att) => {
                        const scorePct = att.percentage !== undefined ? att.percentage : Math.round((att.score / att.total_marks) * 100) || 0;
                        const isSubmitting = att.status === 'in_progress';
                        return (
                          <tr key={att.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text)' }}>{att.exams?.title || 'Exam'}</td>
                            <td>{formatDate(att.created_at)}</td>
                            <td>{att.score} / {att.total_marks}</td>
                            <td>{scorePct}%</td>
                            <td style={{ color: att.violation_count > 0 ? '#DC2626' : 'inherit', fontWeight: att.violation_count > 0 ? 600 : 'normal' }}>
                              {att.violation_count}
                            </td>
                            <td>
                              <span className={isSubmitting ? 'badge-red' : 'badge-green'}>
                                {isSubmitting ? 'In Progress' : 'Completed'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-secondary"
                                onClick={() => navigate(`/student/result/${att.id}`)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8rem' }}
                                disabled={isSubmitting}
                              >
                                <Eye size={14} />
                                Review
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Showing Page {currentPage} of {totalPages} ({filteredAttempts.length} entries)
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <ChevronLeft size={14} />
                        Prev
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        Next
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
