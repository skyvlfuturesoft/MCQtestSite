import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Shield } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Modules', href: '#modules' },
  { label: 'Database', href: '#database' },
  { label: 'Security', href: '#security' },
  { label: 'Screenshots', href: '#screenshots' },
  { label: 'Testing', href: '#testing' },
  { label: 'Future', href: '#future' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
        <div className="navbar-inner">
          <a href="#home" className="navbar-logo" onClick={(e) => handleNavClick(e, '#home')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <span>SOEMS</span>
          </a>

          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={(e) => handleNavClick(e, link.href)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="navbar-cta">
            <Link to="/login" className="btn btn-primary">
              Live Portal
            </Link>
          </div>

          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X size={24} />
        </button>
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)}>
            {link.label}
          </a>
        ))}
        <Link 
          to="/login" 
          className="btn btn-primary" 
          style={{ marginTop: '20px', padding: '12px 32px', fontSize: '1.05rem', fontWeight: 600 }}
          onClick={() => setMobileOpen(false)}
        >
          Live Portal
        </Link>
      </div>
    </>
  );
}
