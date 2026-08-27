import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Linkedin, Github, Mail } from 'lucide-react';
import './footer.css';

const COLUMNS = [
  {
    title: 'Explorar',
    links: [
      { to: '/travels', label: 'Descobrir viagens' },
      { to: '/interactive-map', label: 'Mapa Mundo' },
      { to: '/users', label: 'Viajantes' },
      { to: '/qanda', label: 'Fórum' },
    ],
  },
  {
    title: 'Tu',
    links: [
      { to: '/my-travels', label: 'As minhas viagens' },
      { to: '/future-travels', label: 'Por fazer' },
      { to: '/achievements', label: 'Conquistas' },
      { to: '/notifications', label: 'Notificações' },
    ],
  },
  {
    title: 'App',
    links: [
      { to: '/help-support', label: 'Ajuda' },
      { to: '/settings-and-privacy', label: 'Definições' },
      { to: '/help-support', label: 'Contacto' },
    ],
  },
];

const Footer = () => (
  <footer className="gm-footer" role="contentinfo">
    <div className="gm-footer__inner">
      <div className="gm-footer__top">
        <div className="gm-footer__brand">
          <Link to="/" className="gm-footer__brand-head">
            <span className="gm-app__brand-mark">G</span>
            <span>Globe Memories</span>
          </Link>
          <p>O diário de viagem que dá vida às tuas memórias. Fotografias verticais, mapas interativos e uma comunidade que te inspira.</p>
          <form
            className="gm-footer__newsletter"
            onSubmit={(e) => { e.preventDefault(); }}
            aria-label="Subscrever newsletter"
          >
            <label htmlFor="gm-footer-news" style={{ fontSize: 12, fontWeight: 600, color: 'var(--gm-text-2)' }}>
              Recebe inspiração de viagem semanal.
            </label>
            <div className="gm-footer__newsletter-row">
              <input
                id="gm-footer-news"
                type="email"
                className="gm-footer__newsletter-input"
                placeholder="o-teu-email@exemplo.com"
                autoComplete="email"
              />
              <button type="submit" className="gm-footer__newsletter-btn">
                Subscrever
              </button>
            </div>
          </form>
        </div>

        {COLUMNS.map((col) => (
          <div className="gm-footer__col" key={col.title}>
            <h4>{col.title}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={`${col.title}-${l.to}-${l.label}`}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="gm-footer__bottom">
        <div className="gm-footer__socials">
          <a href="https://instagram.com/globememories" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <Instagram size={16} strokeWidth={1.75} />
          </a>
          <a href="https://twitter.com/globememories" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            <Twitter size={16} strokeWidth={1.75} />
          </a>
          <a href="https://linkedin.com/company/globememories" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <Linkedin size={16} strokeWidth={1.75} />
          </a>
          <a href="https://github.com/globememories" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Github size={16} strokeWidth={1.75} />
          </a>
          <a href="mailto:ola@globememories.app" aria-label="Email">
            <Mail size={16} strokeWidth={1.75} />
          </a>
        </div>

        <div className="gm-footer__bottom-meta">
          <span>© {new Date().getFullYear()} Globe Memories</span>
          <span className="dot" />
          <span>Feito com amor em Portugal</span>
          <span className="dot" />
          <span>v3</span>
        </div>
      </div>
    </div>
  </footer>
);

Footer.propTypes = {};

export default Footer;
