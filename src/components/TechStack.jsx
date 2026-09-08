import { motion } from 'framer-motion';
import {
  Code2, Zap, Palette, Server, Terminal,
  Database, HardDrive, Radio, KeyRound,
  GitBranch as GithubIcon, Globe
} from 'lucide-react';

const techs = [
  { icon: <Code2 size={28} />, name: 'React', desc: 'UI Library' },
  { icon: <Zap size={28} />, name: 'Vite', desc: 'Build Tool' },
  { icon: <Palette size={28} />, name: 'Tailwind CSS', desc: 'Styling' },
  { icon: <Server size={28} />, name: 'FastAPI', desc: 'Backend' },
  { icon: <Terminal size={28} />, name: 'Python', desc: 'Language' },
  { icon: <Database size={28} />, name: 'Supabase', desc: 'BaaS' },
  { icon: <HardDrive size={28} />, name: 'PostgreSQL', desc: 'Database' },
  { icon: <Radio size={28} />, name: 'Realtime API', desc: 'Live Data' },
  { icon: <KeyRound size={28} />, name: 'JWT', desc: 'Auth Tokens' },
  { icon: <GithubIcon size={28} />, name: 'GitHub', desc: 'Version Control' },
  { icon: <Globe size={28} />, name: 'Vercel', desc: 'Deployment' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function TechStack() {
  return (
    <section className="section" id="techstack">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <Code2 size={16} />
            Technology
          </div>
          <h2 className="section-title">
            Built with <span className="gradient-text">Modern Tech</span>
          </h2>
          <p className="section-subtitle">
            A carefully selected technology stack chosen for performance,
            security, and developer experience.
          </p>
        </motion.div>

        <motion.div
          className="tech-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {techs.map((tech, i) => (
            <motion.div className="tech-card" key={i} variants={cardVariants}>
              <div className="tech-icon">{tech.icon}</div>
              <h4>{tech.name}</h4>
              <p>{tech.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
