import { motion } from 'framer-motion';
import { FlaskConical, CheckCircle } from 'lucide-react';

const tests = [
  { name: 'Student Login', description: 'Authentication flow with valid credentials', status: 'Pass' },
  { name: 'Exam Start', description: 'Exam initialization with timer and questions', status: 'Pass' },
  { name: 'Auto Submit', description: 'Automatic submission on timer expiry', status: 'Pass' },
  { name: 'Realtime Dashboard', description: 'Live updates on admin monitoring panel', status: 'Pass' },
  { name: 'Violation Detection', description: 'Tab switch and window blur logging', status: 'Pass' },
  { name: 'Score Calculation', description: 'Accurate automatic grading', status: 'Pass' },
  { name: 'RLS Security', description: 'Row-level security policy enforcement', status: 'Pass' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 },
  },
};

export default function Testing() {
  return (
    <section className="section section-alt" id="testing">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <FlaskConical size={16} />
            Testing
          </div>
          <h2 className="section-title">
            Test <span className="gradient-text">Results</span>
          </h2>
          <p className="section-subtitle">
            All critical system features have been thoroughly tested
            to ensure reliability and security.
          </p>
        </motion.div>

        <motion.div
          className="testing-table-wrapper"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <table className="testing-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Test Case</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {tests.map((test, i) => (
                <motion.tr key={i} variants={rowVariants}>
                  <td style={{ fontWeight: 600, color: '#94A3B8' }}>{String(i + 1).padStart(2, '0')}</td>
                  <td style={{ fontWeight: 600 }}>{test.name}</td>
                  <td style={{ color: '#64748B' }}>{test.description}</td>
                  <td>
                    <span className={`status-badge ${test.status.toLowerCase()}`}>
                      <CheckCircle size={14} />
                      {test.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
