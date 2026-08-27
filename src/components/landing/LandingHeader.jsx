// src/components/landing/LandingHeader.jsx
//
// Round 59 — small, discreet top-of-page header for the public
// Landing. Brand on the left is now the actual Globe Memories logo
// (PNG) instead of a lucide icon + text label, and the right side
// carries the Login / Register CTAs (or "Ir para a app" when signed
// in).

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, LogIn } from 'lucide-react';
import logo from '../../images/Globe-Memories.png';
import '../../styles/components/landing-header.css';

const LandingHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="gm-lh">
      <div className="gm-lh__inner">
        <Link to="/" className="gm-lh__brand" aria-label="Globe Memories — início">
          <img
            src={logo}
            alt="Globe Memories"
            className="gm-lh__brand-logo"
          />
        </Link>

        <nav className="gm-lh__nav" aria-label="Conta">
          {user ? (
            <button
              type="button"
              className="gm-lh__btn gm-lh__btn--primary"
              onClick={() => navigate('/home')}
            >
              Ir para a app
              <ArrowRight size={14} strokeWidth={2.4} />
            </button>
          ) : (
            <>
              <Link to="/login" className="gm-lh__link">
                <LogIn size={14} strokeWidth={2.2} />
                <span>Iniciar sessão</span>
              </Link>
              <Link to="/register" className="gm-lh__btn gm-lh__btn--primary">
                Criar conta
                <ArrowRight size={14} strokeWidth={2.4} />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default LandingHeader;
