// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Criar o contexto
const AuthContext = createContext();

// Hook para utilizar o contexto
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState();
    const [userTravels, setUserTravels] = useState([]);

    // Load user data from localStorage on app load
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        const storedTravels = localStorage.getItem("user-travels");
        if (storedTravels) {
            setUserTravels(JSON.parse(storedTravels));
        }
    },[]);

    return (
        <AuthContext.Provider value={{ user, setUser, userTravels, setUserTravels}}>
            {children}
        </AuthContext.Provider>
    );
};
