// src/utils/sanitizer.js
// Utilitário de sanitização para prevenir XSS attacks
// Usado em conjunto com dangerouslySetInnerHTML

/**
 * Sanitiza HTML para prevenir ataques XSS
 * Remove scripts, event handlers e outros elementos perigosos
 * @param {string} html - HTML a ser sanitizado
 * @returns {string} HTML sanitizado e seguro
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove scripts e event handlers perigosos
  let sanitized = html
    // Remove tags script
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove event handlers (onclick, onload, etc.)
    .replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s*on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '')
    // Remove object, embed, iframe tags perigosos
    .replace(/<(object|embed|iframe)[^>]*>.*?<\/\1>/gi, '')
    // Remove form tags
    .replace(/<\/?form[^>]*>/gi, '')
    // Remove meta refresh
    .replace(/<meta[^>]*http-equiv[^>]*refresh[^>]*>/gi, '')
    // Remove link tags com javascript
    .replace(/<link[^>]*javascript[^>]*>/gi, '');

  // Lista de tags permitidas para comentários e descrições
  const allowedTags = [
    'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote', 'cite',
    'pre', 'code'
  ];

  // Remove tags não permitidas
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    const lowerTagName = tagName.toLowerCase();
    if (allowedTags.includes(lowerTagName)) {
      return match;
    }
    return '';
  });

  // Sanitiza atributos href em links
  sanitized = sanitized.replace(/href\s*=\s*["']([^"']*)["']/gi, (match, url) => {
    // Permite apenas URLs http/https e mailto
    if (url.match(/^(https?:\/\/|mailto:|#)/i)) {
      return match;
    }
    return 'href="#"';
  });

  // Sanitiza atributos src em imagens
  sanitized = sanitized.replace(/src\s*=\s*["']([^"']*)["']/gi, (match, url) => {
    // Permite apenas URLs http/https e data URLs de imagem
    if (url.match(/^(https?:\/\/|data:image\/)/i)) {
      return match;
    }
    return 'src=""';
  });

  return sanitized;
};

/**
 * Sanitiza texto para comentários
 * Versão mais restritiva para comentários de usuários
 * @param {string} text - Texto do comentário
 * @returns {string} Texto sanitizado
 */
export const sanitizeComment = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Para comentários, permitir apenas formatação básica
  const basicSanitized = text
    // Remove scripts e javascript
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s*on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '')
    // Remove tags perigosos
    .replace(/<(script|object|embed|iframe|form|input|button)[^>]*>.*?<\/\1>/gi, '')
    .replace(/<(meta|link|style)[^>]*>/gi, '');

  // Permitir apenas tags básicas de formatação
  const allowedCommentTags = ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'span'];
  
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  const commentSanitized = basicSanitized.replace(tagRegex, (match, tagName) => {
    const lowerTagName = tagName.toLowerCase();
    if (allowedCommentTags.includes(lowerTagName)) {
      return match;
    }
    return '';
  });

  return commentSanitized;
};

/**
 * Sanitiza biografia de perfil
 * Permite formatação mais rica que comentários
 * @param {string} bio - Texto da biografia
 * @returns {string} Biografia sanitizada
 */
export const sanitizeBio = (bio) => {
  if (!bio || typeof bio !== 'string') {
    return '';
  }

  // Para biografias, permitir mais formatação
  const allowedBioTags = [
    'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'span',
    'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'blockquote'
  ];

  let bioSanitized = sanitizeHtml(bio);
  
  // Filtrar apenas tags permitidas para bio
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  bioSanitized = bioSanitized.replace(tagRegex, (match, tagName) => {
    const lowerTagName = tagName.toLowerCase();
    if (allowedBioTags.includes(lowerTagName)) {
      return match;
    }
    return '';
  });

  return bioSanitized;
};

/**
 * Escape de caracteres HTML para exibição segura
 * Alternativa quando não queremos permitir HTML
 * @param {string} text - Texto a ser escaped
 * @returns {string} Texto com caracteres HTML escaped
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
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

export default {
  sanitizeHtml,
  sanitizeComment,
  sanitizeBio,
  escapeHtml
};