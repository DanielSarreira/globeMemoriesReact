/**
 * Hook para tratamento centralizado e robusto de erros de API
 * Diferencia tipos de erro e fornece mensagens apropriadas
 */
export const useApiErrorHandler = (onError) => {
  /**
   * Trata erro de API e retorna mensagem apropriada
   * @param {Error} error - Erro do axios
   * @param {string} defaultMessage - Mensagem padrão
   * @returns {object} { message, type, status, shouldRetry, errorType }
   */
  const handleError = (error, defaultMessage = 'Erro ao processar requisição') => {
    const response = error.response;
    const status = response?.status;
    const data = response?.data;

    let message = defaultMessage;
    let type = 'error';
    let shouldRetry = false;
    let errorType = 'unknown';

    // ===== 4xx Errors =====
    if (status === 400) {
      message = data?.message || 'Dados inválidos. Verifique as informações.';
      type = 'warning';
      errorType = 'bad_request';
    } else if (status === 401) {
      message = 'Sessão expirada. Faça login novamente.';
      type = 'error';
      errorType = 'unauthorized';
    } else if (status === 403) {
      message = 'Você não tem permissão para fazer esta ação.';
      type = 'error';
      errorType = 'forbidden';
    } else if (status === 404) {
      message = 'O recurso solicitado não foi encontrado.';
      type = 'error';
      errorType = 'not_found';
    } else if (status === 409) {
      message = data?.message || 'Conflito. Este recurso pode já existir.';
      type = 'warning';
      errorType = 'conflict';
    } else if (status === 422) {
      message = data?.message || 'Validação falhou. Verifique os dados.';
      type = 'warning';
      errorType = 'validation_error';
    } else if (status === 429) {
      message = 'Muitos pedidos. Aguarde alguns segundos e tente novamente.';
      type = 'warning';
      errorType = 'rate_limit';
      shouldRetry = true;
    }

    // ===== 5xx Errors =====
    else if (status === 500) {
      message = 'Erro no servidor. Tente novamente mais tarde.';
      type = 'error';
      errorType = 'server_error';
      shouldRetry = true;
    } else if (status === 502 || status === 503 || status === 504) {
      message = 'Servidor indisponível. Tente novamente em alguns momentos.';
      type = 'error';
      errorType = 'service_unavailable';
      shouldRetry = true;
    }

    // ===== Network Errors =====
    else if (error.code === 'ECONNABORTED') {
      message = 'Requisição expirou. Verifique sua conexão e tente novamente.';
      type = 'error';
      errorType = 'timeout';
      shouldRetry = true;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      message = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      type = 'error';
      errorType = 'connection_refused';
      shouldRetry = true;
    } else if (error.message === 'Network Error') {
      message = 'Erro de rede. Verifique sua conexão à internet.';
      type = 'error';
      errorType = 'network_error';
      shouldRetry = true;
    }

    // ===== CORS Errors =====
    else if (error.message && error.message.includes('CORS')) {
      message = 'Erro de permissão CORS. Contacte o suporte.';
      type = 'error';
      errorType = 'cors_error';
      shouldRetry = false;
    }

    // ===== File Upload Errors =====
    else if (error.message && error.message.includes('file')) {
      if (error.response?.status === 413) {
        message = 'Ficheiro demasiado grande. Máximo 50MB.';
      } else {
        message = 'Erro ao fazer upload do ficheiro. Tente novamente.';
      }
      type = 'error';
      errorType = 'file_upload_error';
      shouldRetry = true;
    }

    // ===== Default Error =====
    else if (!status) {
      message = error.message || defaultMessage;
      type = 'error';
      errorType = 'unknown_error';
    }

    // Log para debug
    if (process.env.REACT_APP_ENV === 'development') {
      console.error('[API Error]', {
        status,
        message,
        errorType,
        data: data,
        originalError: error.message,
      });
    }

    const result = { message, type, status, shouldRetry, errorType };

    // Callback opcional
    if (onError) {
      onError(result);
    }

    return result;
  };

  return { handleError };
};

/**
 * Hook para retry com backoff exponencial
 */
export const useApiRetry = () => {
  /**
   * Executa função com retry automático
   * @param {Function} fn - Função a executar
   * @param {object} options - Opções de retry
   * @returns {Promise}
   */
  const retryWithBackoff = async (
    fn,
    {
      maxRetries = 3,
      initialDelay = 1000,
      backoffFactor = 2,
      shouldRetry = () => true,
    } = {}
  ) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Não fazer retry no último attempt
        if (attempt === maxRetries) {
          break;
        }

        // Verificar se deve fazer retry
        if (!shouldRetry(error)) {
          throw error;
        }

        // Calcular delay com backoff exponencial
        const delay = initialDelay * Math.pow(backoffFactor, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };

  return { retryWithBackoff };
};

export default useApiErrorHandler;
