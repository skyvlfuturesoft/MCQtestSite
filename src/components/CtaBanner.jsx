import { motion } from 'framer-motion';
import { ArrowRight, BookOpenCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CtaBanner() {
  return (
    <section className="cta-banner-section">
      <div className="container">
        <motion.div 
          className="cta-banner-card"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="cta-left-content">
            <div className="cta-icon-wrapper">
              <BookOpenCheck size={42} color="#2563EB" />
            </div>

            <div className="cta-text-wrapper">
              <h2 className="cta-title">Ready to start your examination?</h2>
              <p className="cta-subtitle">
                Take the next step towards your goals with MCQTest.
              </p>
            </div>
          </div>

          <div className="cta-action">
            <Link to="/login" className="btn-cta-primary">
              Start Now
              <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
