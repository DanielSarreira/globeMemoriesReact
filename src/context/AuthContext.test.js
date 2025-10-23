/**
 * AuthContext.test.js - Testes para AuthContext otimizado
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

describe('AuthContext Otimizado', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('deve fornecer valor inicial correto', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeUndefined();
    expect(result.current.userTravels).toEqual([]);
    expect(result.current.isLoadingAuth).toBe(true);
  });

  test('deve carregar user do localStorage', async () => {
    const mockUser = { id: 1, name: 'John', email: 'john@example.com' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('auth_token', 'fake_token');

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Aguarda splash screen (2.4s)
    await waitFor(() => {
      expect(result.current.isLoadingAuth).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.user).toEqual(mockUser);
  });

  test('deve carregar userTravels do localStorage', async () => {
    const mockUser = { id: 1, name: 'John' };
    const mockTravels = [{ id: 1, title: 'Trip 1' }];
    
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('auth_token', 'fake_token');
    localStorage.setItem('user-travels', JSON.stringify(mockTravels));

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoadingAuth).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.userTravels).toEqual(mockTravels);
  });

  test('deve setar user como null se não houver token', async () => {
    const mockUser = { id: 1, name: 'John' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    // Sem auth_token

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoadingAuth).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.user).toBeNull();
  });

  test('deve permitir atualizar user', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    const newUser = { id: 2, name: 'Jane' };

    await act(async () => {
      result.current.setUser(newUser);
    });

    expect(result.current.user).toEqual(newUser);
  });

  test('deve ter valor memoizado para evitar re-renders', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result, rerender } = renderHook(() => useAuth(), { wrapper });

    const firstValue = result.current;
    
    rerender();
    
    const secondValue = result.current;
    
    // Mesma referência = valor memoizado
    expect(firstValue).toBe(secondValue);
  });
});
