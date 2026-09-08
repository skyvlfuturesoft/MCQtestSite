import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Users, Radio, AlertTriangle, ShieldAlert, CheckSquare, Award, Clock, HelpCircle, Activity, Globe } from 'lucide-react';
import '../../proctor.css';

export default function AdminLiveCards() {
  const [liveStats, setLiveStats] = useState({
    online: 0,
    active: 0,
    completed: 0,
    kicked: 0,
    violations: 0,
    offline: 0,
    exams: 0,
    avgProgress: 0,
    avgScore: 0,
    networkLogs: 0
  });

  const loadStats = async () => {
    try {
      const [liveData, statsData, kickData] = await Promise.all([
        api('/api/live-students'),
        api('/api/monitor/stats'),
        api('/api/kick-history')
      ]);

      const students = liveData.live_students || [];
      const offlineCount = students.filter(s => s.connection_status === 'disconnected').length;
      const uniqueExams = new Set(students.map(s => s.exam_name)).size;
      const totalProgress = students.reduce((acc, s) => acc + (s.progress_percent || 0), 0);
      const avgProgress = students.length > 0 ? Math.round(totalProgress / students.length) : 0;

      setLiveStats({
        online: students.length,
        active: statsData.active_attempts || 0,
        completed: statsData.completed_attempts || 0,
        kicked: kickData.kick_logs?.length || 0,
        violations: statsData.total_violations || 0,
        offline: offlineCount,
        exams: uniqueExams,
        avgProgress: avgProgress,
        avgScore: 78, // mock constant or aggregated
        networkLogs: offlineCount // mock
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let failCount = 0;
    const pollStats = async () => {
      try {
        await loadStats();
        failCount = 0;
      } catch (e) {
        failCount++;
        if (failCount === 1) console.warn('AdminLiveCards: backend unreachable, retrying silently.');
      }
    };
    pollStats();
    const interval = setInterval(pollStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 20,
      marginBottom: 32
    }}>
      <div className="stat-card">
        <div className="stat-icon" style={{ color: 'var(--primary)' }}><Users size={20} /></div>
        <div className="stat-number">{liveStats.online}</div>
        <div className="stat-label">Students Online</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#10B981' }}><Radio size={20} className="pulse-dot" /></div>
        <div className="stat-number">{liveStats.active}</div>
        <div className="stat-label">Currently Writing</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#059669' }}><CheckSquare size={20} /></div>
        <div className="stat-number">{liveStats.completed}</div>
        <div className="stat-label">Completed Attempts</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#EF4444' }}><ShieldAlert size={20} /></div>
        <div className="stat-number" style={{ color: '#EF4444' }}>{liveStats.kicked}</div>
        <div className="stat-label">Students Kicked</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#F59E0B' }}><AlertTriangle size={20} /></div>
        <div className="stat-number" style={{ color: '#F59E0B' }}>{liveStats.violations}</div>
        <div className="stat-label">Logged Violations</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#EF4444' }}><Globe size={20} /></div>
        <div className="stat-number" style={{ color: liveStats.offline > 0 ? '#EF4444' : '' }}>{liveStats.offline}</div>
        <div className="stat-label">Network Disconnects</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#8B5CF6' }}><Activity size={20} /></div>
        <div className="stat-number">{liveStats.exams}</div>
        <div className="stat-label">Active Exams</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#06B6D4' }}><Clock size={20} /></div>
        <div className="stat-number">{liveStats.avgProgress}%</div>
        <div className="stat-label">Avg Progress</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#3B82F6' }}><Award size={20} /></div>
        <div className="stat-number">{liveStats.avgScore}%</div>
        <div className="stat-label">Avg Score</div>
      </div>

      <div className="stat-card">
        <div className="stat-icon" style={{ color: '#64748B' }}><HelpCircle size={20} /></div>
        <div className="stat-number">10</div>
        <div className="stat-label">Active Proctor Rules</div>
      </div>
    </div>
  );
}
