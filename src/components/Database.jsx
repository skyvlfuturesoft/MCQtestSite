import { motion } from 'framer-motion';
import { Database as DbIcon, Table2 } from 'lucide-react';

const tables = [
  {
    name: 'profiles',
    columns: [
      { name: 'id', type: 'PK', badge: 'pk' },
      { name: 'name', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'role', type: 'ENUM' },
    ],
  },
  {
    name: 'exams',
    columns: [
      { name: 'id', type: 'PK', badge: 'pk' },
      { name: 'title', type: 'TEXT' },
      { name: 'duration', type: 'INT' },
      { name: 'created_by', type: 'FK', badge: 'fk' },
    ],
  },
  {
    name: 'questions',
    columns: [
      { name: 'id', type: 'PK', badge: 'pk' },
      { name: 'exam_id', type: 'FK', badge: 'fk' },
      { name: 'question', type: 'TEXT' },
      { name: 'options', type: 'JSONB' },
      { name: 'correct_answer', type: 'TEXT' },
      { name: 'marks', type: 'INT' },
    ],
  },
  {
    name: 'attempts',
    columns: [
      { name: 'id', type: 'PK', badge: 'pk' },
      { name: 'student_id', type: 'FK', badge: 'fk' },
      { name: 'exam_id', type: 'FK', badge: 'fk' },
      { name: 'score', type: 'INT' },
      { name: 'status', type: 'ENUM' },
      { name: 'violation_count', type: 'INT' },
    ],
  },
  {
    name: 'answers',
    columns: [
      { name: 'attempt_id', type: 'FK', badge: 'fk' },
      { name: 'question_id', type: 'FK', badge: 'fk' },
      { name: 'selected_option', type: 'TEXT' },
    ],
  },
  {
    name: 'event_logs',
    columns: [
      { name: 'id', type: 'PK', badge: 'pk' },
      { name: 'type', type: 'ENUM' },
      { name: 'user_id', type: 'FK', badge: 'fk' },
      { name: 'timestamp', type: 'TIMESTAMPTZ' },
      { name: 'details', type: 'JSONB' },
    ],
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
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

export default function DatabaseSection() {
  return (
    <section className="section" id="database">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <DbIcon size={16} />
            Database
          </div>
          <h2 className="section-title">
            Database <span className="gradient-text">Design</span>
          </h2>
          <p className="section-subtitle">
            A well-structured PostgreSQL schema on Supabase with proper relations,
            constraints, and row-level security policies.
          </p>
        </motion.div>

        <motion.div
          className="db-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {tables.map((table, i) => (
            <motion.div className="db-card" key={i} variants={cardVariants}>
              <div className="db-card-header">
                <Table2 size={20} />
                <h4>{table.name}</h4>
              </div>
              <ul className="db-columns">
                {table.columns.map((col, j) => (
                  <li className="db-column" key={j}>
                    <span className="col-name">{col.name}</span>
                    <span className={`col-badge ${col.badge || ''}`}>{col.type}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
