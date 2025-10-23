/**
 * Hook para otimização de performance
 * Inclui debounce, throttle, memoização, etc.
 * @module usePerformance
 */

import { useCallback, useRef, useEffect, useState, useMemo } from 'react';

/**
 * Hook para debounce de função
 * Espera X ms sem chamadas antes de executar
 * Útil para: resize, scroll, input search, etc.
 * @param {Function} func - Função a debounce
 * @param {number} delay - Delay em ms (padrão 300ms)
 * @returns {Function} Função debounced
 */
export const useDebounce = (func, delay = 300) => {
  const timeoutRef = useRef(null);

  const debouncedFunc = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFunc;
};

/**
 * Hook para throttle de função
 * Executa no máximo a cada X ms
 * Útil para: scroll, mousemove, resize com alta frequência
 * @param {Function} func - Função a throttle
 * @param {number} limit - Intervalo em ms (padrão 300ms)
 * @returns {Function} Função throttled
 */
export const useThrottle = (func, limit = 300) => {
  const inThrottleRef = useRef(false);

  const throttledFunc = useCallback(
    (...args) => {
      if (!inThrottleRef.current) {
        func(...args);
        inThrottleRef.current = true;
        setTimeout(() => {
          inThrottleRef.current = false;
        }, limit);
      }
    },
    [func, limit]
  );

  return throttledFunc;
};

/**
 * Hook para debounce de valor (útil para search)
 * @param {*} value - Valor a debounce
 * @param {number} delay - Delay em ms
 * @returns {*} Valor debounced
 */
export const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para memoização com comparação customizada
 * @param {*} data - Dados a memorizar
 * @param {Array} deps - Dependências
 * @param {Function} compareFn - Função de comparação
 * @returns {*} Dados memoizados
 */
export const useMemoComparison = (data, deps, compareFn) => {
  const prevDataRef = useRef(data);
  const prevDepsRef = useRef(deps);

  return useMemo(() => {
    // Verifica se dependências mudaram
    const depChanged = !prevDepsRef.current || 
      prevDepsRef.current.length !== deps.length ||
      prevDepsRef.current.some((dep, i) => dep !== deps[i]);

    if (depChanged) {
      prevDataRef.current = data;
      prevDepsRef.current = deps;
    }

    return prevDataRef.current;
  }, [data, deps]);
};

/**
 * Hook para cache de resultados de função
 * Útil para cálculos computacionais pesados
 * @param {Function} func - Função a cachear
 * @param {number} maxSize - Tamanho máximo do cache
 * @returns {Function} Função com cache
 */
export const useMemoizedFunction = (func, maxSize = 10) => {
  const cacheRef = useRef(new Map());

  const memoizedFunc = useCallback(
    (...args) => {
      const key = JSON.stringify(args);
      
      if (cacheRef.current.has(key)) {
        return cacheRef.current.get(key);
      }

      const result = func(...args);
      
      // Limita o tamanho do cache
      if (cacheRef.current.size >= maxSize) {
        const firstKey = cacheRef.current.keys().next().value;
        cacheRef.current.delete(firstKey);
      }
      
      cacheRef.current.set(key, result);
      return result;
    },
    [func, maxSize]
  );

  return memoizedFunc;
};

/**
 * Hook para performance monitoring
 * Mede tempo de render e execução
 * @param {string} name - Nome da métrica (para logging)
 * @returns {Object} {start, end, measurements}
 */
export const usePerformanceMonitor = (name = 'operation') => {
  const measurementsRef = useRef([]);

  const start = useCallback(() => {
    return performance.now();
  }, []);

  const end = useCallback((startTime) => {
    const duration = performance.now() - startTime;
    measurementsRef.current.push({
      name,
      duration,
      timestamp: new Date()
    });

    // Log em development
    if (process.env.NODE_ENV === 'development') {
      console.info(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }, [name]);

  const getMetrics = useCallback(() => {
    const total = measurementsRef.current.reduce((sum, m) => sum + m.duration, 0);
    const avg = total / measurementsRef.current.length;
    const max = Math.max(...measurementsRef.current.map(m => m.duration));
    const min = Math.min(...measurementsRef.current.map(m => m.duration));

    return {
      total,
      avg,
      max,
      min,
      count: measurementsRef.current.length,
      measurements: measurementsRef.current
    };
  }, []);

  const clearMetrics = useCallback(() => {
    measurementsRef.current = [];
  }, []);

  return {
    start,
    end,
    getMetrics,
    clearMetrics,
    measurements: measurementsRef.current
  };
};

/**
 * Hook para lazy-load de componentes pesados
 * @param {Function} importFunc - Função que importa componente (import())
 * @returns {Object} {Component, loading, error}
 */
export const useLazyComponent = (importFunc) => {
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    importFunc()
      .then(module => {
        if (mounted) {
          setComponent(module.default);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [importFunc]);

  return { Component: component, loading, error };
};

/**
 * Hook para detectar mudanças de tamanho de elemento
 * Útil para responsive components
 * @param {React.RefObject} ref - Referência ao elemento
 * @returns {Object} {width, height}
 */
export const useElementSize = (ref) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(() => {
      setSize({
        width: ref.current.offsetWidth,
        height: ref.current.offsetHeight
      });
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref]);

  return size;
};

/**
 * Hook para batching de múltiplas state updates
 * Agrupa múltiplas atualizações em um render
 * @returns {Object} {batch, flush}
 */
export const useBatchUpdates = () => {
  const updatesRef = useRef([]);
  const [, forceUpdate] = useState({});

  const batch = useCallback((updateFn) => {
    updatesRef.current.push(updateFn);
  }, []);

  const flush = useCallback(() => {
    updatesRef.current.forEach(fn => fn());
    updatesRef.current = [];
    forceUpdate({});
  }, []);

  return { batch, flush };
};

export default {
  useDebounce,
  useThrottle,
  useDebouncedValue,
  useMemoComparison,
  useMemoizedFunction,
  usePerformanceMonitor,
  useLazyComponent,
  useElementSize,
  useBatchUpdates
};
