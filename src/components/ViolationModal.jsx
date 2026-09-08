import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import '../proctor.css';

export default function ViolationModal({ isOpen, onClose, message, isFinal, violationCount }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(5);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => onClose(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="proctor-modal-overlay">
      <div className={`proctor-modal-card ${isFinal ? 'final-warning' : 'standard-warning'}`}>
        <div className="proctor-modal-icon">
          {isFinal ? <ShieldAlert size={48} className="pulse-warning" /> : <AlertTriangle size={48} />}
        </div>
        <h3 className="proctor-modal-title">
          {isFinal ? 'FINAL SECURITY WARNING' : 'SECURITY VIOLATION DETECTED'}
        </h3>
        <p className="proctor-modal-strikes">
          Strike <strong>{violationCount}</strong> of 3
        </p>
        <p className="proctor-modal-msg">{message}</p>
        
        <div className="proctor-modal-footer">
          <button className="proctor-modal-btn" onClick={onClose}>
            I Understand ({countdown}s)
          </button>
        </div>
      </div>
    </div>
  );
}
