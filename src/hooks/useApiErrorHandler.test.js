import { renderHook } from '@testing-library/react';
import useApiErrorHandler from '../hooks/useApiErrorHandler';

describe('useApiErrorHandler Hook', () => {
  it('trata erro 401 corretamente', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const error = {
      response: { status: 401, data: { message: 'Unauthorized' } },
    };

    const handled = result.current.handleError(error);

    expect(handled.status).toBe(401);
    expect(handled.message).toContain('Sessão expirada');
    expect(handled.type).toBe('error');
  });

  it('trata erro 403 corretamente', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const error = {
      response: { status: 403, data: { message: 'Forbidden' } },
    };

    const handled = result.current.handleError(error);

    expect(handled.status).toBe(403);
    expect(handled.message).toContain('não tem permissão');
  });

  it('trata erro 404 corretamente', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const error = {
      response: { status: 404, data: {} },
    };

    const handled = result.current.handleError(error);

    expect(handled.status).toBe(404);
    expect(handled.message).toContain('não foi encontrado');
  });

  it('marca erro 500 como retry', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const error = {
      response: { status: 500, data: {} },
    };

    const handled = result.current.handleError(error);

    expect(handled.shouldRetry).toBe(true);
  });

  it('trata erro de rede', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const error = {
      code: 'ECONNREFUSED',
      message: 'Network Error',
    };

    const handled = result.current.handleError(error);

    expect(handled.message).toContain('Não foi possível conectar');
    expect(handled.shouldRetry).toBe(true);
  });

  it('chama callback onError se fornecido', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useApiErrorHandler(mockCallback));
    const error = {
      response: { status: 400, data: {} },
    };

    result.current.handleError(error);

    expect(mockCallback).toHaveBeenCalled();
  });

  // ===== NOVOS TESTES PARA ERROS AVANÇADOS =====

  it('trata erro 429 (rate limit) corretamente', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const error = {
      response: { status: 429, data: {} },
    };

    const handled = result.current.handleError(error);

    expect(handled.status).toBe(429);
    expect(handled.errorType).toBe('rate_limit');
    expect(handled.shouldRetry).toBe(true);
    expect(handled.message).toContain('Muitos pedidos');
  });

  it('trata erro de timeout (ECONNABORTED) corretamente', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const error = {
      code: 'ECONNABORTED',
      message: 'timeout',
    };

    const handled = result.current.handleError(error);

    expect(handled.errorType).toBe('timeout');
    expect(handled.shouldRetry).toBe(true);
    expect(handled.message).toContain('expirou');
  });

  it('trata erro CORS corretamente', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const error = {
      message: 'CORS error',
      code: 'CORS_ERROR',
    };

    const handled = result.current.handleError(error);

    expect(handled.errorType).toBe('cors_error');
    expect(handled.shouldRetry).toBe(false);
    expect(handled.message).toContain('CORS');
  });

  it('trata erro de file upload corretamente', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const error = {
      message: 'file size too large',
      response: { status: 413 },
    };

    const handled = result.current.handleError(error);

    expect(handled.errorType).toBe('file_upload_error');
    expect(handled.shouldRetry).toBe(true);
    expect(handled.message).toContain('Ficheiro demasiado grande');
  });

  it('retorna errorType em resposta', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const error = {
      response: { status: 401, data: {} },
    };

    const handled = result.current.handleError(error);

    expect(handled).toHaveProperty('errorType');
    expect(handled.errorType).toBe('unauthorized');
  });

  it('trata erro 503 com service unavailable', () => {
    const { result } = renderHook(() => useApiErrorHandler());
    const error = {
      response: { status: 503, data: {} },
    };

    const handled = result.current.handleError(error);

    expect(handled.errorType).toBe('service_unavailable');
    expect(handled.shouldRetry).toBe(true);
  });
});
