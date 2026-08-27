// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

/**
 * @typedef {Object} User
 * @property {string} id - ID do utilizador
 * @property {string} name - Nome
 * @property {string} email - Email
 * @property {string} username - Username
 */

/**
 * AuthContext - Contexto global de autenticação
 * @type {React.Context}
 */
const AuthContext = createContext();

/**
 * Hook para aceder ao contexto de autenticação
 * @returns {Object} Objeto com user, setUser, userTravels, setUserTravels, isLoadingAuth
 */
export const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider - Componente provider para autenticação
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes filhos
 * @returns {React.ReactElement}
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState();
    const [userTravels, setUserTravels] = useState([]);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // Load user data and auth token from localStorage on app load
    useEffect(() => {
        const loadAuth = async () => {
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

            // Sempre mostra splash screen por 2.4 segundos
            setTimeout(() => {
                setIsLoadingAuth(false);
            }, 2400);  // 2.4 segundos
        };

        loadAuth();
    },[]);

    // Round 57 — listen for the axios-helper "auth:logout" event so we
    // can wipe the in-memory user when the JWT filter rejects a banned
    // account mid-session. The event carries `reason: 'banned'` plus
    // the server message; we stash that in sessionStorage so the Login
    // page can surface it as a toast on next mount.
    useEffect(() => {
        const onAuthLogout = (e) => {
            const detail = e?.detail || {};
            if (detail.isAdmin) return; // admin uses its own context
            setUser(null);
            setUserTravels([]);
            if (detail.reason === 'banned' && detail.message) {
                try {
                    sessionStorage.setItem('gm:banned-message', detail.message);
                } catch {}
            }
        };
        window.addEventListener('auth:logout', onAuthLogout);
        return () => window.removeEventListener('auth:logout', onAuthLogout);
    }, []);

    // Memoize o valor do context para evitar re-renders desnecessários
    const value = useMemo(() => ({
        user,
        setUser,
        userTravels,
        setUserTravels,
        isLoadingAuth
    }), [user, userTravels, isLoadingAuth]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
