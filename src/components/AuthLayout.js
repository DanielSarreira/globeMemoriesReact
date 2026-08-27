import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import '../styles/pages/auth-layout.css';

const LOGO_SRC = '/images/Globe-Memories.png';

/**
 * AuthLayout — dedicated shell for /login and /register.
 * No sidebar, no top bar, no mobile tab bar.
 * Renders <Outlet /> so child routes (Login / Register) are injected
 * by React Router, not via the `children` prop.
 *
 * Round 78 — added a body class (`gm-auth-page`) while the auth
 * shell is mounted. The class locks the body to exactly
 * `height: 100dvh` and `overflow: hidden`, so the body itself
 * never scrolls and never shows a scrollbar. The auth-layout
 * (see `auth-layout.css`) is the only scroll surface: it scrolls
 * internally on /register and stays put on /login. This
 * eliminates both the "double scrollbar" (no body scrollbar
 * competing with the auth-layout's) and the "white gap below
 * the footer" (the body's white background never peeks through
 * because the auth-layout always covers the full body).
 *
 * Round 54 — Removed the old `gm-auth-layout__brand` (Globe2 icon +
 * "Globe Memories" text) from the top bar. The logo image is now the
 * single, prominent identity mark — bigger, centered, with a subtle
 * gradient halo to make it feel premium.
 */
const AuthLayout = () => {
  const location = useLocation();
  const isWide = location.pathname.startsWith('/register');

  useEffect(() => {
    document.body.classList.add('gm-auth-page');
    return () => {
      document.body.classList.remove('gm-auth-page');
    };
  }, []);

  return (
    <div className="gm-auth-layout">
      <header className="gm-auth-layout__topbar" role="banner">
        <a href="/" className="gm-auth-layout__logo-wrap" aria-label="Globe Memories — início">
          <span className="gm-auth-layout__logo-halo" aria-hidden="true" />
          <img
            src={LOGO_SRC}
            alt="Globe Memories"
            className="gm-auth-layout__logo"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </a>
      </header>

      <main className="gm-auth-layout__main" role="main">
        <div className={`gm-auth-layout__content${isWide ? ' gm-auth-layout__content--wide' : ''}`}>
          <Outlet />
        </div>
      </main>

      <footer className="gm-auth-layout__footer" role="contentinfo">
        <span>© {new Date().getFullYear()} Globe Memories</span>
        <span className="gm-auth-layout__footer-dot" aria-hidden="true">·</span>
        <span>Viaje · Explore · Lembre</span>
      </footer>
    </div>
  );
};

export default AuthLayout;
