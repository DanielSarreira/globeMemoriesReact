import React, { createContext, useContext, useState, useMemo } from 'react';

/**
 * WeatherContext - Contexto global de dados meteorológicos
 * @type {React.Context}
 */
const WeatherContext = createContext();

/**
 * WeatherProvider - Componente provider para dados meteorológicos
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes filhos
 * @returns {React.ReactElement}
 */
export const WeatherProvider = ({ children }) => {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize o valor do context para evitar re-renders desnecessários
  const value = useMemo(() => ({
    weather,
    setWeather,
    isLoading,
    setIsLoading
  }), [weather, isLoading]);

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
};

/**
 * Hook para aceder ao contexto meteorológico
 * @returns {Object} Objeto com weather, setWeather, isLoading, setIsLoading
 */
export const useWeather = () => useContext(WeatherContext); 