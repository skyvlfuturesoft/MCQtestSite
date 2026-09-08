import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Clock, AlertTriangle, ChevronRight, ChevronLeft, Send, PauseCircle } from 'lucide-react';
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
  const [error, setError] = useState('');
  
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  
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

  // Proctoring Hook
  const {
    violationCount: hookViolationCount,
    showWarningModal,
    setShowWarningModal,
    warningMessage,
    isFinalWarning,
    isPaused
  } = useExamProctor(attemptId, currentIdx, answers, timeLeft, () => submitExam(true), violations);

  // Timer loop
  useEffect(() => {
    if (loading || timeLeft <= 0 || submitting || isPaused) return;

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
        
        await api('/api/events/log', {
          method: 'POST',
          body: {
            attempt_id: attemptId,
            event_type: 'answer_saved',
            details: { question_id: qId, option_index: isMcq ? val : null, answer_text: isMcq ? null : val }
          }
        });
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
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    // Flush remaining dirty answers
    await saveDirtyAnswers();

    try {
      await api(`/api/attempts/${attemptId}/submit?auto=${isAuto}`, { method: 'POST' });
      navigate(`/student/result/${attemptId}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Submission failed');
      setSubmitting(false);
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

  const currentQuestion = questions[currentIdx];

  return (
    <div className="app-container">
      <div className="container" style={{ paddingBottom: 48 }}>
        <header className="exam-header">
          <div>
            <h3>{attempt?.exams?.title}</h3>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Active Session</span>
          </div>
          <div className={`exam-timer ${timeLeft < 120 ? 'warning' : ''}`}>
            <Clock size={18} />
            {formatTime(timeLeft)}
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
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
              elem.requestFullscreen().catch(() => {});
            } else if (elem.webkitRequestFullscreen) {
              elem.webkitRequestFullscreen().catch(() => {});
            } else if (elem.msRequestFullscreen) {
              elem.msRequestFullscreen().catch(() => {});
            }
          }}
          message={warningMessage}
          isFinal={isFinalWarning}
          violationCount={hookViolationCount}
        />

        {showSubmitConfirm && (
          <div className="modal-overlay" style={{ display: 'flex' }}>
            <div className="modal-content" style={{ maxWidth: 450, padding: 32, textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 28
              }}>
                ✓
              </div>
              <h3 style={{ marginBottom: 12 }}>Submit Examination?</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem', lineHeight: 1.5 }}>
                Are you sure you want to finish and submit your exam? You cannot modify your answers or return to the exam after this.
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowSubmitConfirm(false)}
                  id="confirm-submit-cancel"
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#22C55E' }}
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    submitExam(false);
                  }}
                  id="confirm-submit-button"
                >
                  Yes, Submit
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
                <span style={{ color: 'var(--primary)', marginRight: 10 }}>
                  Question {currentIdx + 1} of {questions.length}
                </span>
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
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
