// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './App';
import './styles/force-light-mode.css';

// Registrar o service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        // Service Worker registered successfully
      })
      .catch((error) => {
        // Service Worker registration failed
      });
  });
}

// Renderizar a aplicação
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppWrapper />);