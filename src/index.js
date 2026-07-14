// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './App';
import './styles/force-light-mode.css';

// Service worker is currently disabled (no PWA shell yet).
// To re-enable: add a /public/service-worker.js and uncomment the block below.
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker
//       .register('/service-worker.js')
//       .catch((error) => {
//         console.warn('Service Worker registration failed', error);
//       });
//   });
// }

// Renderizar a aplicação
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppWrapper />);