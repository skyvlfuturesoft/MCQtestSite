import { Shield, GitBranch as GithubIcon, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Shield size={22} color="white" />
              </div>
              <h3 style={{ margin: 0 }}>SOEMS</h3>
            </div>
            <p>
              Secure Online Examination Management System — A secure examination
              platform built with modern web technologies for secure, scalable, and
              intelligent online examinations.
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <a
                href="#"
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', textDecoration: 'none',
                  transition: 'background 0.3s',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.12)'}
              >
                <GithubIcon size={18} />
              </a>
              <a
                href="#"
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', textDecoration: 'none',
                  transition: 'background 0.3s',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.12)'}
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3>Documentation</h3>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#architecture">Architecture</a></li>
              <li><a href="#modules">Modules</a></li>
              <li><a href="#database">Database</a></li>
              <li><a href="#security">Security</a></li>
            </ul>
          </div>

          <div>
            <h3>Technology</h3>
            <ul className="footer-links">
              <li><a href="#techstack">React</a></li>
              <li><a href="#techstack">FastAPI</a></li>
              <li><a href="#techstack">Supabase</a></li>
              <li><a href="#techstack">PostgreSQL</a></li>
              <li><a href="#techstack">Vercel</a></li>
            </ul>
          </div>

          <div>
            <h3>Contact</h3>
            <ul className="footer-links">
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} />
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>
                  S.A. Engineering College
                </span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Mail size={14} />
                <a href="mailto:contact@saec.ac.in">contact@saec.ac.in</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Secure Online Examination Management System.
            S.A. Engineering College. Developed by Skyvlfuturesoft.
          </p>
          <p>
            Built with React, FastAPI & Supabase by Skyvlfuturesoft
          </p>
        </div>
      </div>
    </footer>
  );
}
