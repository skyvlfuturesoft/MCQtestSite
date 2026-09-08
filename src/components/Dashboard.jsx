import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, CheckCircle, AlertTriangle,
  Send, TrendingUp, Activity
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const statsData = [
  { icon: <Users size={24} />, number: 248, label: 'Live Students', suffix: '' },
  { icon: <BookOpen size={24} />, number: 12, label: 'Active Exams', suffix: '' },
  { icon: <CheckCircle size={24} />, number: 1847, label: 'Completed Exams', suffix: '' },
  { icon: <AlertTriangle size={24} />, number: 34, label: 'Violations', suffix: '' },
  { icon: <Send size={24} />, number: 156, label: 'Auto Submitted', suffix: '' },
  { icon: <TrendingUp size={24} />, number: 78, label: 'Average Score', suffix: '%' },
];

const lineData = [
  { name: 'Mon', students: 45, exams: 3 },
  { name: 'Tue', students: 78, exams: 5 },
  { name: 'Wed', students: 120, exams: 8 },
  { name: 'Thu', students: 95, exams: 6 },
  { name: 'Fri', students: 150, exams: 10 },
  { name: 'Sat', students: 200, exams: 12 },
  { name: 'Sun', students: 85, exams: 4 },
];

const barData = [
  { name: 'CSE', pass: 85, fail: 15 },
  { name: 'ECE', pass: 78, fail: 22 },
  { name: 'MECH', pass: 92, fail: 8 },
  { name: 'CIVIL', pass: 70, fail: 30 },
  { name: 'EEE', pass: 88, fail: 12 },
];

const pieData = [
  { name: 'Completed', value: 65, color: '#1565C0' },
  { name: 'In Progress', value: 20, color: '#42A5F5' },
  { name: 'Pending', value: 15, color: '#E3F2FD' },
];

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const step = target / (duration / 16);
          let current = 0;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function ProgressRing({ percentage, size = 100, stroke = 8 }) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} className="progress-ring">
        <circle
          stroke="#E3F2FD"
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="url(#progressGradient)"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="progress-ring-circle"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1565C0" />
            <stop offset="100%" stopColor="#42A5F5" />
          </linearGradient>
        </defs>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: '1.2rem',
            fontWeight: 700,
            fill: '#1E293B',
          }}
          transform={`rotate(90, ${size / 2}, ${size / 2})`}
        >
          {percentage}%
        </text>
      </svg>
      <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>Pass Rate</span>
    </div>
  );
}

export default function Dashboard() {
  return (
    <section className="section section-alt" id="dashboard">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <Activity size={16} />
            Dashboard
          </div>
          <h2 className="section-title">
            Realtime <span className="gradient-text">Analytics</span>
          </h2>
          <p className="section-subtitle">
            A comprehensive admin dashboard with live statistics, interactive charts,
            and real-time monitoring capabilities.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="dashboard-stats"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          {statsData.map((stat, i) => (
            <motion.div
              className="stat-card"
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-number">
                <AnimatedCounter target={stat.number} suffix={stat.suffix} />
              </div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <div className="charts-grid">
          <motion.div
            className="chart-card"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h4>📈 Weekly Activity</h4>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3F2FD" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #D6E9FF',
                    boxShadow: '0 4px 16px rgba(21,101,192,0.1)',
                  }}
                />
                <Line type="monotone" dataKey="students" stroke="#1565C0" strokeWidth={2.5} dot={{ fill: '#1565C0', r: 4 }} />
                <Line type="monotone" dataKey="exams" stroke="#42A5F5" strokeWidth={2.5} dot={{ fill: '#42A5F5', r: 4 }} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h4>📊 Department Performance</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3F2FD" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #D6E9FF',
                    boxShadow: '0 4px 16px rgba(21,101,192,0.1)',
                  }}
                />
                <Bar dataKey="pass" fill="#1565C0" radius={[6, 6, 0, 0]} />
                <Bar dataKey="fail" fill="#E3F2FD" radius={[6, 6, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4>🥧 Exam Status Distribution</h4>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #D6E9FF',
                    boxShadow: '0 4px 16px rgba(21,101,192,0.1)',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <h4 style={{ alignSelf: 'flex-start', width: '100%' }}>🎯 Overall Pass Rate</h4>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ProgressRing percentage={82} size={160} stroke={12} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
