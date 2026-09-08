import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Award, AlertTriangle, ArrowLeft, Check, X, Printer, Timer, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import '../../app.css';

export default function ResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadResult() {
      try {
        const data = await api(`/api/attempts/${attemptId}/result`);
        setResult(data.attempt);
        setAnswers(data.answers);
      } catch (err) {
        setError(err.message || 'Failed to load result data');
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const scorePercentage = result ? (result.percentage !== undefined ? result.percentage : Math.round((result.score / result.total_marks) * 100) || 0) : 0;
  const isPassed = scorePercentage >= (result?.exams?.pass_threshold || 50);

  return (
    <div className="app-container">
      {/* Print Styles Injection */}
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
            background: #FFF !important;
          }
          .dashboard-content {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .stat-card {
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            background: #fff !important;
          }
        }
      `}} />

      <div className="container" style={{ paddingBottom: 48 }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/student')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--primary)', color: 'var(--primary)' }}
          >
            <Printer size={16} />
            Print / Download PDF
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {result && (
          <div className="dashboard-content" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: isPassed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: isPassed ? '#16A34A' : '#DC2626'
              }}>
                <Award size={32} style={{ margin: 'auto' }} />
              </div>
              <h2>{isPassed ? 'Exam Passed' : 'Exam Failed'}</h2>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{result.exams?.title}</p>
              <div style={{ marginTop: 8 }}>
                <span style={{
                  padding: '6px 16px', borderRadius: '50px', fontWeight: 700, fontSize: '0.85rem',
                  background: isPassed ? '#D1FAE5' : '#FEE2E2',
                  color: isPassed ? '#065F46' : '#991B1B'
                }}>
                  {isPassed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 16,
              marginBottom: 32
            }}>
              <div className="stat-card" style={{ padding: 16 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
                  {result.score} / {result.total_marks}
                </div>
                <div className="stat-label" style={{ fontSize: '0.78rem' }}>Marks Obtained</div>
              </div>
              
              <div className="stat-card" style={{ padding: 16 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
                  {scorePercentage}%
                </div>
                <div className="stat-label" style={{ fontSize: '0.78rem' }}>Percentage</div>
              </div>

              <div className="stat-card" style={{ padding: 16, borderLeft: '3px solid #22C55E' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={20} />
                  {result.correct_count || 0}
                </div>
                <div className="stat-label" style={{ fontSize: '0.78rem' }}>Correct Answers</div>
              </div>

              <div className="stat-card" style={{ padding: 16, borderLeft: '3px solid #EF4444' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <XCircle size={20} />
                  {result.wrong_count || 0}
                </div>
                <div className="stat-label" style={{ fontSize: '0.78rem' }}>Wrong Answers</div>
              </div>

              <div className="stat-card" style={{ padding: 16, borderLeft: '3px solid #9CA3AF' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4B5563', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={20} />
                  {result.skipped_count || 0}
                </div>
                <div className="stat-label" style={{ fontSize: '0.78rem' }}>Skipped Count</div>
              </div>

              <div className="stat-card" style={{ padding: 16 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Timer size={18} />
                  {formatTime(result.time_taken)}
                </div>
                <div className="stat-label" style={{ fontSize: '0.78rem' }}>Time Taken</div>
              </div>
            </div>

            {result.violation_count > 0 && (
              <div className="violation-banner" style={{ marginBottom: 40, borderLeft: '4px solid #C62828' }}>
                <AlertTriangle size={20} />
                <span>
                  Our tracking system flagged {result.violation_count} instances of tab switching or browser window blur during this exam. All flags have been reported to the administrator.
                </span>
              </div>
            )}

            <h3 style={{ marginBottom: 20, borderBottom: '1.5px solid var(--border-light)', paddingBottom: 10 }}>
              Question Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {answers.map((ans, idx) => {
                const q = ans.questions || {};
                const qType = q.question_type || 'mcq';
                const isCorrect = ans.is_correct;
                
                // Determine skipped status
                const isSkipped = (qType === 'mcq' || qType === 'image_mcq')
                  ? (ans.selected_option === null || ans.selected_option === undefined)
                  : (!ans.selected_answer_text || ans.selected_answer_text.trim() === '');

                let badgeText = 'Wrong';
                let badgeBg = '#FEE2E2';
                let badgeColor = '#991B1B';
                let statusIcon = <X size={14} />;

                if (isSkipped) {
                  badgeText = 'Skipped';
                  badgeBg = '#E5E7EB';
                  badgeColor = '#4B5563';
                  statusIcon = <AlertCircle size={14} />;
                } else if (isCorrect) {
                  badgeText = 'Correct';
                  badgeBg = '#D1FAE5';
                  badgeColor = '#065F46';
                  statusIcon = <Check size={14} />;
                }

                return (
                  <div
                    key={ans.id}
                    style={{
                      padding: 24,
                      border: '1.5px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      background: isCorrect ? 'rgba(209, 250, 229, 0.1)' : isSkipped ? 'rgba(243, 244, 246, 0.1)' : 'rgba(254, 226, 226, 0.1)',
                      borderColor: isCorrect ? '#A7F3D0' : isSkipped ? '#D1D5DB' : '#FECACA',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        marginTop: 2,
                        width: 24, height: 24, borderRadius: '50%',
                        background: badgeBg,
                        color: badgeColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {statusIcon}
                      </div>
                      
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Question {idx + 1} ({qType.replace('image_', 'Image + ').toUpperCase()})
                          </span>
                          <span style={{ fontSize: '0.8rem', background: badgeBg, color: badgeColor, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                            {badgeText} ({q.marks || 1} Marks)
                          </span>
                        </div>

                        {/* Image Render */}
                        {q.image_url && (
                          <div style={{ margin: '12px 0' }}>
                            <img
                              src={q.image_url}
                              alt="Question context"
                              style={{ maxHeight: 150, maxWidth: '100%', borderRadius: 4, border: '1px solid var(--border-light)' }}
                            />
                          </div>
                        )}

                        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
                          {q.question_text}
                        </div>

                        {/* Answers Options / Submissions */}
                        {(qType === 'mcq' || qType === 'image_mcq') ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(q.options || []).map((opt, optIdx) => {
                              let labelStyle = { color: 'var(--text-secondary)' };
                              let optionBadge = null;

                              if (optIdx === q.correct_answer) {
                                labelStyle = { color: '#065F46', fontWeight: 600 };
                                optionBadge = <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '1px 6px', borderRadius: 4 }}>Correct Answer</span>;
                              }
                              
                              if (optIdx === ans.selected_option) {
                                if (isCorrect) {
                                  labelStyle = { color: '#065F46', fontWeight: 700 };
                                  optionBadge = <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>Your Correct Choice</span>;
                                } else {
                                  labelStyle = { color: '#991B1B', fontWeight: 700 };
                                  optionBadge = <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#FEE2E2', color: '#991B1B', padding: '1px 6px', borderRadius: 4 }}>Your Wrong Choice</span>;
                                }
                              }

                              return (
                                <div key={optIdx} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                                  <span style={{ marginRight: 8, fontWeight: 600 }}>{String.fromCharCode(65 + optIdx)}.</span>
                                  <span style={labelStyle}>{opt}</span>
                                  {optionBadge}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // Text representation for FIB
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem', background: '#FFFFFF', padding: '12px 16px', borderRadius: 6, border: '1px solid var(--border-light)' }}>
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--text-secondary)', marginRight: 6 }}>Your Submitted Answer:</span>
                              <span style={{ fontWeight: 700, color: isCorrect ? '#065F46' : isSkipped ? '#4B5563' : '#991B1B' }}>
                                {ans.selected_answer_text || '(Skipped)'}
                              </span>
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-secondary)', marginRight: 6 }}>Accepted Answer Options:</span>
                              <span style={{ fontWeight: 600, color: '#065F46' }}>
                                {(q.accepted_answers || []).join('  /  ')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
