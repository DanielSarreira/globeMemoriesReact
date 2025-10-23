/**
 * circuitBreaker.test.js - Testes para Circuit Breaker Pattern
 */

import { CircuitBreaker } from '../circuitBreaker';

jest.useFakeTimers();

describe('CircuitBreaker', () => {
  let breaker;
  let onStateChange;

  beforeEach(() => {
    onStateChange = jest.fn();
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 60000,
      onStateChange,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  test('deve iniciar em estado CLOSED', () => {
    expect(breaker.state).toBe('CLOSED');
  });

  test('deve mudar para OPEN após failureThreshold', async () => {
    const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(failingFn);
      } catch (e) {
        // Esperado
      }
    }

    expect(breaker.state).toBe('OPEN');
    expect(onStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        newState: 'OPEN'
      })
    );
  });

  test('deve rejeitar requisições quando OPEN', async () => {
    breaker.setState('OPEN');
    breaker.nextAttemptTime = Date.now() + 1000;

    const fn = jest.fn();
    
    await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is OPEN');
    expect(fn).not.toHaveBeenCalled();
  });

  test('deve mudar para HALF_OPEN após timeout', () => {
    breaker.setState('OPEN');
    breaker.nextAttemptTime = Date.now() - 1; // Já passou

    const fn = jest.fn().mockResolvedValue('success');
    
    breaker.execute(fn);
    
    expect(breaker.state).toBe('HALF_OPEN');
  });

  test('deve voltar para CLOSED após successThreshold em HALF_OPEN', async () => {
    breaker.setState('HALF_OPEN');
    const successFn = jest.fn().mockResolvedValue('success');

    for (let i = 0; i < 2; i++) {
      await breaker.execute(successFn);
    }

    expect(breaker.state).toBe('CLOSED');
  });

  test('deve voltar para OPEN ao falhar em HALF_OPEN', async () => {
    breaker.setState('HALF_OPEN');
    breaker.nextAttemptTime = 0;
    
    const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

    try {
      await breaker.execute(failingFn);
    } catch (e) {
      // Esperado
    }

    expect(breaker.state).toBe('OPEN');
  });

  test('deve respeitar failureThreshold', async () => {
    const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

    // 2 falhas
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(failingFn);
      } catch (e) {
        // Esperado
      }
    }

    expect(breaker.state).toBe('CLOSED');
    expect(breaker.failureCount).toBe(2);

    // 3ª falha abre
    try {
      await breaker.execute(failingFn);
    } catch (e) {
      // Esperado
    }

    expect(breaker.state).toBe('OPEN');
  });

  test('deve retornar resultado da função em sucesso', async () => {
    const fn = jest.fn().mockResolvedValue('resultado');
    
    const result = await breaker.execute(fn);
    
    expect(result).toBe('resultado');
  });

  test('deve poder fazer reset manual', () => {
    breaker.setState('OPEN');
    breaker.failureCount = 5;

    breaker.reset();

    expect(breaker.state).toBe('CLOSED');
    expect(breaker.failureCount).toBe(0);
  });

  test('deve retornar status correto', () => {
    breaker.failureCount = 2;
    
    const status = breaker.getStatus();

    expect(status).toEqual({
      state: 'CLOSED',
      failureCount: 2,
      successCount: 0,
      nextAttemptTime: null,
    });
  });
});
