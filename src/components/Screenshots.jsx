import { motion } from 'framer-motion';
import { MonitorSmartphone } from 'lucide-react';

const screenshots = [
  {
    title: 'Student Login',
    url: 'exam.soems.io/login',
    elements: [
      { type: 'rect', x: '15%', y: '25%', w: '70%', h: '10%', color: '#E3F2FD', radius: 8 },
      { type: 'rect', x: '15%', y: '40%', w: '70%', h: '10%', color: '#E3F2FD', radius: 8 },
      { type: 'rect', x: '25%', y: '58%', w: '50%', h: '10%', color: '#1565C0', radius: 20 },
      { type: 'text', x: '50%', y: '20%', text: '🔐 Login', size: '14px' },
    ],
  },
  {
    title: 'Student Dashboard',
    url: 'exam.soems.io/dashboard',
    elements: [
      { type: 'rect', x: '5%', y: '5%', w: '20%', h: '90%', color: '#F0F7FF', radius: 8 },
      { type: 'rect', x: '28%', y: '8%', w: '33%', h: '25%', color: '#E3F2FD', radius: 12 },
      { type: 'rect', x: '64%', y: '8%', w: '33%', h: '25%', color: '#E3F2FD', radius: 12 },
      { type: 'rect', x: '28%', y: '38%', w: '69%', h: '55%', color: '#F0F7FF', radius: 12 },
    ],
  },
  {
    title: 'Exam Page',
    url: 'exam.soems.io/exam/1',
    elements: [
      { type: 'rect', x: '5%', y: '5%', w: '90%', h: '12%', color: '#1565C0', radius: 12 },
      { type: 'rect', x: '5%', y: '22%', w: '65%', h: '70%', color: '#F0F7FF', radius: 12 },
      { type: 'rect', x: '73%', y: '22%', w: '22%', h: '30%', color: '#E3F2FD', radius: 12 },
    ],
  },
  {
    title: 'Question Paper',
    url: 'exam.soems.io/exam/1/q3',
    elements: [
      { type: 'rect', x: '8%', y: '8%', w: '84%', h: '15%', color: '#F0F7FF', radius: 8 },
      { type: 'rect', x: '8%', y: '28%', w: '84%', h: '10%', color: '#E3F2FD', radius: 8 },
      { type: 'rect', x: '8%', y: '42%', w: '84%', h: '10%', color: '#E3F2FD', radius: 8 },
      { type: 'rect', x: '8%', y: '56%', w: '84%', h: '10%', color: '#E3F2FD', radius: 8 },
      { type: 'rect', x: '8%', y: '70%', w: '84%', h: '10%', color: '#E3F2FD', radius: 8 },
      { type: 'rect', x: '30%', y: '85%', w: '40%', h: '10%', color: '#1565C0', radius: 20 },
    ],
  },
  {
    title: 'Timer View',
    url: 'exam.soems.io/exam/timer',
    elements: [
      { type: 'circle', cx: '50%', cy: '40%', r: '22%', color: '#E3F2FD', stroke: '#1565C0' },
      { type: 'text', x: '50%', y: '42%', text: '⏱ 14:32', size: '18px' },
      { type: 'rect', x: '20%', y: '75%', w: '60%', h: '10%', color: '#E3F2FD', radius: 8 },
    ],
  },
  {
    title: 'Result Page',
    url: 'exam.soems.io/result/1',
    elements: [
      { type: 'text', x: '50%', y: '15%', text: '🏆 Score: 85/100', size: '16px' },
      { type: 'rect', x: '10%', y: '25%', w: '80%', h: '8%', color: '#1565C0', radius: 20 },
      { type: 'rect', x: '10%', y: '38%', w: '80%', h: '55%', color: '#F0F7FF', radius: 12 },
    ],
  },
  {
    title: 'Admin Dashboard',
    url: 'admin.soems.io/dashboard',
    elements: [
      { type: 'rect', x: '5%', y: '5%', w: '18%', h: '90%', color: '#1565C0', radius: 12 },
      { type: 'rect', x: '26%', y: '8%', w: '22%', h: '20%', color: '#E3F2FD', radius: 12 },
      { type: 'rect', x: '51%', y: '8%', w: '22%', h: '20%', color: '#E3F2FD', radius: 12 },
      { type: 'rect', x: '76%', y: '8%', w: '20%', h: '20%', color: '#E3F2FD', radius: 12 },
      { type: 'rect', x: '26%', y: '33%', w: '48%', h: '60%', color: '#F0F7FF', radius: 12 },
      { type: 'rect', x: '76%', y: '33%', w: '20%', h: '60%', color: '#F0F7FF', radius: 12 },
    ],
  },
  {
    title: 'Analytics Page',
    url: 'admin.soems.io/analytics',
    elements: [
      { type: 'rect', x: '5%', y: '5%', w: '18%', h: '90%', color: '#1565C0', radius: 12 },
      { type: 'rect', x: '26%', y: '8%', w: '35%', h: '42%', color: '#F0F7FF', radius: 12 },
      { type: 'rect', x: '64%', y: '8%', w: '32%', h: '42%', color: '#F0F7FF', radius: 12 },
      { type: 'rect', x: '26%', y: '55%', w: '70%', h: '38%', color: '#E3F2FD', radius: 12 },
    ],
  },
  {
    title: 'Reports',
    url: 'admin.soems.io/reports',
    elements: [
      { type: 'rect', x: '5%', y: '5%', w: '18%', h: '90%', color: '#1565C0', radius: 12 },
      { type: 'rect', x: '26%', y: '8%', w: '70%', h: '12%', color: '#F0F7FF', radius: 8 },
      { type: 'rect', x: '26%', y: '24%', w: '70%', h: '8%', color: '#E3F2FD', radius: 6 },
      { type: 'rect', x: '26%', y: '35%', w: '70%', h: '8%', color: '#F0F7FF', radius: 6 },
      { type: 'rect', x: '26%', y: '46%', w: '70%', h: '8%', color: '#E3F2FD', radius: 6 },
      { type: 'rect', x: '26%', y: '57%', w: '70%', h: '8%', color: '#F0F7FF', radius: 6 },
      { type: 'rect', x: '26%', y: '68%', w: '70%', h: '8%', color: '#E3F2FD', radius: 6 },
    ],
  },
];

