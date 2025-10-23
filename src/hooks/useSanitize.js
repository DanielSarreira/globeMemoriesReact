import DOMPurify from 'dompurify';

/**
 * Hook para sanitização segura de conteúdo contra XSS
 * Usa DOMPurify para remoção robusta de conteúdo perigoso
 */
export const useSanitize = () => {
  /**
   * Sanitiza HTML/conteúdo para prevenir XSS
   * @param {string} content - Conteúdo a sanitizar
   * @param {object} options - Opções do DOMPurify
   * @returns {string} Conteúdo sanitizado
   */
  const sanitizeHtml = (content, options = {}) => {
    if (!content) return '';

    const defaultConfig = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
      KEEP_CONTENT: true,
      ...options,
    };

    return DOMPurify.sanitize(content, defaultConfig);
  };

  /**
   * Sanitiza apenas texto (remove todas as tags)
   * @param {string} text - Texto a sanitizar
   * @returns {string} Texto sanitizado
   */
  const sanitizeText = (text) => {
    if (!text) return '';

    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  };

  /**
   * Sanitiza URL para prevenir javascript: e data: URLs
   * @param {string} url - URL a sanitizar
   * @returns {string} URL sanitizada ou string vazia
   */
  const sanitizeUrl = (url) => {
    if (!url) return '';

    // Previne javascript: e data: URLs
    if (url.match(/^(javascript|data|vbscript):/i)) {
      return '';
    }

    // Permite URLs relativas e absolutas normais
    try {
      new URL(url);
      return url;
    } catch {
      // URL relativa é ok
      if (!url.includes('://')) {
        return url;
      }
      return '';
    }
  };

  return {
    sanitizeHtml,
    sanitizeText,
    sanitizeUrl,
  };
};

export default useSanitize;
