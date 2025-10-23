// utils/sanitizeHTML.js
/**
 * Sanitize HTML content to prevent XSS attacks
 * This is a lightweight sanitizer for basic content
 */

const sanitizeHTML = (dirty) => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // Remove script tags and their contents
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous attributes
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, ''); // onclick, onload, etc.
  clean = clean.replace(/\s*javascript\s*:\s*/gi, '');
  clean = clean.replace(/\s*vbscript\s*:\s*/gi, '');
  clean = clean.replace(/\s*data\s*:\s*/gi, '');
  
  // Remove dangerous tags
  const dangerousTags = [
    'iframe', 'object', 'embed', 'link', 'style', 'meta', 'form', 
    'input', 'textarea', 'button', 'select', 'option'
  ];
  
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    clean = clean.replace(regex, '');
  });

  // Allow only safe HTML tags
  const allowedTags = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
    'blockquote', 'a', 'img'
  ];

  // Remove any tags not in the allowed list
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // For links and images, sanitize href and src attributes
      if (tagName.toLowerCase() === 'a') {
        return match.replace(/href\s*=\s*["']([^"']*)["']/gi, (hrefMatch, url) => {
          // Only allow http, https, and relative URLs
          if (url.match(/^(https?:\/\/|\/|#)/)) {
            return hrefMatch;
          }
          return 'href="#"';
        });
      }
      if (tagName.toLowerCase() === 'img') {
        return match.replace(/src\s*=\s*["']([^"']*)["']/gi, (srcMatch, url) => {
          // Only allow http, https, and relative URLs for images
          if (url.match(/^(https?:\/\/|\/|data:image\/)/)) {
            return srcMatch;
          }
          return 'src=""';
        });
      }
      return match;
    }
    return '';
  });

  return clean.trim();
};

// For comments and user-generated content
export const sanitizeComment = (content) => {
  if (!content) return '';
  
  // Basic HTML entities encoding
  let sanitized = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // Allow basic formatting with safe tags
  sanitized = sanitized
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
    .replace(/\n/g, '<br>'); // line breaks

  return sanitized;
};

// For travel descriptions and rich content
export const sanitizeRichContent = (content) => {
  if (!content) return '';
  return sanitizeHTML(content);
};

export default sanitizeHTML;