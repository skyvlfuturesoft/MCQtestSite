import { motion } from 'framer-motion';
import { GitBranch } from 'lucide-react';

const studentSteps = [
  { title: 'Registration', desc: 'Create account with email verification' },
  { title: 'Login', desc: 'Authenticate with Supabase Auth' },
  { title: 'Dashboard', desc: 'View available exams and past results' },
  { title: 'Choose Exam', desc: 'Select an exam to attempt' },
  { title: 'Start Exam', desc: 'Begin with anti-cheating measures active' },
  { title: 'Timer Starts', desc: 'Server-synced countdown begins' },
  { title: 'Submit', desc: 'Manually submit or auto-submit on timeout' },
  { title: 'Score Generated', desc: 'Instant automatic evaluation' },
  { title: 'Logout', desc: 'Secure session termination' },
];

const adminSteps = [
  { title: 'Login', desc: 'Admin authentication with role check' },
  { title: 'Dashboard', desc: 'Overview of platform activity' },
  { title: 'Create Exam', desc: 'Set up exam with parameters' },
  { title: 'Add Questions', desc: 'Build question bank with answers' },
  { title: 'Publish', desc: 'Make exam available to students' },
  { title: 'Students Attend', desc: 'Monitor live exam sessions' },
  { title: 'Realtime Monitoring', desc: 'Track violations and progress' },
  { title: 'View Reports', desc: 'Analyze results and performance' },
  { title: 'Export Results', desc: 'Download reports and data' },
];

function WorkflowTimeline({ steps, delay = 0 }) {
  return (
    <div className="workflow-steps">
      {steps.map((step, i) => (
        <motion.div
          className="workflow-step"
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: delay + i * 0.08, duration: 0.4 }}
        >
          <div className="workflow-step-card">
            <h4>{step.title}</h4>
            <p>{step.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Workflow() {
  return (
    <section className="section" id="workflow">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <GitBranch size={16} />
            Workflow
          </div>
          <h2 className="section-title">
            User <span className="gradient-text">Workflows</span>
          </h2>
          <p className="section-subtitle">
            Step-by-step workflows for both students and administrators,
            from authentication to results.
          </p>
        </motion.div>

        <div className="workflow-container">
          <div className="workflow-column">
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              🎓 Student Workflow
            </motion.h3>
            <WorkflowTimeline steps={studentSteps} delay={0} />
          </div>
          <div className="workflow-column">
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              🛡️ Admin Workflow
            </motion.h3>
            <WorkflowTimeline steps={adminSteps} delay={0.2} />
          </div>
        </div>
      </div>
    </section>
  );
}
