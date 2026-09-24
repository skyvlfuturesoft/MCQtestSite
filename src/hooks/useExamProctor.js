import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function useExamProctor(attemptId, currentIdx, answers, timeLeft, submitExam, initialViolations, isSubmitting = false) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [violationCount, setViolationCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isFinalWarning, setIsFinalWarning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (initialViolations !== undefined && initialViolations !== null) {
      setViolationCount(initialViolations);
    }
  }, [initialViolations]);

  const currentIdxRef = useRef(currentIdx);
  const answersRef = useRef(answers);
  const timeLeftRef = useRef(timeLeft);
  const violationCountRef = useRef(violationCount);
  const isPausedRef = useRef(isPaused);
  const isSubmittingRef = useRef(isSubmitting);
  isSubmittingRef.current = isSubmitting;

  // Sync refs to avoid stale closures in event listeners
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { violationCountRef.current = violationCount; }, [violationCount]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // Utility to gather browser metadata
  const getProctorMetadata = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('Edge') > -1) browser = 'Edge';

    let os = 'Unknown OS';
    if (ua.indexOf('Windows') > -1) os = 'Windows';
    else if (ua.indexOf('Mac') > -1) os = 'macOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iPhone') > -1) os = 'iOS';

    return { browser, os, ip_address: '127.0.0.1', device: 'Desktop' };
  };

  // Heartbeat & Sync Loop + Realtime Subscriptions
  useEffect(() => {
    let active = true;
    let consecutiveFailures = 0;
    const meta = getProctorMetadata();

    const sendHeartbeat = async () => {
      if (!active) return;
      try {
        const answeredCount = Object.keys(answersRef.current).length;
        const res = await api('/api/session/heartbeat', {
          method: 'POST',
          body: {
            attempt_id: attemptId,
            current_question_index: currentIdxRef.current,
            answered_count: answeredCount,
            time_remaining: timeLeftRef.current,
            browser: meta.browser,
            os: meta.os,
            ip_address: meta.ip_address,
            connection_status: navigator.onLine ? 'connected' : 'disconnected',
            is_paused: isPausedRef.current
          }
        });
        consecutiveFailures = 0; // reset on success
        if (res) {
          if (res.status === 'not_found') {
            active = false;
            return;
          }
          if (res.status === 'terminated' || res.status === 'submitted' || res.status === 'auto_submitted') {
            active = false;
            if (res.status === 'terminated') {
              navigate(`/student/exam-terminated?attempt_id=${attemptId}&reason=${encodeURIComponent('Exam session was terminated by the server.')}`, { replace: true });
            } else {
              navigate(`/student/result/${attemptId}`, { replace: true });
            }
            return;
          }
          if (res.is_paused !== undefined) {
            setIsPaused(res.is_paused);
          }
        }
      } catch (err) {
        consecutiveFailures++;
        if (consecutiveFailures === 1) {
          console.warn('Proctor heartbeat: backend unreachable, will retry silently.');
        }
      }
    };

    // 1. Subscribe to Realtime updates on attempts for instant termination/submission
    import('../lib/supabase').then(({ supabase }) => {
      const attemptsChannel = supabase
        .channel(`attempt-channel-${attemptId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'attempts', filter: `id=eq.${attemptId}` },
          (payload) => {
            const status = payload.new.status;
            if (status === 'terminated') {
              active = false;
              navigate(`/student/exam-terminated?attempt_id=${attemptId}&reason=${encodeURIComponent('Exam session was terminated by the administrator.')}`, { replace: true });
            } else if (status === 'submitted' || status === 'auto_submitted') {
              active = false;
              navigate(`/student/result/${attemptId}`, { replace: true });
            }
          }
        )
        .subscribe();

      // 2. Subscribe to Realtime updates on live_sessions for instant pause/resume
      const sessionsChannel = supabase
        .channel(`session-channel-${attemptId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'live_sessions', filter: `attempt_id=eq.${attemptId}` },
          (payload) => {
            if (payload.new.is_paused !== undefined) {
              setIsPaused(payload.new.is_paused);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(attemptsChannel);
        supabase.removeChannel(sessionsChannel);
      };
    });

    // Initial heartbeat
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 20000); // every 20 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [attemptId]);

  const lastViolationTimeRef = useRef(0);
  const offlineTimerRef = useRef(null);

  // Main monitoring effect
  useEffect(() => {
    const meta = getProctorMetadata();

    const reportViolation = async (type) => {
      if (isPausedRef.current || isSubmittingRef.current) return;

      const nowTime = Date.now();
      if (nowTime - lastViolationTimeRef.current < 1500) {
        // Prevent concurrent double-reports within 1.5s (e.g. concurrent blur and visibility events)
        return;
      }
      lastViolationTimeRef.current = nowTime;
      
      const expectedCount = violationCountRef.current + 1;
      
      try {
        const res = await api('/api/violations', {
          method: 'POST',
          body: {
            attempt_id: attemptId,
            violation_type: type,
            browser: meta.browser,
            os: meta.os,
            ip_address: meta.ip_address,
            device: meta.device
          }
        });

        if (res && res.kicked) {
          setShowWarningModal(false);
          // Redirect to the exam terminated page immediately with the specific reason
          navigate(`/student/exam-terminated?attempt_id=${attemptId}&reason=${encodeURIComponent(res.reason || 'Violation of exam rules')}`, { replace: true });
          return;
        }

        const serverCount = (res && res.violation_count) || expectedCount;
        setViolationCount(serverCount);

        const typeLabel = type.replace(/_/g, ' ').toUpperCase();
        if (serverCount === 1) {
          setWarningMessage(`Security alert: [${typeLabel}] detected. Please keep your focus on the examination window.`);
          setIsFinalWarning(false);
          setShowWarningModal(true);
        } else if (serverCount === 2) {
          setWarningMessage(`FINAL SECURITY WARNING: One more violation ([${typeLabel}]) will immediately terminate your session.`);
          setIsFinalWarning(true);
          setShowWarningModal(true);
        }
      } catch (err) {
        console.error('Failed to report violation:', err);
      }
    };

    // 1. Tab Switch (Visibility Change)
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittingRef.current) {
        reportViolation('tab_switch');
      }
    };

    // 2. Window Blur (Focus Loss)
    const handleWindowBlur = () => {
      if (!isSubmittingRef.current) {
        reportViolation('window_blur');
      }
    };

    const getFullscreenElement = () => {
      return (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        null
      );
    };

    // 3. Fullscreen Exit
    const handleFullscreenChange = () => {
      const activeFs = getFullscreenElement();
      if (!activeFs && !isPausedRef.current && !isSubmittingRef.current) {
        reportViolation('fullscreen_exit');
      }
    };

    // 4. Keydown (PrintScreen, Ctrl+P, Copy/Paste block)
    const handleKeyDown = (e) => {
      if (isSubmittingRef.current) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        reportViolation('copy_paste_right_click');
      }
      if (e.key === 'PrintScreen' || e.key === 'Snapshot') {
        e.preventDefault();
        reportViolation('copy_paste_right_click');
      }
    };

    // 5. Context Menu (Right Click)
    const handleContextMenu = (e) => {
      if (isSubmittingRef.current) return;
      e.preventDefault();
      reportViolation('copy_paste_right_click');
    };

    // 6. Copy / Paste events
    const handleCopy = (e) => {
      if (isSubmittingRef.current) return;
      e.preventDefault();
      reportViolation('copy_paste_right_click');
    };
    const handlePaste = (e) => {
      if (isSubmittingRef.current) return;
      e.preventDefault();
      reportViolation('copy_paste_right_click');
    };

    // 7. DevTools Open (Resize check) & Multi-monitor Check
    const handleResize = () => {
      if (isSubmittingRef.current) return;
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        reportViolation('devtools_open');
      }
      if (window.screen && window.screen.isExtended === true) {
        reportViolation('multi_monitor');
      }
    };

    // 8. Prevent reload/refresh
    const handleBeforeUnload = (e) => {
      if (isSubmittingRef.current) return;
      e.preventDefault();
      e.returnValue = 'Are you sure you want to refresh? Your violation count will increase.';
      return e.returnValue;
    };

    // 9. Network Disconnect (Grace period of 15 seconds)
    const handleOnline = () => {
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
    };
    const handleOffline = () => {
      if (!offlineTimerRef.current && !isSubmittingRef.current) {
        offlineTimerRef.current = setTimeout(() => {
          reportViolation('network_disconnect');
        }, 15000); // 15s grace period
      }
    };

    // Attach event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    window.addEventListener('resize', handleResize);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial checks on load
    handleResize();

    // Clean up listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
      }
    };
  }, [attemptId, submitExam, logout, navigate]);

  return {
    violationCount,
    showWarningModal,
    setShowWarningModal,
    warningMessage,
    isFinalWarning,
    isPaused
  };
}
