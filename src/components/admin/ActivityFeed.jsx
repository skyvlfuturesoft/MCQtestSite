import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import '../../proctor.css';

export default function ActivityFeed() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let failCount = 0;
    const load = async () => {
      try {
        const data = await api('/api/activity-feed');
        failCount = 0;
        setEvents(data.events || []);
      } catch (e) {
        failCount++;
        if (failCount === 1) console.warn('Activity feed: backend unreachable, retrying silently.');
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const getEmoji = (type) => {
    if (!type) return '📋';
    if (type.includes('kick')) return '🚫';
    if (type.includes('violation') || type.includes('warning')) return '⚠️';
    if (type.includes('submit')) return '📤';
    if (type.includes('start')) return '🟢';
    if (type.includes('network')) return '📡';
    return '📋';
  };

  return (
    <div className="live-events-panel" style={{ height: 300 }}>
      {events.length === 0 ? (
        <div style={{ margin: 'auto', color: '#64748B' }}>Waiting for activity events...</div>
      ) : (
        events.map((evt) => (
          <div className="event-log-item" key={evt.id}>
            <span style={{ marginRight: 8 }}>{getEmoji(evt.activity_type)}</span>
            <span className="event-time">[{new Date(evt.created_at).toLocaleTimeString()}]</span>{' '}
            <span style={{ color: '#F8FAFC' }}>
              {evt.message}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
