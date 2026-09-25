import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Award, AlertTriangle, ArrowLeft, Check, X, Printer, Timer, CheckCircle2, XCircle, AlertCircle, HelpCircle, ListFilter } from 'lucide-react';
import '../../app.css';

export default function ResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'correct', 'wrong', 'unattended'

  useEffect(() => {
    async function loadResult() {
      try {
        const data = await api(`/api/attempts/${attemptId}/result`);
        setResult(data.attempt);
        setAnswers(data.answers || []);
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

  // Filtered list of answers
  const filteredAnswers = answers.filter((ans) => {
    const q = ans.questions || {};
    const qType = q.question_type || 'mcq';
    const isSkipped = ans.is_unattended || ((qType === 'mcq' || qType === 'image_mcq')
      ? (ans.selected_option === null || ans.selected_option === undefined)
      : (!ans.selected_answer_text || String(ans.selected_answer_text).trim() === ''));

    if (filterType === 'correct') return !isSkipped && ans.is_correct;
    if (filterType === 'wrong') return !isSkipped && !ans.is_correct;
    if (filterType === 'unattended') return isSkipped;
    return true;
  });

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
          <div className="dashboard-content" style={{ maxWidth: 840, margin: '0 auto' }}>
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 14,
              marginBottom: 32
            }}>
              <div className="stat-card" style={{ padding: 16 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>
                  {result.score} / {result.total_marks}
                </div>
                <div className="stat-label" style={{ fontSize: '0.78rem' }}>Marks Obtained</div>
              </div>
              
              <div className="stat-card" style={{ padding: 16 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>
                  {scorePercentage}%
                </div>
                <div className="stat-label" style={{ fontSize: '0.78rem' }}>Percentage</div>
              </div>

              <div className="stat-card" style={{ padding: 16, borderLeft: '3px solid #22C55E' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={18} />
                  {result.correct_count || 0}
                </div>
                <div className="stat-label" style={{ fontSize: '0.78rem' }}>Correct Answers</div>
              </div>

              <div className="stat-card" style={{ padding: 16, borderLeft: '3px solid #EF4444' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <XCircle size={18} />
                  {result.wrong_count || 0}
                </div>
                <div className="stat-label" style={{ fontSize: '0.78rem' }}>Wrong Answers</div>
              </div>

              <div className="stat-card" style={{ padding: 16, borderLeft: '3px solid #F59E0B' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={18} />
                  {result.skipped_count || 0}
                </div>
                <div className="stat-label" style={{ fontSize: '0.78rem' }}>Unattended / Skipped</div>
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
              <div className="violation-banner" style={{ marginBottom: 32, borderLeft: '4px solid #C62828' }}>
                <AlertTriangle size={20} />
                <span>
                  Our tracking system flagged {result.violation_count} instances of tab switching or browser window blur during this exam. All flags have been reported to the administrator.
                </span>
              </div>
            )}

            {/* Question Breakdown Header & Filter Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, borderBottom: '1.5px solid var(--border-light)', paddingBottom: 12 }}>
              <h3 style={{ margin: 0 }}>
                Question Breakdown & Review
              </h3>

              {/* Filter Tabs */}
              <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFilterType('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: filterType === 'all' ? 'var(--primary)' : '#E2E8F0',
                    background: filterType === 'all' ? 'var(--primary)' : '#FFFFFF',
                    color: filterType === 'all' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All ({answers.length})
                </button>
                <button
                  onClick={() => setFilterType('correct')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: filterType === 'correct' ? '#16A34A' : '#E2E8F0',
                    background: filterType === 'correct' ? '#16A34A' : '#FFFFFF',
                    color: filterType === 'correct' ? '#FFFFFF' : '#16A34A',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Correct ({result.correct_count || 0})
                </button>
                <button
                  onClick={() => setFilterType('wrong')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: filterType === 'wrong' ? '#DC2626' : '#E2E8F0',
                    background: filterType === 'wrong' ? '#DC2626' : '#FFFFFF',
                    color: filterType === 'wrong' ? '#FFFFFF' : '#DC2626',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Wrong ({result.wrong_count || 0})
                </button>
                <button
                  onClick={() => setFilterType('unattended')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: filterType === 'unattended' ? '#D97706' : '#E2E8F0',
                    background: filterType === 'unattended' ? '#D97706' : '#FFFFFF',
                    color: filterType === 'unattended' ? '#FFFFFF' : '#D97706',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Unattended / Skipped ({result.skipped_count || 0})
                </button>
              </div>
            </div>

            {filteredAnswers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', background: '#F8FAFC', borderRadius: 12, border: '1px dashed #CBD5E1', color: '#64748B' }}>
                <HelpCircle size={32} style={{ margin: '0 auto 8px', display: 'block', color: '#94A3B8' }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No questions found matching this filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {filteredAnswers.map((ans, idx) => {
                  const q = ans.questions || {};
                  const qType = q.question_type || 'mcq';
                  const isCorrect = ans.is_correct;
                  
                  // Determine skipped / unattended status
                  const isSkipped = ans.is_unattended || ((qType === 'mcq' || qType === 'image_mcq')
                    ? (ans.selected_option === null || ans.selected_option === undefined)
                    : (!ans.selected_answer_text || String(ans.selected_answer_text).trim() === ''));

                  let badgeText = 'Wrong';
                  let badgeBg = '#FEE2E2';
                  let badgeColor = '#991B1B';
                  let cardBorderColor = '#FECACA';
                  let cardBg = 'rgba(254, 226, 226, 0.15)';
                  let statusIcon = <X size={14} />;

                  if (isSkipped) {
                    badgeText = 'Unattended / Skipped';
                    badgeBg = '#FEF3C7';
                    badgeColor = '#B45309';
                    cardBorderColor = '#FDE68A';
                    cardBg = 'rgba(254, 243, 199, 0.2)';
                    statusIcon = <AlertCircle size={14} />;
                  } else if (isCorrect) {
                    badgeText = 'Correct';
                    badgeBg = '#D1FAE5';
                    badgeColor = '#065F46';
                    cardBorderColor = '#A7F3D0';
                    cardBg = 'rgba(209, 250, 229, 0.15)';
                    statusIcon = <Check size={14} />;
                  }

                  // Find original index across all answers
                  const originalIndex = answers.findIndex(a => a.question_id === ans.question_id);
                  const displayIndex = originalIndex >= 0 ? originalIndex + 1 : idx + 1;

                  return (
                    <div
                      key={ans.id || ans.question_id}
                      style={{
                        padding: 24,
                        border: `1.5px solid ${cardBorderColor}`,
                        borderRadius: 'var(--radius-md)',
                        background: cardBg,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                          marginTop: 2,
                          width: 26, height: 26, borderRadius: '50%',
                          background: badgeBg,
                          color: badgeColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {statusIcon}
                        </div>
                        
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              Question {displayIndex} ({qType.replace('image_', 'Image + ').toUpperCase()})
                            </span>
                            <span style={{ fontSize: '0.8rem', background: badgeBg, color: badgeColor, padding: '3px 10px', borderRadius: 6, fontWeight: 700 }}>
                              {badgeText} ({isCorrect ? `${q.marks || 1} / ${q.marks || 1} Marks` : `0 / ${q.marks || 1} Marks`})
                            </span>
                          </div>

                          {/* Image Render */}
                          {q.image_url && (
                            <div style={{ margin: '12px 0' }}>
                              <img
                                src={q.image_url}
                                alt="Question context"
                                style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 6, border: '1px solid var(--border-light)' }}
                              />
                            </div>
                          )}

                          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)', marginBottom: 14 }}>
                            {q.question_text}
                          </div>

                          {/* Unattended Notice Banner */}
                          {isSkipped && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '8px 12px',
                              background: '#FFFBEB',
                              border: '1px solid #FDE68A',
                              borderRadius: 6,
                              marginBottom: 14,
                              fontSize: '0.84rem',
                              color: '#92400E',
                              fontWeight: 500
                            }}>
                              <AlertCircle size={16} color="#D97706" />
                              <span>You did not attend / answer this question. The correct answer is displayed below.</span>
                            </div>
                          )}

                          {/* Answers Options / Submissions */}
                          {(qType === 'mcq' || qType === 'image_mcq') ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {(q.options || []).map((opt, optIdx) => {
                                let labelStyle = { color: 'var(--text-secondary)' };
                                let optionBadge = null;
                                let optionBg = 'transparent';
                                let optionBorder = '1px solid transparent';

                                if (optIdx === q.correct_answer) {
                                  labelStyle = { color: '#065F46', fontWeight: 700 };
                                  optionBg = '#ECFDF5';
                                  optionBorder = '1px solid #A7F3D0';
                                  optionBadge = (
                                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                                      ✓ Correct Answer
                                    </span>
                                  );
                                }
                                
                                if (optIdx === ans.selected_option) {
                                  if (isCorrect) {
                                    labelStyle = { color: '#065F46', fontWeight: 700 };
                                    optionBg = '#D1FAE5';
                                    optionBorder = '1px solid #6EE7B7';
                                    optionBadge = (
                                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: '#059669', color: '#FFFFFF', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                                        ✓ Your Choice (Correct)
                                      </span>
                                    );
                                  } else {
                                    labelStyle = { color: '#991B1B', fontWeight: 700 };
                                    optionBg = '#FEE2E2';
                                    optionBorder = '1px solid #FCA5A5';
                                    optionBadge = (
                                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: '#DC2626', color: '#FFFFFF', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                                        ✗ Your Choice (Wrong)
                                      </span>
                                    );
                                  }
                                }

                                return (
                                  <div
                                    key={optIdx}
                                    style={{
                                      fontSize: '0.9rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      padding: '8px 12px',
                                      borderRadius: 6,
                                      background: optionBg,
                                      border: optionBorder
                                    }}
                                  >
                                    <span style={{ marginRight: 8, fontWeight: 700, color: 'var(--text)' }}>
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <span style={labelStyle}>{opt}</span>
                                    {optionBadge}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            // Text representation for FIB
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', background: '#FFFFFF', padding: '14px 18px', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)', marginRight: 8 }}>Your Submitted Answer:</span>
                                <span style={{ fontWeight: 700, color: isCorrect ? '#065F46' : isSkipped ? '#D97706' : '#991B1B' }}>
                                  {isSkipped ? '(Unattended / Not Answered)' : ans.selected_answer_text}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)', marginRight: 8 }}>Accepted Correct Answers:</span>
                                <span style={{ fontWeight: 700, color: '#065F46' }}>
                                  {(q.accepted_answers || []).join('  /  ') || 'None configured'}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
