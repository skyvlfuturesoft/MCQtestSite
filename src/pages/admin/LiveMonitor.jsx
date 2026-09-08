import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Radio, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import LiveStudentTable from '../../components/admin/LiveStudentTable';
import ActivityFeed from '../../components/admin/ActivityFeed';
import AdminNotifications from '../../components/admin/AdminNotifications';
import AdminLiveCards from '../../components/admin/AdminLiveCards';
import '../../app.css';
import '../../proctor.css';

export default function LiveMonitor() {
  const navigate = useNavigate();
  
  const [activeAttempts, setActiveAttempts] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ active_attempts: 0, total_violations: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const activeAttemptsRef = useRef([]);
  activeAttemptsRef.current = activeAttempts;

  // 1. Initial Load of active attempts, stats, and recent events
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [activeData, eventsData, statsData] = await Promise.all([
          api('/api/monitor/live'),
          api('/api/monitor/events?limit=25'),
          api('/api/monitor/stats')
        ]);
        setActiveAttempts(activeData.active_attempts);
        setEvents(eventsData.events);
        setStats({
          active_attempts: statsData.active_attempts,
          total_violations: statsData.total_violations
        });
      } catch (err) {
        setError(err.message || 'Failed to connect to monitor api');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Realtime Listener & Polling Fallback
  useEffect(() => {
    if (loading) return;

    const isMock = !import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.VITE_SUPABASE_URL.includes('placeholder-project');

    if (isMock) {
      // In offline mock mode, poll database API endpoints every 2 seconds
      const pollInterval = setInterval(async () => {
        try {
          const [activeData, eventsData, statsData] = await Promise.all([
            api('/api/monitor/live'),
            api('/api/monitor/events?limit=25'),
            api('/api/monitor/stats')
          ]);
          setActiveAttempts(activeData.active_attempts);
          setEvents(eventsData.events);
          setStats({
            active_attempts: statsData.active_attempts,
            total_violations: statsData.total_violations
          });
        } catch (e) {
          console.error("Polling error in mock mode:", e);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    }

    // Local profile cache to prevent redundant fetches
    const profileCache = {};

    // Otherwise, listen to live event logs via real Supabase WebSockets
    const eventChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_logs' },
        async (payload) => {
          try {
            let profileData = profileCache[payload.new.user_id];
            if (!profileData) {
              const userProfile = await supabase
                .from('profiles')
                .select('name, email')
                .eq('id', payload.new.user_id)
                .single();
              if (userProfile.data) {
                profileData = userProfile.data;
                profileCache[payload.new.user_id] = profileData;
              }
            }
              
            const formattedEvent = {
              ...payload.new,
              profiles: profileData || { name: 'Student', email: '' },
              created_at: new Date().toISOString()
            };

            setEvents((prev) => [formattedEvent, ...prev.slice(0, 49)]);

            if (['tab_switch', 'window_blur', 'violation'].includes(payload.new.event_type)) {
              setStats((prev) => ({ ...prev, total_violations: prev.total_violations + 1 }));
              
              setActiveAttempts((prevAttempts) =>
                prevAttempts.map((att) =>
                  att.id === payload.new.attempt_id
                    ? { ...att, violation_count: (att.violation_count || 0) + 1 }
                    : att
                )
              );
            }
          } catch (e) {
            console.error('Realtime payload handling error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attempts' },
        async (payload) => {
          try {
            // Only trigger API fetch on INSERT (new exam attempt) or if the status actually changed
            const isInsert = payload.eventType === 'INSERT';
            const isStatusChange = payload.eventType === 'UPDATE' && payload.new.status !== payload.old.status;
            
            if (isInsert || isStatusChange) {
              const [activeData, statsData] = await Promise.all([
                api('/api/monitor/live'),
                api('/api/monitor/stats')
              ]);
              setActiveAttempts(activeData.active_attempts);
              
              setStats({
                active_attempts: statsData.active_attempts,
                total_violations: statsData.total_violations
              });
            } else if (payload.eventType === 'UPDATE' && payload.new.violation_count !== payload.old.violation_count) {
              // Update violation count locally in state to avoid unnecessary database hits
              setActiveAttempts((prevAttempts) =>
                prevAttempts.map((att) =>
                  att.id === payload.new.id
                    ? { ...att, violation_count: payload.new.violation_count }
                    : att
                )
              );
            }
          } catch (e) {
            console.error(e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
    };
  }, [loading]);

  const getTimeRemaining = (startedAt, durationMins) => {
    const start = new Date(startedAt).getTime();
    const duration = durationMins * 60 * 1000;
    const now = new Date().getTime();
    const elapsed = now - start;
    const remaining = Math.max(0, duration - elapsed);
    
    if (remaining === 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Timer updater loop for display
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

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
          <div className="dashboard-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2>Live Activity Monitor</h2>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(21, 101, 192, 0.1)', color: 'var(--primary)',
                  padding: '4px 12px', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 600
                }}>
                  <Radio size={14} className="pulse-dot" style={{ animation: 'pulse-dot 2s infinite' }} />
                  Live Subscribed
                </div>
              </div>
              <p>Track student exam sessions and cheat detection events in real time</p>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <AdminLiveCards />

          <h3 style={{ marginBottom: 16, borderBottom: '1.5px solid var(--border-light)', paddingBottom: 10 }}>
            Active Exam Sessions
          </h3>

          <LiveStudentTable />

          <h3 style={{ marginBottom: 16, borderBottom: '1.5px solid var(--border-light)', paddingBottom: 10 }}>
            Live Security Event Logs (WebSocket)
          </h3>

          <ActivityFeed />

          <AdminNotifications />
        </div>
      </div>
    </div>
  );
}
