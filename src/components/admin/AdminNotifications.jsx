import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { X, AlertTriangle, ShieldAlert, CheckCircle, Radio } from 'lucide-react';
import '../../proctor.css';

export default function AdminNotifications() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let lastCount = 0;

    const poll = async () => {
      try {
        const data = await api('/api/activity-feed');
        const events = data.events || [];
        if (events.length > lastCount && lastCount > 0) {
          const newEvents = events.slice(0, events.length - lastCount);
          newEvents.forEach((evt) => {
            const type = evt.activity_type || '';
            let toastType = 'start';
            if (type.includes('violation') || type.includes('warning')) toastType = 'violation';
            else if (type.includes('kicked')) toastType = 'kick';
            else if (type.includes('submitted')) toastType = 'submit';

            setToasts((prev) => [
              { id: evt.id, message: evt.message, type: toastType, time: new Date(evt.created_at) },
              ...prev.slice(0, 4)
            ]);
          });
        }
        lastCount = events.length;
      } catch (e) {
        // Silently fail polling
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto dismiss after 6 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'violation': return <AlertTriangle size={18} style={{ color: '#D32F2F' }} />;
      case 'kick': return <ShieldAlert size={18} style={{ color: '#7F1D1D' }} />;
      case 'submit': return <CheckCircle size={18} style={{ color: '#10B981' }} />;
      default: return <Radio size={18} style={{ color: 'var(--primary)' }} />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="admin-toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`admin-toast ${toast.type}`}>
          {getIcon(toast.type)}
          <div className="admin-toast-content">
            <div className="admin-toast-title">
              {toast.type === 'violation' ? 'Security Alert' :
               toast.type === 'kick' ? 'Student Kicked' :
               toast.type === 'submit' ? 'Exam Submitted' : 'Activity'}
            </div>
            <div className="admin-toast-desc">{toast.message}</div>
          </div>
          <button className="admin-toast-close" onClick={() => removeToast(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
