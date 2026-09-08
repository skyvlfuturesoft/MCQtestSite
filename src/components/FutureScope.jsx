import { motion } from 'framer-motion';
import {
  ScanFace, Eye, Mic, Brain,
  Smartphone, BookOpen, Sparkles,
  Target, TrendingUp, Rocket
} from 'lucide-react';

const futureItems = [
  { icon: <ScanFace size={28} />, title: 'AI Face Detection', desc: 'Verify student identity using facial recognition during exams.' },
  { icon: <Eye size={28} />, title: 'Eye Tracking', desc: 'Monitor gaze patterns to detect potential cheating behavior.' },
  { icon: <Mic size={28} />, title: 'Voice Monitoring', desc: 'Detect ambient sounds and voice activity during exam sessions.' },
  { icon: <Brain size={28} />, title: 'AI Proctoring', desc: 'Intelligent automated proctoring with anomaly detection.' },
  { icon: <Smartphone size={28} />, title: 'Mobile Application', desc: 'Native iOS and Android apps for on-the-go exam access.' },
  { icon: <BookOpen size={28} />, title: 'LMS Integration', desc: 'Seamless integration with popular Learning Management Systems.' },
  { icon: <Sparkles size={28} />, title: 'AI Analytics', desc: 'ML-powered insights for predicting and improving outcomes.' },
  { icon: <Target size={28} />, title: 'Question Recommendation', desc: 'AI-generated question suggestions based on difficulty and topic.' },
  { icon: <TrendingUp size={28} />, title: 'Performance Prediction', desc: 'Predict student performance with historical data analysis.' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function FutureScope() {
  return (
    <section className="section" id="future">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <Rocket size={16} />
            Future Scope
          </div>
          <h2 className="section-title">
            What's <span className="gradient-text">Next</span>
          </h2>
          <p className="section-subtitle">
            Exciting planned enhancements to transform the platform with
            AI, mobile apps, and advanced analytics.
          </p>
        </motion.div>

        <motion.div
          className="future-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {futureItems.map((item, i) => (
            <motion.div className="future-card" key={i} variants={cardVariants}>
              <div className="future-icon">{item.icon}</div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
