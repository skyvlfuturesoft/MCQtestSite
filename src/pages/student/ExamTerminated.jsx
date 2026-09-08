import { useEffect } from 'react';
import { ShieldAlert, AlertOctagon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import '../../proctor.css';

export default function ExamTerminated() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt_id');
  const reason = searchParams.get('reason') || 'Security triggers logged tab switching, window focus loss, or developer console activity exceeding the permissible limit.';

  // Poll server to check if admin has reinstated the exam attempt
  useEffect(() => {
    if (!attemptId) return;

    let active = true;
    const checkReinstatement = async () => {
      try {
        const data = await api(`/api/attempts/${attemptId}`);
        if (active && data && data.attempt && data.attempt.status === 'in_progress') {
          // Attempt has been reinstated! Refresh and redirect to the exam page
          active = false;
          navigate(`/student/exam/${attemptId}`, { replace: true });
        }
      } catch (err) {
        // Silently handle polling network/auth errors
      }
    };

    const interval = setInterval(checkReinstatement, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [attemptId, navigate]);

  return (
    <div className="terminated-page-wrapper">
      <div className="terminated-card">
        <div className="terminated-icon-wrapper">
          <ShieldAlert size={64} className="terminated-icon" />
        </div>
        <h2 className="terminated-title">Examination Terminated</h2>
        <div className="terminated-divider" />
        
        <div className="terminated-body">
          <p className="terminated-msg">
            Your examination has been terminated because examination rules were violated.
          </p>
          <div className="terminated-notice-box">
            <AlertOctagon size={20} className="notice-icon" />
            <p style={{ margin: 0, fontWeight: 500 }}>
              {reason}
            </p>
          </div>
          <p className="terminated-instructions">
            All violations, IP addresses, and timestamps have been logged to the administrator proctor panel. Please contact the <strong>S.A. Engineering College</strong> exam department to appeal or schedule a re-examination.
          </p>
        </div>

        <div className="terminated-footer" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button 
            className="btn btn-secondary terminated-btn" 
            onClick={() => navigate('/student', { replace: true })}
          >
            Go to Dashboard
          </button>
          <button 
            className="btn btn-primary terminated-btn" 
            onClick={() => navigate('/login', { replace: true })}
          >
            Return to Login Portal
          </button>
        </div>
      </div>
    </div>
  );
}
