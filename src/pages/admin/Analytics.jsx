import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, BarChart3, TrendingUp, Users, AlertTriangle, Filter, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts';
import '../../app.css';
import '../../proctor.css';

const PIE_COLORS = ['#10B981', '#EF4444', '#F59E0B'];

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadExams() {
      try {
        const examsRes = await api('/api/exams');
        setExams(examsRes.exams || []);
      } catch (err) {
        console.error('Failed to load exams', err);
      }
    }
    loadExams();
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const res = await api('/api/analytics', {
          params: selectedExam ? { exam_id: selectedExam } : {}
        });
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [selectedExam]);

  const passFailData = data?.pass_fail_distribution || [
    { name: 'Pass', value: data?.stats?.pass_count || 0, percentage: data?.stats?.pass_rate || 0 },
    { name: 'Fail', value: data?.stats?.fail_count || 0, percentage: data?.stats?.fail_rate || 0 },
  ];

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
          <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BarChart3 size={24} style={{ color: 'var(--primary)' }} />
                <h2>Examination Analytics</h2>
              </div>
              <p>Real-time performance metrics and accurate examination insights</p>
            </div>

            {/* Exam Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border-light)',
                  background: 'var(--card-bg)',
                  fontSize: '0.9rem',
                  color: 'var(--text-main)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Examinations</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.title}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {loading ? (
            <div className="page-loader" style={{ padding: '60px 0' }}>
              <div className="loader-spinner" />
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16,
                marginBottom: 36
              }}>
                <div className="stat-card">
                  <div className="stat-icon"><Users size={22} /></div>
                  <div className="stat-number">{data?.stats?.live_online || 0}</div>
                  <div className="stat-label">Live Online</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: '#F59E0B' }}><AlertTriangle size={22} /></div>
                  <div className="stat-number" style={{ color: '#F59E0B' }}>{data?.stats?.warnings_today || 0}</div>
                  <div className="stat-label">Warnings Today</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: '#EF4444' }}><AlertTriangle size={22} /></div>
                  <div className="stat-number" style={{ color: '#EF4444' }}>{data?.stats?.kicks_today || 0}</div>
                  <div className="stat-label">Kicks Today</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: '#10B981' }}><TrendingUp size={22} /></div>
                  <div className="stat-number" style={{ color: '#10B981' }}>{data?.stats?.average_score || 0}%</div>
                  <div className="stat-label">Avg Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: '#3B82F6' }}><CheckCircle size={22} /></div>
                  <div className="stat-number" style={{ color: '#3B82F6' }}>{data?.stats?.total_completed || 0}</div>
                  <div className="stat-label">Completed Exams</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: '#8B5CF6' }}><TrendingUp size={22} /></div>
                  <div className="stat-number" style={{ color: '#8B5CF6' }}>{data?.stats?.pass_rate || 0}%</div>
                  <div className="stat-label">Pass Rate</div>
                </div>
              </div>

              {/* Charts Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 28,
                marginBottom: 32
              }}>
                {/* Department Performance Bar Chart */}
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h4 style={{ marginBottom: 20 }}>Department Performance</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data?.dept_performance || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(255,255,255,0.95)',
                          border: '1px solid #E2E8F0',
                          borderRadius: 12,
                          fontSize: 13
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="average_score" fill="#1565C0" radius={[6, 6, 0, 0]} name="Avg Score %" />
                      <Bar dataKey="pass_rate" fill="#42A5F5" radius={[6, 6, 0, 0]} name="Pass Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Violation Trend Area Chart */}
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h4 style={{ marginBottom: 20 }}>Violation Trend</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data?.violation_trend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(255,255,255,0.95)',
                          border: '1px solid #E2E8F0',
                          borderRadius: 12,
                          fontSize: 13
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="warnings" stroke="#F59E0B" fill="rgba(245,158,11,0.15)" strokeWidth={2} name="Warnings" />
                      <Area type="monotone" dataKey="kicks" stroke="#EF4444" fill="rgba(239,68,68,0.12)" strokeWidth={2} name="Kicks" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Pass/Fail Pie Chart */}
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h4 style={{ marginBottom: 20 }}>Pass / Fail Distribution</h4>
                  {passFailData.every(d => d.value === 0) ? (
                    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      No completed attempts recorded yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={passFailData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value, percentage }) => `${name}: ${value} (${percentage || 0}%)`}
                        >
                          {passFailData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value} students (${props.payload?.percentage || 0}%)`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Question Difficulty Bar Chart */}
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h4 style={{ marginBottom: 20 }}>Question Difficulty Analysis</h4>
                  {(!data?.questions_analysis || data.questions_analysis.length === 0) ? (
                    <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      No question response data available yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data?.questions_analysis || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <YAxis dataKey="question_text" type="category" width={180} tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value, name, props) => [`${value}% correct (${props.payload?.total_responses || 0} answers)`, 'Accuracy']}
                          contentStyle={{
                            background: 'rgba(255,255,255,0.95)',
                            border: '1px solid #E2E8F0',
                            borderRadius: 12,
                            fontSize: 13
                          }}
                        />
                        <Bar dataKey="correct_rate" fill="#1565C0" radius={[0, 6, 6, 0]} name="Correct %" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
