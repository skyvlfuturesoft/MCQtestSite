import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ShieldAlert, Clock, FileCheck } from 'lucide-react';

export default function InstructionsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <motion.div 
          className="modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid #E2E8F0',
            position: 'relative',
            padding: '32px'
          }}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              border: 'none',
              background: '#F1F5F9',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
          >
            <X size={20} />
          </button>

          {/* Modal Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileCheck size={26} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0F172A' }}>
                Examination Instructions
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>
                Please review the guidelines carefully before starting your MCQ test.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* General Rules */}
            <div style={{ background: '#F8FAFC', padding: '18px 20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#2563EB" />
                General Guidelines
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.92rem', lineHeight: '1.7' }}>
                <li><strong>Single Attempt Rule:</strong> Each student is permitted to attend and submit the examination <strong>only once</strong>.</li>
                <li>Ensure you have a stable internet connection before beginning.</li>
                <li>Each question carries 1 mark unless specified otherwise.</li>
                <li>You can navigate between questions using the Question Navigator or Next/Previous buttons.</li>
                <li>Click <strong>Mark for Review</strong> if you wish to recheck a question later.</li>
              </ul>
            </div>

            {/* Timer Rules */}
            <div style={{ background: '#F8FAFC', padding: '18px 20px', borderRadius: '16px', border: '1px solid #F1F5F9' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#2563EB" />
                Timer & Auto-Submission
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.92rem', lineHeight: '1.7' }}>
                <li>The countdown timer displays the remaining time at the top right corner.</li>
                <li>The exam will automatically submit when the timer reaches 00:00:00.</li>
                <li>Manual submission is enabled at any time via the <strong>End Exam</strong> button.</li>
              </ul>
            </div>

            {/* Security Rules */}
            <div style={{ background: '#FEF2F2', padding: '18px 20px', borderRadius: '16px', border: '1px solid #FECACA' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#DC2626" />
                Anti-Malpractice Protocol
              </h4>
              <p style={{ margin: 0, color: '#7F1D1D', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Tab switching, window blurring, or attempting to open external applications will trigger automatic anti-cheat warnings and may lead to instant exam termination.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            <a
              href="/login"
              className="btn btn-primary"
              style={{
                padding: '10px 28px',
                borderRadius: '12px',
                background: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              Start Exam Now
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
