import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
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
          {/* Top Corner College Emblem Logo - Extra Large & Prominent */}
          <a href="#home" className="navbar-logo" onClick={(e) => handleNavClick(e, '#home')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img 
                src="/logo-removebg-preview.png" 
                alt="S.A. Engineering College Logo" 
                style={{ 
                  width: '105px', 
                  height: '105px', 
                  objectFit: 'contain', 
                  filter: 'drop-shadow(0 4px 12px rgba(15, 23, 42, 0.15))',
                  transition: 'transform 0.2s ease'
                }} 
              />

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.015em', color: '#0F172A', lineHeight: 1.2 }}>
                  S.A. Engineering College
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2563EB', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Online Examination System
                </span>
              </div>
            </div>
          </a>

          {/* Nav Links */}
          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={(e) => handleNavClick(e, link.href)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Login Button */}
          <div className="navbar-cta">
            <Link to="/login" className="btn btn-primary" style={{ padding: '11px 28px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600 }}>
              Login
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

      {/* Mobile Drawer Navigation */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <img src="/logo-removebg-preview.png" alt="S.A. Engineering College Logo" style={{ width: '96px', height: '96px', objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A' }}>
              S.A. Engineering College
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563EB' }}>
              Online Examination System
            </span>
          </div>
        </div>

        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)}>
            {link.label}
          </a>
        ))}
        <Link 
          to="/login" 
          className="btn btn-primary" 
          style={{ marginTop: '20px', padding: '12px 36px', fontSize: '1rem', fontWeight: 600, borderRadius: '12px' }}
          onClick={() => setMobileOpen(false)}
        >
          Login
        </Link>
      </div>
    </>
  );
}