function ScreenMockup({ screen }) {
  return (
    <div className="macbook-frame">
      <div className="macbook-topbar">
        <span className="macbook-dot red" />
        <span className="macbook-dot yellow" />
        <span className="macbook-dot green" />
        <span className="macbook-url">{screen.url}</span>
      </div>
      <div className="macbook-content">
        <svg width="100%" height="100%" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet">
          {screen.elements.map((el, i) => {
            if (el.type === 'rect') {
              return (
                <rect
                  key={i}
                  x={el.x}
                  y={el.y}
                  width={el.w}
                  height={el.h}
                  rx={el.radius}
                  fill={el.color}
                />
              );
            }
            if (el.type === 'circle') {
              return (
                <circle
                  key={i}
                  cx={el.cx}
                  cy={el.cy}
                  r={el.r}
                  fill={el.color}
                  stroke={el.stroke || 'none'}
                  strokeWidth={3}
                />
              );
            }
            if (el.type === 'text') {
              return (
                <text
                  key={i}
                  x={el.x}
                  y={el.y}
                  textAnchor="middle"
                  fontSize={el.size}
                  fill="#1E293B"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {el.text}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function Screenshots() {
  return (
    <section className="section" id="screenshots">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <MonitorSmartphone size={16} />
            Screenshots
          </div>
          <h2 className="section-title">
            Application <span className="gradient-text">Screens</span>
          </h2>
          <p className="section-subtitle">
            Preview the key interfaces across both student and admin
            experiences of the platform.
          </p>
        </motion.div>

        <motion.div
          className="screenshots-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {screenshots.map((screen, i) => (
            <motion.div className="screenshot-card" key={i} variants={cardVariants}>
              <ScreenMockup screen={screen} />
              <p className="screenshot-title">{screen.title}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
