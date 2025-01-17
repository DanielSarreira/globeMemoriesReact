// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Criar o contexto
const AuthContext = createContext();

// Hook para utilizar o contexto
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState();

    // Load user data from localStorage on app load
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
