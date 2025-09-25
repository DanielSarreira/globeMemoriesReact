// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Criar o contexto
const AuthContext = createContext();

// Hook para utilizar o contexto
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState();
    const [userTravels, setUserTravels] = useState([]);

    // Load user data and auth token from localStorage on app load
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const authToken = localStorage.getItem("auth_token");
        
        if (storedUser && authToken) {
            setUser(JSON.parse(storedUser));
        } else {
            setUser(null);
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
