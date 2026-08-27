import { useEffect, useRef } from 'react';

/**
 * useSwipeGesture — detecção de swipe horizontal no mobile.
 *
 * FIX (Round 33 — mobile UX): o user pediu para usar swipe
 * horizontal como navegação nativa nas páginas.
 *
 *   - Swipe na página principal (/, /travels, /interactive-map,
 *     /qanda, /profile/:user) → muda a tab activa do menu
 *     lateral (AppShell) para a tab à esquerda/direita.
 *
 *   - Swipe dentro de /travel/:id → navega para a viagem
 *     anterior/seguinte (lista conhecida do backend).
 *
 * Funcionamento: anexa um event listener `touchstart` /
 * `touchmove` / `touchend` ao elemento passado (ou ao
 * `window` por default). Calcula a distância horizontal.
 * Se for maior que `threshold` (default 60px) e maior que
 * a distância vertical (para não confundir com scroll
 * vertical), dispara `onSwipeLeft` (move para a esquerda,
 * vai para a página seguinte) ou `onSwipeRight` (move
 * para a direita, vai para a página anterior).
 *
 * Não interfere com scroll vertical: se o user fizer swipe
 * predominantemente vertical, ignoramos. Isto é crítico
 * para não bloquear o feed de viagens, etc.
 *
 * O hook é passivo: chama `event.preventDefault()` apenas
 * se for explicitamente pedido (default é não prevenir —
 * deixa o browser fazer scroll vertical como sempre).
 */
export default function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  // O swipe tem de ser mais horizontal que vertical para
  // evitar conflito com scroll vertical. `ratio=1.4` significa
  // que o componente horizontal tem de ser 1.4× o vertical.
  ratio = 1.4,
  enabled = true,
  target = null, // ref ou window
  // Selectores que devem ser IGNORADOS (gesto é entregue
  // ao elemento sem disparar o nosso handler). Útil para
  // mapas (leaflet), carousels, lightboxes, etc.
  ignoreSelector = '.leaflet-container, .gm-lightbox, .gm-td__lightbox, [data-swipe-ignore="true"]',
  // Se TRUE, ignora gestos que comecem sobre um elemento
  // editável (input, textarea, contenteditable). O user pode
  // querer fazer swipe-to-type no teclado virtual — não
  // devemos roubar o gesto.
  ignoreEditable = true,
} = {}) {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const trackingRef = useRef(false);
  const ignoredRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const el = target && target.current ? target.current : window;

    const isIgnored = (e) => {
      if (!e || !e.target) return false;
      const node = e.target;
      // 1) ignoreSelector
      try {
        if (typeof node.closest === 'function' && node.closest(ignoreSelector)) {
          return true;
        }
      } catch (_) { /* selector inválido — ignora */ }
      // 2) ignoreEditable: input, textarea, contenteditable, select
      if (ignoreEditable) {
        const tag = (node.tagName || '').toLowerCase();
        if (
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          node.isContentEditable
        ) {
          return true;
        }
      }
      return false;
    };

    const onStart = (e) => {
      const t = e.touches ? e.touches[0] : e;
      ignoredRef.current = isIgnored(e);
      if (ignoredRef.current) {
        trackingRef.current = false;
        return;
      }
      startXRef.current = t.clientX;
      startYRef.current = t.clientY;
      startTimeRef.current = Date.now();
      trackingRef.current = true;
    };

    const onMove = () => {
      // Não fazemos nada aqui — só no end decidimos. Isto
      // permite ao browser continuar a fazer scroll vertical
      // sem ser interrompido.
    };

    const onEnd = (e) => {
      if (!trackingRef.current) return;
      trackingRef.current = false;
      if (ignoredRef.current) return;

      // `changedTouches` está disponível em touchend; usa o
      // último ponto (onde o dedo saiu).
      const t = e.changedTouches ? e.changedTouches[0] : null;
      if (!t) return;

      const dx = t.clientX - startXRef.current;
      const dy = t.clientY - startYRef.current;
      const dt = Date.now() - startTimeRef.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // 1) distância acima do threshold
      if (absDx < threshold) return;
      // 2) predominantemente horizontal
      if (absDx < absDy * ratio) return;
      // 3) não foi um long-press (max 600ms)
      if (dt > 600) return;

      if (dx < 0) {
        if (onSwipeLeft) onSwipeLeft();
      } else if (dx > 0) {
        if (onSwipeRight) onSwipeRight();
      }
    };

    const onCancel = () => {
      trackingRef.current = false;
      ignoredRef.current = false;
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onCancel);
    };
  }, [
    onSwipeLeft,
    onSwipeRight,
    threshold,
    ratio,
    enabled,
    target,
    ignoreSelector,
    ignoreEditable,
  ]);
}
