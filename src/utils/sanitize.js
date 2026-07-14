// utils/sanitize.js
// Single source of truth for HTML / XSS sanitization.

const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
  /<img[^>]*onerror/gi,
  /<svg[^>]*onload/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
];

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  let s = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/javascript:/gi, '')
    // Strip inline event handlers and the value they try to assign
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '');
  return s;
};

export const containsDangerousContent = (input) => {
  if (typeof input !== 'string') return false;
  return DANGEROUS_PATTERNS.some((re) => re.test(input));
};

export const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export default { sanitizeInput, containsDangerousContent, escapeHtml };
