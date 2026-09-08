import { motion } from 'framer-motion';
import { Users, Monitor, Server, Database, Radio, LayoutDashboard } from 'lucide-react';

const nodes = [
  { icon: <Users size={24} />, title: 'Student', desc: 'End User' },
  { icon: <Monitor size={24} />, title: 'React Frontend', desc: 'Vite + Tailwind' },
  { icon: <Server size={24} />, title: 'FastAPI REST API', desc: 'Python Backend' },
  { icon: <Database size={24} />, title: 'Supabase', desc: 'PostgreSQL + Auth' },
  { icon: <Radio size={24} />, title: 'Realtime', desc: 'Live Subscriptions' },
  { icon: <LayoutDashboard size={24} />, title: 'Admin Dashboard', desc: 'Management Panel' },
];

export default function Architecture() {
  return (
    <section className="section section-alt" id="architecture">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <Server size={16} />
            Architecture
          </div>
          <h2 className="section-title">
            System <span className="gradient-text">Architecture</span>
          </h2>
          <p className="section-subtitle">
            A clean, modular architecture connecting students to administrators
            through a high-performance tech stack.
          </p>
        </motion.div>

        <div className="arch-diagram">
          {nodes.map((node, i) => (
            <motion.div
              key={i}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className="arch-node">
                <div className="arch-icon">{node.icon}</div>
                <h4>{node.title}</h4>
                <p>{node.desc}</p>
              </div>
              {i < nodes.length - 1 && (
                <motion.div
                  className="arch-connector"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.3, duration: 0.4 }}
                  style={{ transformOrigin: 'top' }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
