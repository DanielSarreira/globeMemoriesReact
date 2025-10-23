/**
 * useImageSlideshow.test.js - Testes para hook de slideshow otimizado
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useImageSlideshow from '../useImageSlideshow';

describe('useImageSlideshow', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const mockFeedTravels = [
    { id: 1, images: [{ url: 'img1.jpg' }, { url: 'img2.jpg' }] },
    { id: 2, images: [{ url: 'img3.jpg' }, { url: 'img4.jpg' }, { url: 'img5.jpg' }] }
  ];

  test('deve retornar função de atualização', () => {
    const { result } = renderHook(() => 
      useImageSlideshow(mockFeedTravels, false, null)
    );

    expect(typeof result.current).toBe('function');
  });

  test('deve ser memoizado (useCallback)', () => {
    const { result, rerender } = renderHook(() => 
      useImageSlideshow(mockFeedTravels, false, null)
    );

    const firstCallback = result.current;
    
    rerender();
    
    const secondCallback = result.current;
    
    // Mesma referência = callback memoizado
    expect(firstCallback).toBe(secondCallback);
  });

  test('deve gerenciar intervals para desktop', () => {
    const { result } = renderHook(() => 
      useImageSlideshow(mockFeedTravels, false, null)
    );

    expect(result.current).toBeDefined();
  });

  test('deve limpar intervals ao desmontar', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const { unmount } = renderHook(() => 
      useImageSlideshow(mockFeedTravels, false, null)
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  test('deve suportar mobile com IntersectionObserver', () => {
    const mockContainerRef = {
      current: {
        querySelector: jest.fn(() => ({
          querySelectorAll: jest.fn(() => [])
        }))
      }
    };

    const { result } = renderHook(() => 
      useImageSlideshow(mockFeedTravels, true, mockContainerRef)
    );

    expect(result.current).toBeDefined();
  });

  test('deve atualizar índice corretamente', () => {
    const { result } = renderHook(() => 
      useImageSlideshow(mockFeedTravels, false, null)
    );

    const updateFn = result.current;
    const initialState = { 1: 0, 2: 0 };
    const newState = updateFn(initialState, 1, 2);

    expect(newState[1]).toBe(1);
    expect(newState[2]).toBe(0);
  });

  test('deve fazer wrap-around quando atingir fim', () => {
    const { result } = renderHook(() => 
      useImageSlideshow(mockFeedTravels, false, null)
    );

    const updateFn = result.current;
    const state = { 1: 1 }; // Última imagem
    const newState = updateFn(state, 1, 2); // 2 imagens

    expect(newState[1]).toBe(0); // Volta ao início
  });
});
