import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Monitor, Users, Zap } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';

const floatingCards = [
  { icon: <Shield size={20} />, label: 'Secured with JWT', color: '#E3F2FD' },
  { icon: <Monitor size={20} />, label: 'Realtime Monitoring', color: '#E8F5E9' },
  { icon: <Users size={20} />, label: '500+ Students', color: '#FFF3E0' },
  { icon: <Zap size={20} />, label: 'Auto Evaluation', color: '#F3E5F5' },
];

const stats = [
  { number: '18+', label: 'Features' },
  { number: '6', label: 'Modules' },
  { number: '10+', label: 'Security Layers' },
  { number: '99.9%', label: 'Uptime' },
];

export default function Hero() {
  return (
    <section className="hero" id="home">
      <AnimatedBackground />

      {floatingCards.map((card, i) => (
        <motion.div
          key={i}
          className="floating-card"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 + i * 0.2, duration: 0.6 }}
        >
          <div className="fc-icon" style={{ background: card.color, color: '#1565C0' }}>
            {card.icon}
          </div>
          {card.label}
        </motion.div>
      ))}

      <div className="hero-content">
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="dot" />
          S.A. Engineering College — Developed by Skyvlfuturesoft
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          Secure Online{' '}
          <span className="gradient-text">Examination</span>{' '}
          Management System
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          A secure cloud-based examination platform with real-time monitoring,
          automatic evaluation, malpractice detection, and powerful administration
          tools built using React, FastAPI, and Supabase.
        </motion.p>

        <motion.div
          className="hero-buttons"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <a href="#architecture" className="btn btn-primary" onClick={(e) => { e.preventDefault(); document.querySelector('#architecture')?.scrollIntoView({ behavior: 'smooth' }); }}>
            <Sparkles size={18} />
            View Documentation
          </a>
          <a href="#features" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }); }}>
            Explore Features
            <ArrowRight size={18} />
          </a>
        </motion.div>

        <motion.div
          className="hero-stats"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          {stats.map((stat, i) => (
            <div className="hero-stat" key={i}>
              <div className="number">{stat.number}</div>
              <div className="label">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
