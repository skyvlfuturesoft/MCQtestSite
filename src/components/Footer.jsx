export default function Footer() {
  return (
    <footer className="footer-redesign" id="about">
      <div className="container">
        <div className="footer-inner-content">
          {/* Brand Left Side */}
          <div className="footer-brand-side">
            <div className="footer-logo-row" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img 
                src="/logo-removebg-preview.png" 
                alt="S.A. Engineering College Logo" 
                width={64}
                height={64}
                loading="lazy"
                style={{ width: '64px', height: '64px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(15, 23, 42, 0.1))' }} 
              />

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                  S.A. Engineering College
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#2563EB', textTransform: 'uppercase' }}>
                  Online Examination System
                </span>
              </div>
            </div>

            <div className="footer-brand-divider" />

            <span className="footer-tagline">
              A smarter way to evaluate
            </span>
          </div>

          {/* Links Right Side */}
          <ul className="footer-nav-links" id="contact">
            <li><a href="#about" aria-label="About S.A. Engineering College">About</a></li>
            <li><a href="#contact" aria-label="Contact examination system support">Contact</a></li>
            <li><a href="#privacy" aria-label="View Privacy Policy">Privacy Policy</a></li>
            <li><a href="#terms" aria-label="View Terms of Use">Terms of Use</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
