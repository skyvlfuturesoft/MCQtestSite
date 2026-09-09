import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '1',
    title: 'Login',
    desc: 'Access your account using your credentials',
  },
  {
    number: '2',
    title: 'Select Exam',
    desc: 'Choose the exam from the list',
  },
  {
    number: '3',
    title: 'Answer Questions',
    desc: 'Attempt the MCQs within the given time',
  },
  {
    number: '4',
    title: 'Submit & View Result',
    desc: 'Complete the exam and see your performance',
  },
];

export default function Workflow() {
  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="container">
        {/* Section Header */}
        <motion.div 
          className="how-it-works-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="how-it-works-title">How It Works</h2>
          <p className="how-it-works-subtitle">Get started in just a few simple steps</p>
        </motion.div>

        {/* 4 Steps Horizontal Row */}
        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-wrapper">
              <motion.div 
                className="step-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12, duration: 0.5 }}
              >
                <div className="step-number-badge">
                  {step.number}
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </motion.div>

              {/* Arrow Connector between steps */}
              {index < steps.length - 1 && (
                <div className="step-arrow">
                  <ArrowRight size={22} color="#94A3B8" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
