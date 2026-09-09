import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import InstructionsModal from './InstructionsModal';

export default function Hero() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Python');
  const [timeLeft, setTimeLeft] = useState(2535); // 00:42:15 in seconds

  // Live Countdown Timer tick for realistic feel
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const questionNavItems = [
    { num: 1, status: 'answered' },
    { num: 2, status: 'answered' },
    { num: 3, status: 'current' },
    { num: 4, status: 'not-visited' },
    { num: 5, status: 'not-visited' },
    { num: 6, status: 'not-visited' },
    { num: 7, status: 'not-visited' },
    { num: 8, status: 'not-visited' },
    { num: 9, status: 'not-visited' },
    { num: 10, status: 'not-visited' },
    { num: 11, status: 'not-visited' },
    { num: 12, status: 'marked' },
    { num: 13, status: 'not-visited' },
    { num: 14, status: 'not-visited' },
    { num: 15, status: 'not-visited' },
    { num: 16, status: 'not-visited' },
    { num: 17, status: 'not-visited' },
    { num: 18, status: 'not-visited' },
    { num: 19, status: 'not-visited' },
    { num: 20, status: 'not-visited' },
  ];

  return (
    <section className="hero-redesign" id="home">
      <InstructionsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="hero-container">
        <div className="hero-grid">
          {/* Left Hero Content */}
          <motion.div 
            className="hero-text-col"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
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

          {/* Right Hero Visual Mockup Preview */}
          <motion.div 
            className="hero-mockup-col"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="mockup-window">
              {/* Window Controls */}
              <div className="mockup-window-header">
                <div className="window-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
              </div>

              {/* Exam Header inside Mockup */}
              <div className="mockup-exam-nav">
                <div className="mockup-logo">
                  <img src="/logo-removebg-preview.png" alt="S.A. Engineering College Emblem" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                    S.A.EC Exam
                  </span>
                </div>

                <div className="mockup-timer">
                  <Clock size={16} color="#475569" />
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 600 }}>Time Left</div>
                  <div className="timer-countdown">{formatTime(timeLeft)}</div>
                </div>

                <button className="mockup-end-btn" onClick={() => alert('End Exam Clicked!')}>
                  End Exam
                </button>
              </div>

              {/* Exam Content Split Body */}
              <div className="mockup-exam-body">
                {/* Main Question Area */}
                <div className="mockup-question-area">
                  {/* Progress Header */}
                  <div className="mockup-progress-header">
                    <span className="question-count">Question 12 of 50</span>
                    <span className="progress-percent">24%</span>
                  </div>

                  <div className="mockup-progress-bar">
                    <div className="progress-fill" style={{ width: '24%' }} />
                  </div>

                  {/* Question Text */}
                  <div className="mockup-question-text">
                    Which of the following is an example of an object-oriented programming language?
                  </div>

                  {/* MCQ Options Radio List */}
                  <div className="mockup-options-list">
                    {[
                      { id: 'A', text: 'C' },
                      { id: 'B', text: 'Python' },
                      { id: 'C', text: 'HTML' },
                      { id: 'D', text: 'SQL' },
                    ].map((opt) => (
                      <label 
                        key={opt.id} 
                        className={`mockup-option-card ${selectedOption === opt.text ? 'selected' : ''}`}
                        onClick={() => setSelectedOption(opt.text)}
                      >
                        <div className="option-radio">
                          {selectedOption === opt.text && <div className="radio-inner" />}
                        </div>
                        <span className="option-badge">{opt.id}</span>
                        <span className="option-text">{opt.text}</span>
                      </label>
                    ))}
                  </div>

                  {/* Question Actions */}
                  <div className="mockup-question-actions">
                    <button className="btn-mockup-prev">Previous</button>
                    <button className="btn-mockup-review">Mark for Review</button>
                    <button className="btn-mockup-next">Next</button>
                  </div>
                </div>

                {/* Right Question Navigator Sidebar */}
                <div className="mockup-navigator-sidebar">
                  <div className="navigator-title">Question Navigator</div>

                  <div className="navigator-grid">
                    {questionNavItems.map((item) => (
                      <div 
                        key={item.num} 
                        className={`nav-box ${item.status}`}
                      >
                        {item.num}
                      </div>
                    ))}
                  </div>

                  {/* Legend Key */}
                  <div className="navigator-legend">
                    <div className="legend-item">
                      <span className="dot dot-answered" /> Answered
                    </div>
                    <div className="legend-item">
                      <span className="dot dot-not-visited" /> Not Visited
                    </div>
                    <div className="legend-item">
                      <span className="dot dot-current" /> Current
                    </div>
                    <div className="legend-item">
                      <span className="dot dot-marked" /> Marked for Review
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
