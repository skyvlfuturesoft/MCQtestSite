import { motion } from 'framer-motion';
import { FileText, Clock, ShieldCheck, BarChart3, Cpu, UserCheck, LayoutDashboard, Radio } from 'lucide-react';

const mainHighlightFeatures = [
  {
    icon: <FileText size={26} color="#2563EB" />,
    title: 'MCQ-Based Tests',
    desc: 'Well-structured questions for better learning',
  },
  {
    icon: <Clock size={26} color="#2563EB" />,
    title: 'Timed Examinations',
    desc: 'Stay focused with real-time countdown',
  },
  {
    icon: <ShieldCheck size={26} color="#2563EB" />,
    title: 'Secure Environment',
    desc: 'Fair and protected examination process',
  },
  {
    icon: <BarChart3 size={26} color="#2563EB" />,
    title: 'Instant Results',
    desc: 'Get your performance immediately after submission',
  },
];

const secondaryFeatures = [
  { icon: <UserCheck size={22} />, title: 'Student Authentication', desc: 'Secure login with role-based access and verified sessions.' },
  { icon: <LayoutDashboard size={22} />, title: 'Admin Dashboard', desc: 'Manage exams, questions, student attempts, and settings.' },
  { icon: <Radio size={22} />, title: 'Live Monitoring', desc: 'Real-time anti-cheat surveillance and tab-switch detection.' },
  { icon: <Cpu size={22} />, title: 'Automated Scoring', desc: 'Instant precision evaluation with zero manual grading delay.' },
];

export default function Features() {
  return (
    <section className="features-redesign" id="features">
      <div className="container">
        {/* Primary 4 Feature Cards Row matching Reference Image */}
        <div className="main-features-grid">
          {mainHighlightFeatures.map((feat, i) => (
            <motion.div 
              key={i}
              className="main-feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="feature-icon-box">
                {feat.icon}
              </div>
              <div className="feature-card-content">
                <h3 className="feature-card-title">{feat.title}</h3>
                <p className="feature-card-desc">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Section Divider & Additional Tech Features */}
        <motion.div 
          className="extended-features-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="extended-badge">ENTERPRISE CAPABILITIES</span>
          <h2 className="extended-title">Comprehensive Platform Features</h2>
        </motion.div>

        <div className="secondary-features-grid">
          {secondaryFeatures.map((feat, i) => (
            <motion.div
              key={i}
              className="secondary-feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="sec-icon">{feat.icon}</div>
              <h4>{feat.title}</h4>
              <p>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
