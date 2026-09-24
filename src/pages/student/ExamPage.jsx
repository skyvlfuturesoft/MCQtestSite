import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Clock, AlertTriangle, ChevronRight, ChevronLeft, Send, PauseCircle, CheckCircle2, Maximize } from 'lucide-react';
import useExamProctor from '../../hooks/useExamProctor';
import ViolationModal from '../../components/ViolationModal';
import '../../app.css';
import '../../proctor.css';

export default function ExamPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [violations, setViolations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState('');
  
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [requireFullscreen, setRequireFullscreen] = useState(false);

  const isFullscreenActive = () => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen().catch(() => {});
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen().catch(() => {});
    }
    setRequireFullscreen(false);
  };
  
  const warningRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    async function loadExam() {
      try {
        const attemptData = await api(`/api/attempts/${attemptId}`);
        if (attemptData.attempt.status === 'terminated') {
          navigate(`/student/exam-terminated?attempt_id=${attemptId}&reason=${encodeURIComponent('This exam session has been terminated due to security violations.')}`, { replace: true });
          return;
        }
        if (attemptData.attempt.status !== 'in_progress') {
          navigate(`/student/result/${attemptId}`, { replace: true });
          return;
        }
        
        const qData = await api(`/api/exams/${attemptData.attempt.exam_id}/questions`);
        
        // Calculate remaining seconds
        const duration = (attemptData.attempt.exams?.duration || 30) * 60; // seconds
        const now = new Date().getTime();

        let start = attemptData.attempt.started_at ? new Date(attemptData.attempt.started_at).getTime() : null;

        // If started_at is missing OR if this is a retaken attempt (score is null) with a stale/expired timestamp, reset started_at to NOW!
        if (!start || (attemptData.attempt.score === null && (now - start) >= (duration * 1000))) {
          start = now;
          await supabase
            .from('attempts')
            .update({ started_at: new Date(now).toISOString(), time_taken: 0 })
            .eq('id', attemptId);
        }

        const elapsed = Math.max(0, Math.floor((now - start) / 1000));
        const remaining = Math.max(0, duration - elapsed);
        
        setAttempt(attemptData.attempt);
        setQuestions(qData.questions);
        setTimeLeft(remaining);
        setViolations(attemptData.attempt.violation_count || 0);

        // Fetch any answers saved previously (if resuming)
        const resultData = await api(`/api/attempts/${attemptId}/result`);
        const savedAnswers = {};
        resultData.answers.forEach((ans) => {
          if (ans.selected_option !== null && ans.selected_option !== undefined) {
            savedAnswers[ans.question_id] = ans.selected_option;
          } else if (ans.selected_answer_text !== null && ans.selected_answer_text !== undefined) {
            savedAnswers[ans.question_id] = ans.selected_answer_text;
          }
        });
        setAnswers(savedAnswers);
      } catch (err) {
        setError(err.message || 'Failed to load exam data');
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [attemptId, navigate]);

  useEffect(() => {
    if (!loading && !isFullscreenActive()) {
      enterFullscreen();
    }
  }, [loading]);

  // Proctoring Hook
  const {
    violationCount: hookViolationCount,
    showWarningModal,
    setShowWarningModal,
    warningMessage,
    isFinalWarning,
    isPaused
  } = useExamProctor(attemptId, currentIdx, answers, timeLeft, () => submitExam(true), violations, submitting || submittingRef.current);

  // Timer loop
  useEffect(() => {
    if (loading || timeLeft <= 0 || submitting || submittingRef.current || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, timeLeft, submitting, isPaused]);

  const dirtyAnswersRef = useRef({});
  const savingRef = useRef(false);

  const handleSelectOptionText = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    dirtyAnswersRef.current[qId] = value;
  };

  const saveDirtyAnswers = async () => {
    const dirty = { ...dirtyAnswersRef.current };
    if (Object.keys(dirty).length === 0 || savingRef.current) return;
    
    savingRef.current = true;
    dirtyAnswersRef.current = {};
    
    try {
      const promises = Object.entries(dirty).map(async ([qId, val]) => {
        let retries = 3;
        let success = false;
        const isMcq = typeof val === 'number';
        const bodyPayload = {
          question_id: qId,
          selected_option: isMcq ? val : null,
          selected_answer_text: isMcq ? null : val
        };

        while (retries > 0 && !success) {
          try {
            await api(`/api/attempts/${attemptId}/answer`, {
              method: 'POST',
              body: bodyPayload
            });
            success = true;
          } catch (err) {
            retries--;
            if (retries === 0) throw err;
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      });
      
      await Promise.all(promises);
    } catch (err) {
      console.error('Failed to save answers, restoring dirty answers state:', err);
      Object.entries(dirty).forEach(([qId, val]) => {
        if (dirtyAnswersRef.current[qId] === undefined) {
          dirtyAnswersRef.current[qId] = val;
        }
      });
    } finally {
      savingRef.current = false;
    }
  };

  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      saveDirtyAnswers();
    }, 30000);
    return () => clearInterval(autoSaveTimer);
  }, []);

  const handleSelectOption = (optionIdx) => {
    const q = questions[currentIdx];
    setAnswers((prev) => ({ ...prev, [q.id]: optionIdx }));
    dirtyAnswersRef.current[q.id] = optionIdx;
  };

  const submitExam = async (isAuto = false) => {
    if (submitting || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    clearInterval(timerRef.current);

    // Safely exit full-screen mode before redirecting to result page
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen().catch(() => {});
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen().catch(() => {});
      }
    }

    // Flush remaining dirty answers
    await saveDirtyAnswers();

    try {
      await api(`/api/attempts/${attemptId}/submit?auto=${isAuto}`, { method: 'POST' });
      setShowSubmitConfirm(false);
      navigate(`/student/result/${attemptId}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Submission failed');
      submittingRef.current = false;
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  const handleManualSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const handleAutoSubmit = () => {
    submitExam(true);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  const answeredCount = questions.filter((q) => {
    const ans = answers[q.id];
    return ans !== undefined && ans !== null && ans !== '';
  }).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  const currentQuestion = questions[currentIdx];

  return (
    <div className="app-container">
      <div className="container" style={{ paddingBottom: 48 }}>
        <header className="exam-header">
          <div>
            <h3>{attempt?.exams?.title}</h3>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Active Session</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className={`exam-timer ${timeLeft < 120 ? 'warning' : ''}`}>
              <Clock size={18} />
              {formatTime(timeLeft)}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                await saveDirtyAnswers();
                handleManualSubmit();
              }}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                padding: '9px 18px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                cursor: 'pointer'
              }}
              id="header-finish-exam-btn"
            >
              <Send size={16} />
              <span>Finish Exam</span>
            </button>
          </div>
        </header>

        {(violations > 0 || hookViolationCount > 0) && (
          <div className="violation-banner">
            <AlertTriangle size={20} />
            <span>
              Security warning: <strong>{hookViolationCount}</strong> violation(s) detected. All activities are monitored in real-time.
            </span>
          </div>
        )}

        <ViolationModal
          isOpen={showWarningModal}
          onClose={() => {
            setShowWarningModal(false);
            enterFullscreen();
          }}
          message={warningMessage}
          isFinal={isFinalWarning}
          violationCount={hookViolationCount}
        />

        {showSubmitConfirm && (
          <div className="modal-overlay" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
            <div className="modal-content" style={{ maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', padding: '32px 28px', borderRadius: 24, boxShadow: '0 25px 70px rgba(0, 0, 0, 0.2)', textAlign: 'center' }}>
              
              {/* Modal Header — Centered */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{
                  width: 58, height: 58, background: '#ECFDF5', color: '#10B981',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)'
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', textAlign: 'center' }}>
                  Confirm & Submit Examination
                </h3>
                <p style={{ color: '#0284C7', fontSize: '0.92rem', fontWeight: 700, margin: 0, textAlign: 'center' }}>
                  {attempt?.exams?.title}
                </p>
              </div>

              {/* Confirmation Definition Text — Centered Box */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px 18px', borderRadius: 14, marginBottom: 18, textAlign: 'center' }}>
                <p style={{
                  fontSize: '0.88rem', color: '#475569', lineHeight: 1.55,
                  textAlign: 'center', margin: 0, fontWeight: 500
                }}>
                  Are you sure you want to finish and submit your examination? Once confirmed, your answers will be evaluated and recorded.
                </p>
              </div>

              {/* Summary Metric Cards — Centered */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18, textAlign: 'center' }}>
                <div style={{ background: '#F0F7FF', border: '1px solid #BAE6FD', padding: '12px 10px', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0369A1', marginTop: 2 }}>{questions.length}</div>
                </div>

                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 10px', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Answered</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857', marginTop: 2 }}>{answeredCount}</div>
                </div>

                <div style={{ background: unansweredCount > 0 ? '#FFFBEB' : '#F8FAFC', border: `1px solid ${unansweredCount > 0 ? '#FDE68A' : '#E2E8F0'}`, padding: '12px 10px', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: unansweredCount > 0 ? '#D97706' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unanswered</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: unansweredCount > 0 ? '#B45309' : '#475569', marginTop: 2 }}>{unansweredCount}</div>
                </div>
              </div>

              {/* Question Breakdown Preview Grid Numbers */}
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Question Grid:</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Click number to jump to question</span>
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', gap: 6,
                  maxHeight: 110, overflowY: 'auto', padding: 10, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0'
                }}>
                  {questions.map((q, idx) => {
                    const isAns = answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '';
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setCurrentIdx(idx);
                          setShowSubmitConfirm(false);
                        }}
                        title={isAns ? `Question ${idx + 1}: Answered` : `Question ${idx + 1}: Unanswered`}
                        style={{
                          width: '100%', height: 34, borderRadius: 8, border: 'none',
                          fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                          background: isAns ? '#10B981' : '#E2E8F0',
                          color: isAns ? '#FFFFFF' : '#475569',
                          boxShadow: isAns ? '0 2px 6px rgba(16, 185, 129, 0.25)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Questions Preview List */}
              <div style={{ marginBottom: 18, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>All Questions Preview:</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{questions.length} questions listed below</span>
                </div>
                <div style={{
                  maxHeight: 220, overflowY: 'auto', paddingRight: 6, background: '#FAFAFA',
                  padding: 10, borderRadius: 14, border: '1px solid #E2E8F0'
                }}>
                  {questions.map((q, idx) => {
                    const ansVal = answers[q.id];
                    const isAns = ansVal !== undefined && ansVal !== null && ansVal !== '';
                    let selectedDisplay = '';
                    if (isAns) {
                      if (typeof ansVal === 'number' && q.options && q.options[ansVal] !== undefined) {
                        selectedDisplay = `Selected: ${String.fromCharCode(65 + ansVal)}. ${q.options[ansVal]}`;
                      } else {
                        selectedDisplay = `Selected: ${ansVal}`;
                      }
                    }

                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          setCurrentIdx(idx);
                          setShowSubmitConfirm(false);
                        }}
                        style={{
                          background: isAns ? '#F0FDF4' : '#FFFBEB',
                          border: `1px solid ${isAns ? '#BBF7D0' : '#FDE68A'}`,
                          borderRadius: 12,
                          padding: '10px 12px',
                          marginBottom: 8,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                            Question {idx + 1}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: isAns ? '#10B981' : '#F59E0B',
                            color: '#FFFFFF'
                          }}>
                            {isAns ? 'Answered' : 'Unanswered'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#334155', margin: '0 0 4px 0', lineHeight: 1.4, fontWeight: 500 }}>
                          {q.question_text}
                        </p>
                        {isAns ? (
                          <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>
                            {selectedDisplay}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: '#B45309', fontStyle: 'italic' }}>
                            No answer selected yet. Click to review.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unanswered Questions Warning Alert — Centered */}
              {unansweredCount > 0 && (
                <div style={{
                  background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E',
                  padding: '12px 16px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20, textAlign: 'center'
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <span>You have {unansweredCount} unanswered question(s). You can go back to complete them.</span>
                </div>
              )}

              {/* Action Buttons — Submit Button Aligned to Right */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginTop: 4 }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                  onClick={() => setShowSubmitConfirm(false)}
                  id="confirm-submit-cancel"
                >
                  ← Back to Exam
                </button>
                <button
                  className="btn btn-primary"
                  style={{
                    padding: '12px 26px', borderRadius: 12, fontWeight: 700, fontSize: '0.92rem',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                    marginLeft: 'auto',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    submitExam(false);
                  }}
                  disabled={submitting}
                  id="confirm-submit-button"
                >
                  {submitting ? 'Submitting...' : 'Confirm & Submit Exam →'}
                </button>
              </div>

            </div>
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        {questions.length > 0 && currentQuestion && (
          <div className="exam-body-grid">
            <main className="question-panel" style={{ position: 'relative' }}>
              {isPaused && (
                <div className="paused-screen-overlay">
                  <PauseCircle size={64} className="pulse-dot" />
                  <div className="paused-text">Examination Paused by Admin</div>
                  <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Please wait for the proctor to resume your session.</p>
                </div>
              )}
              <div className="question-text">
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <span style={{
                    color: '#0066FF',
                    background: '#EFF6FF',
                    padding: '6px 18px',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: '1px solid #BFDBFE',
                    display: 'inline-block'
                  }}>
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                </div>
                {currentQuestion.image_url && (
                  <div style={{ margin: '16px 0', textAlign: 'center' }}>
                    <img
                      src={currentQuestion.image_url}
                      alt="Question Context"
                      style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                )}
                <p style={{ marginTop: 12 }}>{currentQuestion.question_text}</p>
              </div>

              {/* Render either option buttons or fill text field */}
              {(currentQuestion.question_type === 'mcq' || currentQuestion.question_type === 'image_mcq' || !currentQuestion.question_type) ? (
                <div className="options-list">
                  {currentQuestion.options.map((option, i) => (
                    <button
                      key={i}
                      className={`option-btn ${answers[currentQuestion.id] === i ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(i)}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: 24, padding: '0 8px' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
                    Type your answer:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter correct answer here..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleSelectOptionText(currentQuestion.id, e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '500px',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '1.5px solid var(--border-light)',
                      fontSize: '1rem',
                      background: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                    * Answer evaluation is case-insensitive.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    await saveDirtyAnswers();
                    setCurrentIdx((p) => Math.max(0, p - 1));
                  }}
                  disabled={currentIdx === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      await saveDirtyAnswers();
                      setCurrentIdx((p) => p + 1);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      await saveDirtyAnswers();
                      handleManualSubmit();
                    }}
                    disabled={submitting}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#22C55E', boxShadow: 'none' }}
                  >
                    <Send size={16} />
                    Finish Exam
                  </button>
                )}
              </div>
            </main>

            <aside className="exam-nav-panel">
              <h4 style={{ marginBottom: 16 }}>Overview</h4>
              <div className="q-grid">
                {questions.map((q, idx) => {
                  const answered = answers[q.id] !== undefined;
                  const active = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      className={`q-badge ${active ? 'active' : ''} ${answered && !active ? 'answered' : ''}`}
                      onClick={async () => {
                        await saveDirtyAnswers();
                        setCurrentIdx(idx);
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--primary)' }} />
                  Current Question
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--light-blue)', border: '1px solid var(--primary)' }} />
                  Answered
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, border: '1px solid var(--border-light)' }} />
                  Unanswered
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  await saveDirtyAnswers();
                  handleManualSubmit();
                }}
                disabled={submitting}
                style={{
                  width: '100%',
                  marginTop: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  padding: '12px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  cursor: 'pointer'
                }}
                id="sidebar-finish-exam-btn"
              >
                <Send size={16} />
                <span>Finish Exam</span>
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
