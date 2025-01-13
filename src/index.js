// src/index.js (ou main.js, dependendo da estrutura do seu projeto)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import App component
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider

// Correct usage: first the DOM element, then the content to render
const root = ReactDOM.createRoot(document.getElementById('root')); // Get the root container
root.render(
  <React.StrictMode>
    <AuthProvider> {/* Wrap App with AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);
