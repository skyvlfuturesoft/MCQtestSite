import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import InstructionsModal from './InstructionsModal';

export default function Hero() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="hero-redesign" id="home">
      <div className="hero-bg-layer" aria-hidden="true" />
      <InstructionsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="hero-container">
        <motion.div 
          className="hero-center-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Top Tagline Badge */}
          <div className="hero-platform-tag">
            ONLINE EXAMINATION PLATFORM
          </div>

          {/* Main Headline */}
          <h1 className="hero-main-title">
            Simple Exams. <br />
            <span className="hero-blue-text">Brighter Futures.</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-description">
            Take secure, timed MCQ examinations with a clean and user-friendly experience.
          </p>

          {/* Action Buttons */}
          <div className="hero-actions">
            <a href="/login" className="btn-hero-primary">
              Start Examination
              <ArrowRight size={18} />
            </a>
            <button 
              onClick={() => setModalOpen(true)} 
              className="btn-hero-secondary"
            >
              View Instructions
            </button>
          </div>

          {/* Metrics / Key Highlights Row */}
          <div className="hero-metrics-row">
            <div className="metric-item">
              <div className="metric-value">100%</div>
              <div className="metric-label">Secure & Reliable</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-value">Easy</div>
              <div className="metric-label">to Use</div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-value">Instant</div>
              <div className="metric-label">Results</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
