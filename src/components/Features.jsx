import { motion } from 'framer-motion';
import {
  UserCheck, LayoutDashboard, ClipboardList, BookOpen,
  Timer, Send, MonitorOff, EyeOff,
  Radio, Calculator, BarChart3, FileText,
  Smartphone, Cloud, Cpu, KeyRound,
  Activity, Moon
} from 'lucide-react';

const features = [
  { icon: <UserCheck size={24} />, title: 'Student Authentication', desc: 'Secure login with Supabase Auth, email verification, and session management.' },
  { icon: <LayoutDashboard size={24} />, title: 'Admin Dashboard', desc: 'Comprehensive admin panel with real-time analytics and exam management.' },
  { icon: <ClipboardList size={24} />, title: 'Exam Management', desc: 'Create, schedule, publish, and manage exams with intuitive controls.' },
  { icon: <BookOpen size={24} />, title: 'Question Bank', desc: 'Organized question repository with categories, marks, and difficulty levels.' },
  { icon: <Timer size={24} />, title: 'Server Timer', desc: 'Tamper-proof server-side countdown timer for fair exam duration control.' },
  { icon: <Send size={24} />, title: 'Automatic Submission', desc: 'Auto-submit exams when time expires, preventing incomplete attempts.' },
  { icon: <MonitorOff size={24} />, title: 'Tab Switch Detection', desc: 'Detects and logs when students switch browser tabs during exams.' },
  { icon: <EyeOff size={24} />, title: 'Window Blur Detection', desc: 'Monitors window focus changes to prevent external resource access.' },
  { icon: <Radio size={24} />, title: 'Realtime Monitoring', desc: 'Live dashboard showing student activity, violations, and progress.' },
  { icon: <Calculator size={24} />, title: 'Score Calculation', desc: 'Instant automatic scoring with detailed breakdown per question.' },
  { icon: <BarChart3 size={24} />, title: 'Analytics', desc: 'Visual charts and insights for exam performance and trends.' },
  { icon: <FileText size={24} />, title: 'Report Generation', desc: 'Export comprehensive reports in multiple formats for analysis.' },
  { icon: <Smartphone size={24} />, title: 'Responsive Design', desc: 'Fully responsive interface optimized for all screen sizes.' },
  { icon: <Cloud size={24} />, title: 'Cloud Database', desc: 'Scalable PostgreSQL on Supabase with real-time subscriptions.' },
  { icon: <Cpu size={24} />, title: 'FastAPI Backend', desc: 'High-performance Python REST API with async request handling.' },
  { icon: <KeyRound size={24} />, title: 'Supabase Auth', desc: 'Enterprise-grade authentication with row-level security policies.' },
  { icon: <Activity size={24} />, title: 'Realtime Dashboard', desc: 'Live updates via Supabase Realtime for instant data sync.' },
  { icon: <Moon size={24} />, title: 'Dark/Light Ready', desc: 'Architecture supports theming with dark and light mode options.' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <Cpu size={16} />
            Features
          </div>
          <h2 className="section-title">
            Powerful Features for <span className="gradient-text">Secure Exams</span>
          </h2>
          <p className="section-subtitle">
            Every feature is designed to ensure exam integrity, streamline administration,
            and provide a seamless experience for students and administrators.
          </p>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {features.map((feature, i) => (
            <motion.div
              className="feature-card"
              key={i}
              variants={cardVariants}
            >
              <div className="icon-wrapper">
                {feature.icon}
              </div>
              <h4>{feature.title}</h4>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
