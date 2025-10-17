/**
 * Configuração Centralizada de Comentários
 * Define limites uniformes de caracteres para toda a aplicação
 */

export const COMMENT_LIMITS = {
  // Limite máximo de caracteres para comentários
  MAX_LENGTH: 500,
  
  // Limite mínimo de caracteres para comentários
  MIN_LENGTH: 3,
  
  // Mensagens de validação
  MESSAGES: {
    EMPTY: 'O comentário não pode estar vazio!',
    TOO_SHORT: `O comentário deve ter pelo menos ${3} caracteres!`,
    TOO_LONG: `O comentário não pode ter mais de ${500} caracteres!`,
    INVALID_CONTENT: 'Comentário contém conteúdo inválido!',
    DANGEROUS_CONTENT: 'Comentário contém conteúdo não permitido!',
    SUCCESS: 'Comentário adicionado com sucesso!',
  }
};

/**
 * Valida um comentário de acordo com as regras definidas
 * @param {string} text - Texto do comentário a validar
 * @returns {object} - {valid: boolean, message: string}
 */
export const validateComment = (text) => {
  if (!text?.trim()) {
    return { valid: false, message: COMMENT_LIMITS.MESSAGES.EMPTY };
  }

  if (text.trim().length < COMMENT_LIMITS.MIN_LENGTH) {
    return { valid: false, message: COMMENT_LIMITS.MESSAGES.TOO_SHORT };
  }

  if (text.trim().length > COMMENT_LIMITS.MAX_LENGTH) {
    return { valid: false, message: COMMENT_LIMITS.MESSAGES.TOO_LONG };
  }

  return { valid: true, message: '' };
};
