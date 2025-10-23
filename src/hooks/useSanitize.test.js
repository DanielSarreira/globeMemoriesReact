import { renderHook } from '@testing-library/react';
import useSanitize from '../hooks/useSanitize';

describe('useSanitize Hook', () => {
  it('remove scripts de HTML', () => {
    const { result } = renderHook(() => useSanitize());
    const dirty = '<p>Hello</p><script>alert("XSS")</script>';
    const clean = result.current.sanitizeHtml(dirty);

    expect(clean).not.toContain('<script>');
    expect(clean).toContain('Hello');
  });

  it('remove atributos perigosos', () => {
    const { result } = renderHook(() => useSanitize());
    const dirty = '<img src="x" onerror="alert(\'XSS\')" />';
    const clean = result.current.sanitizeHtml(dirty);

    expect(clean).not.toContain('onerror');
  });

  it('sanitiza texto removendo todas as tags', () => {
    const { result } = renderHook(() => useSanitize());
    const dirty = '<p>Hello <b>World</b></p>';
    const clean = result.current.sanitizeText(dirty);

    expect(clean).toBe('Hello World');
    expect(clean).not.toContain('<');
  });

  it('previne javascript: URLs', () => {
    const { result } = renderHook(() => useSanitize());
    const jsUrl = 'javascript:alert("XSS")';
    const clean = result.current.sanitizeUrl(jsUrl);

    expect(clean).toBe('');
  });

  it('permite URLs normais', () => {
    const { result } = renderHook(() => useSanitize());
    const validUrl = 'https://example.com';
    const clean = result.current.sanitizeUrl(validUrl);

    expect(clean).toBe(validUrl);
  });
});
