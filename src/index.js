// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './App';
import './styles/force-light-mode.css';

// FIX (Round 33 — PWA): registar o service worker para que
// a app funcione como PWA (offline shell, instalável, network-first
// para HTML + cache-first para assets). O SW está em
// /public/service-worker.js e a estratégia (shell + runtime
// cache) está documentada lá. Em desenvolvimento, o
// `serviceWorker.register` é silenciosamente ignorado pelo
// Chrome quando o SW é servido de `localhost` sem HTTPS
// apenas para sessões de dev — não bloqueia a app.
if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  // Desactivar em dev (vite/webpack dev server) para evitar
  // cache de assets HMR; só activar em build de produção.
  process.env.NODE_ENV === 'production'
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        // Detecta nova versão do SW e força o cliente a
        // adoptá-la sem precisar de F5 (skipWaiting + reload).
        reg.addEventListener('updatefound', () => {
          const newSw = reg.installing;
          if (!newSw) return;
          newSw.addEventListener('statechange', () => {
            if (
              newSw.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // Há um novo SW à espera. Pede-lhe para assumir
              // o controlo e recarrega a página para o user ver
              // a nova versão sem cache stale.
              newSw.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          });
        });
      })
      .catch((err) => {
        // Silent — PWA é nice-to-have, não pode bloquear a app.
        console.warn('[Globe Memories] SW registration failed', err);
      });
  });
}

// Renderizar a aplicação
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppWrapper />);