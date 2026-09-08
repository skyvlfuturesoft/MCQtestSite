import { motion } from 'framer-motion';
import {
  KeyRound, ShieldCheck, Lock, Database,
  Timer, Send, MonitorOff, EyeOff,
  Fingerprint, Route
} from 'lucide-react';

const securityFeatures = [
  { icon: <KeyRound size={22} />, title: 'JWT Authentication', desc: 'Stateless, signed tokens for secure session management.' },
  { icon: <ShieldCheck size={22} />, title: 'Role Based Access', desc: 'Distinct permissions for students and administrators.' },
  { icon: <Lock size={22} />, title: 'Supabase Auth', desc: 'Enterprise-grade authentication with MFA support.' },
  { icon: <Database size={22} />, title: 'Row Level Security', desc: 'Database-level policies ensuring data isolation.' },
  { icon: <Timer size={22} />, title: 'Server-side Timer', desc: 'Tamper-proof countdown managed entirely on backend.' },
  { icon: <Send size={22} />, title: 'Auto Submission', desc: 'Forced submit when timer expires, preventing manipulation.' },
  { icon: <MonitorOff size={22} />, title: 'Tab Detection', desc: 'Real-time monitoring of browser tab switches.' },
  { icon: <EyeOff size={22} />, title: 'Window Blur Detection', desc: 'Tracks when exam window loses focus.' },
  { icon: <Fingerprint size={22} />, title: 'Session Management', desc: 'Secure sessions with refresh token rotation.' },
  { icon: <Route size={22} />, title: 'Protected Routes', desc: 'Client and server route guards for unauthorized access.' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function Security() {
  return (
    <section className="section section-alt" id="security">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <ShieldCheck size={16} />
            Security
          </div>
          <h2 className="section-title">
            Enterprise-Grade <span className="gradient-text">Security</span>
          </h2>
          <p className="section-subtitle">
            Multiple layers of security ensure exam integrity and protect
            sensitive student data at every level.
          </p>
        </motion.div>

        <motion.div
          className="security-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {securityFeatures.map((feature, i) => (
            <motion.div className="security-card" key={i} variants={cardVariants}>
              <div className="sec-icon">{feature.icon}</div>
              <div>
                <h4>{feature.title}</h4>
                <p>{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
