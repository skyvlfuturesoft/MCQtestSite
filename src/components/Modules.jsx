import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, ShieldCheck, ChevronDown,
  UserPlus, LogIn, LayoutDashboard, ListChecks,
  PenTool, Timer, Trophy, User,
  PlusCircle, FileQuestion, Users, FileBarChart,
  AlertTriangle, BarChart3, Settings
} from 'lucide-react';

const studentItems = [
  { icon: <UserPlus size={18} />, title: 'Registration', desc: 'Create a new student account with email verification and profile setup.' },
  { icon: <LogIn size={18} />, title: 'Login', desc: 'Secure authentication with Supabase Auth and JWT tokens.' },
  { icon: <LayoutDashboard size={18} />, title: 'Dashboard', desc: 'Personalized dashboard with upcoming exams, results, and notifications.' },
  { icon: <ListChecks size={18} />, title: 'Exam List', desc: 'Browse available exams with status, duration, and schedule details.' },
  { icon: <PenTool size={18} />, title: 'Attempt Exam', desc: 'Take exams with anti-cheating measures and progress auto-save.' },
  { icon: <Timer size={18} />, title: 'Timer', desc: 'Server-synchronized countdown timer with auto-submission on expiry.' },
  { icon: <Trophy size={18} />, title: 'Result', desc: 'Instant score display with question-wise breakdown and analytics.' },
  { icon: <User size={18} />, title: 'Profile', desc: 'Manage personal details, view history, and update preferences.' },
];

const adminItems = [
  { icon: <LayoutDashboard size={18} />, title: 'Dashboard', desc: 'Overview with live stats, recent activity, and quick actions.' },
  { icon: <PlusCircle size={18} />, title: 'Create Exam', desc: 'Build exams with custom settings, duration, and scheduling.' },
  { icon: <FileQuestion size={18} />, title: 'Question Management', desc: 'Add, edit, and organize questions with options and scoring.' },
  { icon: <Users size={18} />, title: 'Student Management', desc: 'View, manage, and monitor all registered students.' },
  { icon: <FileBarChart size={18} />, title: 'Reports', desc: 'Generate comprehensive exam reports with export options.' },
  { icon: <AlertTriangle size={18} />, title: 'Violations', desc: 'Track and review all detected malpractice events.' },
  { icon: <BarChart3 size={18} />, title: 'Analytics', desc: 'Visual insights into performance trends and patterns.' },
  { icon: <Settings size={18} />, title: 'Settings', desc: 'Configure platform settings, roles, and preferences.' },
];

function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div className="accordion-item">
      <button
        className={`accordion-trigger ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {item.icon}
          {item.title}
        </span>
        <ChevronDown size={18} />
      </button>
      <div
        className="accordion-content"
        style={{
          maxHeight: isOpen ? '120px' : '0px',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div className="accordion-content-inner">
          <p>{item.desc}</p>
        </div>
      </div>
    </div>
  );
}

function ModulePanel({ title, desc, icon, items, delay }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <motion.div
      className="module-panel"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay }}
    >
      <div className="module-panel-header">
        <div className="mp-icon">{icon}</div>
        <div>
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
      </div>
      <div className="accordion-list">
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function Modules() {
  return (
    <section className="section section-alt" id="modules">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <ListChecks size={16} />
            Modules
          </div>
          <h2 className="section-title">
            Application <span className="gradient-text">Modules</span>
          </h2>
          <p className="section-subtitle">
            Explore the detailed functionality available to students and administrators
            across every module.
          </p>
        </motion.div>

        <div className="modules-grid">
          <ModulePanel
            title="Student Module"
            desc="8 features for seamless exam experience"
            icon={<GraduationCap size={24} />}
            items={studentItems}
            delay={0}
          />
          <ModulePanel
            title="Admin Module"
            desc="8 tools for complete exam management"
            icon={<ShieldCheck size={24} />}
            items={adminItems}
            delay={0.15}
          />
        </div>
      </div>
    </section>
  );
}
