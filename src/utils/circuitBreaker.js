/**
 * CircuitBreaker - Pattern para evitar sobrecarregar API com requisições
 * Implementa estados: CLOSED (normal) → OPEN (falhando) → HALF_OPEN (recuperando)
 */

export class CircuitBreaker {
  constructor({
    failureThreshold = 5,
    successThreshold = 2,
    timeout = 60000, // 1 minuto
    onStateChange = null,
  } = {}) {
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.failureThreshold = failureThreshold;
    this.successThreshold = successThreshold;
    this.timeout = timeout;
    this.nextAttemptTime = null;
    this.onStateChange = onStateChange;
  }

  /**
   * Executa função com circuit breaker
   * @param {Function} fn - Função a executar
   * @returns {Promise}
   * @throws {Error} Se circuit estiver OPEN
   */
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN. Request rejected.');
      }
      this.setState('HALF_OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Trata sucesso de requisição
   */
  onSuccess() {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.setState('CLOSED');
      }
    }
  }

  /**
   * Trata falha de requisição
   */
  onFailure() {
    this.failureCount++;
    this.successCount = 0;

    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.setState('OPEN');
      this.nextAttemptTime = Date.now() + this.timeout;
    } else if (this.state === 'HALF_OPEN') {
      this.setState('OPEN');
      this.nextAttemptTime = Date.now() + this.timeout;
    }
  }

  /**
   * Muda estado e notifica
   */
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange({ oldState, newState, failureCount: this.failureCount });
    }
  }

  /**
   * Retorna status do circuit breaker
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Reset manual do circuit breaker
   */
  reset() {
    this.setState('CLOSED');
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = null;
  }
}

/**
 * Hook para usar circuit breaker
 */
export const useCircuitBreaker = (options = {}) => {
  const breakerRef = React.useRef(null);

  if (!breakerRef.current) {
    breakerRef.current = new CircuitBreaker(options);
  }

  return {
    execute: (fn) => breakerRef.current.execute(fn),
    status: () => breakerRef.current.getStatus(),
    reset: () => breakerRef.current.reset(),
  };
};

export default CircuitBreaker;
