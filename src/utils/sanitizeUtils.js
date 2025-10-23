/**
 * Utilidade para sanitização de conteúdo contra XSS
 * @module sanitizeUtils
 */

import DOMPurify from 'dompurify';

/**
 * Configuração de DOMPurify para comentários seguros
 */
const COMMENT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  FORCE_BODY: false
};

/**
 * Configuração de DOMPurify para conteúdo crítico (mais restritivo)
 */
const STRICT_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  FORCE_BODY: false
};

/**
 * Sanitiza comentário de utilizador
 * Remove scripts e tags perigosas, permite formatação básica
 * @param {string} content - Conteúdo bruto do comentário
 * @returns {string} Conteúdo sanitizado
 */
export const sanitizeComment = (content) => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Trim e limite de comprimento
  let sanitized = content.trim();
  
  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000);
  }

  // Sanitiza com DOMPurify
  return DOMPurify.sanitize(sanitized, COMMENT_SANITIZE_CONFIG);
};

/**
 * Sanitiza conteúdo crítico (nomes, emails, etc)
 * Remove todas as tags HTML
 * @param {string} content - Conteúdo bruto
 * @returns {string} Conteúdo sanitizado
 */
export const sanitizeStrict = (content) => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(content.trim(), STRICT_SANITIZE_CONFIG);
};

/**
 * Valida e sanitiza URL
 * @param {string} url - URL a validar
 * @returns {string|null} URL sanitizada ou null se inválida
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(url);
    
    // Apenas permite http e https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }

    return urlObj.toString();
  } catch {
    return null;
  }
};

/**
 * Detecta conteúdo potencialmente perigoso
 * @param {string} content - Conteúdo a verificar
 * @returns {boolean} true se contém conteúdo perigoso
 */
export const containsDangerousContent = (content) => {
  if (!content || typeof content !== 'string') {
    return false;
  }

  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<img[^>]*onerror/gi,
    /<svg[^>]*onload/gi
  ];

  return dangerousPatterns.some(pattern => pattern.test(content));
};

/**
 * Escapa caracteres HTML especiais
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
export const escapeHtml = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, char => map[char]);
};

/**
 * Sanitiza entrada de utilizador (formulários)
 * @param {string} input - Entrada bruta
 * @param {Object} options - Opções adicionais
 * @returns {string} Entrada sanitizada
 */
export const sanitizeUserInput = (input, options = {}) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const {
    maxLength = 500,
    allowHtml = false,
    trim = true
  } = options;

  let sanitized = input;

  // Trim
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Limite de comprimento
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Sanitiza HTML se necessário
  if (!allowHtml) {
    sanitized = DOMPurify.sanitize(sanitized, STRICT_SANITIZE_CONFIG);
  }

  return sanitized;
};

export default {
  sanitizeComment,
  sanitizeStrict,
  sanitizeUrl,
  containsDangerousContent,
  escapeHtml,
  sanitizeUserInput
};
