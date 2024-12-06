// src/index.js (ou main.js, dependendo da estrutura do seu projeto)

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App'; // Importa o componente App
import { AuthProvider } from './context/AuthContext'; // Importa o AuthProvider

ReactDOM.render(
    <React.StrictMode>
        <AuthProvider> {/* Envolva o App com AuthProvider */}
            <App />
        </AuthProvider>
    </React.StrictMode>,
    document.getElementById('root')
);
