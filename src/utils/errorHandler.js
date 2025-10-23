/**
 * Utilidade para error handling melhorado
 * @module errorHandler
 */

/**
 * Logger de erros para produção (integração com Sentry, etc)
 */
class ErrorLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Log de erro com contexto
   * @param {Error} error - Erro a registar
   * @param {string} context - Contexto do erro (componente, função, etc)
   * @param {Object} additionalData - Dados adicionais para debug
   */
  logError(error, context = '', additionalData = {}) {
    const errorInfo = {
      message: error?.message || 'Erro desconhecido',
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...additionalData
    };

    if (this.isDevelopment) {
      console.error(`[${context}]`, error, additionalData);
    }

    if (this.isProduction) {
      // Integração com Sentry (implementar depois)
      // Sentry.captureException(error, { tags: { context }, extra: additionalData });
    }

    return errorInfo;
  }

  /**
   * Log de warning
   * @param {string} message - Mensagem de aviso
   * @param {string} context - Contexto
   */
  logWarning(message, context = '') {
    if (this.isDevelopment) {
      console.warn(`[${context}] ${message}`);
    }
  }

  /**
   * Log de info
   * @param {string} message - Mensagem
   * @param {string} context - Contexto
   */
  logInfo(message, context = '') {
    if (this.isDevelopment) {
      console.info(`[${context}] ${message}`);
    }
  }
}

// Instância única
export const errorLogger = new ErrorLogger();

/**
 * Handler para erros de API
 * @param {Error} error - Erro da requisição
 * @param {string} endpoint - Endpoint que falhou
 * @returns {Object} Erro tratado com mensagem amigável
 */
export const handleApiError = (error, endpoint = '') => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  
  let userMessage = 'Erro ao processar pedido. Tente novamente.';
  let errorType = 'UNKNOWN_ERROR';

  if (error.name === 'AbortError') {
    userMessage = 'Pedido cancelado.';
    errorType = 'ABORT_ERROR';
  } else if (!error.response) {
    userMessage = 'Erro de conexão. Verifique sua internet.';
    errorType = 'NETWORK_ERROR';
  } else if (status === 400) {
    userMessage = data?.message || 'Dados inválidos.';
    errorType = 'VALIDATION_ERROR';
  } else if (status === 401) {
    userMessage = 'Sessão expirada. Faça login novamente.';
    errorType = 'UNAUTHORIZED';
  } else if (status === 403) {
    userMessage = 'Sem permissão para esta ação.';
    errorType = 'FORBIDDEN';
  } else if (status === 404) {
    userMessage = 'Recurso não encontrado.';
    errorType = 'NOT_FOUND';
  } else if (status === 409) {
    userMessage = 'Recurso já existe.';
    errorType = 'CONFLICT';
  } else if (status === 413) {
    userMessage = 'Ficheiro muito grande. Máximo 5MB.';
    errorType = 'FILE_TOO_LARGE';
  } else if (status === 422) {
    userMessage = data?.message || 'Dados inválidos para o servidor.';
    errorType = 'INVALID_DATA';
  } else if (status === 429) {
    userMessage = 'Muitos pedidos. Aguarde um momento.';
    errorType = 'RATE_LIMITED';
  } else if (status === 500) {
    userMessage = 'Erro interno do servidor. Tente mais tarde.';
    errorType = 'SERVER_ERROR';
  } else if (status === 502 || status === 503) {
    userMessage = 'Serviço temporariamente indisponível.';
    errorType = 'SERVICE_UNAVAILABLE';
  }

  errorLogger.logError(error, `API: ${endpoint}`, { status, errorType });

  return {
    userMessage,
    errorType,
    status,
    originalError: error
  };
};

/**
 * Handler para erros de validação
 * @param {Object} errors - Objeto com erros de validação
 * @returns {string} Mensagem de erro formatada
 */
export const handleValidationError = (errors) => {
  if (!errors || Object.keys(errors).length === 0) {
    return 'Erros de validação encontrados.';
  }

  const errorMessages = Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join('; ');

  return errorMessages;
};

/**
 * Handler para erros de ficheiro
 * @param {Error} error - Erro de ficheiro
 * @returns {string} Mensagem amigável
 */
export const handleFileError = (error) => {
  if (error.name === 'NotAllowedError') {
    return 'Acesso ao ficheiro negado.';
  }
  if (error.name === 'NotReadableError') {
    return 'Erro ao ler o ficheiro.';
  }
  if (error.name === 'SecurityError') {
    return 'Erro de segurança ao ler o ficheiro.';
  }
  return 'Erro ao processar ficheiro. Tente novamente.';
};

/**
 * Retry logic com exponential backoff
 * @param {Function} fn - Função a executar
 * @param {number} maxRetries - Número máximo de tentativas
 * @param {number} delay - Delay inicial em ms
 * @returns {Promise} Resultado da função
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      errorLogger.logWarning(
        `Tentativa ${attempt + 1}/${maxRetries} falhou. Aguardando ${delay}ms...`,
        'retryWithBackoff'
      );

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
};

export default {
  errorLogger,
  handleApiError,
  handleValidationError,
  handleFileError,
  retryWithBackoff
};
