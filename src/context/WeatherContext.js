import React, { createContext, useContext, useState } from 'react';

const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <WeatherContext.Provider value={{ weather, setWeather, isLoading, setIsLoading }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => useContext(WeatherContext); 