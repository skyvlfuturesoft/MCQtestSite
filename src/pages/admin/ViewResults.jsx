import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Search, Clock, Award, AlertTriangle, Eye, Printer, Filter, RotateCcw } from 'lucide-react';
import '../../app.css';

export default function ViewResults() {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [resData, examsData] = await Promise.all([
          api('/api/results'),
          api('/api/exams'),
        ]);
        setResults(resData.results || []);
        setExams(examsData.exams || []);
      } catch (err) {
        setError(err.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExamFilterChange = async (examId) => {
    setSelectedExam(examId);
    setLoading(true);
    try {
      const data = await api('/api/results', {
        params: examId ? { exam_id: examId } : {}
      });
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || 'Failed to filter results');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantRetake = async (res) => {
    const studentName = res.profiles?.name || 'this student';
    const examTitle = res.exams?.title || 'this exam';
    if (!confirm(`Grant retake to "${studentName}" for exam "${examTitle}"?\n\nThis will permanently delete their current attempt and all answers so they can start fresh.`)) return;
    try {
      await api('/api/admin/grant-retake', {
        method: 'POST',
        body: { attempt_id: res.id }
      });
      alert(`✅ Retake granted! ${studentName} can now retake "${examTitle}" from scratch.`);
      // Refresh results list
      const data = await api('/api/results', { params: selectedExam ? { exam_id: selectedExam } : {} });
      setResults(data.results || []);
    } catch (err) {
      alert(err.message || 'Failed to grant retake');
    }
  };

  // Extract unique departments and sections from profile results to populate dropdowns
  const uniqueDepts = Array.from(
    new Set(results.map((res) => res.profiles?.department).filter(Boolean))
  ).sort();

  const uniqueSections = Array.from(
    new Set(results.map((res) => res.profiles?.section).filter(Boolean))
  ).sort();

  // Client-side filtering logic
  const filteredResults = results.filter((res) => {
    const profile = res.profiles || {};
    const name = (profile.name || '').toLowerCase();
    const email = (profile.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = name.includes(query) || email.includes(query);
    const matchesDept = selectedDept ? profile.department === selectedDept : true;
    const matchesSection = selectedSection ? profile.section === selectedSection : true;

    return matchesSearch && matchesDept && matchesSection;
  });

  // Calculate overall performance stats
  const totalCount = filteredResults.length;
  const passedCount = filteredResults.filter((res) => {
    const pct = res.percentage !== undefined ? res.percentage : ((res.score / res.total_marks) * 100) || 0;
    return pct >= (res.exams?.pass_threshold || 50);
  }).length;

  const averagePct = totalCount > 0
    ? Math.round(
        filteredResults.reduce((acc, curr) => {
          const pct = curr.percentage !== undefined ? curr.percentage : ((curr.score / curr.total_marks) * 100) || 0;
          return acc + pct;
        }, 0) / totalCount
      )
    : 0;

  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  // Find top performer
  let topPerformer = null;
  if (totalCount > 0) {
    topPerformer = [...filteredResults].sort((a, b) => {
      const aPct = a.percentage !== undefined ? a.percentage : ((a.score / a.total_marks) * 100) || 0;
      const bPct = b.percentage !== undefined ? b.percentage : ((b.score / b.total_marks) * 100) || 0;
      return bPct - aPct;
    })[0];
  }

  // Export spreadsheet utility (CSV)
  const exportToCSV = () => {
    const headers = ['Student Name', 'Email', 'Department', 'Section', 'Exam Title', 'Score', 'Total Marks', 'Percentage', 'Violations', 'Submitted At', 'Status'];
    let rows = [];
    let fileName = `exam_results_${new Date().toISOString().slice(0, 10)}.csv`;
    
    if (filteredResults.length > 0) {
      rows = filteredResults.map(res => {
        const percentage = res.percentage !== undefined ? res.percentage : Math.round((res.score / res.total_marks) * 100) || 0;
        return [
          res.profiles?.name || '—',
          res.profiles?.email || '—',
          res.profiles?.department || '—',
          res.profiles?.section || '—',
          res.exams?.title || '—',
          res.score,
          res.total_marks,
          `${percentage}%`,
          res.violation_count,
          new Date(res.submitted_at).toLocaleString(),
          res.status
        ];
      });
    } else {
      fileName = `exam_results_empty.csv`;
    }
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export spreadsheet utility (Excel compatible XML format)
  const exportToExcel = () => {
    let fileName = `exam_results_${new Date().toISOString().slice(0, 10)}.xls`;
    const headers = ['Student Name', 'Email', 'Department', 'Section', 'Exam Title', 'Score', 'Total Marks', 'Percentage', 'Violations', 'Submitted At', 'Status'];
    
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Results</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; }
          th { background-color: #1565C0; color: #ffffff; font-weight: bold; border: 1px solid #dddddd; padding: 8px; font-family: sans-serif; }
          td { border: 1px solid #dddddd; padding: 6px; font-family: sans-serif; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredResults.map(res => {
              const percentage = res.percentage !== undefined ? res.percentage : Math.round((res.score / res.total_marks) * 100) || 0;
              return `
                <tr>
                  <td>${res.profiles?.name || '—'}</td>
                  <td>${res.profiles?.email || '—'}</td>
                  <td>${res.profiles?.department || '—'}</td>
                  <td>${res.profiles?.section || '—'}</td>
                  <td>${res.exams?.title || '—'}</td>
                  <td>${res.score}</td>
                  <td>${res.total_marks}</td>
                  <td>${percentage}%</td>
                  <td>${res.violation_count}</td>
                  <td>${new Date(res.submitted_at).toLocaleString()}</td>
                  <td>${res.status}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print {
            display: none !important;
          }
          .app-container, .container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
          .dashboard-content {
            max-width: 100% !important;
            margin: 0 !important;
          }
          .admin-table {
            border: 1px solid #000 !important;
          }
          .admin-table th, .admin-table td {
            border: 1px solid #ddd !important;
            padding: 6px !important;
            font-size: 0.8rem !important;
          }
        }
      `}} />

      <div className="container" style={{ paddingBottom: 48 }}>
        <button
          className="btn btn-secondary no-print"
          onClick={() => navigate('/admin')}
          style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="dashboard-content">
          <div className="dashboard-header" style={{ marginBottom: 32 }}>
            <div>
              <h2>Examination Results</h2>
              <p>Review completed attempts, scores, and track security logs</p>
            </div>
            
            <div className="no-print" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={() => window.print()}
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={16} />
                Print List / PDF
              </button>
              <button
                className="btn btn-secondary"
                onClick={exportToCSV}
                style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--lighter-blue)', color: 'var(--primary)', border: '1.5px solid var(--border-light)' }}
              >
                📥 Export CSV
              </button>
              <button
                className="btn btn-secondary"
                onClick={exportToExcel}
                style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'rgba(34, 197, 94, 0.1)', color: '#16A34A', border: '1.5px solid rgba(34, 197, 94, 0.3)' }}
              >
                📊 Export Excel
              </button>
            </div>
          </div>

          {/* Stats Analytics Dashboard cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 32
          }}>
            <div className="stat-card" style={{ padding: 16 }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)' }}>{totalCount}</div>
              <div className="stat-label" style={{ fontSize: '0.78rem' }}>Total Attempt Sheets</div>
            </div>
            <div className="stat-card" style={{ padding: 16, borderLeft: '3px solid var(--primary)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>{averagePct}%</div>
              <div className="stat-label" style={{ fontSize: '0.78rem' }}>Average Score</div>
            </div>
            <div className="stat-card" style={{ padding: 16, borderLeft: '3px solid #22C55E' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16A34A' }}>{passRate}%</div>
              <div className="stat-label" style={{ fontSize: '0.78rem' }}>Pass Rate ({passedCount} Passed)</div>
            </div>
            <div className="stat-card" style={{ padding: 16 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {topPerformer ? topPerformer.profiles?.name : '—'}
              </div>
              <div className="stat-label" style={{ fontSize: '0.78rem' }}>
                Top Performer ({topPerformer ? `${topPerformer.score}/${topPerformer.total_marks}` : '—'})
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="no-print" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            background: 'var(--lighter-blue)',
            padding: 16,
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-light)',
            marginBottom: 24
          }}>
            {/* Search query box */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Search Student
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 30, marginBottom: 0, fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Exam Select Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Exam Title
              </label>
              <select
                className="form-select"
                value={selectedExam}
                onChange={(e) => handleExamFilterChange(e.target.value)}
                style={{ marginBottom: 0, fontSize: '0.85rem' }}
              >
                <option value="">All Exams</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Department
              </label>
              <select
                className="form-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ marginBottom: 0, fontSize: '0.85rem' }}
              >
                <option value="">All Departments</option>
                {uniqueDepts.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Section
              </label>
              <select
                className="form-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                style={{ marginBottom: 0, fontSize: '0.85rem' }}
              >
                <option value="">All Sections</option>
                {uniqueSections.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {filteredResults.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>No examination results found matching the filters.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Dept & Sec</th>
                    <th>Exam Title</th>
                    <th>Score / Max</th>
                    <th>Percentage</th>
                    <th>Violations</th>
                    <th>Submitted At</th>
                    <th className="no-print">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((res) => {
                    const percentage = res.percentage !== undefined ? res.percentage : Math.round((res.score / res.total_marks) * 100) || 0;
                    return (
                      <tr key={res.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{res.profiles?.name || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{res.profiles?.email || '—'}</div>
                        </td>
                        <td>
                          {res.profiles?.department || '—'} - {res.profiles?.section || '—'}
                        </td>
                        <td>{res.exams?.title || '—'}</td>
                        <td style={{ fontWeight: 600 }}>
                          {res.score} / {res.total_marks}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {percentage}%
                        </td>
                        <td>
                          <span className={res.violation_count > 0 ? 'badge-red' : 'badge-green'}>
                            {res.violation_count} Flagged
                          </span>
                        </td>
                        <td>{new Date(res.submitted_at).toLocaleString()}</td>
                        <td className="no-print">
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => navigate(`/student/result/${res.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              <Eye size={14} />
                              Review
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleGrantRetake(res)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', fontSize: '0.8rem',
                                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                color: '#B45309',
                                border: '1px solid rgba(234, 179, 8, 0.35)',
                                fontWeight: 600
                              }}
                              title="Allow this student to retake the exam"
                            >
                              <RotateCcw size={14} />
                              Grant Retake
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
