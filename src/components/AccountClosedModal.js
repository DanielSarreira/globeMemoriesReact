// src/components/AccountClosedModal.js
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldOff, AlertTriangle, LogIn, X } from 'lucide-react';
import { clearAuthToken, STORAGE_KEYS } from '../axios_helper';
import '../styles/components/AccountClosedModal.css';

/**
 * Round 58 — global modal that surfaces when the user has been banned
 * or deleted while holding a still-valid token. Listens to the
 * `auth:logout` custom event dispatched by the axios response
 * interceptor (`reason: 'banned' | 'deleted'`).
 *
 * Once dismissed (or after the user clicks the action button) it
 * forces a redirect to /login and clears the appropriate token so the
 * user can't reach any page that needs authentication.
 */
const AccountClosedModal = () => {
  const [state, setState] = useState(null); // { kind, message }
  const navigate = useNavigate();

  const close = useCallback(() => setState(null), []);

  useEffect(() => {
    const onAuthLogout = (e) => {
      const detail = e?.detail || {};
      // Only surface in the user-facing app; the admin console has its
      // own login and shouldn't trigger this.
      if (detail.isAdmin) return;
      if (detail.reason === 'banned' || detail.reason === 'deleted') {
        setState({
          kind: detail.reason,
          message: detail.message || (
            detail.reason === 'banned'
              ? 'Conta suspensa. Contacta o suporte para mais informações.'
              : 'A tua conta foi removida. Contacta o suporte para mais informações.'
          ),
        });
      }
    };
    window.addEventListener('auth:logout', onAuthLogout);
    return () => window.removeEventListener('auth:logout', onAuthLogout);
  }, []);

  const handleGoToLogin = useCallback(() => {
    clearAuthToken(STORAGE_KEYS.USER);
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('user-travels');
    } catch {}
    setState(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  if (typeof document === 'undefined') return null;

  const isBanned = state?.kind === 'banned';

  return createPortal(
    <AnimatePresence>
      {state && (
        <motion.div
          className="acm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="acm-title"
        >
          <motion.div
            className="acm-card"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className="acm-close"
              onClick={close}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className={`acm-icon ${isBanned ? 'acm-icon--banned' : 'acm-icon--deleted'}`}>
              {isBanned ? <ShieldOff size={36} strokeWidth={1.6} /> : <AlertTriangle size={36} strokeWidth={1.6} />}
            </div>

            <h2 id="acm-title" className="acm-title">
              {isBanned ? 'Conta suspensa' : 'Conta removida'}
            </h2>

            <p className="acm-message">{state.message}</p>

            <p className="acm-sub">
              {isBanned
                ? 'A tua sessão terminou automaticamente. Não podes aceder à plataforma enquanto a conta estiver suspensa.'
                : 'A tua sessão terminou automaticamente porque a tua conta foi removida por um administrador.'}
            </p>

            <div className="acm-actions">
              <button type="button" className="acm-btn acm-btn--primary" onClick={handleGoToLogin}>
                <LogIn size={16} strokeWidth={2} /> Ir para o login
              </button>
              <button type="button" className="acm-btn acm-btn--ghost" onClick={close}>
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default AccountClosedModal;
