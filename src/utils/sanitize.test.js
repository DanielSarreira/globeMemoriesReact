import { sanitizeInput, containsDangerousContent, escapeHtml } from '../utils/sanitize';

describe('sanitizeInput', () => {
  it('strips script tags', () => {
    expect(sanitizeInput('hi <script>alert(1)</script> there')).toBe('hi  there');
  });

  it('strips javascript: URLs', () => {
    expect(sanitizeInput('click javascript:alert(1) here')).toBe('click alert(1) here');
  });

  it('strips inline event handlers', () => {
    expect(sanitizeInput('<img src=x onerror=alert(1)>')).toBe('<img src=x >');
  });

  it('returns empty string for non-strings', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(123)).toBe('');
  });
});

describe('containsDangerousContent', () => {
  it('detects scripts', () => {
    expect(containsDangerousContent('<script>x</script>')).toBe(true);
  });
  it('detects javascript: urls', () => {
    expect(containsDangerousContent('javascript:hack')).toBe(true);
  });
  it('returns false for safe text', () => {
    expect(containsDangerousContent('hello world')).toBe(false);
  });
});

describe('escapeHtml', () => {
  it('escapes < > & " \'', () => {
    expect(escapeHtml(`<a href="x">'hi' & bye</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#039;hi&#039; &amp; bye&lt;/a&gt;');
  });
});
