// src/context/AuthContext.js
import React, { createContext, useContext, useState } from 'react';

// Criar o contexto
const AuthContext = createContext();

// Hook para utilizar o contexto
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(); // Estado do utilizador (null significa não autenticado)

    // Função de login (exemplo simples)
    const login = (username) => {
        setUser({ username });
    };

    // Função de logout
    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
