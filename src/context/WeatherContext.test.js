/**
 * WeatherContext.test.js - Testes para WeatherContext otimizado
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { WeatherProvider, useWeather } from '../WeatherContext';

describe('WeatherContext Otimizado', () => {
  test('deve fornecer valor inicial correto', () => {
    const wrapper = ({ children }) => <WeatherProvider>{children}</WeatherProvider>;
    const { result } = renderHook(() => useWeather(), { wrapper });
    
    expect(result.current.weather).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  test('deve permitir atualizar weather', () => {
    const wrapper = ({ children }) => <WeatherProvider>{children}</WeatherProvider>;
    const { result } = renderHook(() => useWeather(), { wrapper });

    const mockWeather = {
      city: 'Lisboa',
      temperature: 20,
      description: 'Sunny'
    };

    act(() => {
      result.current.setWeather(mockWeather);
    });

    expect(result.current.weather).toEqual(mockWeather);
  });

  test('deve permitir atualizar isLoading', () => {
    const wrapper = ({ children }) => <WeatherProvider>{children}</WeatherProvider>;
    const { result } = renderHook(() => useWeather(), { wrapper });

    act(() => {
      result.current.setIsLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setIsLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  test('deve ter valor memoizado para evitar re-renders', () => {
    const wrapper = ({ children }) => <WeatherProvider>{children}</WeatherProvider>;
    const { result, rerender } = renderHook(() => useWeather(), { wrapper });

    const firstValue = result.current;
    
    rerender();
    
    const secondValue = result.current;
    
    // Mesma referência = valor memoizado
    expect(firstValue).toBe(secondValue);
  });

  test('deve suportar múltiplos consumers', () => {
    const wrapper = ({ children }) => <WeatherProvider>{children}</WeatherProvider>;
    
    const { result: result1 } = renderHook(() => useWeather(), { wrapper });
    const { result: result2 } = renderHook(() => useWeather(), { wrapper });

    const mockWeather = { city: 'Porto', temperature: 18 };

    act(() => {
      result1.current.setWeather(mockWeather);
    });

    // Ambos devem ter o mesmo weather
    expect(result1.current.weather).toEqual(mockWeather);
    expect(result2.current.weather).toEqual(mockWeather);
  });
});
