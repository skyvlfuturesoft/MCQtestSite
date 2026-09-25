import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Pause, Play, XCircle, Send, Wifi, WifiOff, ChevronLeft, ChevronRight, Search, RotateCcw } from 'lucide-react';
import '../../proctor.css';

export default function LiveStudentTable() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, Sort, Paginate State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [connectionFilter, setConnectionFilter] = useState('all');
  const [sortField, setSortField] = useState('student_name');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadStudents = async () => {
    try {
      const data = await api('/api/live-students');
      setStudents(data.live_students || []);
    } catch (e) {
      // Silently retry on network errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let failCount = 0;
    let isCancelled = false;

    const poll = async () => {
      if (document.hidden || isCancelled) return;
      try {
        await loadStudents();
        failCount = 0;
      } catch (e) {
        failCount++;
        if (e?.message?.includes('Session expired') || e?.message?.includes('401') || failCount >= 5) {
          isCancelled = true;
        }
      }
    };
    poll();
    const interval = setInterval(() => {
      if (!isCancelled) poll();
    }, 12000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, connectionFilter, pageSize]);

  const handleAction = async (action, attemptId) => {
    try {
      await api(`/api/${action}`, {
        method: 'POST',
        body: { attempt_id: attemptId, action_type: action, details: {} }
      });
      loadStudents();
    } catch (e) {
      console.error(`Action ${action} failed:`, e);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      (s.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.student_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.exam_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = s.status === 'in_progress' && !s.is_paused;
    } else if (statusFilter === 'paused') {
      matchesStatus = s.is_paused;
    } else if (statusFilter === 'terminated') {
      matchesStatus = s.status === 'terminated';
    }

    let matchesConnection = true;
    if (connectionFilter === 'connected') {
      matchesConnection = s.connection_status === 'connected';
    } else if (connectionFilter === 'disconnected') {
      matchesConnection = s.connection_status === 'disconnected';
    }

    return matchesSearch && matchesStatus && matchesConnection;
  });

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let valA, valB;
    if (sortField === 'student_name') {
      valA = (a.student_name || '').toLowerCase();
      valB = (b.student_name || '').toLowerCase();
    } else if (sortField === 'progress') {
      valA = a.progress_percent || 0;
      valB = b.progress_percent || 0;
    } else if (sortField === 'violations') {
      valA = a.violation_count || 0;
      valB = b.violation_count || 0;
    } else if (sortField === 'time_left') {
      valA = a.remaining_time || 0;
      valB = b.remaining_time || 0;
    } else {
      return 0;
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Paginated students
  const totalPages = Math.ceil(sortedStudents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = sortedStudents.slice(startIndex, startIndex + pageSize);

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Loading live student data...</p>;
  }

  return (
    <div style={{ marginBottom: 40 }}>
      {/* Search and Filters panel */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
        padding: 16,
        background: 'var(--bg-light)',
        border: '1.5px solid var(--border-light)',
        borderRadius: 8,
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', position: 'absolute', left: 12 }} />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 38px',
              borderRadius: 6,
              border: '1px solid var(--border-light)',
              background: '#FFFFFF',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Connection:</span>
            <select
              value={connectionFilter}
              onChange={(e) => setConnectionFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
            >
              <option value="all">All</option>
              <option value="connected">Online</option>
              <option value="disconnected">Offline</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-light)', fontSize: '0.82rem' }}
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>
          </div>
        </div>
      </div>

      {sortedStudents.length === 0 ? (
        <div style={{ padding: '40px 0', background: 'var(--bg-light)', border: '1.5px solid var(--border-light)', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {students.length === 0
              ? 'No active exam sessions right now.'
              : 'No sessions match the current filters.'}
          </p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('student_name')}>
                    Student {sortField === 'student_name' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th>Exam</th>
                  <th style={{ textAlign: 'center' }}>Q No.</th>
                  <th style={{ textAlign: 'center' }}>Answered</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('time_left')}>
                    Time Left {sortField === 'time_left' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('progress')}>
                    Progress {sortField === 'progress' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('violations')}>
                    Violations {sortField === 'violations' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th>Browser / OS</th>
                  <th>Connection</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((s) => {
                  const isTerminated = s.status === 'terminated';
                  const isPaused = s.is_paused;
                  return (
                    <tr key={s.id || s.attempt_id} style={isTerminated ? { backgroundColor: 'rgba(239, 68, 68, 0.06)', borderLeft: '4px solid #EF4444' } : isPaused ? { backgroundColor: 'rgba(245, 158, 11, 0.06)', borderLeft: '4px solid #F59E0B' } : {}}>
                      {/* Student */}
                      <td>
                        <div style={{ fontWeight: 600, color: isTerminated ? '#EF4444' : 'var(--text)' }}>
                          {s.student_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {s.student_email || '—'}
                        </div>
                      </td>

                      {/* Exam */}
                      <td style={{ fontWeight: 500 }}>{s.exam_name}</td>

                      {/* Current Q */}
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>
                        {isTerminated ? '—' : `${s.current_question} / ${s.total_questions || '?'}`}
                      </td>

                      {/* Answered */}
                      <td style={{ textAlign: 'center' }}>
                        {isTerminated ? '—' : `${s.answered_questions} / ${s.total_questions || '?'}`}
                      </td>

                      {/* Time Left */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: !isTerminated && s.remaining_time < 120 && s.remaining_time > 0 ? '#C62828' : '' }}>
                        {isTerminated
                          ? <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.8rem' }}>TERMINATED</span>
                          : isPaused
                            ? <span style={{ color: '#F59E0B', fontWeight: 600, fontSize: '0.8rem' }}>PAUSED</span>
                            : formatTime(s.remaining_time)}
                      </td>

                      {/* Progress */}
                      <td>
                        {isTerminated ? (
                          <div style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 500, maxWidth: 200 }} title={s.kick_reason}>
                            {s.kick_reason || 'Security limit exceeded'}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 64, height: 6, borderRadius: 3, background: 'var(--border-light)', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 3,
                                background: s.progress_percent >= 75 ? '#10B981' : s.progress_percent >= 40 ? '#F59E0B' : '#EF4444',
                                width: `${Math.min(100, s.progress_percent)}%`
                              }} />
                            </div>
                            <span style={{ fontSize: '0.8rem' }}>{s.progress_percent}%</span>
                          </div>
                        )}
                      </td>

                      {/* Violations */}
                      <td>
                        <span className={s.violation_count > 0 ? 'badge-red' : 'badge-green'}>
                          {s.violation_count} {isTerminated ? '(Kicked)' : ''}
                        </span>
                      </td>

                      {/* Browser / OS */}
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {s.browser && s.os ? `${s.browser} / ${s.os}` : s.browser || s.os || '—'}
                      </td>

                      {/* Connection */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {isTerminated ? (
                            <><WifiOff size={14} style={{ color: '#EF4444' }} /><span style={{ fontSize: '0.8rem', color: '#EF4444' }}>Locked</span></>
                          ) : s.connection_status === 'connected' ? (
                            <><Wifi size={14} style={{ color: '#10B981' }} /><span style={{ fontSize: '0.8rem', color: '#10B981' }}>Online</span></>
                          ) : (
                            <><WifiOff size={14} style={{ color: '#EF4444' }} /><span style={{ fontSize: '0.8rem', color: '#EF4444' }}>Offline</span></>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {!isTerminated && (
                            <>
                              {isPaused ? (
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => handleAction('resume-exam', s.attempt_id)}
                                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                  title="Resume Exam"
                                >
                                  <Play size={12} />
                                </button>
                              ) : (
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => handleAction('pause-exam', s.attempt_id)}
                                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                  title="Pause Exam"
                                >
                                  <Pause size={12} />
                                </button>
                              )}
                              <button
                                className="btn btn-secondary"
                                onClick={() => {
                                  if (confirm("Force submit this student's exam?")) {
                                    handleAction('force-submit', s.attempt_id);
                                  }
                                }}
                                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                title="Force Submit"
                              >
                                <Send size={12} />
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => {
                                  if (confirm("Terminate this student's exam session?")) {
                                    handleAction('terminate-exam', s.attempt_id);
                                  }
                                }}
                                style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#C62828' }}
                                title="Terminate Session"
                              >
                                <XCircle size={12} />
                              </button>
                            </>
                          )}
                          {isTerminated && (
                            <button
                              className="btn btn-secondary"
                              onClick={async () => {
                                if (confirm(`Grant retake to "${s.student_name}" for exam "${s.exam_name}"?\n\nThis will clear their violations and allow them to take the exam again from scratch.`)) {
                                  try {
                                    await api('/api/admin/grant-retake', {
                                      method: 'POST',
                                      body: { attempt_id: s.attempt_id }
                                    });
                                    alert(`✅ Retake granted! ${s.student_name} can now start the exam from scratch.`);
                                    loadStudents();
                                  } catch (err) {
                                    alert(err.message || 'Failed to grant retake');
                                  }
                                }
                              }}
                              style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#D97706', borderColor: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}
                              title="Grant Retake"
                            >
                              <RotateCcw size={12} />
                              Grant Retake
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 16,
              padding: '12px 16px',
              border: '1.5px solid var(--border-light)',
              borderRadius: 8,
              background: 'var(--bg-light)'
            }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Showing <strong style={{ color: 'var(--text)' }}>{startIndex + 1}</strong> to{' '}
                <strong style={{ color: 'var(--text)' }}>{Math.min(startIndex + pageSize, sortedStudents.length)}</strong>{' '}
                of <strong style={{ color: 'var(--text)' }}>{sortedStudents.length}</strong> sessions
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 500 }}>
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
